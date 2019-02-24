(function () {

    angular
        .module('myApp')
        .controller('studentSubGroupDetailController', studentSubGroupDetailController)

    studentSubGroupDetailController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function studentSubGroupDetailController($state, $scope, $rootScope, $filter) {



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
        var uid = $rootScope.settings.userId;
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'studentGroupDetail');
        $rootScope.setData('selectedMenu', 'subGroupDetail');

        $scope.$on("$destroy", function () {
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
        });
        $scope.init = function () {

            $rootScope.setData('loadingfinished', false);

            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey
                + '/groupsets/' + $rootScope.settings.groupSetKey);
            $scope.subGroupRef.on('value', function (snapshot) {
                $scope.groupData = snapshot.val();
                $scope.subGroupName = $scope.groupData.data.groups[$rootScope.settings.subIndex].name;
                if (!$scope.subGroupName) {
                    $scope.subGroupName = $scope.groupData.name + " " + ($rootScope.settings.subIndex + 1);
                }
                $scope.groupData.QuestionSets = $scope.groupData.QuestionSets || []
                $scope.groupData.QuestionSets = $scope.groupData.QuestionSets.filter(set => !set.hidden);

                if ($scope.groupData.subgroupsets) {
                    for (var key in $scope.groupData.subgroupsets) {
                        var groupset = $scope.groupData.subgroupsets[key];
                        var data = $scope.groupData.data.groups[$rootScope.settings.subIndex].subgroupsets[key];
                        if (!data.members) data.members = [];
                        if (data.members.indexOf(uid) > -1) data.joined = true;
                        data.joinable = true;
                        if (groupset.locked || (groupset.exclusive && data.joined)) {
                            data.joinable = false;
                        }

                        groupset.key = key;
                        for (var i = 0; i < groupset.count; i++) {
                            var group = data.groups[i];
                            if (!group.members) group.members = [];
                            if (group.members.indexOf(uid) > -1) group.joined = true;
                            group.joinable = false;
                            if (data.joinable && !group.joined) group.joinable = true;
                        }
                        groupset.data = data;
                    }
                    $scope.subgroupsets = $scope.groupData.subgroupsets;
                }


                if (!$scope.selectedTab) $scope.selectedTab = $rootScope.settings.selectedTab1;




                if (!$scope.selectedTab) $scope.selectedTab = $rootScope.settings.selectedTab1;
                if (!$scope.groupSetKey) $scope.groupSetKey = $rootScope.settings.subSetKey;
                if (!$scope.secondIndex) $scope.secondIndex = $rootScope.settings.secondIndex;
                if ($scope.subgroupsets) {
                    if (!$scope.groupSetKey) {
                        $scope.groupSetKey = Object.keys($scope.subgroupsets)[0];
                        $scope.secondIndex = 0;
                    }
                    $scope.selectedGroup = $scope.subgroupsets[$scope.groupSetKey];
                }



                // ============get completed state======================== 
                $scope.groupData.QuestionSets.forEach(obj => {
                    // get questions
                    var qstRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo(obj.key);
                    qstRef.once('value', function (questions) {
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
                                    '/answers/' + uid + '/answer/' + questionKey);
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
                                ansRef = firebase.database().ref('GroupAnswers/').orderByChild('questionKey').equalTo(questionKey);
                                ansRef.once('value', function (ans) {
                                    var answered = false;
                                    calcCount++;
                                    ans.forEach(function (answers) {
                                        var answer = answers.val();
                                        if (answer.studentgroupkey == $rootScope.settings.groupKey
                                            && answer.groupType == 'sub'
                                            && answer.groupSetKey == $rootScope.settings.groupSetKey
                                            && answer.subIndex == $rootScope.settings.subIndex
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


                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.questions = function (set) {           
            if (set.isSection) return;
            $rootScope.setData('questionSetKey1', set.key);
            $rootScope.setData('questionSetName', set.setname);
            $rootScope.setData('questionSet', set);
            $rootScope.setData('groupType', 'sub');

            if (set.LikertType == true) {
                
                let groupLikertSettings = $rootScope.settings.groupLikertSettings;
                let showResponse = false;
                if (groupLikertSettings.groupsets
                    && groupLikertSettings.groupsets[$rootScope.settings.groupSetKey]
                    && groupLikertSettings.groupsets[$rootScope.settings.groupSetKey][set.key]) {
                    showResponse = groupLikertSettings.groupsets[$rootScope.settings.groupSetKey][set.key].showResponse;
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
            } else if ($rootScope.settings.questionSetKey1 == obj.key) {
                return 'active';
            }
        }
        $scope.getClass = function (selectedTab) {
            if ($scope.selectedTab == selectedTab) {
                return 'active';
            }
        }
        $scope.setActive = function (selectedTab) {
            $scope.selectedTab = selectedTab;
            $rootScope.setData('selectedTab1', selectedTab);
        }
        $scope.selectGroup = function (groupSetKey) {
            if ($scope.groupSetKey != groupSetKey) {
                $scope.groupSetKey = groupSetKey;
                $scope.selectedGroup = $scope.groupData.subgroupsets[groupSetKey];
                $scope.secondIndex = 0;
            }
        }
        $scope.getGroupClass = function (obj) {
            if ($scope.groupSetKey == obj.key) {
                return 'active';
            }
        }
        $scope.getSubGroupClass = function (index) {
            if ($scope.secondIndex == index) {
                return 'active';
            }
        }
        $scope.join_group = function (groupSet_key, group_index) {
            var updates = {};
            var members1 = $scope.selectedGroup.data.members;
            var groupSetStr = 'Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $rootScope.settings.groupSetKey
                + '/data/groups/' + $rootScope.settings.subIndex + '/subgroupsets/' + groupSet_key + '/';

            if (members1.indexOf(uid) < 0) {
                members1.push(uid);
                updates[groupSetStr + 'members'] = members1;
                updates[groupSetStr + 'member_count'] = members1.length;
            }

            var members2 = $scope.selectedGroup.data.groups[group_index].members;

            if (members2.indexOf(uid) < 0) {
                members2.push(uid);
                updates[groupSetStr + 'groups/' + group_index + '/members'] = members2;
                updates[groupSetStr + 'groups/' + group_index + '/member_count'] = members2.length;
            }

            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('You are joined Successfully!');
            });
        }

        $scope.unjoin_group = function (groupSet_key, group_index) {
            $rootScope.setData('loadingfinished', false);
            var myanswer = firebase.database().ref('GroupAnswers').orderByChild('uid').equalTo(uid);
            myanswer.once('value', function (snapshot) {
                var answered = false;
                if (snapshot.val()) {
                    for (key in snapshot.val()) {
                        var answer = snapshot.val()[key];
                        if (answer.studentgroupkey == $rootScope.settings.groupKey && answer.subIndex == $rootScope.settings.subIndex
                            && answer.groupSetKey == $rootScope.settings.groupSet_key && answer.subSetKey == groupSet_key && answer.secondIndex == group_index) {
                            answered = true;
                        }
                    };
                }
                if (answered) {
                    $rootScope.warning("You already submitted answer in this second subgroup.");
                    $rootScope.setData('loadingfinished', true);
                    return;
                }
                var updates = {};

                var groupSetStr = 'Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $rootScope.settings.groupSetKey
                    + '/data/groups/' + $rootScope.settings.subIndex + '/subgroupsets/' + groupSet_key + '/';


                var members2 = $scope.selectedGroup.data.groups[group_index].members;


                members2.splice(members2.indexOf(uid), 1);
                updates[groupSetStr + 'groups/' + group_index + '/members'] = members2;
                updates[groupSetStr + 'groups/' + group_index + '/member_count'] = members2.length;

                var groups = $scope.selectedGroup.data.groups;
                var exist = false;
                groups.forEach(function (group) {
                    if (group.members.indexOf(uid) > -1) {
                        exist = true;
                    }
                });


                var members1 = $scope.selectedGroup.data.members;
                if (!exist) {
                    members1.splice(members1.indexOf(uid), 1);
                    updates[groupSetStr + 'members'] = members1;
                    updates[groupSetStr + 'member_count'] = members1.length;
                }

                firebase.database().ref().update(updates).then(function () {
                    $rootScope.success('You are unjoined Successfully!');
                    $rootScope.setData('loadingfinished', true);
                });

            });
        }


        $scope.secondGroup = function (obj, index) {
            let subGroups = [];
            $scope.selectedGroup.data.groups.forEach((group, index) => {
                let name = group.name ? group.name : $scope.selectedGroup.name + " " + (index + 1);
                subGroups.push(name);
            });
            $scope.secondIndex = index;
            if (obj.joined) {
                var teamName = obj.name;
                if (!teamName) {
                    teamName = $scope.selectedGroup.name + ' ' + (index + 1);
                }
                $rootScope.setData('secondIndex', index);
                $rootScope.setData('subSetKey', $scope.groupSetKey);
                $rootScope.setData('subGroupName', $scope.subGroupName + ' / ' + teamName);
                $rootScope.setData('questionSetKey2', undefined);
                $rootScope.setData('subGroups', subGroups);
                $state.go('studentSecondGroupDetail');
            }
        }
    }
})();