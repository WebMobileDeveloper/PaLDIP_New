(function () {

    angular
        .module('myApp')
        .controller('deleteQuestionController', deleteQuestionController)

    deleteQuestionController.$inject = ['$state', '$scope', '$rootScope'];

    function deleteQuestionController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questionsInSet");
        $scope.question = $rootScope.settings.qustionData;
        $scope.deleteType = $rootScope.settings.deleteType;
        $scope.totalLoopCount = 0;

        $scope.initExportAll = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getStudentGroup();
            $scope.getStudents();
            $scope.getTeachers();
            $scope.getAllGroups();
            $scope.getAllQuestions();
            $scope.getAllAnswers();
        }
        $scope.getStudentGroup = function () {
            var studentGroupRef = firebase.database().ref('StudentGroups');
            studentGroupRef.on('value', function (snapshot) {
                $scope.studentGroups = {};
                snapshot.forEach(student => {
                    $scope.studentGroups[student.key] = [];
                    for (var key in student.val()) {
                        $scope.studentGroups[student.key].push(student.val()[key]);
                    }
                });
                $scope.finalCalc();
            });
        }
        $scope.getStudents = function () {
            var studentsRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            studentsRef.on('value', function (snapshot) {
                $scope.students = {};
                if (snapshot.val()) {
                    snapshot.forEach(function (childsnapshot) {
                        $scope.students[childsnapshot.key] = childsnapshot.val();
                        if (!$scope.studentGroups[childsnapshot.key]) {
                            $scope.studentGroups[childsnapshot.key] = [];
                        }
                    });
                }
                $scope.finalCalc();
            });
        }
        $scope.getTeachers = function () {
            var teacherRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Teacher');
            teacherRef.on('value', function (snapshot) {
                $scope.teachers = {};
                snapshot.forEach(function (childsnapshot) {
                    var teacherKey = childsnapshot.key;
                    $scope.teachers[teacherKey] = {
                        teacherEmail: childsnapshot.val()['ID']
                    };
                })
                $scope.finalCalc();
            })
        }
       
        $scope.getAllGroups = function () {
            var groupRef = firebase.database().ref('Groups');
            groupRef.on('value', function (snapshot) {
                $scope.groups = {};
                for (groupKey in snapshot.val()) {
                    let group = snapshot.val()[groupKey]
                    let teacherKey = group.teacherKey
                    $scope.groups[teacherKey] = $scope.groups[teacherKey] || {}
                    $scope.groups[teacherKey][groupKey] = group
                }
                $scope.finalCalc();
            });
        }
        $scope.getAllQuestions = function () {
            var questionRef = firebase.database().ref('Questions');
            questionRef.on('value', function (snapshot) {
                $scope.questions = {};
                var allQuestions = snapshot.val()
                for (questionKey in allQuestions) {
                    var setKey = allQuestions[questionKey]
                    $scope.questions[setKey] = $scope.questions[setKey] || {}
                    $scope.questions[setKey][questionKey]=allQuestions[questionKey]
                }
                $scope.finalCalc();
            });
        }
        $scope.getAllAnswers = function () {
            var answerRef = firebase.database().ref('NewAnswers');
            answerRef.on('value', function (snapshot) {
                $scope.answers = {};
                snapshot.forEach(function (question) {
                    $scope.answers[question.key] = question.val();
                });
                $scope.finalCalc();
            });
        }
        $scope.finalCalc = function () {
            $scope.totalLoopCount++;
            if ($scope.totalLoopCount > 5) {
                $scope.result = [];
                for (teacherKey in $scope.teachers) {
                    var teacherEmail = $scope.teachers[teacherKey]['teacherEmail'];
                    var groups = $scope.groups[teacherKey];
                    for (groupKey in groups) {
                        var groupName = groups[groupKey]['groupname'];
                        var questionSets = groups[groupKey]['QuestionSets'];
                        for (questionSetKey in questionSets) {
                            if (questionSetKey == $rootScope.settings.questionSetKey) {
                                var questionSetName = questionSets[questionSetKey]['setname'];
                                var questions = $scope.questions[questionSetKey];
                                for (questionKey in questions) {
                                    var question = questions[questionKey];
                                    if (questionKey == $scope.question.key) {
                                        if ($scope.answers[questionKey]) {
                                            var answers = $scope.answers[questionKey]['answer'];
                                            for (studentKey in answers) {
                                                if ($scope.studentGroups[studentKey].indexOf(groupKey) > -1) {
                                                    var answer = answers[studentKey];
                                                    var feedbackTexts = answer['FeedbackTexts'];
                                                    var score = 0;
                                                    var count = 0;
                                                    for (var key in answer['Feedbacks']) {
                                                        answer['Feedbacks'][key].forEach(function (feedback) {
                                                            score += feedback;
                                                            count++;
                                                        });
                                                    }
                                                    if (count > 0) {
                                                        score = Math.round(score * 10 / count) / 10;
                                                    }
                                                    if (score == 0) score = '';
                                                    var temp = {
                                                        teacher: teacherEmail,
                                                        group: groupName,
                                                        questionSet: questionSetName,
                                                        student: $scope.students[studentKey].ID,
                                                        gender: $scope.students[studentKey].gender,
                                                        age: $scope.students[studentKey].age,
                                                        profession: $scope.students[studentKey].profession,
                                                        language: $scope.students[studentKey].countrylanguage,
                                                        question: question.question,
                                                        questionType: question.questionType,
                                                        answer: answer.answer,
                                                        date: answer.datetime,
                                                        feedback: feedbackTexts,
                                                        score: score,
                                                    }
                                                    $scope.result.push(temp)
                                                }
                                            }
                                        }
                                    }


                                }
                            }
                        }
                    }
                }

                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
            }
        }

        $scope.deleteQuestion = function () {
            if (!confirm("Are you sure want to delete this question?")) {
                return;
            }
            var questionSetKey = $rootScope.settings.questionSetKey;

            var updates = {};

            // delete all answers

            updates['/NewAnswers/' + $scope.question.key] = {};

            // delete question
            updates['/Questions/' + $scope.question.key] = {};

            var groupAnswerRef = firebase.database().ref('GroupAnswers');
            groupAnswerRef.on('value', function (snapshot) {
                if (snapshot.val()) {
                    snapshot.forEach(function (gQst) {
                        if (gQst.val().questionKey == $scope.question.key) {
                            updates['/GroupAnswers/' + gQst.key] = {};
                        }
                    })
                }

                firebase.database().ref().update(updates).then(function () {
                    $rootScope.success('Question Set has been deleted successfully!');
                    $state.go('questionsInSet');
                });
            });
        }

        $scope.deleteSubscale = function () {
            if (!confirm("Are you sure want to delete this Subscale?")) {
                return;
            }
            var questionSetKey = $rootScope.settings.questionSetKey;
            var scaleKey = $rootScope.settings.subScaleData.key;

            var updates = {};

            updates['/QuestionSets/' + questionSetKey + '/subscales/' + scaleKey] = {};


            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Subscale has been deleted successfully!');
                $state.go('questionsInSet');
            });
        }
    }
})();