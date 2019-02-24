(function () {

    angular
        .module('myApp')
        .controller('choiceQuestionTypeController', choiceQuestionTypeController)

    choiceQuestionTypeController.$inject = ['$state', '$scope', '$rootScope'];

    function choiceQuestionTypeController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', $rootScope.settings.backUrlInChoice);
        var types = ['Feedback Type', 'Rating Type', 'Digit Type', 'Text Type', 'Dropdown Type', 'Slide Type', 'Multiple Type', 'Contingent Type', 'Answer Type', 'External Activity']
        $rootScope.safeApply();


        $scope.$on('$destroy', function () {
            if ($scope.teacherRef) $scope.teacherRef.off('value')
            if ($scope.defaultCreateQuestionSettingsRef) $scope.defaultCreateQuestionSettingsRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getTeacherData();
            $scope.getDefaultCreateQuestionSettings();
        }
        $scope.getTeacherData = function () {
            $scope.teacherRef = firebase.database().ref('Users/' + $rootScope.settings.userId + '/createQuestionSettings');
            $scope.teacherRef.on('value', function (snapshot) {
                $scope.teacherSettings = snapshot.val() || {};
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }
        $scope.getDefaultCreateQuestionSettings = function () {
            $scope.defaultCreateQuestionSettingsRef = firebase.database().ref('Settings/createQuestionSettings');
            $scope.defaultCreateQuestionSettingsRef.on('value', snapshot => {
                $scope.defaultCQSettings = snapshot.val()
                $scope.ref_2 = true
                $scope.finalCalc()
            })
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            for (key in $scope.teacherSettings) {
                $scope.defaultCQSettings[key] = $scope.teacherSettings[key]
            }
            delete $scope.defaultCQSettings['Likert Type']
            $scope.createQuestionSettings = []
            for (type in $scope.defaultCQSettings) {
                $scope.createQuestionSettings[types.indexOf(type)] = {
                    type: type,
                    value: $scope.defaultCQSettings[type]
                }
            }
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }
        $scope.createQuestion = function (item) {
            if (!item.value) {
                $rootScope.warning(item.type + " quesiton creating function is disabled for you. Please contact to administrator to enable it.")
                return
            }
            $state.go('createBy' + item.type.split(' ')[0]);
        }
        $scope.goback = function () {
            $state.go($rootScope.settings.backUrl);
        }
    }

})();