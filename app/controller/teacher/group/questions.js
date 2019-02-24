(function () {
    angular
        .module('myApp')
        .controller('questionsInGroupController', questionsInGroupController)
    questionsInGroupController.$inject = ['$state', '$scope', '$rootScope', 'dragulaService', '$filter'];
    function questionsInGroupController($state, $scope, $rootScope, dragulaService, $filter) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceGroupAction");
        $scope.selectedQuestionKey = $rootScope.settings.selectedQuestionKey;
        $scope.selectedQuestionSetKey = $rootScope.settings.selectedQuestionSetKey;
        $scope.subIndex = $rootScope.settings.selectedSubIndex;
        $scope.secondIndex = $rootScope.settings.selectedSecondIndex;
        $rootScope.safeApply();
        dragulaService.options($scope, 'drag-div', {
            removeOnSpill: false
        });

        $scope.$on('$destroy', function () {
            if ($scope.setsRef) $scope.setsRef.off('value')
            if ($scope.qstsRef) $scope.qstsRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.refCount = 0
            $scope.getAllSets()
            $scope.getAllQuestions()
            $scope.getGroupData()
        }
        $scope.getAllSets = function () {
            $scope.setsRef = firebase.database().ref('QuestionSets')
            $scope.setsRef.on('value', function (snapshot) {
                $scope.allSets = snapshot.val() || {}
                $scope.ref_1 = true;
                $scope.finalCalc()
            })
        }
        $scope.getAllQuestions = function () {
            $scope.qstsRef = firebase.database().ref('Questions')
            $scope.qstsRef.on('value', function (snapshot) {
                $scope.allQuestions = {}
                var questions = snapshot.val();
                for (key in questions) {
                    var question = questions[key]
                    var setKey = question.Set
                    if (!$scope.allQuestions[setKey]) $scope.allQuestions[setKey] = {}
                    $scope.allQuestions[setKey][key] = question
                }
                $scope.ref_2 = true;
                $scope.finalCalc()
            })
        }
        $scope.getGroupData = function () {
            $scope.groupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey);
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groupRoot = snapshot.val()
                $scope.ref_3 = true;
                $scope.finalCalc()
            });
        }

        $scope.finalCalc = function () {
            $rootScope.setData('loadingfinished', false);
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return;
            $rootScope.setData('selectedSubIndex', $scope.subIndex);
            $rootScope.setData('selectedSecondIndex', $scope.secondIndex);
            $scope.groupsets = [{ key: 'root', name: '---  Group Root  ---' }]
            $scope.groupRoot.groupsets = $scope.groupRoot.groupsets || {}
            for (subKey in $scope.groupRoot.groupsets) {
                let subGroup = $scope.groupRoot.groupsets[subKey];
                $scope.groupsets.push({ key: subKey, name: subGroup.name })
            }
            if ($scope.subIndex == 0) {
                $scope.group = angular.copy($scope.groupRoot);
                $scope.subGroupsets = [];
            } else {
                $scope.subGroupsets = [{ key: 'root', name: '---  subGroup Root  ---' }];
                let subGroup = $scope.groupRoot.groupsets[$scope.groupsets[$scope.subIndex].key];
                subGroup.subgroupsets = subGroup.subgroupsets || {}
                for (secondKey in subGroup.subgroupsets) {
                    let secondGroup = subGroup.subgroupsets[secondKey];
                    $scope.subGroupsets.push({ key: secondKey, name: secondGroup.name })
                }
                if ($scope.secondIndex == 0) {
                    $scope.group = angular.copy(subGroup)
                } else {
                    $scope.group = angular.copy(subGroup.subgroupsets[$scope.subGroupsets[$scope.secondIndex].key])
                }
            }
            $scope.QuestionSets = []
            $scope.group.QuestionSets = $scope.group.QuestionSets || {}
            $scope.group.sections = $scope.group.sections || {}
            for (setKey in $scope.group.QuestionSets) {
                $scope.QuestionSets.push($scope.group.QuestionSets[setKey])
            }

            for (setKey in $scope.group.sections) {
                $scope.QuestionSets.push($scope.group.sections[setKey])
            }

            $scope.QuestionSets = $filter('orderBy')($scope.QuestionSets, 'order');

            // =============================================
            $scope.QuestionSets.forEach(setData => {
                if (setData.isSection) return
                var setKey = setData.key;
                $scope.allSets[setKey] = $scope.allSets[setKey] || {}
                setData.setname = $scope.allSets[setKey].setname
                if (setData.LikertType) {
                    setData.questions = [{
                        questionKey: setKey,
                        questionType: 'Likert Type',
                        question: '**************    Likert Type QuestionSet    **************',
                        disabled: setData.DisabledQuestions,
                    }]
                } else {
                    var questions = []
                    $scope.allQuestions[setKey] = $scope.allQuestions[setKey] || {}
                    setData.DisabledQuestions = setData.DisabledQuestions || {}

                    for (qstKey in $scope.allQuestions[setKey]) {
                        var qst = $scope.allQuestions[setKey][qstKey]
                        if ($scope.subIndex == 0) {
                            if (qst.teamRate) continue;
                        } else {
                            if (qst.questionType == 'Slide Type' || qst.questionType == 'Answer Type' || qst.questionType == 'External Activity') continue;
                        }

                        qst.questionKey = qstKey
                        qst.disabled = Object.keys(setData.DisabledQuestions).indexOf(qstKey) > -1 ? true : false
                        questions.push($scope.allQuestions[setKey][qstKey])
                    }
                    questions = $filter('orderBy')(questions, 'order');
                    setData.questions = questions
                }
            });
            $rootScope.safeApply();
            $rootScope.setData('loadingfinished', true);
        }

        $scope.changeSubIndex = function () {
            $scope.secondIndex = 0;
            $scope.finalCalc();
        }
        $scope.changeSecondIndex = function () {
            $scope.finalCalc();
        }
        $scope.response = function (setKey, question) {
            $rootScope.setData('exportQuestion', question);
            $rootScope.setData('selectedQuestionKey', question.questionKey);
            $rootScope.setData('selectedQuestionSetKey', setKey);
            $rootScope.setData('questionSet', $scope.allSets[setKey]);


            if ($scope.subIndex == 0) {             // group root
                switch (question.questionType) {
                    case 'Likert Type':
                        $state.go('responseOfLikertAnswer');
                        break;
                    case "Dropdown Type":
                        $state.go('responseOfDropdownAnswer');
                        break;
                    case "Multiple Type":
                        $state.go('responseOfMultipleAnswer');
                        break;
                    case "Contingent Type":
                        $state.go('responseOfContingentAnswer');
                        break;
                    case "Feedback Type":
                        $state.go('responseOfFeedbackAnswer');
                        break;
                    case "Rating Type":
                        $state.go('responseOfRatingAnswer');
                        break;
                    case "Slide Type":
                        $state.go('responseOfSlideAnswer');
                        break;
                    case "Answer Type":
                        $state.go('responseOfPerAnswer');
                        break;
                    case "External Activity":
                        $state.go('responseOfExternal');
                        break;
                    default:
                        $state.go('responseOfAnswer');
                        break;

                }
            } else {                                // groupset, subgroupset

                var groupType = 'sub';
                if ($scope.secondIndex > 0) {
                    groupType = 'second';
                }
                $rootScope.setData('groupType', groupType);
                $rootScope.setData('groupSetKey', $scope.groupsets[$scope.subIndex].key);
                $rootScope.setData('subSetKey', groupType == 'second' ? $scope.subGroupsets[$scope.secondIndex].key : undefined);
                $rootScope.setData('groupsets', $scope.groupRoot.groupsets[$scope.groupsets[$scope.subIndex].key]);

                // $rootScope.setData('setData', set);

                switch (question.questionType) {
                    case 'Likert Type':
                        $state.go('groupResponseOfLikertAnswer');
                        break;
                    case "Dropdown Type":
                        $state.go('groupResponseOfDropdownAnswer');
                        break;
                    case "Multiple Type":
                        $state.go('groupResponseOfMultipleAnswer');
                        break;
                    case "Contingent Type":
                        $state.go('groupResponseOfContingentAnswer');
                        break;
                    case "Feedback Type":
                        $state.go('groupResponseOfFeedbackAnswer');
                        break;
                    case "Rating Type":
                        $state.go('groupResponseOfRatingAnswer');
                        break;
                    default:
                        $state.go('groupResponseOfAnswer');
                        break;
                }
            }

        }

        $scope.disableView = function (setKey, question, index) {
            var qstKey = question.questionKey
            var disabled = question.disabled ? {} : true
            var disableRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey +
                '/QuestionSets/' + setKey + '/DisabledQuestions/')
            if ($scope.subIndex > 0) {
                disableRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' +
                    $scope.groupsets[$scope.subIndex].key +
                    '/QuestionSets/' + index + '/DisabledQuestions/');
                if ($scope.secondIndex > 0) {
                    disableRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' +
                        $scope.groupsets[$scope.subIndex].key + '/subgroupsets/' + $scope.subGroupsets[$scope.secondIndex].key +
                        '/QuestionSets/' + index + '/DisabledQuestions/');
                }
            }
            if (question.questionType == 'Likert Type') {
                disableRef.set(disabled);
            } else {
                disableRef.child(qstKey).set(disabled);
            }
        }
    }

})();