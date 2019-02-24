(function () {

    angular
        .module('myApp')
        .controller('AdminQuestionDetailController', AdminQuestionDetailController)

        AdminQuestionDetailController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminQuestionDetailController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminQuestions");
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
    }

})();