(function () {

    angular
        .module('myApp')
        .controller('LikertAnswerController', LikertAnswerController)

    LikertAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function LikertAnswerController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "studentGroupDetail");
        var siblingSetKey = $rootScope.settings.questionSet.siblingSetKey
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.allSetsRef) $scope.allSetsRef.off('value')
            if ($scope.qtRef) $scope.qtRef.off('value')
            if ($scope.ansRef) $scope.ansRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getSetData()
            $scope.getAllQuestions()
            $scope.getAnswers();
        }

        $scope.getSetData = function () {

            if (siblingSetKey) {
                $scope.allSetsRef = firebase.database().ref('QuestionSets/').orderByChild('siblingSetKey').equalTo(siblingSetKey)
            } else {
                $scope.allSetsRef = firebase.database().ref('QuestionSets/').orderByKey().equalTo($rootScope.settings.questionSetKey)
            }

            $scope.allSetsRef.on('value', function (snapshot) {
                var allSets = snapshot.val() || {}
                $scope.setData = allSets[$rootScope.settings.questionSetKey]
                if ($scope.setData.videoID) {
                    $scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.setData.videoID + "?rel=0&enablejsapi=1");
                    $rootScope.removeRecommnedVideo()
                }
                if (siblingSetKey) {
                    $scope.setData.options = allSets[siblingSetKey].options || []
                }
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }
        $scope.getAllQuestions = function () {
            if (siblingSetKey) {
                $scope.qtRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo(siblingSetKey);
            } else {
                $scope.qtRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo($rootScope.settings.questionSetKey);
            }
            $scope.qtRef.on('value', function (snapshot) {
                $scope.answers = {};
                snapshot.forEach(function (childSnapshot) {
                    $scope.answers[childSnapshot.key] = {
                        answer: undefined,
                        question: childSnapshot.val()['question'],
                        order: childSnapshot.val().order,
                    };
                });
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }

        $scope.getAnswers = function () {
            $scope.ansRef = firebase.database().ref('LikertAnswer/' + $rootScope.settings.questionSetKey + '/' + $rootScope.settings.userId + '/answer')
            $scope.ansRef.on('value', function (snapshot) {
                $scope.originAnswers = snapshot.val() || {}
                $scope.ref_3 = true
                $scope.finalCalc()
            })
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            $scope.answered = true;
            for (questionKey in $scope.originAnswers) {
                if ($scope.answers[questionKey]) $scope.answers[questionKey].answer = $scope.originAnswers[questionKey]
            }
            if (!$scope.tempAnswers) $scope.tempAnswers = {}
            for (var key in $scope.answers) {
                if ($scope.answers[key].answer == undefined) {
                    $scope.answered = false;
                }
                if (!$scope.tempAnswers[key]) $scope.tempAnswers[key] = angular.copy($scope.answers[key])
            }
            for (var key in $scope.tempAnswers) {
                if (!$scope.answers[key]) delete $scope.tempAnswers[key];
            }
            $rootScope.setData('loadingfinished', true);
        }
        $scope.checkAnswer = function (answer) {
            if ($scope.trySubmit && answer == undefined) {
                return true;
            } else {
                return false;
            }
        }

        $scope.submitAnswer = function () {
            var updates = {};
            $scope.trySubmit = true;
            var answer = {}
            for (var key in $scope.tempAnswers) {
                if ($scope.tempAnswers[key].answer == undefined) {
                    $rootScope.warning("You need to choose all answer for submit!");
                    return;
                }
                answer[key] = $scope.tempAnswers[key].answer
            }           

            updates['/LikertAnswer/' + $rootScope.settings.questionSetKey + '/' + $rootScope.settings.userId + '/answer'] = answer
            updates['/LikertAnswer/' + $rootScope.settings.questionSetKey + '/' + $rootScope.settings.userId + '/datetime'] = getDateTime();

            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Your answer is saved successfully!');
                $state.go('viewLikert');
            });
        }
        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see other\'s answer now.');
            }
            $state.go('viewLikert');
        }
    }
})();