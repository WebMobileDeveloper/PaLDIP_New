(function () {

    angular
        .module('myApp')
        .controller('AdminGroupController', AdminGroupController)

    AdminGroupController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminGroupController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "admin");
        // $rootScope.setData('selectedMenu', 'group');

        $scope.teacherKey = $rootScope.settings.selectedTeacherKey;
        $scope.teacherEmail = $rootScope.settings.selectedTeacherEmail;

        if (!$scope.teacherKey) {
            $rootScope.warning('You need to select teacher at first');
            $state.go('admin');
        }
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.groupRef) $scope.groupRef.off('value')
        })
        $scope.getGroups = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.groupRef = firebase.database().ref('Groups').orderByChild('teacherKey').equalTo($scope.teacherKey);
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groups = [];
                for (groupKey in snapshot.val()) {
                    $scope.groups.push({
                        key: groupKey,
                        groupName: snapshot.val()[groupKey].groupname
                    })
                }
                $rootScope.setData('loadingfinished', true);
                if ($scope.groups.length == 0) {
                    $rootScope.warning("There isn't any group!");
                }
                $rootScope.safeApply();
            });
        }
        $scope.showQuestionSets = function (obj) {
            if ($rootScope.settings.groupKey != obj.key) {
                $rootScope.setData('groupKey', obj.key);
                $rootScope.setData('groupName', obj.groupName);
                $rootScope.setData('selectedTab', 'QuestionSet');
            }

            $state.go('adminGroupDetails');
        }
        $scope.setActive = function (obj) {
            if (obj.key == $rootScope.settings.groupKey) {
                return 'active';
            }
            return '';
        }

    }

})();