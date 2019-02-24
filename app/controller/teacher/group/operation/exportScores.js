(function () {

    angular
        .module('myApp')
        .controller('exportScoresController', exportScoresController)

    exportScoresController.$inject = ['$state', '$scope', '$rootScope'];

    function exportScoresController($state, $scope, $rootScope) {
        // ********************* router: exportScores  ************************
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'groupRoot');
        $scope.finalScoreQuestionKeys = $rootScope.settings.finalScoreQuestions
        $scope.qstRefArr = {}
        $scope.ansRefArr = {}
        $scope.$on('$destroy', function () {
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
            for (key in $scope.qstRefArr) {
                $scope.qstRefArr[key].off('value')
            }
            for (key in $scope.ansRefArr) {
                $scope.ansRefArr[key].off('value')
            }
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getStudentGroups()
            $scope.getUsers()
            $scope.getQuestions()
        }

        $scope.getStudentGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (snapshot) {
                $scope.usersInGroup = [];
                if (snapshot.val()) {
                    for (userKey in snapshot.val()) {
                        if (Object.values(snapshot.val()[userKey]).indexOf($rootScope.settings.groupKey) > -1) {
                            $scope.usersInGroup.push(userKey);
                        }
                    }
                }
                $scope.ref_1 = true
                $scope.finalCalc()
                $rootScope.safeApply();
            });
        };

        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val() || {}
                $scope.ref_2 = true
                $scope.finalCalc()
            })
        }

        $scope.getQuestions = function () {
            $scope.allQuestions = {}
            $scope.allAnswers = {}
            $scope.qstCount = 0
            $scope.finalScoreQuestionKeys.forEach(questionKey => {
                $scope.qstRefArr[questionKey] = firebase.database().ref('Questions').orderByKey().equalTo(questionKey);
                $scope.qstRefArr[questionKey].on('value', function (snapshot) {
                    $scope.allQuestions[questionKey] = snapshot.val() ? snapshot.val()[questionKey] : {}
                    $scope.getAnswers(questionKey)
                })
            });
        }

        $scope.getAnswers = function (questionKey) {
            if ($scope.ansRefArr[questionKey]) $scope.ansRefArr[questionKey].off('value')
            $scope.ansRefArr[questionKey] = firebase.database().ref('NewAnswers').orderByKey().equalTo(questionKey)
            $scope.ansRefArr[questionKey].on('value', function (snapshot) {
                $scope.allQuestions[questionKey].answers = snapshot.val() ? snapshot.val()[questionKey].answer : {}
                if ($scope.qstCount < $scope.finalScoreQuestionKeys.length) $scope.qstCount++
                if ($scope.qstCount == $scope.finalScoreQuestionKeys.length) {
                    $scope.ref_3 = true
                    $scope.finalCalc()
                }
            })
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            $scope.Users = []
            $scope.usersInGroup.forEach(userKey => {
                let user = { show_id: $scope.allUsers[userKey].show_id, scores: {} }
                for (questionKey in $scope.allQuestions) {
                    let question = $scope.allQuestions[questionKey]
                    let answer = question.answers[userKey] || {}
                    switch (question.questionType) {
                        case 'Text Type':
                            user.scores[questionKey] = answer.score ? answer.score : ''
                            break;
                        case "Feedback Type":
                            let scores = {
                                teacher: 0,
                                student: 0
                            }
                            let counts = {
                                teacher: 0,
                                student: 0
                            }
                            let feedbackSetting = {
                                studentRate: 100,
                                teacherRate: 0,
                            }

                            for (var userKey in answer.Feedbacks) {
                                let feed = answer.Feedbacks[userKey]
                                let totalScore = 0
                                if (feed.score) {
                                    feed.score.forEach(score => {
                                        totalScore += score
                                    });
                                    totalScore = Math.round(totalScore / feed.score.length * 100) / 100
                                }
                                if (totalScore) {
                                    scores[feed.userType] += totalScore
                                    counts[feed.userType]++
                                }
                            }
                            if (question.teacherFeedback && question.teacherFeedback[$rootScope.settings.groupKey]) {
                                feedbackSetting = question.teacherFeedback[$rootScope.settings.groupKey].data
                            }
                            var tempStRate = 0;
                            var tempTeRate = 0;
                            if (counts.student > 0) {
                                if (counts.teacher > 0) {
                                    tempStRate = feedbackSetting.studentRate;
                                    tempTeRate = feedbackSetting.teacherRate;
                                } else {
                                    tempStRate = 100
                                }
                            } else {
                                if (counts.teacher > 0) {
                                    tempTeRate = 100
                                }
                            }
                            let studentTotalScore = counts.student ? scores.student / counts.student : 0
                            let teacherTotalScore = counts.teacher ? scores.teacher / counts.teacher : 0
                            let finalTotalScore = studentTotalScore * tempStRate / 100 + teacherTotalScore * tempTeRate / 100
                            finalTotalScore = Math.round(finalTotalScore * 10) / 10
                            user.scores[questionKey] = finalTotalScore ? finalTotalScore : ''
                            break;
                        default:
                            break;
                    }
                }
                $scope.Users.push(user)
            });
            $rootScope.setData('loadingfinished', true)
        }
    }
})();