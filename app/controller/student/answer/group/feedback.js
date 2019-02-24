(function () {

    angular
        .module('myApp')
        .controller('FeedbackAnswerController', FeedbackAnswerController)

    FeedbackAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function FeedbackAnswerController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questions");
        $rootScope.currAnswer = undefined;
        $rootScope.currAnswerKey = undefined;
        $scope.question = $rootScope.settings.questionObj;
        if ($scope.question.videoID) {
            $scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        $rootScope.safeApply();
        
        $scope.$on("$destroy", function () {
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.goNext = function () {
            $state.go('feedbackAnswer1');
        }
    }
})();