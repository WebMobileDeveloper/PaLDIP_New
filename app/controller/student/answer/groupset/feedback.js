(function () {

    angular
        .module('myApp')
        .controller('GroupFeedbackAnswerController', GroupFeedbackAnswerController)

    GroupFeedbackAnswerController.$inject = ['$state', '$scope', '$rootScope'];

    function GroupFeedbackAnswerController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "subQuestions"); 
        $scope.question = $rootScope.settings.questionObj;
        $scope.groupType = $rootScope.settings.groupType;

        $rootScope.currAnswer = undefined;
        $rootScope.currAnswerKey = undefined;
        $rootScope.safeApply();
        $scope.$on("$destroy", function () {
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.goNext = function () {
            $state.go('groupFeedbackAnswer1');
        }
        $scope.goBack = function () {
            $state.go($rootScope.settings.backUrl);
        }
    }
})();