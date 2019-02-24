(function () {

    angular
        .module('myApp')
        .controller('exportController', exportController)

    exportController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function exportController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        if ($rootScope.settings.fromChoiceAction) {
            $rootScope.setData('backUrl', "choiceGroupAction");
        } else {
            $rootScope.setData('backUrl', "choiceExportGroup");
        }
        $rootScope.setData('groupType', 'group');

        $scope.types = ['Feedback Type', 'Rating Type', 'Digit Type', 'Text Type', 'Dropdown Type', 'Multiple Type', 'Contingent Type', 'Slide Type', 'Likert Type'];
        if (!$scope.selectedTab) $scope.selectedTab = $rootScope.settings.selectedTab;

        $scope.$on("$destroy", function () {
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.questionsRefArr) {
                $scope.questionsRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
            if ($scope.questionSetsRefArr) {
                $scope.questionSetsRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        });

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey);
            $scope.subGroupRef.on('value', function (snapshot) {
                var groupData = snapshot.val();
                $scope.setsInGroup = [];
                $scope.questions = {};
                $scope.setQuestions = {};
                for (var i = 0; i < $scope.types.length; i++) {
                    $scope.questions[$scope.types[i]] = [];
                }
                if (groupData.QuestionSets) {
                    for (var key in groupData.QuestionSets) {

                        $scope.setsInGroup.push(groupData.QuestionSets[key]);
                        $scope.setQuestions[key] = {
                            setName: groupData.QuestionSets[key].setname,
                            questions: [],
                            order: groupData.QuestionSets[key].order
                        };


                        if ($scope.questionSetsRefArr) {
                            $scope.questionSetsRefArr.forEach(ref => {
                                ref.off('value')
                            });
                        }
                        $scope.questionSetsRefArr = []
                        let setRef = firebase.database().ref('QuestionSets/' + key + '/setname')
                        $scope.questionSetsRefArr.push(setRef)
                        setRef.on('value', function (snapshot) {
                            let setname = snapshot.val()
                            groupData.QuestionSets[key].setname = setname
                            $scope.setQuestions[key].setname = setname
                            $rootScope.safeApply()
                        })
                    }
                }

                if (groupData.groupsets) {
                    $scope.groupsets = groupData.groupsets;
                    $scope.groupSetKey = $rootScope.settings.groupSetKey;
                    $scope.subIndex = $rootScope.settings.subIndex;
                    if (!$scope.groupSetKey) {
                        $scope.groupSetKey = Object.keys($scope.groupsets)[0];
                        $scope.subIndex = 0;
                        $rootScope.setData('groupSetKey', $scope.groupSetKey);
                        $rootScope.setData('subIndex', $scope.subIndex);
                    }
                    for (groupSetKey in $scope.groupsets) {
                        $scope.groupsets[groupSetKey].data.groups.forEach((group, index) => {
                            let nameIndex = index + 1;
                            group.name = group.name ? group.name : $scope.groupsets[groupSetKey].name + ' ' + nameIndex;
                        });
                    }

                    $scope.selectedGroup = $scope.groupsets[$scope.groupSetKey];
                }

                if ($scope.setsInGroup.length == 0) {
                    $rootScope.warning("There isn't any question set.");
                    $rootScope.setData('loadingfinished', true);
                    return;
                }
                $scope.setsInGroup = $filter('orderBy')($scope.setsInGroup, 'order');
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
                        questionType: 'Likert Type',
                        siblingSetKey: set.siblingSetKey,
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
                            if (question.questionType == 'Answer Type' || question.questionType == 'External Activity' || question.teamRate) continue;
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
                            $rootScope.safeApply()
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
            $rootScope.setData('questionType', type);
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

        $scope.getClass = function (selectedTab) {
            if ($scope.selectedTab == selectedTab) {
                return 'active';
            }
        }
        $scope.setActive = function (selectedTab) {
            $scope.selectedTab = selectedTab;
            $rootScope.setData('selectedTab', selectedTab);
        }

        // groupset functions
        $scope.selectGroupset = function (groupSetKey) {
            if ($scope.groupSetKey != groupSetKey) {
                $scope.groupSetKey = groupSetKey;
                $scope.selectedGroup = $scope.groupsets[groupSetKey];
                $scope.subIndex = 0;
                $rootScope.setData('groupSetKey', $scope.groupSetKey);
                $rootScope.setData('subIndex', $scope.subIndex);
            }
        }
        $scope.getGroupClass = function (obj) {
            if ($scope.groupSetKey == obj.key) {
                return 'active';
            }
        }

        $scope.getSubGroupClass = function (index) {
            if ($scope.subIndex == index) {
                return 'active';
            }
        }

        $scope.selectGroup = function (index, group_name) {
            let groupNames = []
            $scope.selectedGroup.data.groups.forEach(group => {
                groupNames.push(group.name)
            });
            $scope.subIndex = index;
            $rootScope.setData('groupNames',groupNames);
            $rootScope.setData('subIndex', index);
            $rootScope.setData('selectedTab1', 'Questions');
            $rootScope.setData('subSetKey', undefined);
            group_name = group_name ? group_name : $scope.selectedGroup.name + ' ' + (index + 1);
            $rootScope.setData('subGroupName', $rootScope.settings.groupName + ' / ' + group_name);
            $state.go('exportSub');
        }
    }
})();