(function () {

    angular
        .module('myApp')
        .controller('AdminAllSetsController', AdminAllSetsController)

    AdminAllSetsController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminAllSetsController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "");
        $rootScope.setData('selectedMenu', 'allSets');
        $scope.fields = ['setName', 'creator'];
        $scope.fieldIndex = 0;
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.teacherRef) $scope.teacherRef.off('value')
            if ($scope.questionsRef) $scope.questionsRef.off('value')
            if ($scope.answersRef) $scope.answersRef.off('value')
            if ($scope.questionSetRef) $scope.questionSetRef.off('value')
        })
        $scope.init = function () {
            $scope.getTeachers();
            $scope.getAllQuestions();
            $scope.getAllAnswerCount();
            $scope.getAllQuestionSets();
        }
        $scope.getTeachers = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.teacherRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Teacher');
            $scope.teacherRef.on('value', function (snapshot) {
                $scope.teachers = {};
                snapshot.forEach(function (childsnapshot) {
                    var teacherKey = childsnapshot.key;
                    $scope.teachers[teacherKey] = {
                        teacherEmail: childsnapshot.val()['ID']
                    };
                });
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }

        $scope.getAllQuestions = function () {
            $scope.questionsRef = firebase.database().ref('Questions');
            $scope.questionsRef.on('value', function (snapshot) {
                $scope.questions = {};
                for (questionKey in snapshot.val()) {
                    var question = snapshot.val()[questionKey]
                    question.key = questionKey
                    var questionSetKey = question.Set
                    $scope.questions[questionSetKey] = $scope.questions[questionSetKey] || [];
                    $scope.questions[questionSetKey].push(question);
                }
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }
        
        $scope.getAllAnswerCount = function () {
            $scope.answersRef = firebase.database().ref('NewAnswers');
            $scope.answersRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {}
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }

        $scope.getAllQuestionSets = function () {
            $scope.questionSetRef = firebase.database().ref('QuestionSets').orderByChild('creator');
            $scope.questionSetRef.on('value', function (snapshot) {
                $scope.allSets = snapshot.val() || {}
                $scope.questionSets = [];
                $scope.ref_4 = true
                $scope.finalCalc()
            });
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return
            $scope.answerCountsByQuestion = {};
            $scope.answerCounts = {};

            for (questionKey in $scope.allAnswers) {
                var answers = $scope.allAnswers[questionKey]['answer'] || {};
                if (answers) {
                    $scope.answerCountsByQuestion[questionKey] = Object.keys(answers).length;
                } else {
                    $scope.answerCountsByQuestion[questionKey] = 0;
                }
            }

            for (questionSetKey in $scope.questions) {
                $scope.answerCounts[questionSetKey] = 0;
                $scope.questions[questionSetKey].forEach(question => {
                    var questionKey = question.key;
                    if ($scope.answerCountsByQuestion[questionKey]) {
                        $scope.answerCounts[questionSetKey] += $scope.answerCountsByQuestion[questionKey];
                    }
                });
            }

            for (setKey in $scope.allSets) {
                let questionSet = $scope.allSets[setKey]
                var answers = 0;
                if ($scope.answerCounts[questionSet.key]) {
                    answers = $scope.answerCounts[questionSet.key];
                }
                $scope.questionSets.push({
                    questionSetKey: questionSet.key,
                    setName: questionSet.setname,
                    creator: $scope.teachers[questionSet.creator].teacherEmail,
                    answers: answers,
                });
            }
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();

        }

        $scope.gotoUse = function (obj) {
            $rootScope.setData('globalQuestionSetKey', obj.questionSetKey);
            $rootScope.setData('globalQuestionSetName', obj.setName);
            $rootScope.setData('globalQuestions', $scope.questions[obj.questionSetKey]);
            $state.go('adminQuestionSetUseDetail');
        }
        $scope.setActive = function (obj) {
            if (obj.questionSetKey == $rootScope.settings.globalQuestionSetKey) {
                return 'active';
            }
            return '';
        }

    }

})();