(function () {
    angular
        .module('myApp')
        .controller('groupResponseOfFeedbackAnswerController', groupResponseOfFeedbackAnswerController)
    groupResponseOfFeedbackAnswerController.$inject = ['$state', '$scope', '$rootScope', '$filter'];
    function groupResponseOfFeedbackAnswerController($state, $scope, $rootScope, $filter) {
        // **************   router:    groupResponseOfFeedbackAnswer  *****************

        $rootScope.setData('showMenubar', true);
        var groupType = $rootScope.settings.groupType;
        $rootScope.setData('backUrl', groupType == 'sub' ? "groupSubRoot" : "groupSecondRoot");

        $scope.question = $rootScope.settings.question;
        $scope.groupKey = $rootScope.settings.groupKey;
        $scope.groupSetKey = $rootScope.settings.groupSetKey;
        $scope.subIndex = $rootScope.settings.subIndex;
        $scope.subSetKey = $rootScope.settings.subSetKey;
        $scope.secondIndex = $rootScope.settings.secondIndex;

        $scope.feedqts = ($scope.question.feedqts) ? $scope.question.feedqts : [];
        $scope.type = $scope.question.type;
        $scope.top_answers = $scope.question.top_answers;

        $scope.orderBy = 'rating';
        let tempScores = [];
        if ($scope.feedqts) {
            for (i = 0; i < $scope.feedqts.length; i++) {
                tempScores.push(0);
            }
        }

        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.feedSetRef) $scope.feedSetRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        });

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getFeedbackSetting();
            $scope.getAnswers();
        }
        $scope.getFeedbackSetting = function () {
            $scope.feedbackSetting = {
                studentRate: 100,
                teacherRate: 0,
            }
            $scope.feedSetRef = firebase.database().ref('Questions/' + $scope.question.code + '/teacherFeedback/' + $scope.groupKey + '/data');
            $scope.feedSetRef.on('value', function (snapshot) {
                $scope.feedbackSetting = snapshot.val() || {
                    studentRate: 100,
                    teacherRate: 0,
                };
                $scope.ref_1 = true;
                $scope.finalCalc();
            })
        }
        $scope.getAnswers = function () {
            $scope.answerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($scope.question.code);
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = {};
                for (var key in snapshot.val()) {
                    var answer = snapshot.val()[key];

                    if (answer.groupType != groupType ||
                        answer.studentgroupkey != $scope.groupKey ||
                        answer.groupSetKey != $scope.groupSetKey
                    ) continue;

                    if (groupType == 'sub') {       //if 1st child group answer
                        if ($scope.question.groupFeedback != 'group' && answer.subIndex != $scope.subIndex) continue;
                    } else {                                           //if 2nd child group answer
                        if (answer.subIndex != $scope.subIndex || answer.subSetKey != $scope.subSetKey) continue;
                        if ($scope.question.groupFeedback != 'group' && answer.secondIndex != $scope.secondIndex) continue;
                    }
                    $scope.allAnswers[key] = answer;
                }
                $scope.ref_2 = true;
                $scope.finalCalc();

            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return;
            $scope.temp_answers = [];
            for (var key in $scope.allAnswers) {
                var answer = $scope.allAnswers[key];

                answer.feedbacktext = [];
                answer.resultScore = angular.copy(tempScores)
                answer.totalScore = 0;
                var studentCount = 0;
                var teacherCount = 0;
                var studentScores = angular.copy(tempScores);
                var teacherScores = angular.copy(tempScores);
                for (var userKey in answer.Feedbacks) {
                    var feed = answer.Feedbacks[userKey];
                    if (feed.score) {
                        if (feed.userType == 'student') {
                            studentCount++
                            studentScores.push(angular.copy(feed.score))
                            for (var i = 0; i < feed.score.length; i++) {
                                studentScores[i] += feed.score[i]
                            }
                        } else {
                            teacherCount++
                            for (var i = 0; i < feed.score.length; i++) {
                                teacherScores[i] += feed.score[i]
                            }
                        }
                    }
                    if (feed.text) {
                        answer.feedbacktext.push(feed.text)
                    }
                }

                var tempStRate = 0;
                var tempTeRate = 0;
                if (studentCount > 0) {
                    if (teacherCount > 0) {
                        tempStRate = $scope.feedbackSetting.studentRate;
                        tempTeRate = $scope.feedbackSetting.teacherRate;
                    } else {
                        tempStRate = 100
                    }
                } else {
                    if (teacherCount > 0) {
                        tempTeRate = 100
                    }
                }

                if (studentCount > 0) {
                    for (var i = 0; i < studentScores.length; i++) {
                        studentScores[i] /= studentCount
                    }
                }
                if (teacherCount > 0) {
                    for (var i = 0; i < teacherScores.length; i++) {
                        teacherScores[i] /= teacherCount
                    }
                }

                for (var i = 0; i < answer.resultScore.length; i++) {
                    answer.resultScore[i] = studentScores[i] * tempStRate / 100 + teacherScores[i] * tempTeRate / 100;
                    answer.totalScore += answer.resultScore[i]
                    answer.resultScore[i] = Math.round(answer.resultScore[i] * 10) / 10
                }
                answer.totalScore /= answer.resultScore.length
                answer.totalScore = Math.round(answer.totalScore * 10) / 10
                answer.userCount = studentCount + teacherCount
                answer.totalAwardScore = 0;

                for (key in answer.awardScore) {
                    answer.totalAwardScore += answer.awardScore[key];
                }
                $scope.temp_answers.push(answer);
            }
            $scope.orderChanged($scope.orderBy)
            $scope.selectUser();
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }
        $scope.orderChanged = function (orderBy) {
            $scope.orderBy = orderBy;
            $scope.answers = $filter('orderBy')($scope.temp_answers, ($scope.orderBy == 'rating') ? '-totalScore' : '-totalAwardScore');
            if ($scope.top_answers) {
                var last = $scope.answers.length;
                for (var i = $scope.top_answers; i < last; i++) {
                    $scope.answers.pop();
                }
            }
            $rootScope.safeApply()
        }
        $scope.selectUser = function () {
            if ($scope.answers.length == 0) {
                $scope.selectedUserKey = undefined;
                $scope.answerIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                $scope.answerIndex = 0;
                if ($scope.selectedUserKey) {
                    for (var i = 0; i < $scope.answers.length; i++) {
                        if ($scope.answers[i].key == $scope.selectedUserKey) {
                            $scope.answerIndex = i;
                            break;
                        }
                    }
                }
                $scope.selectedUserKey = $scope.answers[$scope.answerIndex].key;
            }
            $rootScope.safeApply();
        }

        //When click next answer button( " > " )
        $scope.increaseindex = function () {
            if ($scope.answers.length == 0) {
                $scope.selectedUserKey = undefined;
                $scope.selectedIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                if ($scope.answerIndex == $scope.answers.length - 1) {
                    $rootScope.info('This is last Answer.');
                } else {
                    $scope.answerIndex++;
                    $scope.selectedUserKey = $scope.answers[$scope.answerIndex].key;
                }
            }
            $rootScope.safeApply();
        }

        //When click previous answer button( " < " )
        $scope.decreaseindex = function () {
            if ($scope.answers.length == 0) {
                $scope.selectedUserKey = undefined;
                $scope.selectedIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                if ($scope.answerIndex == 0) {
                    $rootScope.info('This is first Answer.');
                } else {
                    $scope.answerIndex--;
                    $scope.selectedUserKey = $scope.answers[$scope.answerIndex].key;
                }
            }
            $rootScope.safeApply();
        }

        $scope.changeIndex = function (nextIndex) {
            if (nextIndex == $scope.answerIndex) return;
            $scope.answerIndex = nextIndex;
            $scope.selectedUserKey = $scope.answers[$scope.answerIndex].key;
            $rootScope.safeApply();
        }

    }

})();