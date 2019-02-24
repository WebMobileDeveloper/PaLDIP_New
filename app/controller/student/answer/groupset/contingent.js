(function () {

    angular
        .module('myApp')
        .controller('GroupContingentAnswerController', GroupContingentAnswerController)

    GroupContingentAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function GroupContingentAnswerController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "subQuestions");
        $rootScope.currAnswer = undefined;
        $rootScope.currAnswerKey = undefined;
        $scope.question = $rootScope.settings.questionObj;

        $rootScope.safeApply();
        
        $scope.$on('$destroy', function () {
            $('#answerModal').modal('hide');
        })
        $scope.init = function () {
            if ($rootScope.settings.prevAnswer) {
                $scope.currAnswer = $rootScope.settings.prevAnswer;
            } else {
                $scope.index = 0;
                $scope.currAnswer = [];
                for (var i = 0; i < $scope.question.subQuestions.length; i++) {
                    $scope.currAnswer[i] = undefined;
                }
                $scope.showModal();
            }
        }
        $scope.showModal = function () {
            $scope.subQuestion = $scope.question.subQuestions[$scope.index];
            $scope.loadimage();
            $scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.subQuestion.videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
            $scope.selectedRadio = $scope.currAnswer[$scope.index];
            $rootScope.safeApply();
            $('#answerModal').modal({ backdrop: 'static', keyboard: false });
        }
        //Load Image
        $scope.loadimage = function () {
            $scope.imgSrc = '';
            var imgname = $scope.subQuestion.image;
            if (imgname != "") {
                var storageRef = firebase.storage().ref();
                storageRef.child('img/' + imgname).getDownloadURL().then(function (url) {
                    $scope.imgSrc = url + '?_ts=' + new Date().getTime()
                    $rootScope.safeApply();
                }).catch(function (error) { })
            }
        }
        $scope.radioChanged = function (selectedRadio) {
            $scope.selectedRadio = selectedRadio;
            $rootScope.safeApply();
        }
        $scope.prev = function () {
            if ($scope.selectedRadio == undefined) {
                $rootScope.warning("Please select your answer!");
                return;
            }
            $scope.currAnswer[$scope.index] = $scope.selectedRadio;
            if ($scope.index == 0) {
                $rootScope.warning("This is first sub question.");
                return;
            }
            $scope.index--;
            $scope.showModal();
        }
        $scope.next = function () {
            if ($scope.selectedRadio == undefined) {
                $rootScope.warning("Please select your answer!");
                return;
            }
            $scope.currAnswer[$scope.index] = $scope.selectedRadio;

            if ($scope.index == $scope.question.subQuestions.length - 1) {
                $rootScope.info("Answer completed!");
                $('#answerModal').modal('hide');
                $scope.completed = true;
            } else {
                $scope.index++;
                $scope.showModal();
            }
        }
        $scope.saveanswer = function () {
            if ($scope.completed) {
                $rootScope.currAnswer = angular.copy($scope.currAnswer);
                $rootScope.saveGroupanswer();
            } else {
                $rootScope.warning("You didn't complet all questions!");
                return;
            }
        }
        $scope.edit = function () {
            $scope.index = 0;
            $scope.showModal();
        }


        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('groupViewContingent');
            }
        }
    }
})();