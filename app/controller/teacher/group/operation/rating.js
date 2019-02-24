(function () {

    angular
        .module('myApp')
        .controller('teacherRatingController', teacherRatingController)

    teacherRatingController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherRatingController($state, $scope, $rootScope, $filter) {
        // ****************** router:  teacherRating ****************************

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        $scope.question = $rootScope.settings.question;
        $scope.items = $scope.question.ratingItems || [];
        $scope.options = $scope.question.ratingOptions || [];
        $scope.type = $scope.question.ratingtype;
        $scope.feedKey = undefined;
        $scope.feedIndex = undefined;
        $scope.isAward = $scope.question.awardScore && $scope.question.awardPeoples;

        $scope.userType = 'student';
        $scope.itemIndex = 0;

        let answerRefStr = 'NewAnswers/' + $scope.question.code + '/answer/';
        let groupSettingRefStr = 'Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey + '/data';
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.settingRef) $scope.settingRef.off('value')
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
            if ($scope.shareRef) $scope.shareRef.off('value')
        });
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);

            $scope.getFeedbackSetting();
            $scope.getStudentsInGroup();
            $scope.getSharedTeachers();
            $scope.getanswers();
        }

        $scope.getFeedbackSetting = function () {
            $scope.settingRef = firebase.database().ref(groupSettingRefStr);
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

        $scope.getStudentsInGroup = function () {
            $scope.userRef = firebase.database().ref('StudentGroups');
            $scope.userRef.on('value', function (snapshot) {
                $scope.studentsInGroup = [];
                for (studentKey in snapshot.val()) {
                    let user = snapshot.val()[studentKey];
                    if (Object.values(user).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                $scope.ref_2 = true;
                $scope.finalCalc();
            })
        }
        $scope.getSharedTeachers = function () {
            $scope.shareRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/sharedList');
            $scope.shareRef.on('value', function (snapshot) {
                $scope.teacherKeys = Object.keys(snapshot.val() || {})
                if ($scope.teacherKeys.indexOf($rootScope.settings.userId) == -1) $scope.teacherKeys.push($rootScope.settings.userId)
                $scope.ref_3 = true;
                $scope.finalCalc();
            })
        }

        $scope.getanswers = function () {
            $scope.answerRef = firebase.database().ref(answerRefStr);
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {}
                $scope.ref_4 = true;
                $scope.finalCalc();
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return

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
                if ($scope.studentsInGroup.indexOf(userKey) == -1 && $scope.teacherKeys.indexOf(userKey) == -1) continue;
                let userAns = $scope.allAnswers[userKey];
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
            let newData = {
                answer: angular.copy($scope.myFeedback),
                datetime: getDateTime(),
                mail: $rootScope.settings.userEmail,
                isTeacherRating: true,
            }
            firebase.database().ref(answerRefStr + $rootScope.settings.userId).set(newData).then(function () {
                $rootScope.safeApply();
            }).catch(function (error) {
                $rootScope.error('Submit Error!')
            });
        }
        $scope.getStarState = function (index, rowindex) {
            if (index < $scope.myFeedback[$scope.itemIndex].rating[rowindex]) {
                return "checked";
            }
        }

        // =============================   Group Setting functions  ====================================

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