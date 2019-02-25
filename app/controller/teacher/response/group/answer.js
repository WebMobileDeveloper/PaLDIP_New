(function () {

    angular
        .module('myApp')
        .controller('responseOfPerAnswerController', responseOfPerAnswerController)

    responseOfPerAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce', '$filter'];

    function responseOfPerAnswerController($state, $scope, $rootScope, $sce, $filter) {
        // **************   router:    responseOfPerAnswer  *****************
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.setQuestionsRef) $scope.setQuestionsRef.off('value')
            if ($scope.ansRefArr) {
                $scope.ansRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        });
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getUsers()
            $scope.getStGroups()
            $scope.getSetQuestions()
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users').orderByChild("Usertype").equalTo('Student');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.users = snapshot.val() || {};
                $scope.ref_1 = true;
                $scope.finalCalc()
            })
        }
        $scope.getStGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (studentGroups) {
                $scope.studentsInGroup = [];
                var studentGroup = studentGroups.val();
                for (var studentKey in studentGroup) {
                    var obj = studentGroup[studentKey];
                    if (Object.values(obj).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                $scope.ref_2 = true;
                $scope.finalCalc()
            })
        }
        $scope.getSetQuestions = function () {
            $scope.setQuestionsRef = firebase.database().ref('Questions').orderByChild('Set').equalTo($rootScope.settings.questionSetKey);
            $scope.setQuestionsRef.on('value', function (snapshot) {
                $scope.setQuestions = snapshot.val() || {}
                $scope.question = $scope.setQuestions[$rootScope.settings.question.code];
                $scope.questionKeys = $scope.question.questionKeys || []
                $scope.getAnswers()
            })
        }
        $scope.getAnswers = function () {
            $scope.allAnswers = {}
            $scope.ansLoopCount = 0;

            if ($scope.ansRefArr) {
                $scope.ansRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
            $scope.ansRefArr = []
            let questionKeys = $scope.questionKeys || []
            if (questionKeys.length == 0) {
                $scope.ref_3 = true;
                $scope.finalCalc()
            } else {
                questionKeys.forEach(questionKey => {
                    let ansRef = firebase.database().ref('NewAnswers/' + questionKey + '/answer');
                    $scope.ansRefArr.push(ansRef)
                    ansRef.on('value', function (snapshot) {
                        $scope.allAnswers[questionKey] = snapshot.val() || {}
                        $scope.ansLoopCount++
                        if ($scope.ansLoopCount >= questionKeys.length) {
                            $scope.ref_3 = true;
                            $scope.finalCalc()
                        }
                    })
                });
            }
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return

            $scope.answers = []
            $scope.studentsInGroup.forEach(userKey => {
                let stAnswers = []
                $scope.questionKeys.forEach(questionKey => {
                    let question = $scope.setQuestions[questionKey]
                    if (!question) return

                    let qAnswer = $scope.allAnswers[questionKey] || {}

                    let answer = undefined
                    let answerval = undefined
                    if (qAnswer[userKey]) {
                        answer = qAnswer[userKey].answer
                        answerval = qAnswer[userKey].answerval
                    }

                    if (question.options && answer) {  //for multiple or dropdown
                        answer = answer.split("#%%#")
                        let optionAnswer = []
                        for (i = 0; i < question.options.length; i++) {
                            optionAnswer.push((answer.indexOf(question.options[i]) > -1) ? true : false)
                        }
                        answer = optionAnswer
                    }
                    if (question.properties) {        //slide type 
                        answer = answerval
                    }

                    stAnswers.push({
                        questionType: question.questionType,
                        title: question.title || '',
                        question: question.question,
                        answer: answer,
                        answerval: answerval,
                        subQuestions: question.subQuestions,  //for contingent type
                        options: question.options,
                        ratingItems: question.ratingItems,
                        ratingOptions: question.ratingOptions,
                        properties: question.properties
                    })
                });

                $scope.answers.push({
                    userKey: userKey,
                    show_id: $scope.users[userKey].show_id,
                    answers: stAnswers,
                })
            });
            $scope.setIndex()
            if ($scope.questionKeys.length == 0) {
                $rootScope.warning("There isn't any question.")
            }
            $rootScope.setData('loadingfinished', true)
            $rootScope.safeApply();
        }
        $scope.setIndex = function () {
            if ($scope.selectedKey) {
                $scope.selectedIndex = $scope.studentsInGroup.indexOf($scope.selectedKey)
                if ($scope.selectedIndex == -1) {
                    $scope.selectedIndex = undefined
                    $scope.selectedKey = undefined
                }
            } else {
                $scope.selectedIndex = 0
                $scope.selectedKey = $scope.studentsInGroup[0]
            }
            $rootScope.safeApply();
        }
        $scope.decIndex = function () {
            if ($scope.selectedIndex == 0) {
                $rootScope.warning("This is first student answer.")
                return;
            }
            $scope.selectedIndex--
            $scope.selectedKey = $scope.studentsInGroup[$scope.selectedIndex]
            $rootScope.safeApply();
        }
        $scope.incIndex = function () {
            if ($scope.selectedIndex == $scope.studentsInGroup.length - 1) {
                $rootScope.warning("This is last student answer.")
                return;
            }
            $scope.selectedIndex++
            $scope.selectedKey = $scope.studentsInGroup[$scope.selectedIndex]
            $rootScope.safeApply();
        }
        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('viewDigit');
            }
        }
    }
})();