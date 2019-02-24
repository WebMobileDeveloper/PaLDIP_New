(function () {

    angular
        .module('myApp')
        .controller('studentSecondGroupDetailController', studentSecondGroupDetailController)

    studentSecondGroupDetailController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function studentSecondGroupDetailController($state, $scope, $rootScope, $filter) {

        var uid = $rootScope.settings.userId;
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'studentSubGroupDetail');
        $rootScope.setData('selectedMenu', 'secondGroupDetail');

        if ($rootScope.settings.groupKey == undefined) {
            $rootScope.warning('You need to select group at first');
            $state.go('myGroups');
            return;
        }
        if ($rootScope.settings.groupSetKey == undefined) {
            $rootScope.warning('You need to select sub group at first');
            $state.go('studentGroupDetail');
            return;
        }
        if ($rootScope.settings.subSetKey == undefined) {
            $rootScope.warning('You need to select 2nd subgroup at first');
            $state.go('studentSubGroupDetail');
            return;
        }

        $scope.$on("$destroy", function () {
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
        });

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey
                + '/groupsets/' + $rootScope.settings.groupSetKey + '/subgroupsets/' + $rootScope.settings.subSetKey);
            $scope.subGroupRef.on('value', function (snapshot) {
                var groupData = snapshot.val();
                $scope.subGroupName = $rootScope.settings.subGroupName;
                groupData.QuestionSets = groupData.QuestionSets || []
                groupData.QuestionSets = groupData.QuestionSets.filter(set => !set.hidden);

                // ============get completed state======================== 
                groupData.QuestionSets.forEach(obj => {
                    // get questions
                    $scope.qstRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo(obj.key);
                    $scope.qstRef.once('value', function (questions) {
                        var completed = true;
                        var questionKeys = [];
                        questions.forEach(function (question) {
                            if (question.questionType != 'Answer Type') questionKeys.push(question.key);
                        });
                        var questionCount = questionKeys.length;
                        var calcCount = 0;
                        questionKeys.forEach(function (questionKey) {
                            var ansRef = undefined;
                            if (obj.LikertType == true) {
                                ansRef = firebase.database().ref('GroupLikertAnswer/' + obj.key +
                                    '/' + $rootScope.settings.groupKey + '/' + $rootScope.settings.groupSetKey + '/' + $rootScope.settings.subIndex +
                                    '/groupset/' + $rootScope.settings.subSetKey + '/' + $rootScope.settings.secondIndex +
                                    '/' + uid + '/answer/' + questionKey);
                                ansRef.once('value', function (ans) {
                                    var answered = false;
                                    calcCount++;
                                    if (ans.val()) answered = true;

                                    if (!answered) {
                                        completed = false;
                                    }
                                    if (calcCount == questionCount) {
                                        obj.completed = completed;
                                        $rootScope.safeApply();
                                    }
                                });
                            } else {
                                var ansRef = firebase.database().ref('GroupAnswers/').orderByChild('questionKey').equalTo(questionKey);
                                ansRef.once('value', function (ans) {
                                    var answered = false;
                                    calcCount++;
                                    ans.forEach(function (answers) {
                                        var answer = answers.val();
                                        if (answer.studentgroupkey == $rootScope.settings.groupKey
                                            && answer.groupType == 'second'
                                            && answer.groupSetKey == $rootScope.settings.groupSetKey
                                            && answer.subIndex == $rootScope.settings.subIndex
                                            && answer.subSetKey == $rootScope.settings.subSetKey
                                            && answer.secondIndex == $rootScope.settings.secondIndex
                                            && answer.uid == uid) {
                                            answered = true;
                                        }
                                    })

                                    if (!answered) {
                                        completed = false;
                                    }
                                    if (calcCount == questionCount) {
                                        obj.completed = completed;
                                        $rootScope.safeApply();
                                    }
                                });
                            }
                        });
                        if (questionCount == 0) {
                            obj.completed = true;
                            $rootScope.safeApply();
                        }
                    });
                });
                // ============end get completed state======================== 

                $scope.QuestionSets = groupData.QuestionSets
                $rootScope.safeApply()
                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.questions = function (set) {
            if (set.isSection) return;
            $rootScope.setData('questionSetKey2', set.key);
            $rootScope.setData('questionSetName', set.setname);
            $rootScope.setData('questionSet', set);
            $rootScope.setData('groupType', 'second');
            if (set.LikertType == true) {
                let groupLikertSettings = $rootScope.settings.groupLikertSettings;
                let showResponse = false;
                if (groupLikertSettings.subgroupsets
                    && groupLikertSettings.subgroupsets[$rootScope.settings.groupSetKey]
                    && groupLikertSettings.subgroupsets[$rootScope.settings.groupSetKey][$rootScope.settings.subSetKey]
                    && groupLikertSettings.subgroupsets[$rootScope.settings.groupSetKey][$rootScope.settings.subSetKey][set.key]) {
                    showResponse = groupLikertSettings.subgroupsets[$rootScope.settings.groupSetKey][$rootScope.settings.subSetKey][set.key].showResponse;
                }
                $rootScope.setData('showResponse', showResponse);
                $rootScope.setData('disabledQuestion', set.DisabledQuestions);
                if (!showResponse && set.completed) {
                    $state.go('groupViewLikert');
                } else {
                    $state.go('groupLikertAnswer');
                }
            } else {
                $state.go('subQuestions');
            }
        }
        $scope.getQstClass = function (obj) {
            if (obj.isSection) {
                return 'section';
            } else if ($rootScope.settings.questionSetKey2 == obj.key) {
                return 'active';
            }
        }
    }
})();