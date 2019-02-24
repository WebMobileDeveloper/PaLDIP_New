(function () {

    angular
        .module('myApp')
        .controller('choiceGroupActionController', choiceGroupActionController)

    choiceGroupActionController.$inject = ['$state', '$scope', '$rootScope'];

    function choiceGroupActionController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'teacherGroup');
        $rootScope.safeApply();

        $scope.groupKey = $rootScope.settings.groupKey;

        $scope.$on('$destroy', function () {
            if ($scope.groupRef) $scope.groupRef.off('value')
            $('#editTitleModal').modal('hide');
            $('#addModal').modal('hide');
            $('#copyClassModal').modal('hide');
        })

        $scope.init = function () {
            $scope.getGroups()
        }

        $scope.getGroups = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.groupRef = firebase.database().ref('Groups');
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groupNames = [];
                $scope.groupCodes = [];
                for (groupKey in snapshot.val()) {
                    let group = snapshot.val()[groupKey]
                    $scope.groupNames.push(group.groupname);
                    $scope.groupCodes.push(group.code);
                    if (groupKey == $scope.groupKey) {
                        $scope.groupName = group.groupname;
                        $rootScope.setData('groupName', $scope.groupName);
                        $scope.sharedList = (group.sharedList) ? group.sharedList : {};
                        $scope.groupData = group
                        $rootScope.setData('origin_groupKey', group.origin_groupKey)
                    }
                }
                $rootScope.setData('loadingfinished', true);
            });
        }
        // ===================  add teacher functions  =========================
        $scope.showAddModal = function () {
            $scope.email = undefined;
            $rootScope.safeApply();
            $('#addModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.addTeacher = function () {
            if (!$scope.email) {
                $rootScope.warning('Please type teacher email');
                return;
            }
            for (var teacherKey in $scope.sharedList) {
                if ($scope.email == $scope.sharedList[teacherKey].email) {
                    $rootScope.error('This teacher already added to current group.');
                    return;
                }
            }
            var teacheRef = firebase.database().ref('Users/').orderByChild('ID').equalTo($scope.email);
            teacheRef.on('value', function (snapshot) {
                var user = snapshot.val();
                if (!user) {
                    $rootScope.error('Unregistered Teacher!');
                    return;
                }

                for (var key in user) {
                    if (user[key].Usertype != 'Teacher') {
                        $rootScope.error('Unregistered Teacher!');
                        return;
                    } else {
                        var data = {
                            email: user[key].ID,
                            key: key,
                        }
                        var updates = {};
                        updates['Groups/' + $scope.groupKey + '/sharedList/' + key] = data;
                        updates['SharedList/' + key + '/' + $rootScope.settings.userId + '/' + $scope.groupKey] = $rootScope.settings.groupName;
                        $rootScope.setData('loadingfinished', false);
                        firebase.database().ref().update(updates).then(function () {
                            $rootScope.setData('loadingfinished', true);
                            $rootScope.success('New Teacher added successfully!');
                            $scope.showAddModal();
                        });
                    }
                }
            });
        }
        $scope.deleteTeacher = function (teacher) {
            if (!confirm("Are you sure want to delete this teacher from this group?")) return;
            var updates = {};
            updates['Groups/' + $scope.groupKey + '/sharedList/' + teacher.key] = {};
            updates['SharedList/' + teacher.key + '/' + $rootScope.settings.userId + '/' + $scope.groupKey] = {};
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Teacher deleted successfully!');
            });
        }
        // ===================  Edit Group name functions  =========================

        $scope.showEditTitleModal = function () {
            $scope.newGroupName = $scope.groupName;
            $rootScope.safeApply();
            $('#editTitleModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.updateGroupName = function () {

            var groupNameRef = firebase.database().ref('Groups/' + $scope.groupKey + '/groupname');
            groupNameRef.set($scope.newGroupName).then(function () {
                $rootScope.success("Group name has been changed successfully!");
                $('#editTitleModal').modal('hide');
            });

        }
        // ===================  Edit copy group name functions  =========================

        $scope.showCopyClassModal = function () {
            $scope.newGroupName = $scope.groupName;
            $rootScope.safeApply();
            $('#copyClassModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.copyGroup = function () {
            if (!$scope.newGroupName) {
                $rootScope.warning('Please input new group name!');
                return;
            }
            if ($scope.groupNames.indexOf($scope.newGroupName) > -1) {
                $rootScope.warning('This group name is exist already!');
                return;
            }
            if (!confirm('Are you sure want to copy this group?')) {
                return;
            }
            var code = $scope.getCode();
            while ($scope.groupCodes.indexOf(code) > -1) {
                code = $scope.getCode();
            }


            var updates = {}
            let newGroup = angular.copy($scope.groupData)
            newGroup.groupname = $scope.newGroupName
            newGroup.code = code

            if (!newGroup.origin_groupKey) {
                newGroup.origin_groupKey = $scope.groupKey
                updates['Groups/' + $scope.groupKey + '/origin_groupKey'] = $scope.groupKey
            }

            for (setKey in newGroup.groupsets) {
                var setData = newGroup.groupsets[setKey].data
                setData.member_count = 0
                setData.members = {}
                for (var subIndex = 0; subIndex < setData.groups.length; subIndex++) {
                    var subGroupData = setData.groups[subIndex]
                    subGroupData.member_count = 0
                    subGroupData.members = {}
                    for (var subSetKey in subGroupData.subgroupsets) {
                        var subSetData = subGroupData.subgroupsets[subSetKey]
                        subSetData.member_count = 0
                        subSetData.members = {}
                        for (var secondIndex = 0; secondIndex < subSetData.groups.length; secondIndex++) {
                            var secondGroupData = subSetData.groups[secondIndex]
                            secondGroupData.member_count = 0
                            secondGroupData.members = {}
                        }
                    }
                }
            }


            var newGroupKey = firebase.database().ref('Groups').push().key
            updates['Groups/' + newGroupKey] = newGroup

            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Group is copied successfully!')
                $('#copyClassModal').modal('hide');
                $rootScope.safeApply();
            });
        }
        $scope.getCode = function () {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZ'.split('');
            var new_id = '';
            for (var i = 0; i < 4; i++) {
                new_id += chars[Math.floor(Math.random() * chars.length)];
            }
            return new_id;
        }

        $scope.gotoGroupExport = function () {
            if (!$rootScope.teacherSettings.export_enabled) {
                $rootScope.warning("Sorry, You didn't enabled for export function");
                return;
            } else {
                $rootScope.setData('selectedTab', 'Questions');
                $rootScope.setData('groupSetKey', undefined);
                $rootScope.setData('selectedMenu', 'export');
                $rootScope.setData('fromChoiceAction', true);
                $rootScope.safeApply();
                $state.go('export');
            }
        }
        $scope.gotoOperation = function () {
            $rootScope.setData('groupSetKey', undefined);
            $rootScope.setData('selectedTab', 'QuestionSet');
            $rootScope.setData('groupSetKey', undefined);
            $state.go('teacherLinkGroupDetail');
        }
        $scope.gotoResponse = function () {
            $rootScope.setData('selectedSubIndex', 0);
            $rootScope.setData('selectedSecondIndex', 0);
            $rootScope.setData('selectedQuestionKey', undefined);
            $rootScope.setData('selectedQuestionSetKey', undefined);
            $state.go('questionsInGroup');
        }
    }
})();