(function () {

    angular
        .module('myApp')
        .controller('GroupRatingAnswerController', GroupRatingAnswerController)

    GroupRatingAnswerController.$inject = ['$state', '$scope', '$rootScope'];

    function GroupRatingAnswerController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "subQuestions");
        $scope.itemIndex = 0;
        $scope.question = $rootScope.settings.questionObj;

        $scope.type = $scope.question.ratingtype;
        $scope.items = $scope.question.teamRate ? $rootScope.settings.subGroups : $scope.question.ratingItems;
        $scope.options = $scope.question.ratingOptions || [];
        $scope.groupIndex = $rootScope.settings.groupType == 'sub' ? $rootScope.settings.subIndex : $rootScope.settings.secondIndex;
        let uid = $rootScope.settings.userId;
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.getanswer = function () {
            $rootScope.setData('loadingfinished', false);
            var myanswer = firebase.database().ref('GroupAnswers').orderByChild('uid').equalTo(uid);
            myanswer.once('value', function (snapshot) {
                if (snapshot.val()) {
                    for (key in snapshot.val()) {
                        var answer = snapshot.val()[key];
                        var checkSecond = true;
                        if ($rootScope.settings.groupType == 'second') {
                            if (answer.subSetKey != $rootScope.settings.subSetKey || answer.secondIndex != $rootScope.settings.secondIndex) {
                                checkSecond = false;
                            }
                        }
                        if (answer.groupType == $rootScope.settings.groupType && answer.questionKey == $scope.question.code &&
                            answer.studentgroupkey == $rootScope.settings.groupKey && answer.subIndex == $rootScope.settings.subIndex
                            && answer.groupSetKey == $rootScope.settings.groupSetKey
                            && checkSecond) {
                            $scope.originAnswer = answer;
                            $scope.answerKey = key;
                        }
                    };
                }
                if (!$scope.originAnswer) {
                    let answer = Array($scope.items.length).fill().map(() => {
                        return { awardScore: 0, feedbacktext: "", rating: Array($scope.options.length).fill(0) };
                    })

                    $scope.originAnswer = {
                        key: firebase.database().ref("GroupAnswers").push().key,
                        groupType: $rootScope.settings.groupType,
                        questionKey: $scope.question.code,
                        question: $scope.question.question,
                        answer: answer,
                        mail: $rootScope.settings.userEmail,
                        studentgroupkey: $rootScope.settings.groupKey,
                        studentgroupname: $rootScope.settings.groupName,
                        groupSetKey: $rootScope.settings.groupSetKey,
                        subIndex: $rootScope.settings.subIndex,
                        uid: uid,
                        subSetKey: $rootScope.settings.groupType == 'second' ? $rootScope.settings.subSetKey : {},
                        secondIndex: $rootScope.settings.groupType == 'second' ? $rootScope.settings.secondIndex : {},
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
            });
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

        $scope.getStarState = function (index, rowindex) {
            if (index < $scope.answer[$scope.itemIndex].rating[rowindex]) {
                return "checked";
            }
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
            firebase.database().ref('GroupAnswers/' + $scope.originAnswer.key).set($scope.originAnswer);
            $rootScope.safeApply();
        }

        $scope.gotoGroupResult = function () {
            $rootScope.setData('backUrl', "groupRatingAnswer");
            $state.go('groupRatingView');
        }

    }
})();