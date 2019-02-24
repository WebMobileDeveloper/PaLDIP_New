(function () {

    angular
        .module('myApp')
        .controller('ResetController', ResetController)

    ResetController.$inject = ['$state', '$scope', '$rootScope'];

    function ResetController($state, $scope, $rootScope) {
        localStorage.clear();
        $rootScope.setData('showMenubar', false);
        $rootScope.getData();

        $scope.categories = ['Teacher', 'Student'];
        //************************************************************************************************************** */
        // ************************  Login  *****************************************************************************
        $scope.resetpwd = function () {
            if ($scope.requestmail == undefined || $scope.requestmail == '')
                $rootScope.warning('Please Input your mail!')
            else {
                var email = $scope.requestmail;
                firebase.auth().sendPasswordResetEmail(email).then(function () {
                    $scope.requestmail = '';
                    $rootScope.info('Password Reset Email Sent!');
                    $rootScope.safeApply()
                }).catch(function (error) {
                    var errorMessage = error.message;
                    $rootScope.error(errorMessage)
                    $rootScope.safeApply()
                })
            }
        }
    }

})();