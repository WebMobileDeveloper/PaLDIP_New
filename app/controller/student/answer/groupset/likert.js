(function () {
    angular
        .module('myApp')
        .controller('GroupLikertAnswerController', GroupLikertAnswerController)

    GroupLikertAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function GroupLikertAnswerController($state, $scope, $rootScope, $sce) {

        $rootScope.setData('showMenubar', true);

        if ($rootScope.settings.groupType == 'sub') {
            $rootScope.setData('backUrl', "studentSubGroupDetail");
            $scope.questionSetKey = $rootScope.settings.questionSetKey1
        } else {
            $rootScope.setData('backUrl', "studentSecondGroupDetail");
            $scope.questionSetKey = $rootScope.settings.questionSetKey2;
        }

        if ($rootScope.settings.groupType == 'sub') {
            $scope.ansRefStr = 'GroupLikertAnswer/' + $scope.questionSetKey + '/' + $rootScope.settings.groupKey + '/' +
                $rootScope.settings.groupSetKey + '/' + $rootScope.settings.subIndex + '/answers/' + $rootScope.settings.userId;
        } else {
            $scope.ansRefStr = 'GroupLikertAnswer/' + $scope.questionSetKey + '/' + $rootScope.settings.groupKey + '/' +
                $rootScope.settings.groupSetKey + '/' + $rootScope.settings.subIndex + '/groupset/' +
                $rootScope.settings.subSetKey + '/' + $rootScope.settings.secondIndex + '/' + $rootScope.settings.userId;
        }

        $rootScope.safeApply();


        $scope.$on('$destroy', function () {
            if ($scope.qsetRef) $scope.qsetRef.off('value')
            if ($scope.qtRef) $scope.qtRef.off('value')
            if ($scope.ansRef) $scope.ansRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getSetData();
            $scope.getAllQuestions();
            $scope.getAnswers();
        }
        $scope.getSetData = function () {
            $scope.qsetRef = firebase.database().ref('QuestionSets/' + $scope.questionSetKey);
            $scope.qsetRef.on('value', function (snapshot) {
                $scope.setData = snapshot.val();
                if ($scope.setData.videoID) {
                    $scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.setData.videoID + "?rel=0&enablejsapi=1");
                    $rootScope.removeRecommnedVideo()
                }
                $scope.ref_1 = true;
                $scope.finalFunc()
            });
        }

        $scope.getAllQuestions = function () {
            $scope.qtRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo($scope.questionSetKey)
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
                $scope.finalFunc();
            });
        }
        $scope.getAnswers = function () {
            $scope.ansRef = firebase.database().ref($scope.ansRefStr + '/answer');
            $scope.ansRef.on('value', function (snapshot) {
                $scope.originAnswers = snapshot.val() || {};
                $scope.ref_3 = true
                $scope.finalFunc()
            })
        }
        $scope.finalFunc = function () {
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

            var refData = {
                answer: answer,
                datetime: getDateTime()
            }

            updates[$scope.ansRefStr] = refData
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Your answer is saved successfully!');
                $state.go('groupViewLikert');
            });
        }
        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see other\'s answer now.');
            }
            $state.go('groupViewLikert');
        }
    }
})();