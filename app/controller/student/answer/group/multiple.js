(function () {

    angular
        .module('myApp')
        .controller('MultipleAnswerController', MultipleAnswerController)

    MultipleAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function MultipleAnswerController($state, $scope, $rootScope, $sce) {
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
            if ($scope.optionDataRef) $scope.optionDataRef.off('value')
        });

        $scope.getMultipleOptions = function () {
            $scope.options = [];
            $rootScope.setData('loadingfinished', false);
            $scope.optionDataRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey);
            $scope.optionDataRef.on('value', function (snapshot) {

                $scope.options = snapshot.val()['options'];
                $scope.currAnswerVal = [];
                $scope.prevAnswerVal = [];
                $scope.disabled = [];
                for (var i = 0; i < $scope.options.length; i++) {
                    $scope.currAnswerVal.push(0);
                    $scope.prevAnswerVal.push(0);
                    $scope.disabled.push(false);
                }
                $scope.maximumSelection = snapshot.val()['maximumSelection'];
                if ($rootScope.settings.prevAnswer) {
                    var prevAnswerArr = $rootScope.settings.prevAnswer.split("#%%#");
                    for (var i = 0; i < prevAnswerArr.length; i++) {
                        var index = $scope.options.indexOf(prevAnswerArr[i]);
                        $scope.prevAnswerVal[index] = 1;
                        $scope.selectedRadio = index;
                    }   
                }
                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.toggle = function (index) {

            $scope.currAnswerVal[index] = 1 - $scope.currAnswerVal[index];
            var total = 0;
            for (var i = 0; i < $scope.currAnswerVal.length; i++) {
                total += $scope.currAnswerVal[i];
            }
            if (total == $scope.maximumSelection) {
                for (var i = 0; i < $scope.currAnswerVal.length; i++) {
                    if ($scope.currAnswerVal[i] == 0) {
                        $scope.disabled[i] = true;
                    }
                }
                $rootScope.info("You are reached to maximum selection count!");
            } else {
                for (var i = 0; i < $scope.currAnswerVal.length; i++) {
                    $scope.disabled[i] = false;
                }
            }
            $rootScope.safeApply();
        };
        $scope.radioChanged = function (selectedRadio) {
            $scope.selectedRadio = selectedRadio;
            $rootScope.safeApply();
        }
        $scope.saveanswer = function () {
            if ($scope.maximumSelection == 1) {  //radio
                if ($scope.selectedRadio == undefined) {
                    $scope.warning("You need to choose at least one answer!");
                    return;
                }
                $rootScope.currAnswer = $scope.options[$scope.selectedRadio];
            } else {                          // checkbox
                var total = 0;
                $rootScope.currAnswer = "";
                for (var i = 0; i < $scope.currAnswerVal.length; i++) {
                    total += $scope.currAnswerVal[i];
                    if ($scope.currAnswerVal[i]) {
                        if ($rootScope.currAnswer.length == 0) {
                            $rootScope.currAnswer = $scope.options[i];
                        } else {
                            $rootScope.currAnswer = $rootScope.currAnswer + "#%%#" + $scope.options[i];
                        }
                    }
                }
                if (total == 0) {
                    $scope.warning("You need to choose at least one answer!");
                    return;
                }
            }

            $rootScope.saveanswer();
        }

        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('viewMultiple');
            }
        }
    }
})();