(function () {

    angular
        .module('myApp')
        .controller('teacherGroupRatingController', teacherGroupRatingController)

    teacherGroupRatingController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherGroupRatingController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacherLinkGroupQuestions");
        $scope.question = $rootScope.settings.questionObj;
        $scope.items = $scope.question.teamRate ? $rootScope.settings.subGroups : ($scope.question.ratingItems || []);
        $scope.options = $scope.question.ratingOptions || [];
        $scope.type = $scope.question.ratingtype;
        $scope.userType = 'student';
        $scope.itemIndex = 0;
        $scope.feedKey = undefined;
        $scope.feedIndex = undefined;
        $scope.isAward = $scope.question.awardScore && $scope.question.awardPeoples
        let settingRefStr = 'Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey +
            + '/' + $rootScope.settings.groupSetKey + '/';
        if ($rootScope.settings.groupType == 'sub') {       //if 1st child group answer
            $scope.settingRef = firebase.database().ref(settingRefStr + 'data');
        } else {
            $scope.settingRef = firebase.database().ref(settingRefStr + $rootScope.settings.subSetKey + '/data');
        }

        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.settingRef) $scope.settingRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
            if ($scope.shareRef) $scope.shareRef.off('value')
        });
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getFeedbackSetting();
            $scope.getanswers();
        }

        $scope.getFeedbackSetting = function () {
            $scope.settingRef.on('value', function (snapshot) {
                if (snapshot.val()) {
                    $scope.feedbackSetting = snapshot.val();
                } else {
                    $scope.feedbackSetting = {
                        studentRate: 100,
                        teacherRate: 0,
                        showIndividual: false
                    }
                }
                $scope.feedbackSetting.showIndividual = $scope.feedbackSetting.showIndividual || false;
                $scope.ref_1 = true;
                $scope.finalCalc();
            })
        }

        $scope.getanswers = function () {
            $scope.answerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($scope.question.code);
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = {}
                for (var key in snapshot.val()) {
                    var answer = snapshot.val()[key];
                    if (answer.groupType != $rootScope.settings.groupType ||
                        answer.studentgroupkey != $rootScope.settings.groupKey ||
                        answer.groupSetKey != $rootScope.settings.groupSetKey
                    ) continue;

                    if ($rootScope.settings.groupType == 'sub') {       //if 1st child group answer
                        if (!$scope.question.teamRate && answer.subIndex != $rootScope.settings.subIndex) continue;
                    } else {                                           //if 2nd child group answer
                        if (answer.subIndex != $rootScope.settings.subIndex || answer.subSetKey != $rootScope.settings.subSetKey) continue;
                        if (!$scope.question.teamRate && answer.secondIndex != $rootScope.settings.secondIndex) continue;
                    }
                    $scope.allAnswers[answer.uid] = answer
                }
                $scope.ref_2 = true;
                $scope.finalCalc();
            });
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $scope.answers = [];
            for (i = 0; i < $scope.items.length; i++) {
                $scope.answers[i] = {
                    itemName: $scope.items[i],
                    student: [],
                    teacher: [],
                    rating: [],
                    avRating: 0,
                    feedbacktext: [],
                    awardScore: 0,
                    awardUsers: 0,
                };
                for (j = 0; j < $scope.options.length; j++) {
                    $scope.answers[i].rating[j] = {
                        teRating: 0,
                        stRating: 0,
                        totalRating: 0,
                        teCount: 0,
                        stCount: 0,
                        totalCount: 0,
                    }
                }
            }
            for (userKey in $scope.allAnswers) {
                let userAns = $scope.allAnswers[userKey];
                if ($rootScope.settings.groupType == 'sub') {       //if 1st child group answer
                    if (!$scope.question.teamRate && $scope.GroupIndex && $scope.GroupIndex - 1 != userAns.subIndex) continue;
                } else {
                    if ($scope.GroupIndex && $scope.GroupIndex - 1 != userAns.subIndex) continue;
                    if (!$scope.question.teamRate && $scope.SubGroupIndex && $scope.SubGroupIndex - 1 != userAns.secondIndex) continue;
                }


                userAns.answer.forEach((itemAnswer, itemIndex) => {
                    let valueExist = false;
                    let tempItemAnswer = $scope.answers[itemIndex];
                    if (itemAnswer.feedbacktext) {
                        valueExist = true;
                        tempItemAnswer.feedbacktext.push(itemAnswer.feedbacktext);
                    }
                    if (itemAnswer.awardScore) {
                        valueExist = true;
                        tempItemAnswer.awardScore += itemAnswer.awardScore;
                        tempItemAnswer.awardUsers++;
                    }
                    itemAnswer.rating = itemAnswer.rating || []
                    itemAnswer.rating.map((rate, optionIndex) => {
                        if (rate) {
                            valueExist = true;
                            if (userAns.isTeacherRating) {
                                tempItemAnswer.rating[optionIndex].teRating += rate;
                                tempItemAnswer.rating[optionIndex].teCount++;
                            } else {
                                tempItemAnswer.rating[optionIndex].stRating += rate;
                                tempItemAnswer.rating[optionIndex].stCount++;
                            }
                            tempItemAnswer.rating[optionIndex].totalCount++;
                        }
                    })
                    if (valueExist) {
                        let temp = angular.copy(itemAnswer);
                        temp.key = userKey
                        temp.answerKey = userAns.key;
                        if (userAns.isTeacherRating) {
                            tempItemAnswer.teacher.push(temp);
                        } else {
                            tempItemAnswer.student.push(temp);
                        }
                    }
                });
            }
            $scope.answers.forEach(tempItemAnswer => {
                let optionCount = 0;
                tempItemAnswer.rating.map(optionAnswers => {
                    let tempStRate = $scope.feedbackSetting.studentRate;
                    let tempTeRate = $scope.feedbackSetting.teacherRate;
                    if (optionAnswers.teCount) {
                        optionAnswers.teRating = Math.round(optionAnswers.teRating / optionAnswers.teCount * 10) / 10;
                    } else {
                        tempStRate = 100;
                        tempTeRate = 0;
                    }
                    if (optionAnswers.stCount) {
                        optionAnswers.stRating = Math.round(optionAnswers.stRating / optionAnswers.stCount * 10) / 10;
                    } else {
                        tempStRate = 0;
                        tempTeRate = 100;
                    }

                    optionAnswers.totalRating = (optionAnswers.stRating * tempStRate + optionAnswers.teRating * tempTeRate) / 100;
                    if (optionAnswers.totalRating) {
                        tempItemAnswer.avRating += optionAnswers.totalRating;
                        optionCount++;
                    }
                    optionAnswers.totalRating = Math.round(optionAnswers.totalRating * 10) / 10;
                })
                tempItemAnswer.avRating = optionCount ? Math.round(tempItemAnswer.avRating / optionCount * 10) / 10 : '-';
            });
            $scope.getMyFeedback();
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }

        $scope.getMyFeedback = function () {
            if ($scope.allAnswers[$rootScope.settings.userId]) {
                $scope.myFeedback = angular.copy($scope.allAnswers[$rootScope.settings.userId].answer)
            } else {
                $scope.myFeedback = Array($scope.items.length).fill().map(() => {
                    return {
                        feedbacktext: '',
                        rating: Array($scope.options.length).fill(0),
                    }
                });
            }
        }

        $scope.changeItem = function (nextIndex) {
            if (nextIndex == $scope.itemIndex) return;
            $scope.itemIndex = nextIndex;
            $rootScope.safeApply();
        }

        //When click next item button( " > " )
        $scope.increaseItemIndex = function () {
            if ($scope.itemIndex == $scope.items.length - 1) {
                $rootScope.info('This is last item.');
                return;
            } else {
                $scope.changeItem($scope.itemIndex + 1);
            }
        }

        //When click previous answer button( " < " )
        $scope.decreaseItemIndex = function () {
            if ($scope.itemIndex == 0) {
                $rootScope.info('This is first item.');
                return;
            } else {
                $scope.changeItem($scope.itemIndex - 1);
            }
        }

        $scope.setstar = function (index, rowindex) {
            index++;
            let currValue = $scope.myFeedback[$scope.itemIndex].rating[rowindex];
            if (index == currValue) {
                currValue = index - 1;
            } else {
                currValue = index;
            }
            $scope.myFeedback[$scope.itemIndex].rating[rowindex] = currValue;
            $scope.saveFeedback();
        }
        $scope.saveFeedback = function () {
            let newData = $scope.allAnswers[$rootScope.settings.userId];
            if (!newData) {
                newData = {
                    groupSetKey: $rootScope.settings.groupSetKey,
                    groupType: $rootScope.settings.groupType,
                    key: firebase.database().ref("GroupAnswers").push().key,
                    mail: $rootScope.settings.userEmail,
                    question: $scope.question.question,
                    questionKey: $scope.question.code,
                    studentgroupkey: $rootScope.settings.groupKey,
                    subIndex: $rootScope.settings.subIndex,
                    uid: $rootScope.settings.userId,
                    subSetKey: $rootScope.settings.groupType == 'second' ? $rootScope.settings.subSetKey : {},
                    secondIndex: $rootScope.settings.groupType == 'second' ? $rootScope.settings.secondIndex : {},
                    isTeacherRating: true,
                }
            }
            newData.answer = angular.copy($scope.myFeedback);
            newData.datetime = getDateTime();
            firebase.database().ref("GroupAnswers/" + newData.key).set(newData).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.getStarState = function (index, rowindex) {
            if (index < $scope.myFeedback[$scope.itemIndex].rating[rowindex]) {
                return "checked";
            }
        }

        $scope.changeRate = function (rate, type) {
            rate = Number(rate);
            if (isNaN(rate)) {
                rate = 0;
            }
            if (rate > 100) {
                rate = 100;
            }
            if (rate < 0) {
                rate = 0;
            }
            rate = Math.round(rate);
            if (type == 'teacher') {
                $scope.feedbackSetting.teacherRate = rate;
                $scope.feedbackSetting.studentRate = 100 - rate;
            } else {
                $scope.feedbackSetting.teacherRate = 100 - rate;
                $scope.feedbackSetting.studentRate = rate;
            }
            $scope.settingRef.set($scope.feedbackSetting);
        }


    }
})();