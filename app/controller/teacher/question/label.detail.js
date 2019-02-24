(function () {

    angular
        .module('myApp')
        .controller('TeacherLabelDetailController', TeacherLabelDetailController)

    TeacherLabelDetailController.$inject = ['$state', '$scope', '$rootScope'];

    function TeacherLabelDetailController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questionsInSet");
        $scope.editable = $rootScope.settings.subscaleEditable;
        $scope.title = $rootScope.settings.subscale.title;
        $scope.subscales = $rootScope.settings.subscales;
        $scope.label = $rootScope.settings.subscale;

        $rootScope.safeApply();

        $scope.getTeacherData = function () {
            $rootScope.setData('loadingfinished', false);
            var userRef = firebase.database().ref('Users/' + $rootScope.settings.userId);
            userRef.on('value', function (snapshot) {
                $scope.userData = snapshot.val();
                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.titleChanged = function (title) {
            var refStr = 'QuestionSets/' + $rootScope.settings.questionSetKey + '/labels/' + $scope.label.key + '/title';
            firebase.database().ref(refStr).set(title).then(function () {
                $rootScope.safeApply();
            });
        }
    }
})();