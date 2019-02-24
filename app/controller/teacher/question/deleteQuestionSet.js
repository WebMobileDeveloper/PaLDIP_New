(function () {

    angular
        .module('myApp')
        .controller('deleteQuestionSetController', deleteQuestionSetController)

    deleteQuestionSetController.$inject = ['$state', '$scope', '$rootScope'];

    function deleteQuestionSetController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questionsInSet");


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
                    $scope.questions[setKey][questionKey] = allQuestions[questionKey]
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

                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
            }
        }

        $scope.deleteQuestionSet = function () {
            if (!confirm("Are you sure want to delete this question set?")) {
                return;
            }
            var questionSetKey = $rootScope.settings.questionSetKey;

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
                        if (questionSetKey1 == questionSetKey) {
                            updates['/Groups/' + teacherKey + '/' + groupKey + '/QuestionSets/' + questionSetKey] = {};
                        }
                    }
                    var groupsets = groups[groupKey]['groupsets'];
                    if (groupsets) {
                        for (var groupsetkey in groupsets) {
                            var questionSets1 = groupsets[groupsetkey]['QuestionSets'];
                            if (questionSets1) {
                                for (var i = 0; i < questionSets1.length; i++) {
                                    if (questionSets1[i].key == questionSetKey) {
                                        questionSets1.splice(i, 1);
                                        updates['/Groups/' + teacherKey + '/' + groupKey + '/groupsets/' + groupsetkey + '/QuestionSets'] = questionSets1;
                                    }
                                }
                            }
                            var subgroupsets = groupsets[groupsetkey]['subgroupsets'];
                            if (subgroupsets) {
                                for (var subGroupsetkey in subgroupsets) {
                                    var questionSets2 = subgroupsets[subGroupsetkey]['QuestionSets'];
                                    if (questionSets2) {
                                        for (var j = 0; j < questionSets2.length; j++) {
                                            if (questionSets2[j].key == questionSetKey) {
                                                questionSets2.splice(j, 1);
                                                updates['/Groups/' + teacherKey + '/' + groupKey + '/groupsets/' + groupsetkey + '/subgroupsets/' + subGroupsetkey
                                                    + '/QuestionSets'] = questionSets2;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Question Set has been deleted successfully!');
                $rootScope.setData('questionSetKey', undefined);
                $state.go('teacherQuestion');
            });
        }

    }
})();