(function () {

    angular
        .module('myApp')
        .controller('AdminExportQuestionController', AdminExportQuestionController)

    AdminExportQuestionController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminExportQuestionController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminQuestionSetUseDetail");
        $scope.question = $rootScope.settings.qustionData;

        $scope.$on('$destroy', function () {
            if ($scope.studentGroupRef) $scope.studentGroupRef.off('value')
            if ($scope.studentsRef) $scope.studentsRef.off('value')
            if ($scope.teacherRef) $scope.teacherRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.questionRef) $scope.questionRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        })
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
            $scope.studentGroupRef = firebase.database().ref('StudentGroups');
            studentGroupRef.on('value', function (snapshot) {
                $scope.studentGroups = {};
                snapshot.forEach(student => {
                    $scope.studentGroups[student.key] = [];
                    for (var key in student.val()) {
                        $scope.studentGroups[student.key].push(student.val()[key]);
                    }
                });
                $scope.ref_1 = true
                $scope.finalCalc();
            });
        }

        $scope.getStudents = function () {
            $scope.studentsRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            $scope.studentsRef.on('value', function (snapshot) {
                $scope.students = snapshot.val() || {};
                $scope.ref_2 = true
                $scope.finalCalc();
            });
        }
        $scope.getTeachers = function () {
            $scope.teacherRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Teacher');
            $scope.teacherRef.on('value', function (snapshot) {
                $scope.teachers = snapshot.val() || {};
                snapshot.forEach(function (childsnapshot) {
                    var teacherKey = childsnapshot.key;
                    $scope.teachers[teacherKey] = {
                        teacherEmail: childsnapshot.val()['ID']
                    };
                })
                $scope.ref_3 = true
                $scope.finalCalc()
            })
        }
        $scope.getAllGroups = function () {
            $scope.groupRef = firebase.database().ref('Groups');
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groups = {};
                for (groupKey in snapshot.val()) {
                    let group = snapshot.val()[groupKey]
                    let teacherKey = group.teacherKey
                    $scope.groups[teacherKey] = $scope.groups[teacherKey] || {}
                    $scope.groups[teacherKey][groupKey] = group
                }
                $scope.ref_4 = true
                $scope.finalCalc();
            });
        }
        $scope.getAllQuestions = function () {
            $scope.questionRef = firebase.database().ref('Questions');
            $scope.questionRef.on('value', function (snapshot) {
                $scope.questions = {};
                snapshot.forEach(function (snapshot1) {
                    let question = snapshot1.val()
                    var setKey = question.Set
                    var questionKey = question.code
                    $scope.questions[setKey] = $scope.questions[setKey] || {}
                    $scope.questions[setKey][questionKey] = question
                });
                $scope.ref_5 = true
                $scope.finalCalc();
            });
        }
        $scope.getAllAnswers = function () {
            $scope.answerRef = firebase.database().ref('NewAnswers');
            $scope.answerRef.on('value', function (snapshot) {
                $scope.answers = {};
                snapshot.forEach(function (question) {
                    $scope.answers[question.key] = question.val();
                });
                $scope.ref_6 = true
                $scope.finalCalc();
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4 || !$scope.ref_5 || !$scope.ref_6) return
            $scope.result = [];
            for (teacherKey in $scope.teachers) {
                var teacherEmail = $scope.teachers[teacherKey]['teacherEmail'];
                var groups = $scope.groups[teacherKey] || {};
                for (groupKey in groups) {
                    var groupName = groups[groupKey]['groupname'];
                    var questionSets = groups[groupKey]['QuestionSets'];
                    for (questionSetKey in questionSets) {
                        if (questionSetKey == $rootScope.settings.globalQuestionSetKey) {
                            var questionSetName = questionSets[questionSetKey]['setname'];
                            var questions = $scope.questions[questionSetKey] || {};
                            for (questionKey in questions) {
                                var question = questions[questionKey];
                                if (questionKey == $scope.question.key) {
                                    if ($scope.answers[questionKey]) {
                                        var answers = $scope.answers[questionKey]['answer'];
                                        for (studentKey in answers) {
                                            if ($scope.studentGroups[studentKey] && $scope.studentGroups[studentKey].indexOf(groupKey) > -1) {
                                                var answer = answers[studentKey];
                                                var feedbackTexts = answer['FeedbackTexts'] || {};
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

        $scope.deleteQuestion = function () {
            if (!confirm("Are you sure want to delete this question?")) {
                return;
            }
            var questionSetKey = $rootScope.settings.globalQuestionSetKey;

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
                    var index = $rootScope.settings.qustionIndex;
                    $rootScope.settings.globalQuestions.splice(index, 1);
                    $rootScope.setData('globalQuestions', $rootScope.settings.globalQuestions);

                    $rootScope.success('Question Set has been deleted successfully!');
                    $state.go('adminQuestionSetUseDetail');
                });
            });
        }
    }
})();