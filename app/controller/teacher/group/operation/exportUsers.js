(function () {

    angular
        .module('myApp')
        .controller('exportUsersController', exportUsersController)

    exportUsersController.$inject = ['$state', '$scope', '$rootScope'];

    function exportUsersController($state, $scope, $rootScope) {
        // **************** router:  exportGroupUsers  ****************************
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'groupRoot');
        $scope.usersInGroup = $rootScope.settings.usersInGroup || []
 
        $scope.$on('$destroy', function () {
            if ($scope.usersRef) $scope.usersRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getUsers()
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.Users = []
                snapshot.forEach(user => {
                    if ($scope.usersInGroup.indexOf(user.key) > -1) $scope.Users.push(user.val())
                });
                $rootScope.setData('loadingfinished', true)
            })
        }
    }
})();