(function () {

    angular
        .module('myApp')
        .controller('GroupDigitAnswerController', GroupDigitAnswerController)

    GroupDigitAnswerController.$inject = ['$state', '$scope', '$rootScope'];

    function GroupDigitAnswerController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "subQuestions");
        $rootScope.currAnswer = undefined;
        $rootScope.currAnswerKey = undefined; 
        $scope.question = $rootScope.settings.questionObj;
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('groupViewDigit');
            }
        }
        $scope.goBack = function () {
            $state.go($rootScope.settings.backUrl);
        }
    }
})();