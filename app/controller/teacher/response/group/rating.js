(function () {

    angular
        .module('myApp')
        .controller('responseOfRatingAnswerController', responseOfRatingAnswerController)

    responseOfRatingAnswerController.$inject = ['$state', '$scope', '$rootScope', '$filter'];
    // **************   router:    responseOfRatingAnswer  *****************

    function responseOfRatingAnswerController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        $scope.question = $rootScope.settings.question;
        $scope.type = $scope.question.ratingtype;
        $scope.items = $scope.question.ratingItems || [];
        $scope.options = $scope.question.ratingOptions || [];
        $scope.top_answers = $scope.question.top_answers || 0;
        $scope.isAward = $scope.question.awardScore && $scope.question.awardPeoples;
        $scope.itemIndex = 0;
        $scope.orderBy = 'rating';
        let answerRefStr = 'NewAnswers/' + $scope.question.code + '/answer/';
        let groupSettingRefStr = 'Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey + '/data';
        $rootScope.safeApply();


        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
            if ($scope.settingRef) $scope.settingRef.off('value')
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
            if ($scope.shareRef) $scope.shareRef.off('value')
            $('#groupSettingModal').modal('hide');
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
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return;
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
                if ($scope.studentsInGroup.indexOf(userKey) == -1 && $scope.teacherKeys.indexOf(userKey) == -1) continue;
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