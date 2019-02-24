(function () {

    angular
        .module('myApp')
        .controller('teacherGroupRatingResultController', teacherGroupRatingResultController)

    teacherGroupRatingResultController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherGroupRatingResultController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacherGroupRating");
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
            $scope.selectFeedback();
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }

        // feedback change functions
        $scope.selectFeedback = function (userType) {
            if (userType) {
                $scope.userType = userType
            }
            $scope.changeFeedIndex(0);
        }

        $scope.changeFeedIndex = function (index = undefined) {
            var feedbacks = $scope.answers[$scope.itemIndex][$scope.userType];
            if (feedbacks.length == 0) {
                $scope.feedIndex = undefined;
                $scope.feedKey = undefined;
                $rootScope.warning("There isn't any " + $scope.userType + " feedback data!");
                return;
            }
            if (index == undefined) {
                $scope.feedIndex = 0
                if ($scope.feedKey) {
                    for (var i = 0; i < feedbacks.length; i++) {
                        if (feedbacks[i].key == $scope.feedKey) {
                            $scope.feedIndex = i;
                            break;
                        }
                    }
                }
            } else {
                if (index == feedbacks.length) {
                    $rootScope.info('This is last feedback.');
                    return;
                }
                if (index == -1) {
                    $rootScope.info('This is first feedback.');
                    return;
                }
                $scope.feedIndex = index;

            }
            $scope.feedKey = feedbacks[$scope.feedIndex].key;
            $rootScope.safeApply();
        }

        //When click next feedback button( " > " )
        $scope.increaseFeedIndex = function () {
            if ($scope.feedIndex == undefined) return;
            $scope.changeFeedIndex($scope.feedIndex + 1);
        }

        //When click previous feedback button( " < " )
        $scope.decreaseFeedIndex = function () {
            if ($scope.feedIndex == undefined) return;
            $scope.changeFeedIndex($scope.feedIndex - 1);
        }

        $scope.deleteFeedback = function () {
            if (!$scope.feedKey) {
                $rootScope.warning("There isn't any selected feedback!");
                return
            }
            if (!confirm("Are you sure want to delete this feedback?")) return
            let answerKey = $scope.answers[$scope.itemIndex][$scope.userType][$scope.feedIndex].answerKey;
            let tempAnswer = { awardScore: 0 }
            if ($scope.type) tempAnswer.rating = Array($scope.options.length).fill(0)
            if ($scope.type % 2 == 0) tempAnswer.feedbacktext = '';

            var updates = {};
            updates['GroupAnswers/' + answerKey + '/answer/' + $scope.itemIndex] = tempAnswer;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            }).catch(function (error) {
                $rootScope.error('Database Error.  Try again!')
            });
        }

        $scope.changeItem = function (nextIndex) {
            if (nextIndex == $scope.itemIndex) return;
            $scope.itemIndex = nextIndex;
            $scope.changeFeedIndex(0);
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
    }
})();