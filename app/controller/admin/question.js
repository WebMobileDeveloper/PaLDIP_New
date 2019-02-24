(function () {

    angular
        .module('myApp')
        .controller('AdminQuestionsController', AdminQuestionsController)

    AdminQuestionsController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function AdminQuestionsController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminGroupDetails");
        // $rootScope.setData('selectedMenu', 'question');
        $rootScope.safeApply();

        $scope.teacherkey = $rootScope.settings.selectedTeacherKey;
        if (!$scope.teacherkey) {
            $rootScope.warning('You need to select teacher at first');
            $state.go('admin');
        }

        if ($rootScope.settings.groupKey == undefined) {
            $rootScope.warning('You need to select group at first');
            $state.go('adminGroup');
        }
        if ($rootScope.settings.questionSetKey == undefined) {
            $rootScope.warning('You need to select question set at first');
            $state.go('adminGroupDetails');
        }


        $scope.$on('$destroy', function () {
            if ($scope.qstRef) $scope.qstRef.off('value')
        })

        $scope.getAllQuestions = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.qstRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo($rootScope.settings.questionSetKey)
            $scope.qstRef.on('value', function (snapshot) {
                $scope.questions = [];
                snapshot.forEach(function (childSnapshot) {
                    var question = childSnapshot.val();
                    question.key = childSnapshot.key;
                    $scope.questions.push(question);
                });
                if ($scope.questions.length == 0) {
                    $rootScope.warning("There isn't any question data.");
                }
                $scope.questions = $filter('orderBy')($scope.questions, 'order');
                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.showDetail = function (obj) {
            $rootScope.setData('question', obj);
            $rootScope.setData('questionKey', obj.key);
            $state.go('adminQuestionDetail');
        }

        $scope.setActive = function (obj) {
            if (obj.key == $rootScope.settings.questionKey) {
                return 'active';
            }
            return '';
        }
    }

})();