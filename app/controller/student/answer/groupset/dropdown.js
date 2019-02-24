(function () {

    angular
        .module('myApp')
        .controller('GroupDropdownAnswerController', GroupDropdownAnswerController)

    GroupDropdownAnswerController.$inject = ['$state', '$scope', '$rootScope'];

    function GroupDropdownAnswerController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "subQuestions");
        $rootScope.currAnswer = undefined;
        $rootScope.currAnswerKey = undefined; 
        $scope.question = $rootScope.settings.questionObj;
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.optionDataRef) $scope.optionDataRef.off('value')
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.getdropdownoptions = function () {
            $scope.options = [];
            var setKey = "";
            if ($rootScope.settings.groupType == 'sub') {
                setKey = $rootScope.settings.questionSetKey1;
            } else {
                setKey = $rootScope.settings.questionSetKey2;
            }
            $scope.optionDataRef = firebase.database().ref('Questions/'  + $rootScope.settings.questionKey);
            $scope.optionDataRef.on('value', function (snapshot) {
                $scope.options = snapshot.val()['options'];
                $rootScope.safeApply();
            });
        }

        $scope.applyAnswer = function (e) {
            $rootScope.currAnswerKey = e;
            $rootScope.currAnswer = $scope.options[e];
            $rootScope.safeApply();
        }

        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('groupViewDropdown');
            }
        }
        $scope.goBack = function () {
            $state.go($rootScope.settings.backUrl);
        }

    }
})();