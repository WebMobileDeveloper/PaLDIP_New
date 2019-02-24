(function () {

    angular
        .module('myApp')
        .controller('exportGroupsetUsersController', exportGroupsetUsersController)

    exportGroupsetUsersController.$inject = ['$state', '$scope', '$rootScope'];

    function exportGroupsetUsersController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'groupsets');

        $scope.$on('$destroy', function () {
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.groupsetRef) $scope.groupsetRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getGroupUsers()
            $scope.getUsers()
        }
        $scope.getGroupUsers = function () {
            $scope.groupsetRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $rootScope.settings.groupSetKey);
            $scope.groupsetRef.on('value', function (snapshot) {
                $scope.groupset = snapshot.val() || {}
                $scope.ref_1 = true;
                $scope.finalCalc()
            })
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val() || {}
                $scope.ref_2 = true;
                $scope.finalCalc()
            })
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return

            $scope.Users = []
            let userKeys = []
            $scope.groupset.data.groups.forEach((group, index) => {
                group.name = group.name || ($scope.groupset.name + (index + 1))
                group.members = group.members || []
                group.members.forEach(userKey => {
                    if (userKeys.indexOf(userKey) > -1) {
                        let user = $scope.Users[userKeys.indexOf(userKey)]
                        user.joinedGroups = user.joinedGroups + ', ' + group.name
                    } else {
                        let user = angular.copy($scope.allUsers[userKey])
                        user.joinedGroups = group.name
                        $scope.Users.push(user)
                        userKeys.push(userKey)
                    }
                });
            });
            $rootScope.setData('loadingfinished', true)
        }
    }
})();