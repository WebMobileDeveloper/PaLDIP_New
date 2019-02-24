(function () {

    angular
        .module('myApp')
        .controller('FeedbackAnswer2Controller', FeedbackAnswer2Controller)

    FeedbackAnswer2Controller.$inject = ['$state', '$scope', '$rootScope'];

    function FeedbackAnswer2Controller($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "feedbackAnswer1");
        $scope.question = $rootScope.settings.questionObj;

        $scope.qtype = $scope.qtype2 = $rootScope.settings.qtype;
        if ($scope.qtype == 2) {
            $scope.qtype2 = 0
        }
        $scope.feedbackquestions = $rootScope.settings.feedqts;
        if ($scope.feedbackquestions) {
            $scope.scalehide = 0;
        } else {
            $scope.scalehide = 1;
        }
        $scope.progresskey = true;
        var uid = $rootScope.settings.userId;
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.feedbackSettingRef) $scope.feedbackSettingRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        })
        $scope.init = function () {
            $scope.getFeedbackSetting();
            $scope.myfeedbackscore();
        }
        $scope.getFeedbackSetting = function () {
            $scope.feedbackSetting = {
                studentRate: 100,
                teacherRate: 0,
            }
            $scope.feedbackSettingRef = firebase.database().ref('Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey + '/data');
            $scope.feedbackSettingRef.on('value', function (snapshot) {
                if (snapshot.val()) {
                    $scope.feedbackSetting = snapshot.val();
                    $rootScope.safeApply();
                }
            })
        }
        $scope.myfeedbackscore = function () {
            $scope.viewfeedbtn = true;
            $scope.userType = 'student';
            $scope.selectedKey = {
                student: undefined,
                teacher: undefined
            }
            $scope.selectedIndex = {
                student: undefined,
                teacher: undefined
            }
            $scope.totalScore = 0;
            $scope.answerRef = firebase.database().ref('NewAnswers/' + $rootScope.settings.questionKey + '/answer/' + uid);
            $scope.answerRef.on('value', function (snapshot) {
                $scope.Feedbacks = {
                    teacher: [],
                    student: []
                }
                var answer = snapshot.val();
                for (var userKey in answer.Feedbacks) {
                    answer.Feedbacks[userKey].key = userKey;
                    $scope.Feedbacks[answer.Feedbacks[userKey].userType].push(answer.Feedbacks[userKey]);
                }

                $scope.totalAwardScore = 0;
                $scope.awardScoreCount = 0;

                for (key in answer.awardScore) {
                    $scope.totalAwardScore += answer.awardScore[key];
                    $scope.awardScoreCount++;
                }
                $scope.selectFeedback();
                $scope.getTotalScore();
                $scope.progresskey = false;
                $scope.viewfeedbtn = false;
                $rootScope.safeApply();
            });
        }
        $scope.selectFeedback = function () {
            var feedbacks = $scope.Feedbacks[$scope.userType];
            if (feedbacks.length == 0) {
                $scope.selectedKey[$scope.userType] = undefined;
                $scope.selectedIndex[$scope.userType] = undefined;
                $rootScope.warning("There isn't any " + $scope.userType + " feedback data!");
            } else {
                if ($scope.selectedKey[$scope.userType]) {
                    $scope.selectedIndex[$scope.userType] = 0
                    for (var i = 0; i < feedbacks.length; i++) {
                        if (feedbacks.key == $scope.selectedKey[$scope.userType]) {
                            $scope.selectedIndex[$scope.userType] = i;
                            break;
                        }
                    }
                } else {
                    $scope.selectedKey[$scope.userType] = feedbacks[0].key;
                    $scope.selectedIndex[$scope.userType] = 0;
                }
            }
            $rootScope.safeApply();
        }
        $scope.prevfeedback = function () {
            var feedbacks = $scope.Feedbacks[$scope.userType];
            if (feedbacks.length == 0) {
                $scope.selectedKey[$scope.userType] = undefined;
                $scope.selectedIndex[$scope.userType] = undefined;
                $rootScope.warning("There isn't any " + $scope.userType + " feedback data!");
            } else {
                if ($scope.selectedIndex[$scope.userType] > 0) {
                    $scope.selectedIndex[$scope.userType]--;
                    $scope.selectedKey[$scope.userType] = feedbacks[$scope.selectedIndex[$scope.userType]].key;
                } else {
                    $rootScope.info("This is first " + $scope.userType + " feedback!");
                }
            }
            $rootScope.safeApply();
        }
        $scope.nextfeedback = function () {
            var feedbacks = $scope.Feedbacks[$scope.userType];
            if (feedbacks.length == 0) {
                $scope.selectedKey[$scope.userType] = undefined;
                $scope.selectedIndex[$scope.userType] = undefined;
                $rootScope.warning("There isn't any " + $scope.userType + " feedback data!");
            } else {
                if ($scope.selectedIndex[$scope.userType] < feedbacks.length - 1) {
                    $scope.selectedIndex[$scope.userType]++;
                    $scope.selectedKey[$scope.userType] = feedbacks[$scope.selectedIndex[$scope.userType]].key;
                } else {
                    $rootScope.info("This is last " + $scope.userType + " feedback!");
                }
            }
            $rootScope.safeApply();
        }
        $scope.getTotalScore = function () {
            var studentCount = 0
            var teacherCount = 0
            var studentTotalScore = 0
            var teacherTotalScore = 0

            $scope.Feedbacks.student.forEach(feedback => {
                if (feedback.score) {
                    studentCount++
                    feedback.score.forEach(score => {
                        studentTotalScore += score
                    });
                }
                studentTotalScore = studentTotalScore / studentCount / $scope.feedbackquestions.length
            });

            $scope.Feedbacks.teacher.forEach(feedback => {
                if (feedback.score) {
                    teacherCount++
                    feedback.score.forEach(score => {
                        teacherTotalScore += score
                    });
                }
                teacherTotalScore = teacherTotalScore / teacherCount / $scope.feedbackquestions.length
            });

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

            $scope.totalScore = studentTotalScore * tempStRate / 100 + teacherTotalScore * tempTeRate / 100
            $scope.totalScore = Math.round($scope.totalScore * 10) / 10
        }

        $scope.gotoNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('viewFeedbacks');
            }
        }

    }
})();