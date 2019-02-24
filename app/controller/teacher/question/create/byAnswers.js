(function () {

    angular
        .module('myApp')
        .controller('createByAnswerController', createByAnswerController)

    createByAnswerController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function createByAnswerController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceQuestionType");
        $scope.show_id = false;
        $rootScope.newQuestionKey = undefined
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.questionsRef) $scope.questionsRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getAllQuestions()
        }
        $scope.getAllQuestions = function () {
            $scope.questionsRef = firebase.database().ref("Questions")
            $scope.questionsRef.on('value', function (snapshot) {
                $scope.Questions = snapshot.val() || {}
                $scope.setQuestions = Object.values($scope.Questions).filter(qst => qst.Set == $rootScope.settings.questionSetKey && qst.questionType != "Answer Type");
                $scope.setQuestions = $filter('orderBy')($scope.setQuestions, 'order');
                $rootScope.newQuestionKey = $scope.getCode()
                $rootScope.setData("loadingfinished", true)
            })
        }
        $scope.getCode = function () {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghijklmnopqrstuvwxyz1234567890'.split('');
            var new_id = '';
            do {
                new_id = '';
                for (var i = 0; i < 5; i++) {
                    new_id += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (Object.keys($scope.Questions).indexOf(new_id) > -1);
            return new_id;
        }
        $scope.toggleAll = function () {
            $scope.selectAll = !$scope.selectAll
            $scope.setQuestions.forEach(qst => {
                qst.selected = $scope.selectAll
            });
            $rootScope.safeApply()
        }
        $scope.toggle = function (index) {
            $scope.setQuestions[index].selected = !$scope.setQuestions[index].selected
            $rootScope.safeApply()
        }

        $scope.creatStudentAnswerQuestion = function () {
            if (!$scope.mainQuestion) {
                $rootScope.error('Please Input Question!');
                return;
            }
            let questionKeys = []
            $scope.setQuestions.forEach(qst => {
                if (qst.selected) questionKeys.push(qst.code)
            });
            if (questionKeys.length == 0) {
                $rootScope.warning("You need to select one more question.")
                return
            }
            var qtdetails = {
                title: $scope.title ? $scope.title : {},
                question: $scope.mainQuestion,
                questionKeys: questionKeys,
                teacher: $rootScope.settings.userEmail,
                Set: $rootScope.settings.questionSetKey,
                questionType: 'Answer Type',
                show_id: $scope.show_id ? true : {},
                code: $rootScope.newQuestionKey,
                order: $scope.setQuestions.length + 1
            };//Questions
            firebase.database().ref('Questions/' + $rootScope.newQuestionKey).set(qtdetails).then(function () {
                $rootScope.success('Question is created successfully!')
                $rootScope.safeApply();
                $state.reload()
            })
        }
    }
})();