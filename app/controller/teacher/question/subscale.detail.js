(function () {

    angular
        .module('myApp')
        .controller('TeacherSubscaleDetailController', TeacherSubscaleDetailController)

    TeacherSubscaleDetailController.$inject = ['$state', '$scope', '$rootScope'];

    function TeacherSubscaleDetailController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questionsInSet");
        $scope.editable = $rootScope.settings.subscaleEditable;
        $scope.title = $rootScope.settings.subscale.title;
        $scope.subscale = $rootScope.settings.subscale;
        $scope.questions = $rootScope.settings.questions;
        $scope.questions.forEach(element => {
            if ($scope.subscale.questions.indexOf(element.key) > -1) {
                element.selected = true;
                if ($scope.subscale.reversed && $scope.subscale.reversed.indexOf(element.key) > -1) {
                    element.reversed = true;
                }
            }
        });
        if (!$scope.subscale.Feedback) {   //for multiple type question
            $scope.subscale.Feedback = [{ start: -1, end: 0, text: '' }];
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
            var refStr = 'QuestionSets/' + $rootScope.settings.questionSetKey + '/subscales/' + $scope.subscale.key + '/title';
            firebase.database().ref(refStr).set(title).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.operationChanged = function () {
            var refStr = 'QuestionSets/' + $rootScope.settings.questionSetKey + '/subscales/' + $scope.subscale.key + '/method';
            firebase.database().ref(refStr).set($scope.subscale.method).then(function () {
                $rootScope.safeApply();
            });
        }

        $scope.addFeedback = function (index) {
            var start = $scope.subscale.Feedback[index].end;
            $scope.subscale.Feedback.splice(index + 1, 0, { start: start, end: start, text: '' });
        }
        $scope.removeFeedback = function (index) {
            if ($scope.subscale.Feedback.length == 1) {
                $rootScope.warning("This is a last feedback!");
                return;
            }
            $scope.subscale.Feedback.splice(index, 1);
        }
        $scope.saveFeedbacks = function () {
            if (!confirm("Are you sure want to save changed feedback data?")) return;
            var feedbacks = angular.copy($scope.subscale.Feedback);
            var refStr = 'QuestionSets/' + $rootScope.settings.questionSetKey + '/subscales/' + $scope.subscale.key + '/Feedback';
            firebase.database().ref(refStr).set(feedbacks).then(function () {
                $rootScope.success('Feedback data saved Successfuly!');
                $rootScope.safeApply();
            });
        }
    }
})();