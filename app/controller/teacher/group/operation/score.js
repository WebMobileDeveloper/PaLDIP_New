(function () {

    angular
        .module('myApp')
        .controller('teacherScoreController', teacherScoreController)

    teacherScoreController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherScoreController($state, $scope, $rootScope, $filter) {
        // ****************** router:  teacherGiveScore ****************************

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        $scope.question = $rootScope.settings.question;
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getStudentsInGroup();
            $scope.getanswers();
            $scope.getState();
        }

        $scope.getStudentsInGroup = function () {
            $scope.groupRef = firebase.database().ref('StudentGroups');
            $scope.groupRef.on('value', function (studentGroups) {
                $scope.studentsInGroup = [];
                var studentGroup = studentGroups.val();
                for (var studentKey in studentGroup) {
                    var obj = studentGroup[studentKey];
                    if (Object.values(obj).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }

        $scope.getanswers = function () {
            $scope.answerRef = firebase.database().ref('NewAnswers/' + $scope.question.code + '/answer');
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {};
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }

        $scope.getState = function () {
            $scope.qstRef = firebase.database().ref('Questions/' + $scope.question.key);
            $scope.qstRef.on('value', function (snapshot) {
                let question = snapshot.val() || {}
                $scope.showScore = question.showScore ? question.showScore : false
                $scope.showFeedback = question.showFeedback ? question.showFeedback : false
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            $scope.answers = {}
            for (userKey in $scope.allAnswers) {
                if ($scope.studentsInGroup.indexOf(userKey) > -1) {
                    $scope.answers[userKey] = $scope.allAnswers[userKey]
                }
            }

            $rootScope.safeApply()
            $rootScope.setData('loadingfinished', true);
        }
        $scope.scoreChanged = function (key) {
            firebase.database().ref('NewAnswers/' + $scope.question.code + '/answer/' + key + '/score').set($scope.answers[key].score);
        }
        $scope.feedbackChanged = function (key) {
            firebase.database().ref('NewAnswers/' + $scope.question.code + '/answer/' + key + '/feedback').set($scope.answers[key].feedback);
        }
        $scope.changeShowScore=function(showScore){
            firebase.database().ref('Questions/' + $scope.question.key+'/showScore').set(showScore)
        }
        $scope.changeShowFeedback=function(showFeedback){
            firebase.database().ref('Questions/' + $scope.question.key+'/showFeedback').set(showFeedback)
        }
    }
})();