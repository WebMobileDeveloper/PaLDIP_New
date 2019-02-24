(function () {

    angular
        .module('myApp')
        .controller('RatingAnswerController', RatingAnswerController)

    RatingAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function RatingAnswerController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questions");
        $scope.itemIndex = 0;
        $scope.type = $rootScope.settings.ratingType;
        $scope.items = $rootScope.settings.ratingItems;
        $scope.options = $rootScope.settings.ratingOptions;
        $scope.question = $rootScope.settings.questionObj;
        $scope.tempAnswer = undefined;
        $scope.isAward = $scope.question.awardScore && $scope.question.awardPeoples;
        let uid = $rootScope.settings.userId;
        let ansRefStr = 'NewAnswers/' + $scope.question.code + '/answer/' + uid;

        if ($scope.question.videoID) {
            $scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.answerRef) $scope.answerRef.off('value')
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.getanswer = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.answerRef = firebase.database().ref(ansRefStr);
            $scope.answerRef.on('value', function (snapshot) {
                $scope.originAnswer = snapshot.val();
                if (!$scope.originAnswer) {
                    $scope.originAnswer = {
                        mail: $rootScope.settings.userEmail,
                        answer: Array($scope.items.length).fill().map(() => {
                            return {
                                feedbacktext: '',
                                rating: Array($scope.options.length).fill(0),
                                awardScore: 0
                            }
                        })
                    }
                }
                $scope.totalAwardScore = 0;
                $scope.totalAwardPeople = 0;
                $scope.nextAwardScore = [];
                
                $scope.answer = $scope.originAnswer.answer;
                $scope.answer.forEach((ans, index) => {
                    ans.awardScore = ans.awardScore || 0;
                    $scope.nextAwardScore[index] = ans.awardScore;
                    $scope.totalAwardScore += ans.awardScore;
                    if (ans.awardScore) {
                        $scope.totalAwardPeople++;
                    }
                });
                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
            });
        }

        $scope.getStarState = function (index, rowindex) {
            if (index < $scope.answer[$scope.itemIndex].rating[rowindex]) {
                return "checked";
            }
        }

        //When click next answer button( " > " )
        $scope.increaseindex = function () {
            if ($scope.itemIndex == $scope.items.length - 1) {
                $rootScope.info('This is last Item.');
            } else {
                $scope.itemIndex++;
            }
            $rootScope.safeApply();
        }

        //When click previous answer button( " < " )
        $scope.decreaseindex = function () {
            if ($scope.itemIndex == 0) {
                $rootScope.info('This is first Item.');
            } else {
                $scope.itemIndex--;
            }
            $rootScope.safeApply();
        }

        $scope.changeIndex = function (nextIndex) {
            if (nextIndex == $scope.itemIndex) return;
            $scope.itemIndex = nextIndex;
            $rootScope.safeApply();
        }

        $scope.setstar = function (index, rowindex) {
            index++;
            let currValue = $scope.answer[$scope.itemIndex].rating[rowindex];
            if (index == currValue) {
                currValue = index - 1;
            } else {
                currValue = index;
            }
            $scope.answer[$scope.itemIndex].rating[rowindex] = currValue;
            $scope.submitAnswer();
            $rootScope.safeApply();
        }

        $scope.changeAward = function () {
            let currScore = $scope.answer[$scope.itemIndex].awardScore;
            let nextScore = $scope.nextAwardScore[$scope.itemIndex];
            nextScore = parseInt(nextScore);
            if (isNaN(nextScore)) {
                nextScore = currScore;
            }
            nextScore = Math.round(nextScore);
            if (nextScore < 0) nextScore = 0;

            let tempTotalScore = $scope.totalAwardScore - currScore + nextScore;
            if (tempTotalScore > $scope.question.awardScore) {
                nextScore = $scope.question.awardScore - $scope.totalAwardScore + currScore;
                tempTotalScore = $scope.question.awardScore;
                $rootScope.error("You reached max award score!");
            }
            if (currScore == nextScore) {
                $scope.nextAwardScore[$scope.itemIndex] = nextScore;
                return;
            }
            if (nextScore == 0) $scope.totalAwardPeople--;
            if (currScore == 0) {
                if ($scope.question.awardPeoples == $scope.totalAwardPeople) {
                    nextScore = 0;
                    tempTotalScore = $scope.totalAwardScore - currScore + nextScore;
                    $rootScope.error("You reached max award item count!");
                } else {
                    $scope.totalAwardPeople++;
                }
            }
            $scope.answer[$scope.itemIndex].awardScore = nextScore;
            $scope.nextAwardScore[$scope.itemIndex] = nextScore;
            $scope.totalAwardScore = tempTotalScore;
            $scope.submitAnswer();
            $rootScope.safeApply();
        }
       
        // submit stars and text feedback

        $scope.submitAnswer = function () {
            $scope.originAnswer.datetime = getDateTime();
            $scope.answerRef.set($scope.originAnswer)
           
        }

    }
})();