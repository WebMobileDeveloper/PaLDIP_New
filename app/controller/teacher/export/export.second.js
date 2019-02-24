(function () {

    angular
        .module('myApp')
        .controller('exportSecondController', exportSecondController)

    exportSecondController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function exportSecondController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "exportSub");
        $rootScope.setData('groupType', 'second');
        $scope.groupName = $rootScope.settings.secondGroupName;

        $scope.types = ['Feedback Type', 'Rating Type', 'Digit Type', 'Text Type', 'Dropdown Type', 'Multiple Type', 'Contingent Type', 'Slide Type', 'Likert Type'];
        if (!$scope.selectedTab) $scope.selectedTab = $rootScope.settings.selectedTab1;

        $scope.$on("$destroy", function () {
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
            if ($scope.questionsRefArr) {
                $scope.questionsRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        });

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/'
                + $rootScope.settings.groupSetKey + '/subgroupsets/' + $rootScope.settings.subSetKey);
            $scope.subGroupRef.on('value', function (snapshot) {

                var groupData = snapshot.val();
                $scope.setsInGroup = [];
                $scope.questions = {};
                $scope.setQuestions = {};
                for (var i = 0; i < $scope.types.length; i++) {
                    $scope.questions[$scope.types[i]] = [];
                }
                if (groupData.QuestionSets) {
                    for (var i = 0; i < groupData.QuestionSets.length; i++) {
                        $scope.setsInGroup.push(groupData.QuestionSets[i]);
                        $scope.setQuestions[groupData.QuestionSets[i].key] = {
                            key: groupData.QuestionSets[i].key,
                            setName: groupData.QuestionSets[i].setname,
                            questions: [],
                        };
                    }
                }

                if ($scope.setsInGroup.length == 0) {
                    $rootScope.warning("There isn't any question set.");
                    $rootScope.setData('loadingfinished', true);
                    return;
                }
                $scope.getQuestions();  // Get Feedback
            });
        }

        $scope.getQuestions = function () {
            var loopCount = $scope.setsInGroup.length;
            var count = 0;
            if ($scope.questionsRefArr) {
                $scope.questionsRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
            $scope.questionsRefArr = []
            $scope.setsInGroup.forEach(set => {
                if (set.LikertType) {
                    var childData = {
                        key: 'likert QuestionSet',
                        setname: set.setname,
                        setKey: set.key,
                        question: '*************** likert QuestionSet ***************',
                        questionType: 'Likert Type'
                    }
                    $scope.questions['Likert Type'].push(childData);
                    $scope.setQuestions[set.key].questions.push(childData);
                    count++;
                    loopCount--;
                    if (loopCount == 0) {
                        if (count == 0) {
                            $rootScope.warning("There isn't any question data.");
                        }
                        $rootScope.setData('loadingfinished', true);
                    }
                } else {
                    var questionsRef = firebase.database().ref("Questions/").orderByChild("Set").equalTo(set.key);
                    $scope.questionsRefArr.push(questionsRef)
                    questionsRef.on('value', function (qtSnapshot) {
                        for (questionKey in qtSnapshot.val()) {
                            var question = qtSnapshot.val()[questionKey]
                            if (question.questionType == 'Answer Type') continue;
                            question.key = questionKey
                            question.setKey = set.key
                            question.setname = set.setname
                            $scope.questions[question.questionType].push(question);
                            $scope.setQuestions[set.key].questions.push(question);
                            count++;
                        }
                        $scope.setQuestions[set.key].questions = $filter('orderBy')($scope.setQuestions[set.key].questions, 'order');
                        loopCount--;
                        if (loopCount == 0) {
                            if (count == 0) {
                                $rootScope.warning("There isn't any question data.");
                            }
                            $rootScope.setData('loadingfinished', true);
                        }
                    });
                }
            });
        }

        $scope.exportQuestionDatas = function (obj, type) {
            $rootScope.setData('question', obj);
            if (type == 'Likert Type') {
                $state.go('exportLikertToExcel');
            } else if (type == 'Rating Type') {
                $state.go('exportRatingToExcel');
            } else {
                $state.go('exportToExcel');
            }
        }

        $scope.exportAllQuestionDatas = function (questions, type) {
            $rootScope.setData('questionArr', questions);
            if (questions.length == 0) {
                $rootScope.warning('There isn\'t any question');
            } else if (type == 'Rating Type') {
                $state.go('ratingToExcelAll');
            } else if (type == 'Contingent Type') {
                $state.go('contingentToExcelAll');
            } else {
                $state.go('exportToExcelAll');
            }
        }
    }
})();