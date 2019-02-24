(function () {

    angular
        .module('myApp')
        .controller('TeacherSuperScaleDetailController', TeacherSuperScaleDetailController)

    TeacherSuperScaleDetailController.$inject = ['$state', '$scope', '$rootScope'];

    function TeacherSuperScaleDetailController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questionsInSet");
        $scope.editable = $rootScope.settings.subscaleEditable;
        $scope.title = $rootScope.settings.subscale.title;
        $scope.subscales = $rootScope.settings.subscales;
        $scope.superscale = $rootScope.settings.subscale;

        if (!$scope.superscale.Feedback) {   //for multiple type question
            $scope.superscale.Feedback = [{ start: -1, end: 0, text: '' }];
        }
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
            var refStr = 'QuestionSets/' + $rootScope.settings.questionSetKey + '/superscales/' + $scope.superscale.key + '/title';
            firebase.database().ref(refStr).set(title).then(function () {               
                $rootScope.safeApply();
            });
        }
        $scope.addFeedback = function (index) {
            var start = $scope.superscale.Feedback[index].end;
            $scope.superscale.Feedback.splice(index + 1, 0, { start: start, end: start, text: '' });
        }
        $scope.removeFeedback = function (index) {
            if ($scope.superscale.Feedback.length == 1) {
                $rootScope.warning("This is a last feedback!");
                return;
            }
            $scope.superscale.Feedback.splice(index, 1);
        }
        $scope.saveFeedbacks = function () {
            if (!confirm("Are you sure want to save changed feedback data?")) return;
            var feedbacks = angular.copy($scope.superscale.Feedback);
            var refStr = 'QuestionSets/' + $rootScope.settings.questionSetKey + '/superscales/' + $scope.superscale.key + '/Feedback';
            firebase.database().ref(refStr).set(feedbacks).then(function () {
                $rootScope.success('Feedback data saved Successfuly!');
                $rootScope.safeApply();
            });
        }
    }
})();