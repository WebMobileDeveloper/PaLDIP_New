(function () {

    angular
        .module('myApp')
        .controller('AdminExportAllGroupsController', AdminExportAllGroupsController)

    AdminExportAllGroupsController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminExportAllGroupsController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminGroup");
        $scope.teacherKey = $rootScope.settings.selectedTeacherKey;
        $scope.teacherEmail = $rootScope.settings.selectedTeacherEmail;
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.studentGroupRef) $scope.studentGroupRef.off('value')
            if ($scope.studentsRef) $scope.studentsRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.questionRef) $scope.questionRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        })
        $scope.initExportAll = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getStudentGroup();
            $scope.getStudents();
            $scope.getAllGroups();
            $scope.getAllQuestions();
            $scope.getAllAnswers();
        }

        $scope.getStudentGroup = function () {
            $scope.studentGroupRef = firebase.database().ref('StudentGroups');
            $scope.studentGroupRef.on('value', function (snapshot) {
                $scope.studentGroups = {};
                for (studentKey in snapshot.val()) {
                    let groupKeys = snapshot.val()[studentKey]
                    $scope.studentGroups[studentKey] = Object.values(groupKeys);
                }
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

        $scope.getAllGroups = function () {
            $scope.groupRef = firebase.database().ref('Groups').orderByChild('teacherKey').equalTo($scope.teacherKey);
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groups = snapshot.val()
                $scope.ref_3 = true
                $scope.finalCalc();
            });
        }

        $scope.getAllQuestions = function () {
            $scope.questionRef = firebase.database().ref('Questions');
            $scope.questionRef.on('value', function (snapshot) {
                $scope.questions = {};
                snapshot.forEach(function (childSnapshot) {
                    let question = childSnapshot.val()
                    var setKey = question.Set
                    var questionKey = question.code
                    if (!$scope.questions[setKey]) $scope.questions[setKey] = {}
                    $scope.questions[setKey][questionKey] = question
                });
                $scope.ref_4 = true
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
                $scope.ref_5 = true
                $scope.finalCalc();
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4 || !$scope.ref_5) return
            $scope.result = [];
            for (groupKey in $scope.groups) {
                let group = $scope.groups[groupKey]
                let groupName = group.groupname;
                let questionSets = group.QuestionSets || {};
                for (questionSetKey in questionSets) {
                    let questionSetName = questionSets[questionSetKey]['setname'];
                    let questions = $scope.questions[questionSetKey] || {};
                    for (questionKey in questions) {
                        let question = questions[questionKey];
                        if ($scope.answers[questionKey]) {
                            let answers = $scope.answers[questionKey]['answer'] || {};
                            for (studentKey in answers) {
                                if ($scope.studentGroups[studentKey] && $scope.studentGroups[studentKey].indexOf(groupKey) > -1) {
                                    let answer = answers[studentKey];
                                    let feedbackTexts = answer['FeedbackTexts'] || {};
                                    let score = 0;
                                    let count = 0;

                                    for (key in answer['Feedbacks']) {
                                        answer['Feedbacks'][key].forEach(function (feedback) {
                                            score += feedback;
                                            count++;
                                        });
                                    }
                                    if (count > 0) {
                                        score = Math.round(score * 10 / count) / 10;
                                    }
                                    if (score == 0) score = '';

                                    let temp = {
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
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }



    }
})();