(function () {

    angular
        .module('myApp')
        .controller('TeacherGroupController', TeacherGroupController)

    TeacherGroupController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function TeacherGroupController($state, $scope, $rootScope, $filter) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacher");
        $rootScope.setData('selectedMenu', 'group');
        $rootScope.safeApply();


        $scope.$on('$destroy', function () {
            if ($scope.groupsRef) $scope.groupsRef.off('value')
            if ($scope.shareRef) $scope.shareRef.off('value')
            if ($scope.allGroupRef) $scope.allGroupRef.off('value')
            for (ref in $scope.shareGroupRef) {
                $scope.shareGroupRef[ref].off('value');
            }
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.shareGroupRef = {}
            $scope.getgroups()
            $scope.getSharedGroups();

            // $scope.getSettings()
            // $scope.getStudents()
        }
        $scope.getgroups = function () {
            $scope.groupsRef = firebase.database().ref('Groups').orderByChild('teacherKey').equalTo($rootScope.settings.userId);
            $scope.groupsRef.on('value', function (snapshot) {
                $scope.myGroups = snapshot.val() || {}
                $scope.ref_1 = true;
                $scope.finalCalc();
            });
        }

        $scope.getSharedGroups = function () {
            $scope.shareRef = firebase.database().ref('SharedList/' + $rootScope.settings.userId);
            $scope.shareRef.on('value', function (snapshot) {
                // init
                for (ref in $scope.shareGroupRef) {
                    $scope.shareGroupRef[ref].off('value');
                }
                $scope.shareGroupRef = {}
                $scope.sharedGroups = {}
                $scope.isGetSharedGroups = {}
                // get teachers who shared to me

                let shareLists = snapshot.val() || {}
                for (var fromKey in shareLists) {
                    var fromTeacher = shareLists[fromKey];
                    for (var groupKey in fromTeacher) {
                        $scope.isGetSharedGroups[groupKey] = false;
                    }
                }
                $scope.checkFinishShared();
                for (var fromKey in shareLists) {
                    var fromTeacher = shareLists[fromKey];
                    for (var groupKey in fromTeacher) {
                        $scope.getSharedGroup(groupKey)
                    }
                }
            });
        }
        $scope.getSharedGroup = function (groupKey) {
            $scope.shareGroupRef[groupKey] = firebase.database().ref('Groups/' + groupKey);
            $scope.shareGroupRef[groupKey].on('value', function (shareSnapshot) {
                if (shareSnapshot.val()) {
                    $scope.sharedGroups[groupKey] = shareSnapshot.val();
                    $scope.isGetSharedGroups[groupKey] = true;
                } else {
                    delete $scope.sharedGroups[groupKey];
                    delete $scope.isGetSharedGroups[groupKey];
                }
                $scope.checkFinishShared();
            });
        }
        $scope.checkFinishShared = function () {
            for (groupKey in $scope.isGetSharedGroups) {
                if (!$scope.isGetSharedGroups[groupKey]) return;
            }
            $scope.ref_2 = true;
            $scope.finalCalc();
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return;
            $scope.groups = [];
            for (key in $scope.myGroups) {
                let group = $scope.myGroups[key];
                $scope.groups.push({
                    groupName: group.groupname,
                    code: group.code,
                    key: key,
                    teacherId: group.teacherKey,
                    byMe: true,
                });
            }
            for (key in $scope.sharedGroups) {
                let group = $scope.sharedGroups[key];
                $scope.groups.push({
                    groupName: group.groupname,
                    code: group.code,
                    key: key,
                    teacherId: group.teacherKey,
                    byMe: false,
                });
            }
            $scope.groups = $filter('orderBy')($scope.groups, 'groupName');
            $rootScope.setData('loadingfinished', true);
            if ($scope.groups.length == 0) {
                $rootScope.warning("There isn't any group!");
            }
            $rootScope.safeApply();
            // snapshot.forEach(function (childSnapshot) {

            // });
        }

        // ===================== show group detail functions==============================
        $scope.gotoGroupDetails = function (obj) {
            $rootScope.setData('groupKey', obj.key);
            $rootScope.setData('teacherId', obj.teacherId);
            $rootScope.setData('groupSetKey', undefined);
            $rootScope.setData('subIndex', undefined);
            $rootScope.setData('rootPageSetting', DEFAULT_PAGE_SETTING);
            $state.go('groupRoot');
        }

        $scope.copyToClipboard = function (str) {
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(str).select();
            document.execCommand("copy");
            $temp.remove();
        }
        //delete group
        $scope.deletegroup = function (group) {

            if (!confirm("Are you sure want to delete this group?")) {
                return;
            }
            $rootScope.setData('loadingfinished', false);
            var key = group.key;
            var updates = {};
            updates['Groups/' + key] = {};

            var loopCount = 3;
            var groupAnswerRef = firebase.database().ref('GroupAnswers').orderByChild('studentgroupkey').equalTo(key);
            groupAnswerRef.once('value', function (snapshot) {
                var answers = snapshot.val();
                if (answers) {
                    for (var ansKey in answers) {
                        updates['GroupAnswers/' + ansKey] = {};
                    }
                }
                loopCount--;
                if (loopCount == 0) {
                    firebase.database().ref().update(updates).then(function () {
                        $rootScope.setData('loadingfinished', true);
                        $rootScope.success('Group delete finished successfully.');
                    });
                }
            });
            var groupAnswerRef = firebase.database().ref('StudentGroups');
            groupAnswerRef.once('value', function (snapshot) {
                var students = snapshot.val();
                if (students) {
                    for (var studentKey in students) {
                        var groups = students[studentKey];
                        for (var groupKey in groups) {
                            if (groups[groupKey] == key) {
                                updates['StudentGroups/' + studentKey + '/' + groupKey] = {};
                            }
                        }
                    }
                }
                loopCount--;
                if (loopCount == 0) {
                    firebase.database().ref().update(updates).then(function () {
                        $rootScope.setData('loadingfinished', true);
                        $rootScope.success('Group delete finished successfully.');
                    });
                }
            });
            var shareRef = firebase.database().ref('SharedList/');
            shareRef.once('value', function (snapshot) {
                var shareList = snapshot.val();
                if (shareList) {
                    for (var toKey in shareList) {
                        for (var fromKey in shareList[toKey]) {
                            if (shareList[toKey][fromKey][key]) {
                                updates['SharedList/' + toKey + '/' + fromKey + '/' + key] = {};
                            }
                        }
                    }
                }
                loopCount--;
                if (loopCount == 0) {
                    firebase.database().ref().update(updates).then(function () {
                        $rootScope.setData('loadingfinished', true);
                        $rootScope.success('Group delete finished successfully.');
                    });
                }
            });
        }
        $scope.setActive = function (obj) {
            if (obj.key == $rootScope.settings.groupKey) {
                return 'active';
            }
            return '';
        }
    }
})();