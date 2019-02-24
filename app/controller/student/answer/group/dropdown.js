(function () {

    angular
        .module('myApp')
        .controller('DropdownAnswerController', DropdownAnswerController)

    DropdownAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function DropdownAnswerController($state, $scope, $rootScope, $sce) {
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
            if ($scope.optionDataRef) $scope.optionDataRef.off('value')
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.getdropdownoptions = function () {
            $scope.options = [];

            $scope.optionDataRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey);
            $scope.optionDataRef.on('value', function (snapshot) {
                $scope.options = snapshot.val()['options'];
                $rootScope.safeApply();
            });
        }

        $scope.applyAnswer = function (e) {
            $rootScope.currAnswerKey = e;
            $rootScope.currAnswer = $scope.options[e];
            $rootScope.safeApply();
        }

        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('viewDropdown');
            }
        }
    }
})();