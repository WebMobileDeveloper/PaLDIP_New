(function () {
    angular
        .module('myApp')
        .controller('studentGroupDetailController', studentGroupDetailController)

    studentGroupDetailController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function studentGroupDetailController($state, $scope, $rootScope, $filter) {

        if ($rootScope.settings.groupKey == undefined) {
            $rootScope.warning('You need to select group at first');
            $state.go('myGroups');
            return;
        }

        var uid = $rootScope.settings.userId;
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'myGroups');
        $rootScope.setData('selectedMenu', 'groupDetail');
        $rootScope.safeApply()

        $scope.$on("$destroy", function () {
            if ($scope.hideRef) $scope.hideRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.qstRefArr) {
                $scope.qstRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
            if ($scope.qsetNameRefArr) {
                $scope.qsetNameRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
            $('#searchQuestionModal').modal('hide');
        });
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getHideState();
        }
        $scope.getHideState = function () {
            $scope.hideRef = firebase.database().ref('HiddenQuestions/' + $rootScope.settings.groupKey);
            $scope.hideRef.on('value', function (snapshot) {
                $scope.hides = snapshot.val() || {};
                $scope.getGroupSets();
            });
        }
        $scope.getGroupSets = function () {
            if ($scope.groupRef) $scope.groupRef.off('value')
            $scope.groupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey);
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groupData = snapshot.val();
                $scope.enableFirstQuestion = $scope.groupData.enableFirstQuestion;
                if ($scope.enableFirstQuestion) {
                    $scope.requireFirstAnswer = undefined;
                } else {
                    $scope.requireFirstAnswer = false;
                }

                var QuestionSets = [];
                $scope.groupData.QuestionSets = $scope.groupData.QuestionSets || {}
                $scope.groupData.sections = $scope.groupData.sections || {}
                for (var key in $scope.groupData.QuestionSets) {
                    var set = $scope.groupData.QuestionSets[key]
                    if (set.hidden && !set.releaseRule) continue;
                    $scope.hides[key] = $scope.hides[key] || {}
                    set.deadlineString = set.deadline ? moment(set.deadline).format("MM/DD/YYYY h:mm A") : ''
                    QuestionSets.push(set);
                }

                $scope.groupData.sections
                for (var key in $scope.groupData.sections) {
                    QuestionSets.push($scope.groupData.sections[key]);
                }
                QuestionSets = $filter('orderBy')(QuestionSets, 'order');

                var prevIndex = -1;
                for (var i = 0; i < QuestionSets.length; i++) {
                    if (!QuestionSets[i].isSection) {
                        QuestionSets[i].prevIndex = prevIndex
                        prevIndex = i
                    }
                }

                $scope.groupData.QuestionSets = QuestionSets;
                // ============get completed state======================== 
                if ($scope.qstRefArr) {
                    $scope.qstRefArr.forEach(ref => {
                        ref.off('value')
                    });
                }
                $scope.qstRefArr = []

                if ($scope.qsetNameRefArr) {
                    $scope.qsetNameRefArr.forEach(ref => {
                        ref.off('value')
                    });
                }
                $scope.qsetNameRefArr = []

                $scope.groupData.QuestionSets.forEach(obj => {
                    // get questions
                    if (obj.isSection) return
                    let setKey = obj.siblingSetKey ? obj.siblingSetKey : obj.key
                    let qstRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo(setKey);
                    $scope.qstRefArr.push(qstRef)
                    qstRef.on('value', function (qstSnapshot) {
                        var completed = true;
                        var questions = [];
                        for (questionKey in qstSnapshot.val()) {
                            var question = qstSnapshot.val()[questionKey];
                            if (question.hideBy || question.questionType == 'Answer Type' || $scope.hides[obj.key][questionKey]) continue;
                            question.key = questionKey;
                            questions.push(question);
                        }

                        questions = $filter('orderBy')(questions, 'order');
                        obj.questions = angular.copy(questions)

                        var questionCount = questions.length;
                        var calcCount = 0;
                        questions.forEach(function (question) {
                            questionKey = question.key;
                            var ansRef = undefined;
                            if (obj.LikertType == true) {
                                ansRef = firebase.database().ref('LikertAnswer/' + obj.key + '/' + uid + '/answer/' + questionKey);
                            } else {
                                ansRef = firebase.database().ref('NewAnswers/' + questionKey + '/answer/' + uid);
                            }
                            ansRef.once('value', function (ans) {
                                calcCount++;
                                if (ans.val() == undefined) {
                                    completed = false;
                                }

                                if ($scope.requireFirstAnswer == undefined) {
                                    $scope.requireFirstAnswer = !completed;
                                    if ($scope.requireFirstAnswer) {
                                        $scope.goSubmitAnswer(obj, 0);
                                        return;
                                    }
                                    $rootScope.safeApply();
                                }

                                if (calcCount == questionCount) {
                                    obj.completed = completed;
                                    $rootScope.safeApply();
                                }
                            });
                        });
                        if (questionCount == 0) {
                            obj.completed = true;
                            $rootScope.safeApply();
                        }
                    });

                    let qsetNameRef = firebase.database().ref("QuestionSets/" + obj.key + '/setname')
                    $scope.qsetNameRefArr.push(qsetNameRef)
                    qsetNameRef.on('value', snapshot => {
                        obj.setname = snapshot.val()
                        $rootScope.safeApply()
                    })

                });

                if ($scope.groupData.groupsets) {
                    $scope.groupsets = $scope.groupData.groupsets;
                    for (var key in $scope.groupsets) {
                        var groupset = $scope.groupsets[key];
                        var data = groupset.data;
                        if (!data.members) data.members = [];
                        if (data.members.indexOf(uid) > -1) data.joined = true;
                        data.joinable = true;
                        if (groupset.locked || (groupset.exclusive && data.joined)) {
                            data.joinable = false;
                        }

                        groupset.key = key;

                        for (var i = 0; i < groupset.count; i++) {
                            var group = data.groups[i];
                            group.name = group.name ? group.name : groupset.name + ' ' + (i + 1);
                            if (!group.members) group.members = [];
                            if (group.members.indexOf(uid) > -1) group.joined = true;
                            group.joinable = false;
                            if (data.joinable && !group.joined) group.joinable = true;
                        }
                    }

                }
                if (!$scope.selectedTab) $scope.selectedTab = $rootScope.settings.selectedTab;
                if (!$scope.groupSetKey) $scope.groupSetKey = $rootScope.settings.groupSetKey;

                if (!$scope.subIndex) $scope.subIndex = $rootScope.settings.subIndex;
                if ($scope.groupsets) {
                    if (!$scope.groupSetKey) {
                        $scope.groupSetKey = Object.keys($scope.groupsets)[0];
                        $scope.subIndex = 0;
                    }
                    $scope.selectedGroup = $scope.groupsets[$scope.groupSetKey];
                }

                // ============end get completed state======================== 
                $rootScope.setData('loadingfinished', true);

            });
        }
        $scope.goSubmitAnswer = function (set, qstIndex) {
            var question = set.questions[qstIndex]
            $rootScope.setData('questionSetKey', set.key);
            $rootScope.setData('questionSetName', set.setname);
            $rootScope.setData('questionSet', set);
            if (set.LikertType == true) {
                var siblingSetKeys = [set.key]
                if (set.siblingSetKey) {
                    $scope.groupData.QuestionSets.forEach(obj => {
                        if (obj.siblingSetKey == set.siblingSetKey && set.key != obj.key) {
                            siblingSetKeys.push(obj.key)
                        }
                    });
                }
                $rootScope.setData('siblingSetKeys', siblingSetKeys)
                $rootScope.setData('disabledQuestion', set.DisabledQuestions);
                $state.go('likertAnswer');
            } else {
                $rootScope.setData('showMenubar', true);
                $rootScope.setData('questionsInSet', set.questions);
                $rootScope.setData('currentIndex', qstIndex);
                var myanswer = firebase.database().ref('NewAnswers/' + question.key + '/answer/' + $rootScope.settings.userId);
                myanswer.once('value', function (snapshot) {
                    if (snapshot.val()) {
                        $rootScope.setData('prevAnswer', snapshot.val()['answer']);
                        $rootScope.setData('prevAnswerVal', snapshot.val()['answerval']);
                    } else {
                        $rootScope.setData('prevAnswer', '');
                    }

                    // check if disabled question
                    var disabled = false;
                    if (set.DisabledQuestions) {
                        if (set.DisabledQuestions[question.key]) {
                            disabled = true;
                        }
                    }
                    $rootScope.setData('disabledQuestion', disabled);
                    $rootScope.setData('questionKey', question.key);
                    $rootScope.setData('questionString', question.question);
                    $rootScope.setData('questionObj', question);
                    $rootScope.setData('questionType', question.questionType);
                    $rootScope.setData('backUrl', "studentGroupDetail");
                    switch (question.questionType) {
                        case 'Feedback Type':  //Feedbacktype
                            $rootScope.setData('qtype', question.type);
                            $rootScope.setData('feedqts', question.feedqts);
                            $rootScope.setData('listType', question.listType);
                            $rootScope.setData('selfRate', question.selfRate);
                            $state.go('feedbackAnswer');
                            break;
                        case 'Rating Type':
                            $rootScope.setData('ratingType', question.ratingtype);
                            $rootScope.setData('ratingItems', question.ratingItems);
                            $rootScope.setData('ratingOptions', question.ratingOptions);
                            $rootScope.setData('shareRate', question.shareRate);
                            $state.go('ratingAnswer');
                            break;
                        case 'Digit Type':
                            $state.go('digitAnswer');
                            break;
                        case 'Text Type':
                            $state.go('textAnswer');
                            break;
                        case 'Dropdown Type':
                            $state.go('dropdownAnswer');
                            break;
                        case 'Contingent Type':
                            $state.go('contingentAnswer');
                            break;
                        case 'Slide Type':
                            $state.go('slideAnswer');
                            break;
                        case 'Multiple Type':
                            $state.go('multipleAnswer');
                            break;
                    }
                });
            }
        }


        $scope.questions = function (set) {
            if (set.isSection) return;
            switch ($scope.isLocked(set)) {
                case 'after-locked':
                    $rootScope.warning('Locked Questionset. This set will be unlock when previous set is completed.')
                    return
                case 'time-locked':
                    $rootScope.warning('Locked Questionset. This set will be unlock after release time.')
                    return
                case 'or-locked':
                    $rootScope.warning('Locked Questionset. This set will be unlock when previous set is completed or after release time.')
                    return
                case 'and-locked':
                    $rootScope.warning('Locked Questionset. This set will be unlock when previous set is completed and after release time.')
                    return
            }
            $rootScope.setData('questionSetKey', set.key);
            $rootScope.setData('questionSetName', set.setname);
            $rootScope.setData('questionSet', set);
            if (set.LikertType == true) {
                var siblingSetKeys = [set.key]
                if (set.siblingSetKey) {
                    $scope.groupData.QuestionSets.forEach(obj => {
                        if (obj.siblingSetKey == set.siblingSetKey && set.key != obj.key) {
                            siblingSetKeys.push(obj.key)
                        }
                    });
                }
                let showResponse = false;
                if ($scope.groupData.groupLikertSettings && $scope.groupData.groupLikertSettings.group && $scope.groupData.groupLikertSettings.group[set.key]) {
                    showResponse = $scope.groupData.groupLikertSettings.group[set.key].showResponse;
                }
                $rootScope.setData('siblingSetKeys', siblingSetKeys)
                $rootScope.setData('disabledQuestion', set.DisabledQuestions);
                $rootScope.setData('showResponse', showResponse);
                if (!showResponse && set.completed) {
                    $state.go('viewLikert');
                } else {
                    $state.go('likertAnswer');
                }
            } else {
                $state.go('questions');
            }
        }
        $scope.getQstClass = function (obj) {
            if (obj.isSection) {
                return 'section';
            } else if ($rootScope.settings.questionSetKey == obj.key) {
                return 'active';
            } else {
                return $scope.isLocked(obj)
            }
        }
        $scope.isLocked = function (currSet) {
            if (!currSet.releaseRule) return ''
            var prevSet = $scope.groupData.QuestionSets[currSet.prevIndex] || {}
            var timeCond = moment(currSet.releaseRule.date).isBefore(moment())
            var released = true
            switch (currSet.releaseRule.type) {
                case 'after':
                    released = prevSet.completed
                    break;
                case 'time':
                    released = timeCond
                    break;
                case 'or':
                    released = prevSet.completed || timeCond
                    break;
                case 'and':
                    released = prevSet.completed && timeCond
                    break;
            }
            if (released) {
                return ''
            } else {
                return currSet.releaseRule.type + '-locked'
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
        $scope.selectGroup = function (groupSetKey) {
            if ($scope.groupSetKey != groupSetKey) {
                $scope.groupSetKey = groupSetKey;
                $scope.selectedGroup = $scope.groupData.groupsets[groupSetKey];
                $scope.subIndex = 0;
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
        $scope.subGroup = function (obj, index) {
            let subGroups = [];
            $scope.selectedGroup.data.groups.forEach((group, index) => {
                subGroups.push(group.name);
            });
            $scope.subIndex = index;
            if (obj.joined) {
                $rootScope.setData('groupSetKey', $scope.groupSetKey);
                $rootScope.setData('subIndex', index);
                $rootScope.setData('subSetKey', undefined);
                $rootScope.setData('secondIndex', undefined);
                $rootScope.setData('selectedTab1', 'QuestionSet');
                $rootScope.setData('questionSetKey1', undefined);
                $rootScope.setData('subGroups', subGroups);
                $rootScope.setData('groupLikertSettings', $scope.groupData.groupLikertSettings || {});
                $state.go('studentSubGroupDetail');
            }
        }

        $scope.join_group = function (groupSet_key, group_index) {
            var updates = {};
            var members1 = $scope.selectedGroup.data.members;
            var groupSetStr = 'Groups/' + $rootScope.settings.groupKey + '/groupsets/' + groupSet_key + '/data/';

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
            var subgroup = $scope.selectedGroup.data.groups[group_index];
            if (subgroup.subgroupsets) {
                for (key in subgroup.subgroupsets) {
                    var subset = subgroup.subgroupsets[key];
                    if (subset.members && subset.members.indexOf(uid) > -1) {
                        $rootScope.warning("You need to unjoin from all of subgroups at first.");
                        $rootScope.setData('loadingfinished', true);
                        return;
                    }
                }
            }

            $rootScope.setData('loadingfinished', false);
            var myanswer = firebase.database().ref('GroupAnswers').orderByChild('uid').equalTo(uid);
            myanswer.once('value', function (snapshot) {
                var answered = false;
                if (snapshot.val()) {
                    for (key in snapshot.val()) {
                        var answer = snapshot.val()[key];
                        if (answer.studentgroupkey == $rootScope.settings.groupKey && answer.subIndex == group_index
                            && answer.groupSetKey == groupSet_key) {
                            answered = true;
                        }
                    };
                }
                if (answered) {
                    $rootScope.warning("You already submitted answer in this subgroup.");
                    $rootScope.setData('loadingfinished', true);
                    return;
                }

                var updates = {};

                var groupSetStr = 'Groups/' + $rootScope.settings.groupKey + '/groupsets/' + groupSet_key + '/data/';
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

        $scope.showSearchCodeModal = function () {
            $scope.searchCode = ""
            $scope.selectedIndex = undefined
            $scope.searchList = []

            $('#searchQuestionModal').modal({ backdrop: 'static', keyboard: false });
            $('#searchQuestionModal').on('shown.bs.modal', function () {
                $('#searchCode').focus();
            })
        }
        $scope.searchQuestion = function () {
            $scope.selectedIndex = undefined
            $scope.searchList = []
            $scope.searchCode = $scope.searchCode.trim()
            $rootScope.safeApply()
            if ($scope.searchCode.length != 5) return
            for (setIndex in $scope.groupData.QuestionSets) {
                var set = $scope.groupData.QuestionSets[setIndex]
                if (set.isSection || !set.questions) continue
                if (set.LikertType) {
                    if (set.questions.length > 0 && set.questions[0].code == $scope.searchCode) {
                        $scope.searchList.push({
                            set: set,
                            questionIndex: 0
                        })
                    }
                } else {
                    for (qstIndex in set.questions) {
                        if (set.questions[qstIndex].code == $scope.searchCode) {
                            $scope.searchList.push({
                                set: angular.copy(set),
                                questionIndex: qstIndex
                            })
                            break;
                        }
                    }
                }

            }
            if ($scope.searchList.length > 0) {
                $scope.selectedIndex = 0
            }
        }
        $scope.changeSelect = function (index) {
            $scope.selectedIndex = index
            $rootScope.safeApply()
        }
        $scope.gotoAnswer = function () {
            if ($scope.selectedIndex == undefined) {
                $rootScope.error("There isn't any matched question!")
                return
            }
            let set = $scope.searchList[$scope.selectedIndex].set
            let questionIndex = $scope.searchList[$scope.selectedIndex].questionIndex
            switch ($scope.isLocked(set)) {
                case 'after-locked':
                    $rootScope.warning('Locked Questionset. This set will be unlock when previous set is completed.')
                    return
                case 'time-locked':
                    $rootScope.warning('Locked Questionset. This set will be unlock after release time.')
                    return
                case 'or-locked':
                    $rootScope.warning('Locked Questionset. This set will be unlock when previous set is completed or after release time.')
                    return
                case 'and-locked':
                    $rootScope.warning('Locked Questionset. This set will be unlock when previous set is completed and after release time.')
                    return
            }
            $scope.goSubmitAnswer(set, questionIndex)
        }
    }
})();