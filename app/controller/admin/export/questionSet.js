(function () {

    angular
        .module('myApp')
        .controller('AdminExportQuestionSetController', AdminExportQuestionSetController)

    AdminExportQuestionSetController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminExportQuestionSetController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminQuestionSetUseDetail");

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
                                if ($scope.answers[questionKey]) {
                                    var answers = $scope.answers[questionKey]['answer'];
                                    for (studentKey in answers) {
                                        if ($scope.studentGroups[studentKey] && $scope.studentGroups[studentKey].indexOf(groupKey) > -1) {
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

            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();

        }

        $scope.deleteQuestionSet = function () {
            if (!confirm("Are you sure want to delete this question set?")) {
                return;
            }
            var questionSetKey = $rootScope.settings.globalQuestionSetKey;

            var updates = {};

            for (questionKey in $scope.questions[questionSetKey]) {
                // delete all answers
                updates['/NewAnswers/' + questionKey] = {};
                // delete all questions
                updates['/Questions/' + questionKey] = {};
            }
            // delete question set
            updates['/QuestionSets/' + questionSetKey] = {};
            // delete question set in Groups
            for (teacherKey in $scope.groups) {
                var groups = $scope.groups[teacherKey];
                for (groupKey in groups) {
                    var questionSets = groups[groupKey]['QuestionSets'];
                    for (questionSetKey1 in questionSets) {
                        if (questionSetKey1 == $rootScope.settings.globalQuestionSetKey) {
                            updates['/Groups/' + teacherKey + '/' + groupKey + '/QuestionSets/' + questionSetKey1] = {};
                        }
                    }
                }
            }
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Question Set has been deleted successfully!');
                $state.go('adminAllQuestionSet');
            });
        }

    }
})();