(function () {

    angular
        .module('myApp')
        .controller('TextAnswerController', TextAnswerController)

    TextAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function TextAnswerController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questions");       
        $scope.question = $rootScope.settings.questionObj;
        if ($scope.question.videoID) {
            $scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        $rootScope.currAnswer = undefined;
        $rootScope.currAnswerKey = undefined;
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('viewText');
            }
        }
    }
})();