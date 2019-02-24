(function () {

    angular
        .module('myApp')
        .controller('TeacherExportChoiceGroupController', TeacherExportChoiceGroupController)

    TeacherExportChoiceGroupController.$inject = ['$state', '$scope', '$rootScope'];

    function TeacherExportChoiceGroupController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacherQuestion");
        $rootScope.setData('fromChoiceAction', false);
        $rootScope.setData('selectedMenu', 'export');
        var userId = $rootScope.settings.userId
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.shareRef) $scope.shareRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
        });
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getSharedGroups()
        }
        $scope.getSharedGroups = function () {
            $scope.shareRef = firebase.database().ref('SharedList/' + userId);
            $scope.shareRef.on('value', function (snapshot) {
                $scope.shareList = []
                var teacherGroups = snapshot.val() || {}
                for (teacherId in teacherGroups) {
                    var groups = teacherGroups[teacherId] || {}
                    var groupKeys = Object.keys(groups)
                    groupKeys.forEach(groupKey => {
                        $scope.shareList.push({ teacherId: teacherId, groupKey: groupKey })
                    });
                }
                $scope.getgroups()
            });
        }

        $scope.getgroups = function () {
            if ($scope.groupRef) $scope.groupRef.off('value')
            $scope.groupRef = firebase.database().ref('Groups');
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groups = [];
                var allGroups = snapshot.val() || {}
                for(groupKey in allGroups){
                    let group= allGroups[groupKey]
                    if(group.teacherKey == userId){
                        $scope.groups.push({
                            groupname: group.groupname,
                            key: groupKey,
                            teacherId: userId,
                            byMe: true,
                        });
                    }
                }
                $scope.shareList.forEach(group => {
                    $scope.groups.push({
                        groupname: allGroups[group.groupKey].groupname,
                        key: group.groupKey,
                        teacherId: group.teacherId,
                        byMe: false,
                    })
                })

                $rootScope.setData('loadingfinished', true);
                if ($scope.groups.length == 0) {
                    $rootScope.warning("There isn't any group!");
                }
                $rootScope.safeApply();
            });
        }


        $scope.gotoGroupExport = function (obj) {
            $rootScope.setData('groupKey', obj.key);
            $rootScope.setData('groupName', obj.groupname);
            $rootScope.setData('teacherId', obj.teacherId);
            $rootScope.setData('selectedTab', 'Questions');
            $rootScope.setData('groupSetKey', undefined);
            $rootScope.safeApply();
            $state.go('export');
        }
        $scope.setActive = function (obj) {
            if (obj.key == $rootScope.settings.groupKey) {
                return 'active';
            }
            return '';
        }
    }



})();