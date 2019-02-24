(function () {
    angular
        .module('myApp')
        .controller('SubsetUsersController', SubsetUsersController)
    SubsetUsersController.$inject = ['$state', '$scope', '$rootScope', '$filter', 'dragulaService'];
    function SubsetUsersController($state, $scope, $rootScope, $filter, dragulaService) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupsets");
        let groupCount = $rootScope.settings.groupCount
        $rootScope.safeApply();

        $scope.groupSetKey = $rootScope.settings.groupSetKey;
        $scope.subSetKey = $rootScope.settings.subSetKey;

        $scope.$on('$destroy', function () {
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
            if ($scope.userRef) $scope.userRef.off('value')
        })
        let indexs = Array(groupCount).fill(0)
        indexs.forEach((value, groupIndex) => {
            dragulaService.options($scope, 'drag-div' + groupIndex, {
                revertOnSpill: true,
                moves: function (el, container, handle) {
                    if (!handle.classList.contains('user-span')) return false;
                    return handle.className.indexOf('joined') == -1;
                },
                accepts: function (el, target, source, sibling) {
                    if (target.classList.contains('child-group-users')) {
                        //========= check max member count  ============
                        let subindex = target.attributes.subindex.value
                        let group = $scope.groups[groupIndex].subgroupsets[$scope.subSetKey].groups[subindex]
                        if ($scope.subSet.max_member <= group.users.length) return false;
                        //========= check same email  ============
                        let useremail = el.attributes.useremail.value
                        for (i = 0; i < group.users.length; i++) {
                            if (useremail == group.users[i].ID) return false;
                        }
                    }
                    return true; // elements can be dropped in any of the `containers` by default
                },
                copy: function (el, source, target) {
                    if (!$scope.subSet.exclusive && source.classList.contains('group-users')) {
                        return true;
                    }
                    return false;
                }
            });

            $scope.$on('drag-div' + groupIndex + '.out', function (e, el, container) {
                let target = container[0]
                if (target.classList.contains('child-group-users')) {
                    //========= remove hover class  ============
                    let subindex = target.attributes.subindex.value
                    let group = $scope.groups[groupIndex].subgroupsets[$scope.subSetKey].groups[subindex]
                    group.acceptable = false
                }
            });
            $scope.$on('drag-div' + groupIndex + '.over', function (e, el, container) {
                let target = container[0]
                if (target.classList.contains('child-group-users')) {
                    //========= check max member count  ============
                    let subindex = target.attributes.subindex.value
                    let group = $scope.groups[groupIndex].subgroupsets[$scope.subSetKey].groups[subindex]
                    if ($scope.subSet.max_member <= group.users.length) {
                        group.acceptable = false;
                        $rootScope.safeApply();
                        return
                    }
                    //========= check same email  ============
                    let useremail = el[0].attributes.useremail.value
                    for (i = 0; i < group.users.length; i++) {
                        if (useremail == group.users[i].ID) {
                            group.acceptable = false;
                            $rootScope.safeApply();
                            return
                        };
                    }
                    group.acceptable = true;
                    $rootScope.safeApply();
                }
            });
            $scope.$on('drag-div' + groupIndex + '.drop-model', function (e, el, target, source) {
                $scope.checkDuplicated(groupIndex)
                $scope.checkJoined(groupIndex);
            })

        });
        $scope.checkJoined = function (groupIndex) {
            group = $scope.groups[groupIndex]
            group.availableUsers.forEach(user => {
                user.used = false;
                for (i = 0; i < group.subgroupsets[$scope.subSetKey].groups.length; i++) {
                    for (j = 0; j < group.subgroupsets[$scope.subSetKey].groups[i].users.length; j++) {
                        let guser = group.subgroupsets[$scope.subSetKey].groups[i].users[j];
                        if (user.ID == guser.ID) {
                            user.used = true;
                            return;
                        }
                    }
                }
            });
            $rootScope.safeApply()
        }
        $scope.checkDuplicated = function (groupIndex) {
            group = $scope.groups[groupIndex]
            for (i = group.availableUsers.length - 1; i > 0; i--) {
                for (j = i - 1; j >= 0; j--) {
                    if (group.availableUsers[i].ID == group.availableUsers[j].ID) {
                        group.availableUsers.splice(i, 1);
                        break;
                    }
                }
            }

            $rootScope.safeApply()
        }

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getGroupsets();
            $scope.getUserList();
        }

        $scope.getGroupsets = function () {
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $scope.groupSetKey);
            $scope.subGroupRef.on('value', function (snapshot) {
                $scope.groupSet = snapshot.val() || {};
                $scope.subSet = $scope.groupSet.subgroupsets[$scope.subSetKey]
                // if (!$scope.subSet.addRule) $scope.subSet.addRule = { type: 'manually' };
                $scope.groups = $scope.groupSet.data.groups;
                $scope.ref_1 = true;
                $scope.finalCalc()
            });
        }
        $scope.getUserList = function () {
            $scope.userRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            $scope.userRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val() || {}
                $scope.ref_2 = true;
                $scope.finalCalc()
            })
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return

            $scope.groups.forEach((group, index) => {
                group.availableUsers = []
                group.name = group.name ? group.name : $scope.groupSet.name + ' ' + (index + 1)
                let group_members = group.members || []
                let subset_members = group.subgroupsets[$scope.subSetKey].members || []
                group_members.forEach(userKey => {
                    if (!$scope.subSet.exclusive || subset_members.indexOf(userKey) == -1) {
                        group.availableUsers.push(angular.copy($scope.allUsers[userKey]))
                    }
                });
                group.subgroupsets[$scope.subSetKey].groups.forEach((subgroup, subindex) => {
                    subgroup.name = subgroup.name ? subgroup.name : $scope.subSet.name + ' ' + (subindex + 1)
                    subgroup.users = []
                    subgroup.members = subgroup.members || []
                    subgroup.members.forEach(userKey => {
                        let user = angular.copy($scope.allUsers[userKey])
                        user.joined = true
                        for (i = 0; i < group.availableUsers.length; i++) {
                            if (user.ID == group.availableUsers[i].ID) {
                                group.availableUsers[i].used = true;
                                break;
                            }
                        }
                        subgroup.users.push(user)
                    });
                });
            });

            $rootScope.safeApply()
            $rootScope.setData('loadingfinished', true);
        }

        $scope.saveChange = function () {
            if (!confirm("Are you sure want to save changed members?")) return;
            $rootScope.setData('loadingfinished', false);
            let updates = {};

            $scope.groups.forEach((group, index) => {
                let member_count = 0;
                let members = [];
                group.subgroupsets[$scope.subSetKey].groups.forEach((subGroup, subindex) => {
                    let groupMembers = []
                    subGroup.users.forEach(user => {
                        groupMembers.push(user.Userkey)
                        if (members.indexOf(user.Userkey) == -1) {
                            member_count++;
                            members.push(user.Userkey);
                        }
                    });
                    updates['data/groups/' + index + '/subgroupsets/' + $scope.subSetKey + '/groups/' + subindex + '/member_count'] = groupMembers.length
                    updates['data/groups/' + index + '/subgroupsets/' + $scope.subSetKey + '/groups/' + subindex + '/members'] = groupMembers
                });

                updates['data/groups/' + index + '/subgroupsets/' + $scope.subSetKey + '/member_count'] = member_count
                updates['data/groups/' + index + '/subgroupsets/' + $scope.subSetKey + '/members'] = members
            });
            $scope.subGroupRef.update(updates).then(function () {
                $rootScope.setData('loadingfinished', true);
                $rootScope.success('success!');
            });
        }
        // $scope.applyRandomRule = function () {

        //     let exclusive = $scope.groupSet.exclusive;
        //     let userIndex = $scope.getUserIndex();
        //     let groupIndex = $scope.getGroupIndex();
        //     while (userIndex != undefined && groupIndex != undefined) {
        //         $scope.groups[groupIndex].users.push(angular.copy($scope.availableUsers[userIndex]))
        //         if (exclusive) {
        //             $scope.availableUsers.splice(userIndex, 1);
        //         } else {
        //             $scope.availableUsers[userIndex].used = true;
        //         }
        //         userIndex = $scope.getUserIndex();
        //         groupIndex = $scope.getGroupIndex();
        //     }
        // }
        // $scope.getUserIndex = function () {
        //     let indexs = []
        //     for (i = 0; i < $scope.availableUsers.length; i++) {
        //         if (!$scope.availableUsers[i].used) indexs.push(i)
        //     }
        //     if (indexs.length == 0) return undefined;
        //     return indexs[Math.floor(Math.random() * indexs.length)];
        // }
        // $scope.getGroupIndex = function () {
        //     let indexs = []
        //     let groupCount = $scope.groupSet.count;
        //     let max_member = $scope.groupSet.max_member;
        //     for (i = 0; i < groupCount; i++) {
        //         if ($scope.groups[i].users.length < max_member) indexs.push(i)
        //     }
        //     if (indexs.length == 0) return undefined;
        //     return indexs[Math.floor(Math.random() * indexs.length)];
        // }
    }
})();