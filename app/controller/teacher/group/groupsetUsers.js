(function () {
    angular
        .module('myApp')
        .controller('GroupsetUsersController', GroupsetUsersController)
    GroupsetUsersController.$inject = ['$state', '$scope', '$rootScope', '$filter', 'dragulaService'];
    function GroupsetUsersController($state, $scope, $rootScope, $filter, dragulaService) {


        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupsets");
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.userGroupRef) $scope.userGroupRef.off()
        })

        dragulaService.options($scope, 'drag-div', {
            revertOnSpill: true,

            moves: function (el, container, handle) {
                if (!handle.classList.contains('user-span')) return false;
                return handle.className.indexOf('joined') == -1;
            },
            accepts: function (el, target, source, sibling) {
                if (target.classList.contains('child-group-users')) {
                    //========= check max member count  ============
                    let groupindex = target.attributes.groupindex.value
                    let group = $scope.groups[groupindex]
                    if ($scope.groupSet.max_member <= group.users.length) return false;

                    //========= check same email  ============
                    let useremail = el.attributes.useremail.value
                    for (i = 0; i < group.users.length; i++) {
                        if (useremail == group.users[i].ID) return false;
                    }
                }
                return true; // elements can be dropped in any of the `containers` by default
            },
            copy: function (el, source, target) {
                if (!$scope.groupSet.exclusive && source.classList.contains('group-users')) {
                    return true;
                }
                return false;
            }
        });

        $scope.$on('drag-div.out', function (e, el, container) {
            let target = container[0]
            if (target.classList.contains('child-group-users')) {
                //========= remove hover class  ============
                let groupindex = target.attributes.groupindex.value
                let group = $scope.groups[groupindex]
                group.acceptable = false
            }
        });
        $scope.$on('drag-div.over', function (e, el, container) {
            let target = container[0]
            if (target.classList.contains('child-group-users')) {
                //========= check max member count  ============
                let groupindex = target.attributes.groupindex.value
                let group = $scope.groups[groupindex]
                if ($scope.groupSet.max_member <= group.users.length) {
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
        $scope.$on('drag-div.drop-model', function (e, el, target, source) {
            $scope.checkDuplicated()
            $scope.checkJoined();
        })
        $scope.checkJoined = function () {
            $scope.availableUsers.forEach(user => {
                user.used = false;
                for (i = 0; i < $scope.groups.length; i++) {
                    for (j = 0; j < $scope.groups[i].users.length; j++) {
                        let guser = $scope.groups[i].users[j];
                        if (user.ID == guser.ID) {
                            user.used = true;
                            return;
                        }
                    }
                }
            });
            $rootScope.safeApply()
        }
        $scope.checkDuplicated = function () {
            for (i = $scope.availableUsers.length - 1; i > 0; i--) {
                for (j = i - 1; j >= 0; j--) {
                    if ($scope.availableUsers[i].ID == $scope.availableUsers[j].ID) {
                        $scope.availableUsers.splice(i, 1);
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
            $scope.getUserGroups();
        }

        $scope.getGroupsets = function () {
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $rootScope.settings.groupSetKey);
            $scope.subGroupRef.on('value', function (snapshot) {
                $scope.groupSet = snapshot.val() || {};
                // $scope.groupSet.exclusive=!$scope.groupSet.exclusive
                // if (!$scope.groupSet.addRule) $scope.groupSet.addRule = { type: 'manually' };
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
        $scope.getUserGroups = function () {
            $scope.userGroupRef = firebase.database().ref('StudentGroups');
            $scope.userGroupRef.on('value', function (snapshot) {
                let userGroups = snapshot.val() || {}
                $scope.groupUsers = {}
                for (userKey in userGroups) {
                    if (Object.values(userGroups[userKey]).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.groupUsers[userKey] = {}
                    }
                }
                $scope.ref_3 = true;
                $scope.finalCalc()
            })
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return

            for (userKey in $scope.groupUsers) {
                $scope.groupUsers[userKey] = angular.copy($scope.allUsers[userKey])
            }
            $scope.availableUsers = []
            $scope.groupSet.data.members = $scope.groupSet.data.members || []
            for (userKey in $scope.groupUsers) {
                if (!$scope.groupSet.exclusive || $scope.groupSet.data.members.indexOf(userKey) == -1) {
                    $scope.availableUsers.push(angular.copy($scope.groupUsers[userKey]))
                }
            }
            $scope.groups.forEach((group, index) => {
                group.name = group.name ? group.name : $scope.groupSet.name + ' ' + (index + 1)
                group.users = []
                group.members = group.members || []

                group.members.forEach(userKey => {
                    let user = angular.copy($scope.groupUsers[userKey])
                    user.joined = true
                    for (i = 0; i < $scope.availableUsers.length; i++) {
                        if (user.ID == $scope.availableUsers[i].ID) {
                            $scope.availableUsers[i].used = true;
                            break;
                        }
                    }
                    group.users.push(user)
                });


            });
            $rootScope.safeApply()
            $rootScope.setData('loadingfinished', true);
        }

        $scope.saveChange = function () {
            if (!confirm("Are you sure want to save changed members?")) return;
            $rootScope.setData('loadingfinished', false);
            let updates = {};
            let member_count = 0;
            let members = [];
            $scope.groups.forEach((group, index) => {
                let groupMembers = []
                group.users.forEach(user => {
                    groupMembers.push(user.Userkey)
                    if (members.indexOf(user.Userkey) == -1) {
                        member_count++;
                        members.push(user.Userkey);
                    }
                });
                updates['data/groups/' + index + '/member_count'] = groupMembers.length
                updates['data/groups/' + index + '/members'] = groupMembers
            });
            updates['data/member_count'] = member_count
            updates['data/members'] = members
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