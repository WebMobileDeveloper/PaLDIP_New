(function () {

    angular
        .module('myApp')
        .controller('createByExternalController', createByExternalController)

    createByExternalController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function createByExternalController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceQuestionType");
        $rootScope.newQuestionKey = undefined
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.questionsRef) $scope.questionsRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getAllQuestions()
            $scope.getUsers()
        }
        $scope.getAllQuestions = function () {
            $scope.questionsRef = firebase.database().ref("Questions")
            $scope.questionsRef.on('value', function (snapshot) {
                $scope.Questions = snapshot.val() || {}
                $rootScope.newQuestionKey = $scope.getCode()
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            $scope.usersRef.on('value', function (snapshot) {
                let users = snapshot.val() || {};
                $scope.users = {}
                for (userKey in users) {
                    $scope.users[users[userKey].show_id] = users[userKey]
                }
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $rootScope.setData("loadingfinished", true)
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
        $scope.getOrder = function () {
            let order = -1
            let setQuestions = Object.values($scope.Questions).filter(qst => qst.Set == $rootScope.settings.questionSetKey);
            for (i = 0; i < setQuestions.length; i++) {
                if (setQuestions[i].order > order) order = setQuestions[i].order
            }
            return order + 1
        }
        
        $scope.creatExternalQuestion = function () {
            if (!$scope.mainQuestion) {
                $rootScope.error('Please Input Question!');
                return;
            }
            var qtdetails = {
                title: $scope.title ? $scope.title : {},
                question: $scope.mainQuestion,
                teacher: $rootScope.settings.userEmail,
                Set: $rootScope.settings.questionSetKey,
                questionType: 'External Activity',
                code: $rootScope.newQuestionKey,
                order: $scope.getOrder()
            };
          
            let updates = {}
            updates['Questions/' + $rootScope.newQuestionKey] = qtdetails
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Question is created successfully!')
                $rootScope.safeApply();
                $state.reload()
            })
        }
    }
})();