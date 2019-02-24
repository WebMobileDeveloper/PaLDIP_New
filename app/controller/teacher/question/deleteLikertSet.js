(function () {

    angular
        .module('myApp')
        .controller('deleteLikertSetController', deleteLikertSetController)

    deleteLikertSetController.$inject = ['$state', '$scope', '$rootScope'];

    function deleteLikertSetController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questionsInSet");
        $scope.deleteType = $rootScope.settings.deleteType;

        $scope.totalLoopCount = 0;

        $scope.initExportAll = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getSetData();
            $scope.getStudentGroup();
            $scope.getStudents();
            $scope.getTeachers();
            $scope.getAllGroups();
        }

        $scope.getSetData = function () {
            //============================================================ 
            var qsetdata = firebase.database().ref('QuestionSets/' + $rootScope.settings.questionSetKey);
            qsetdata.on('value', function (snapshot) {
                $scope.setData = snapshot.val();
                if ($scope.setData) {
                    if ($scope.setData.subscales == undefined) {
                        $scope.noAnswerMessage = 'There isn\'t any answers in ths questionset.';
                        $rootScope.setData('loadingfinished', true);
                    } else {
                        $scope.subscales = [];
                        for (var key in $scope.setData.subscales) {
                            var scale = $scope.setData.subscales[key];
                            $scope.subscales.push(scale);
                        }
                        $scope.getAnswers();
                    }
                }
            });
        }

        $scope.getAnswers = function () {
            var qstRef = firebase.database().ref('LikertAnswer/' + $rootScope.settings.questionSetKey)
            qstRef.on('value', function (setSnapshot) {
                $scope.tempAnswers = setSnapshot.val() || {};
                var tempAnswers = {};

                for (userKey in setSnapshot.val()) {
                    tempAnswers[userKey] = {}
                    var userAns = setSnapshot.val()[userKey].answer
                    for (qstKey in userAns) {
                        tempAnswers[userKey][qstKey] = userAns[qstKey] + 1;
                    }
                }

                $scope.answers = {};
                for (var userId in tempAnswers) {
                    var userScaleAnswers = [];
                    var userAnswers = tempAnswers[userId];

                    for (var scaleIndex = 0; scaleIndex < $scope.subscales.length; scaleIndex++) {
                        var scaleData = $scope.subscales[scaleIndex];
                        var qstArr = scaleData.questions;
                        var allAnswered = true;
                        var sum = 0;

                        for (var qstIndex = 0; qstIndex < qstArr.length; qstIndex++) {
                            var qstKey = qstArr[qstIndex];
                            if (userAnswers[qstKey]) {
                                sum += userAnswers[qstKey];
                            } else {
                                allAnswered = false;
                            }
                        }

                        var calcValue = '';
                        if (allAnswered) {                              // if answered for all subscale questions
                            if (scaleData.method == "Sum") {
                                calcValue = sum;
                            } else {
                                calcValue = Math.round(sum / qstArr.length * 100) / 100;
                            }
                        }
                        userScaleAnswers.push(calcValue);
                    }
                    $scope.answers[userId] = userScaleAnswers;
                }

                $scope.finalCalc();
            });
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


        $scope.finalCalc = function () {
            $scope.totalLoopCount++;
            if ($scope.totalLoopCount > 4) {
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

                                for (studentKey in $scope.answers) {
                                    if ($scope.studentGroups[studentKey].indexOf(groupKey) > -1) {
                                        var answer = $scope.answers[studentKey];

                                        var temp = {
                                            teacher: teacherEmail,
                                            group: groupName,
                                            questionSet: questionSetName,
                                            student: $scope.students[studentKey].ID,
                                            gender: $scope.students[studentKey].gender,
                                            age: $scope.students[studentKey].age,
                                            profession: $scope.students[studentKey].profession,
                                            language: $scope.students[studentKey].countrylanguage,
                                            answer: answer,
                                            datetime: $scope.tempAnswers[studentKey].datetime,
                                        }
                                        $scope.result.push(temp)
                                    }
                                }
                            }
                        }
                    }
                }
                if ($scope.result.length == 0) {
                    $scope.noAnswerMessage = 'There isn\'t any answers in ths questionset.';
                }
                $rootScope.setData('loadingfinished', true);
            }
        }

        $scope.deleteQuestionSet = function () {
            if (!confirm("Are you sure want to delete this question set?")) {
                return;
            }

            var questionSetKey = $rootScope.settings.questionSetKey;



            firebase.database().ref("Questions").orderByChild("Set").equalTo(questionSetKey).once('value', function (snapshot) {

                var updates = {};
                var allQuestions = snapshot.val()

                // delete all questions
                for (questionKey in allQuestions) {
                    updates['/Questions/' + questionKey] = {};
                }

                // delete question set
                updates['/QuestionSets/' + questionSetKey] = {};
                // delete question set in Groups
                // delete all answers
                updates['/LikertAnswer/' + questionSetKey] = {};

                for (teacherKey in $scope.groups) {
                    var groups = $scope.groups[teacherKey];
                    for (groupKey in groups) {
                        var questionSets = groups[groupKey]['QuestionSets'];
                        for (questionSetKey1 in questionSets) {
                            if (questionSetKey1 == questionSetKey) {
                                updates['/Groups/' + teacherKey + '/' + groupKey + '/QuestionSets/' + questionSetKey] = {};
                            }
                        }
                    }
                }

                firebase.database().ref().update(updates).then(function () {
                    $rootScope.success('Question Set has been deleted successfully!');
                    $rootScope.setData('questionSetKey', undefined);
                    $state.go('teacherQuestion');
                });
            })



        }

        $scope.deleteQuestion = function () {
            if (!confirm("Are you sure want to delete this question?")) {
                return;
            }
            var questionSetKey = $rootScope.settings.questionSetKey;
            var questionKey = $rootScope.settings.qustionData.key;

            var updates = {};

            // delete all questions
            updates['/Questions/' + questionKey] = {};
            //delete answer for questionKey
            Object.keys($scope.tempAnswers).forEach(userKey => {
                updates['/LikertAnswer/' + questionSetKey + '/' + userKey + '/answer/' + questionKey] = {};
            });

            // delete question in subscales          

            for (var scaleKey in $scope.setData.subscales) {
                var questions = $scope.setData.subscales[scaleKey].questions;
                var index = questions.indexOf(questionKey);
                if (index !== -1) {
                    if (questions.length > 1) {
                        var NewQuestions = angular.copy(questions);
                        NewQuestions.splice(index, 1);
                        updates['/QuestionSets/' + questionSetKey + '/subscales/' + scaleKey + '/questions/'] = NewQuestions;
                    } else {
                        updates['/QuestionSets/' + questionSetKey + '/subscales/' + scaleKey] = {};
                    }
                }
            }
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Question has been deleted successfully!');
                $state.go('questionsInSet');
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

            // delete subscale in superscale
            if ($scope.setData.superscales) {
                for (key in $scope.setData.superscales) {
                    var isChanged = false;
                    var superscales = [];
                    var superscale = $scope.setData.superscales[key];
                    if (superscale.subscales) {
                        for (i = 0; i < superscale.subscales.length; i++) {
                            if (!superscale.subscales[i].subscaleKey == scaleKey) {
                                superscales.push(superscale.subscales[i])
                            } else {
                                isChanged = true;
                            }
                        }
                    }
                    if (isChanged) {
                        updates['/QuestionSets/' + questionSetKey + '/superscales/' + key + '/subscales'] = superscales;
                    }
                }
            }

            // delete subscale in labels
            if ($scope.setData.labels) {
                for (key in $scope.setData.labels) {
                    var isChanged = false;
                    var labels = [];
                    var label = $scope.setData.labels[key];
                    if (label.subscales) {
                        for (i = 0; i < label.subscales.length; i++) {
                            if (!label.subscales[i].subscaleKey == scaleKey) {
                                labels.push(label.subscales[i])
                            } else {
                                isChanged = true;
                            }
                        }
                    }
                    if (isChanged) {
                        updates['/QuestionSets/' + questionSetKey + '/labels/' + key + '/subscales'] = labels;
                    }
                }
            }

            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Subscale has been deleted successfully!');
                $state.go('questionsInSet');
            });
        }

    }
})();