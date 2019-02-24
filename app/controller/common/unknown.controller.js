(function () {

    angular
        .module('myApp')
        .controller('unknownController', unknownController)

    unknownController.$inject = ['$state', '$scope', '$rootScope'];

    function unknownController($state, $scope, $rootScope) {

        // switch ($rootScope.settings.userType) {
        //     case undefined:
        //         $state.go('login');
        //         break;
        //     case 'Teacher':
        //         $state.go('teacher');
        //         break;
        //     case 'Student':
        //         $state.go('student');
        //         break;
        //     default:
        //         $state.go('login');
        // }
    }
})();