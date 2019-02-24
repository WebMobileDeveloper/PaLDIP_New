(function () {

    angular
        .module('myApp')
        .controller('teacherGroupFeedbackController', teacherGroupFeedbackController)

    teacherGroupFeedbackController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherGroupFeedbackController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacherLinkGroupQuestions");
        $scope.question = $rootScope.settings.questionObj;
        $scope.feedqts = ($scope.question.feedqts) ? $scope.question.feedqts : [];
        $scope.type = $scope.type2 = $scope.question.type;
        if ($scope.type == 2) {
            $scope.type2 = 0
        }
        $rootScope.safeApply();


        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.userType = 'student';
            $scope.selectedAnswerKey = undefined
            $scope.selectedAnswerIndex = undefined
            $scope.selectedFeedbackKey = {
                student: undefined,
                teacher: undefined
            }
            $scope.selectedFeedbackIndex = {
                student: undefined,
                teacher: undefined
            }
            $scope.getFeedbackSetting();
        }
        $scope.getFeedbackSetting = function () {
            $scope.feedbackSetting = {
                studentRate: 100,
                teacherRate: 0,
            }
            var setRef = undefined;
            if ($rootScope.settings.groupType == 'sub') {       //if 1st child group answer
                setRef = firebase.database().ref('Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey
                    + '/' + $rootScope.settings.groupSetKey + '/data');
            } else {
                setRef = firebase.database().ref('Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey
                    + '/' + $rootScope.settings.groupSetKey + '/' + $rootScope.settings.subSetKey + '/data');
            }
            setRef.on('value', function (snapshot) {
                if (snapshot.val()) {
                    $scope.feedbackSetting = snapshot.val();
                    $rootScope.safeApply();
                }
                $scope.getanswer()
            })
        }

        $scope.getanswer = function () {
            var tempScores = [];
            for (i = 0; i < $scope.feedqts.length; i++) {
                tempScores[i] = 0;
            }
            var answerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($scope.question.code);
            answerRef.on('value', function (snapshot) {
                $scope.answers = [];
                for (var key in snapshot.val()) {
                    var answer = snapshot.val()[key];

                    if (answer.groupType != $rootScope.settings.groupType ||
                        answer.studentgroupkey != $rootScope.settings.groupKey ||
                        answer.groupSetKey != $rootScope.settings.groupSetKey
                    ) continue;

                    if ($rootScope.settings.groupType == 'sub') {       //if 1st child group answer
                        if ($scope.question.groupFeedback != 'group' && answer.subIndex != $rootScope.settings.subIndex) continue;
                    } else {                                           //if 2nd child group answer
                        if (answer.subIndex != $rootScope.settings.subIndex || answer.subSetKey != $rootScope.settings.subSetKey) continue;
                        if ($scope.question.groupFeedback != 'group' && answer.secondIndex != $rootScope.settings.secondIndex) continue;
                    }

                    var feedbackArr = {
                        teacher: [],
                        student: []
                    }

                    var totalScore = {
                        student: 0,
                        teacher: 0,
                    }
                    var scoreCount = {
                        total: 0,
                        student: 0,
                        teacher: 0,
                    }
                    for (var userKey in answer.Feedbacks) {
                        var feed = answer.Feedbacks[userKey];
                        feed.key = userKey;
                        if (feed.score) {
                            for (var i = 0; i < feed.score.length; i++) {
                                totalScore[feed.userType] += feed.score[i]
                            }
                            scoreCount[feed.userType]++
                            scoreCount['total']++
                        } else {
                            feed.score = angular.copy(tempScores);
                        }
                        feedbackArr[feed.userType].push(angular.copy(feed));
                    }

                    var tempStRate = 0;
                    var tempTeRate = 0;
                    if (scoreCount['student'] > 0) {
                        totalScore['student'] /= scoreCount['student']
                        if (scoreCount['teacher'] > 0) {
                            tempStRate = $scope.feedbackSetting.studentRate;
                            tempTeRate = $scope.feedbackSetting.teacherRate;
                            totalScore['teacher'] /= scoreCount['teacher']
                        } else {
                            tempStRate = 100
                        }
                    } else {
                        if (scoreCount['teacher'] > 0) {
                            totalScore['teacher'] /= scoreCount['teacher']
                            tempTeRate = 100
                        }
                    }
                    if ($scope.feedqts.length) {
                        answer.totalScore = totalScore['student'] / $scope.feedqts.length * tempStRate / 100 + totalScore['teacher'] / $scope.feedqts.length * tempTeRate / 100;
                    } else {
                        answer.totalScore = 0
                    }
                    answer.totalScore = Math.round(answer.totalScore * 10) / 10
                    answer.scoreCount = scoreCount
                    answer.feedbackArr = feedbackArr
                    $scope.answers.push(answer);
                }

                $scope.answers = $filter('orderBy')($scope.answers, '-totalScore');
                $scope.selectUser();
                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
            });
        }

        $scope.selectUser = function () {
            var feedKeyExist = false;
            if ($scope.answers.length == 0) {
                $scope.selectedAnswerKey = undefined;
                $scope.selectedAnswerIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                $scope.selectedAnswerIndex = 0;
                if ($scope.selectedAnswerKey) {
                    for (var i = 0; i < $scope.answers.length; i++) {
                        if ($scope.answers[i].key == $scope.selectedAnswerKey) {
                            $scope.selectedAnswerIndex = i;
                            feedKeyExist = true;
                            break;
                        }
                    }
                }
                $scope.selectedAnswerKey = $scope.answers[$scope.selectedAnswerIndex].key;
            }
            if (!feedKeyExist) {
                $scope.selectedFeedbackKey = {
                    student: undefined,
                    teacher: undefined,
                }
                $scope.selectedFeedbackIndex = {
                    student: undefined,
                    teacher: undefined,
                };
            }
            if ($scope.selectedAnswerKey) {
                $scope.selectFeedback()
            }
            $scope.getMyFeedback();
            $rootScope.safeApply();
        }

        // feedback change functions
        $scope.selectFeedback = function (userType) {
            if (userType) {
                $scope.userType = userType
            }
            var feedbacks = $scope.answers[$scope.selectedAnswerIndex].feedbackArr[$scope.userType];
            if (feedbacks.length == 0) {
                $scope.selectedFeedbackKey[$scope.userType] = undefined;
                $scope.selectedFeedbackIndex[$scope.userType] = undefined;
                if ($scope.saved) {
                    $scope.saved = false
                } else {
                    $rootScope.warning("There isn't any " + $scope.userType + " feedback data!");
                }

            } else {
                $scope.selectedFeedbackIndex[$scope.userType] = 0
                if ($scope.selectedFeedbackKey[$scope.userType]) {
                    for (var i = 0; i < feedbacks.length; i++) {
                        if (feedbacks[i].key == $scope.selectedFeedbackKey[$scope.userType]) {
                            $scope.selectedFeedbackIndex[$scope.userType] = i;
                            break;
                        }
                    }
                }
                $scope.selectedFeedbackKey[$scope.userType] = feedbacks[$scope.selectedFeedbackIndex[$scope.userType]].key;
            }
            $rootScope.safeApply();
        }


        //When click next answer button( " > " )
        $scope.increaseindex = function () {
            if ($scope.answers.length == 0) {
                $scope.selectedAnswerKey = undefined;
                $scope.selectedFeedbackIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                if ($scope.selectedAnswerIndex == $scope.answers.length - 1) {
                    $rootScope.info('This is last Answer.');
                } else {
                    $scope.selectedAnswerIndex++;
                    $scope.selectedAnswerKey = $scope.answers[$scope.selectedAnswerIndex].key;
                    $scope.selectedFeedbackKey[$scope.userType] = undefined;
                    $scope.selectFeedback()
                }
            }
            $scope.getMyFeedback();
            $rootScope.safeApply();
        }

        //When click previous answer button( " < " )
        $scope.decreaseindex = function () {
            if ($scope.answers.length == 0) {
                $scope.selectedAnswerKey = undefined;
                $scope.selectedFeedbackIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                if ($scope.selectedAnswerIndex == 0) {
                    $rootScope.info('This is first Answer.');
                } else {
                    $scope.selectedAnswerIndex--;
                    $scope.selectedAnswerKey = $scope.answers[$scope.selectedAnswerIndex].key;
                    $scope.selectedFeedbackKey[$scope.userType] = undefined;
                    $scope.selectFeedback()
                }
            }
            $scope.getMyFeedback();
            $rootScope.safeApply();
        }

        $scope.changeIndex = function (nextIndex) {
            if (nextIndex == $scope.selectedAnswerIndex) return;
            $scope.selectedAnswerIndex = nextIndex;
            $scope.selectedAnswerKey = $scope.answers[$scope.selectedAnswerIndex].key;
            $scope.selectedFeedbackKey[$scope.userType] = undefined;
            $scope.selectFeedback();
            $scope.getMyFeedback();
            $rootScope.safeApply();
        }

        //When click next feedback button( " > " )
        $scope.increaseFeedIndex = function () {
            if ($scope.answers.length == 0) {
                $rootScope.warning("There isn't any answer data!");
                return;
            }
            var feedbacks = $scope.answers[$scope.selectedAnswerIndex].feedbackArr[$scope.userType];
            if (feedbacks.length == 0) {
                $scope.selectedFeedbackKey[$scope.userType] = undefined;
                $scope.selectedFeedbackIndex[$scope.userType] = undefined;
                $rootScope.error("There isn't any feedback.");
            } else if ($scope.selectedFeedbackIndex[$scope.userType] == feedbacks.length - 1) {
                $rootScope.info('This is last feedback.');
            } else {
                $scope.selectedFeedbackIndex[$scope.userType]++;
                $scope.selectedFeedbackKey[$scope.userType] = feedbacks[$scope.selectedFeedbackIndex[$scope.userType]].key
            }
            $rootScope.safeApply();
        }

        //When click previous feedback button( " < " )
        $scope.decreaseFeedIndex = function () {
            if ($scope.answers.length == 0) {
                $rootScope.warning("There isn't any answer data!");
                return;
            }
            var feedbacks = $scope.answers[$scope.selectedAnswerIndex].feedbackArr[$scope.userType];
            if (feedbacks.length == 0) {
                $scope.selectedFeedbackKey[$scope.userType] = undefined;
                $scope.selectedFeedbackIndex[$scope.userType] = undefined;
                $rootScope.error("There isn't any feedback.");
            } else if ($scope.selectedFeedbackIndex[$scope.userType] == 0) {
                $rootScope.info('This is first feedback.');
            } else {
                $scope.selectedFeedbackIndex[$scope.userType]--;
                $scope.selectedFeedbackKey[$scope.userType] = feedbacks[$scope.selectedFeedbackIndex[$scope.userType]].key
            }
            $rootScope.safeApply();
        }

        $scope.getMyFeedback = function () {
            if ($scope.answers.length == 0) {
                return;
            }
            var feedbacks = $scope.answers[$scope.selectedAnswerIndex].Feedbacks;

            if (feedbacks && feedbacks[$rootScope.settings.userId]) {
                $scope.myFeedback = angular.copy(feedbacks[$rootScope.settings.userId])
            } else {
                $scope.myFeedback = {
                    text: '',
                    score: [],
                }
                for (i = 0; i < $scope.feedqts.length; i++) {
                    $scope.myFeedback.score[i] = 0;
                }
            }
        }

        $scope.changeFeedbackText = function () {
            if ($scope.answers.length == 0) return;
            var updates = {};
            updates['GroupAnswers/' + $scope.answers[$scope.selectedAnswerIndex].key + '/Feedbacks/' + $rootScope.settings.userId + '/text/'] = $scope.myFeedback.text;
            updates['GroupAnswers/' + $scope.answers[$scope.selectedAnswerIndex].key + '/Feedbacks/' + $rootScope.settings.userId + '/userType/'] = 'teacher';
            $scope.saved = true
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            }).catch(function (error) {
                $rootScope.error('Submit Error!')
            });
        }

        $scope.setstar = function (index, rowindex) {
            if ($scope.answers.length == 0) return;
            index++;
            let currValue = $scope.myFeedback.score[rowindex];
            if (index == currValue) {
                currValue = index - 1;
            } else {
                currValue = index;
            }
            $scope.myFeedback.score[rowindex] = currValue;
            var updates = {};
            updates['GroupAnswers/' + $scope.answers[$scope.selectedAnswerIndex].key + '/Feedbacks/' + $rootScope.settings.userId + '/score/'] = $scope.myFeedback.score;
            updates['GroupAnswers/' + $scope.answers[$scope.selectedAnswerIndex].key + '/Feedbacks/' + $rootScope.settings.userId + '/userType/'] = 'teacher';
            $scope.saved = true
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            }).catch(function (error) {
                $rootScope.error('Submit Error!')
            });
        }

        $scope.getStarState = function (index, rowindex) {
            if ($scope.answers.length == 0) return;
            if (index < $scope.myFeedback.score[rowindex]) {
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
            var setRef = undefined
            if ($rootScope.settings.groupType == 'sub') {       //if 1st child group answer
                setRef = firebase.database().ref('Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey
                    + '/' + $rootScope.settings.groupSetKey + '/data');
            } else {
                setRef = firebase.database().ref('Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey
                    + '/' + $rootScope.settings.groupSetKey + '/' + $rootScope.settings.subSetKey + '/data');
            }
            $scope.saved = true
            setRef.set($scope.feedbackSetting);
        }

        $scope.deleteFeedback = function () {
            if (!$scope.selectedAnswerKey) {
                $rootScope.warning("There isn't any selected answer!");
                return;
            }
            if (!$scope.selectedFeedbackKey[$scope.userType]) {
                $rootScope.warning("There isn't any selected feedback!");
                return
            }
            if (!confirm("Are you sure want to delete this feedback?")) return

            var answerKey = $scope.answers[$scope.selectedAnswerIndex].key
            var feedbackKey = $scope.answers[$scope.selectedAnswerIndex].feedbackArr[$scope.userType][$scope.selectedFeedbackIndex[$scope.userType]].key
            var updates = {};
            updates['GroupAnswers/' + answerKey + '/Feedbacks/' + feedbackKey] = {};
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            }).catch(function (error) {
                $rootScope.error('Submit Error!')
            });
        }

    }
})();