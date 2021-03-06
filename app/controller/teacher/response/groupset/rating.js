(function () {
    angular
        .module('myApp')
        .controller('groupResponseOfRatingAnswerController', groupResponseOfRatingAnswerController)
    groupResponseOfRatingAnswerController.$inject = ['$state', '$scope', '$rootScope', '$filter'];
    function groupResponseOfRatingAnswerController($state, $scope, $rootScope, $filter) {
        // **************   router:    groupResponseOfRatingAnswer  *****************

        $rootScope.setData('showMenubar', true);
        var groupType = $rootScope.settings.groupType;
        $rootScope.setData('backUrl', groupType == 'sub' ? "groupSubRoot" : "groupSecondRoot");

        $scope.question = $rootScope.settings.question;
        $scope.groupKey = $rootScope.settings.groupKey;
        $scope.groupSetKey = $rootScope.settings.groupSetKey;
        $scope.subIndex = $rootScope.settings.subIndex;
        $scope.subSetKey = $rootScope.settings.subSetKey;
        $scope.secondIndex = $rootScope.settings.secondIndex;


        $scope.type = $scope.question.ratingtype;
        $scope.items = $scope.question.teamRate ? $rootScope.settings.subGroups : $scope.question.ratingItems;
        $scope.options = $scope.question.ratingOptions || [];
        $scope.top_answers = $scope.question.top_answers;
        $scope.isAward = $scope.question.awardScore && $scope.question.awardPeoples
        $scope.orderBy = 'rating';
        $scope.itemIndex = 0;

        let settingRefStr = 'Questions/' + $scope.question.code + '/teacherFeedback/' + $scope.groupKey +
            + '/' + $scope.groupSetKey + '/';
        if (groupType == 'sub') {       //if 1st child group answer
            $scope.settingRef = firebase.database().ref(settingRefStr + 'data');
        } else {
            $scope.settingRef = firebase.database().ref(settingRefStr + $scope.subSetKey + '/data');
        }
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.settingRef) $scope.settingRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
            $('#groupSettingModal').modal('hide');
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
                let allAnswers = snapshot.val() || {}
                for (var key in allAnswers) {
                    var answer = allAnswers[key];
                    if (answer.groupType != groupType || answer.studentgroupkey != $scope.groupKey ||
                        answer.groupSetKey != $scope.groupSetKey) continue;

                    if (groupType == 'sub') {       //if 1st child group answer
                        if (!$scope.question.teamRate && answer.subIndex != $scope.subIndex) continue;
                    } else {               //if 2nd child group answer
                        if (answer.subIndex != $scope.subIndex || answer.subSetKey != $scope.subSetKey) continue;
                        if (!$scope.question.teamRate && answer.secondIndex != $scope.secondIndex) continue;
                    }
                    $scope.allAnswers[answer.uid] = answer
                }
                $scope.ref_2 = true;
                $scope.finalCalc();
            });
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return

            $scope.temp_answers = [];
            for (i = 0; i < $scope.items.length; i++) {
                $scope.temp_answers[i] = {
                    itemName: $scope.items[i],
                    student: [],
                    teacher: [],
                    rating: [],
                    avRating: 0,
                    feedbacktext: [],
                    awardScore: 0
                };
                for (j = 0; j < $scope.options.length; j++) {
                    $scope.temp_answers[i].rating[j] = {
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
                userAns.answer.forEach((itemAnswer, itemIndex) => {
                    let valueExist = false;
                    let tempItemAnswer = $scope.temp_answers[itemIndex];
                    if (itemAnswer.feedbacktext) {
                        valueExist = true;
                        tempItemAnswer.feedbacktext.push(itemAnswer.feedbacktext);
                    }
                    if (itemAnswer.awardScore) {
                        valueExist = true;
                        tempItemAnswer.awardScore += itemAnswer.awardScore;
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
            $scope.temp_answers.forEach(tempItemAnswer => {
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
            $scope.orderChanged($scope.orderBy);
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }

        $scope.orderChanged = function (orderBy) {
            $scope.orderBy = orderBy
            $scope.answer = $filter('orderBy')($scope.temp_answers, ($scope.orderBy == 'rating') ? '-avRating' : '-awardScore');
            if ($scope.top_answers) {
                var last = $scope.answer.length;
                for (var i = $scope.top_answers; i < last; i++) {
                    $scope.answer.pop();
                }
            }
            $rootScope.safeApply();
        }

        //When click next answer button( " > " )
        $scope.increaseindex = function () {
            if ($scope.itemIndex == $scope.answer.length - 1) {
                $rootScope.info('This is last ' + ($scope.question.teamRate ? 'group.' : 'item.'));
            } else {
                $scope.itemIndex++;
            }
            $rootScope.safeApply();
        }

        //When click previous answer button( " < " )
        $scope.decreaseindex = function () {
            if ($scope.itemIndex == 0) {
                $rootScope.info('This is first ' + ($scope.question.teamRate ? 'group.' : 'item.'));
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

        // =============================   Group Setting functions  ====================================

        $scope.showGroupSettingModal = function () {
            $('#groupSettingModal').modal({ backdrop: 'static', keyboard: false });
            $rootScope.safeApply();
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
            $scope.saveSetting();
        }
        $scope.saveSetting = function () {
            $scope.settingRef.set($scope.feedbackSetting);
        }
    }

})();