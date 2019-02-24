(function () {

    angular
        .module('myApp')
        .controller('GroupTextAnswerController', GroupTextAnswerController)

        GroupTextAnswerController.$inject = ['$state', '$scope', '$rootScope'];

    function GroupTextAnswerController($state, $scope, $rootScope) {
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
                $state.go('groupViewText');
            }
        }

        $scope.goBack = function () {
            $state.go($rootScope.settings.backUrl);
        }
    }
})();