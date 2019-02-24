(function () {

    angular
        .module('myApp')
        .controller('directLinkController', directLinkController)

    directLinkController.$inject = ['$state', '$scope', '$rootScope', '$stateParams', '$filter', '$location'];

    function directLinkController($state, $scope, $rootScope, $stateParams, $filter, $location) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('selectedMenu', 'link');
        $rootScope.setData('backUrl', "myGroups");
        $rootScope.setData('linkKey', "");

        $scope.linkKey = '';
        if ($stateParams.linkKey) {
            $scope.linkKey = $stateParams.linkKey;
            $scope.hidden = true;
        }
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.linksRef) $scope.linksRef.off('value')
            if ($scope.linkRef) $scope.linkRef.off('value')
            if ($scope.linkStGroupsRef) $scope.linkStGroupsRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.qsetRef) $scope.qsetRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
            $('#choiceModal').modal('hide');
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getAllStudentGroups();
            $scope.getAllLinks();
        }
        $scope.getAllStudentGroups = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.stGroupRef = firebase.database().ref('StudentGroups/' + $rootScope.settings.userId);
            $scope.stGroupRef.on('value', function (snapshot) {
                $scope.studentGroups = Object.values(snapshot.val() || {});
                $scope.ref_1 = true;
                $scope.finalCalc();
            })
        }
        $scope.getAllLinks = function () {
            $scope.linksRef = firebase.database().ref('Links/').orderByKey();
            $scope.linksRef.on('value', function (snapshot) {
                $scope.allLinks = Object.values(snapshot.val() || {});
                $scope.ref_2 = true;
                $scope.finalCalc();
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return;
            $scope.myLinks = [];
            $scope.allLinks.forEach(link => {
                if ($scope.studentGroups.indexOf(link.groupKey) > -1) {
                    link.url = window.location.origin + '/directLink/' + link.key;
                    $scope.myLinks.push(link);
                }
            });
            $scope.myLinks.reverse();
            $rootScope.setData('loadingfinished', true);
        }


        $scope.init1 = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.linkRef = firebase.database().ref('Links/' + $scope.linkKey);
            $scope.linkRef.once('value', function (snapshot) {
                if (!snapshot.val()) {
                    $rootScope.error("Invalid link!");
                    $rootScope.setData('loadingfinished', true);
                    $scope.reloadPage();
                } else {
                    $scope.link = snapshot.val();
                    $scope.checkStudentInGroup();
                }
            });
        }
        $scope.reloadPage = function () {
            $state.go('directLink', { linkKey: null }, {
                reload: true, inherit: false, notify: true
            });
        }
        //get student group
        $scope.checkStudentInGroup = function () {
            $scope.linkStGroupsRef = firebase.database().ref('StudentGroups/' + $rootScope.settings.userId).orderByValue().equalTo($scope.link.groupKey);
            $scope.linkStGroupsRef.once('value', function (snapshot) {
                if (!snapshot.val()) {
                    $scope.joinType = 'group';
                    $rootScope.setData('loadingfinished', true);
                    $('#choiceModal').modal({ backdrop: 'static', keyboard: false });
                } else {
                    $scope.getGroup();
                }
            });
        };
        $scope.getGroup = function () {
            if ($scope.groupRef) $scope.groupRef.off('value')
            $scope.groupRef = firebase.database().ref('Groups/' + $scope.link.groupKey);
            $scope.groupRef.once('value', function (snapshot) {
                $scope.groupData = snapshot.val();
                $scope.groupsets = $scope.groupData.groupsets || {}

                $rootScope.setData('teacherId', $scope.link.teacherId);
                $rootScope.setData('groupKey', $scope.link.groupKey);
                $rootScope.setData('groupName', $scope.groupData.groupname);

                switch ($scope.link.groupType) {
                    case undefined:      // group
                        $scope.setData = $scope.groupData.QuestionSets[$scope.link.setKey];
                        $rootScope.setData('groupSetKey', undefined);
                        $rootScope.setData('subSetKey', undefined);
                        $rootScope.setData('selectedTab', 'QuestionSet');
                        $rootScope.setData('questionSetKey', $scope.setData.key);
                        $rootScope.setData('questionSetName', $scope.setData.setname);
                        $rootScope.setData('questionSet', $scope.setData);
                        $rootScope.setData('selectedMenu', 'groups');

                        if ($scope.setData.LikertType == true) {
                            $rootScope.setData('disabledQuestion', $scope.setData.DisabledQuestions);
                            if ($scope.qsetRef) $scope.qsetRef.off('value')
                            $scope.qsetRef = firebase.database().ref('QuestionSets/' + $rootScope.settings.questionSetKey);
                            $scope.qsetRef.once('value', function (snapshot) {
                                $rootScope.setData('setData', snapshot.val());
                                $rootScope.setData('loadingfinished', true);
                                $state.go('likertAnswer');
                            });
                        } else {
                            $scope.getAllQuestions();
                        }
                        break;
                    case 'sub':         //groupset
                        $scope.groupSetKey = $scope.link.groupSetKey;
                        $scope.selectedGroup = $scope.groupsets[$scope.link.groupSetKey];
                        $scope.selectedGroup.data.members = $scope.selectedGroup.data.members || []

                        $rootScope.setData('groupSetKey', $scope.groupSetKey);

                        if ($scope.selectedGroup.data.members.indexOf($rootScope.settings.userId) > -1) {
                            let subGroups = [];
                            $scope.selectedGroup.data.groups.forEach((group, index) => {
                                subGroups.push(group.name || $scope.selectedGroup.name + (index + 1));
                                group.members = group.members || []
                                if (group.members.indexOf($rootScope.settings.userId) > -1) {
                                    $scope.subIndex = index;
                                }
                            });

                            $scope.setData = {}
                            for (i = 0; i < $scope.selectedGroup.QuestionSets.length; i++) {
                                if ($scope.selectedGroup.QuestionSets[i].key == $scope.link.setKey) {
                                    $scope.setData = $scope.selectedGroup.QuestionSets[i];
                                    break;
                                }
                            }
                            $rootScope.setData('subIndex', $scope.subIndex);
                            $rootScope.setData('subSetKey', undefined);
                            $rootScope.setData('secondIndex', undefined);
                            $rootScope.setData('selectedTab', 'GroupSet');
                            $rootScope.setData('selectedTab1', 'QuestionSet');
                            $rootScope.setData('subGroups', subGroups);
                            $rootScope.setData('groupLikertSettings', $scope.groupData.groupLikertSettings || {});
                            $rootScope.setData('selectedMenu', 'subGroupDetail');

                            $rootScope.setData('questionSetKey1', $scope.setData.key);
                            $rootScope.setData('questionSetName', $scope.setData.setname);
                            $rootScope.setData('questionSet', $scope.setData);
                            $rootScope.setData('groupType', 'sub');

                            if ($scope.setData.LikertType == true) {

                                let groupLikertSettings = $scope.groupData.groupLikertSettings;
                                let showResponse = false;
                                if (groupLikertSettings.groupsets
                                    && groupLikertSettings.groupsets[$scope.link.groupSetKey]
                                    && groupLikertSettings.groupsets[$scope.link.groupSetKey][$scope.setData.key]) {
                                    showResponse = groupLikertSettings.groupsets[$scope.link.groupSetKey][$scope.setData.key].showResponse;
                                }
                                $rootScope.setData('showResponse', showResponse);
                                $rootScope.setData('disabledQuestion', $scope.setData.DisabledQuestions);
                                $state.go('groupLikertAnswer');
                                // if (!showResponse && $scope.setData.completed) {
                                //     $state.go('groupViewLikert');
                                // } else {
                                //     $state.go('groupLikertAnswer');
                                // }
                            } else {
                                $scope.getAllQuestions();
                            }

                        } else {
                            $scope.joinType = 'subgroup';
                            $rootScope.setData('loadingfinished', true);
                            $('#choiceModal').modal({ backdrop: 'static', keyboard: false });
                        }
                        break;
                    case 'second':
                        $scope.groupSetKey = $scope.link.groupSetKey;
                        $scope.selectedGroup = $scope.groupsets[$scope.link.groupSetKey];
                        $scope.subSetKey = $scope.link.subSetKey;
                        $scope.selectedGroup.data.members = $scope.selectedGroup.data.members || []

                        $rootScope.setData('groupSetKey', $scope.groupSetKey);

                        if ($scope.selectedGroup.data.members.indexOf($rootScope.settings.userId) > -1) {
                            $scope.selectedGroup.data.groups.forEach((group, index) => {
                                group.members = group.members || []
                                if (group.members.indexOf($rootScope.settings.userId) > -1) {
                                    $scope.subIndex = index;
                                }
                            });
                            $rootScope.setData('subIndex', $scope.subIndex);
                            $rootScope.setData('subSetKey', $scope.subSetKey);

                            $scope.selectedSubGroup = $scope.selectedGroup.data.groups[$scope.subIndex].subgroupsets[$scope.subSetKey];
                            $scope.selectedSubGroup.members = $scope.selectedSubGroup.members || []


                            if ($scope.selectedSubGroup.members.indexOf($rootScope.settings.userId) > -1) {
                                let subGroups = [];
                                $scope.selectedSubGroup.groups.forEach((group, index) => {
                                    subGroups.push(group.name || $scope.selectedGroup.subgroupsets[$scope.subSetKey].name + (index + 1));
                                    group.members = group.members || []
                                    if (group.members.indexOf($rootScope.settings.userId) > -1) {
                                        $scope.secondIndex = index;
                                    }
                                });
                                $scope.setData = {}
                                for (i = 0; i < $scope.selectedGroup.subgroupsets[$scope.subSetKey].QuestionSets.length; i++) {
                                    if ($scope.selectedGroup.subgroupsets[$scope.subSetKey].QuestionSets[i].key == $scope.link.setKey) {
                                        $scope.setData = $scope.selectedGroup.subgroupsets[$scope.subSetKey].QuestionSets[i];
                                        break;
                                    }
                                }

                                $rootScope.setData('secondIndex', $scope.secondIndex);
                                $rootScope.setData('selectedTab', 'GroupSet');
                                $rootScope.setData('selectedTab1', 'GroupSet');
                                $rootScope.setData('subGroups', subGroups);
                                $rootScope.setData('groupLikertSettings', $scope.groupData.groupLikertSettings || {});
                                $rootScope.setData('selectedMenu', 'secondGroupDetail');

                                $rootScope.setData('questionSetKey2', $scope.setData.key);
                                $rootScope.setData('questionSetName', $scope.setData.setname);
                                $rootScope.setData('questionSet', $scope.setData);
                                $rootScope.setData('groupType', 'second');

                                if ($scope.setData.LikertType == true) {

                                    let groupLikertSettings = $rootScope.settings.groupLikertSettings;
                                    let showResponse = false;
                                    if (groupLikertSettings.subgroupsets
                                        && groupLikertSettings.subgroupsets[$rootScope.settings.groupSetKey]
                                        && groupLikertSettings.subgroupsets[$rootScope.settings.groupSetKey][$rootScope.settings.subSetKey]
                                        && groupLikertSettings.subgroupsets[$rootScope.settings.groupSetKey][$rootScope.settings.subSetKey][$scope.setData.key]) {
                                        showResponse = groupLikertSettings.subgroupsets[$rootScope.settings.groupSetKey][$rootScope.settings.subSetKey][$scope.setData.key].showResponse;
                                    }
                                    $rootScope.setData('showResponse', showResponse);
                                    $rootScope.setData('disabledQuestion', $scope.setData.DisabledQuestions);
                                    $state.go('groupLikertAnswer');
                                    // if (!showResponse && $scope.setData.completed) {
                                    //     $state.go('groupViewLikert');
                                    // } else {
                                    //     $state.go('groupLikertAnswer');
                                    // }
                                } else {
                                    $scope.getAllQuestions();
                                }

                            } else {
                                $scope.joinType = 'secondgroup';
                                $rootScope.setData('loadingfinished', true);
                                $('#choiceModal').modal({ backdrop: 'static', keyboard: false });
                            }
                        } else {
                            $scope.joinType = 'subgroup';
                            $rootScope.setData('loadingfinished', true);
                            $('#choiceModal').modal({ backdrop: 'static', keyboard: false });
                        }
                        break;
                }

            });
        }
        $scope.getAllQuestions = function () {
            $scope.qstRef = firebase.database().ref('Questions/').orderByChild("Set").equalTo($scope.setData.key)
            $scope.qstRef.once('value', function (snapshot) {
                $scope.questions = [];
                snapshot.forEach(function (childSnapshot) {
                    var question = childSnapshot.val();
                    question.key = childSnapshot.key;
                    $scope.questions.push(question);
                });
                $scope.questions = $filter('orderBy')($scope.questions, 'order');

                $scope.questionIndex = 0;
                var i = 0;
                $scope.questions.forEach(question => {
                    if (question.key == $scope.link.questionKey) {
                        $scope.questionIndex = i;
                    }
                    i++;
                });
                $scope.goSubmitAnswer()
            });
        }

        $scope.goSubmitAnswer = function () {
            var obj = $scope.questions[$scope.questionIndex];
            $rootScope.setData('questionsInSet', $scope.questions);
            $rootScope.setData('currentIndex', $scope.questionIndex);
            if ($scope.link.groupType == undefined) {
                var myanswer = firebase.database().ref('NewAnswers/' + obj.key + '/answer/' + $rootScope.settings.userId);
                myanswer.once('value', function (snapshot) {
                    if (snapshot.val()) {
                        $rootScope.setData('prevAnswer', snapshot.val()['answer']);
                        $rootScope.setData('prevAnswerVal', snapshot.val()['answerval']);
                    } else {
                        $rootScope.setData('prevAnswer', '');
                    }

                    // check if disabled question
                    var set = $rootScope.settings.questionSet;
                    var disabled = false;
                    if ($scope.setData.DisabledQuestions) {
                        if ($scope.setData.DisabledQuestions[obj.key]) {
                            disabled = true;
                        }
                    }
                    $rootScope.setData('disabledQuestion', disabled);
                    $rootScope.setData('questionKey', obj.key);
                    $rootScope.setData('questionString', obj.question);
                    $rootScope.setData('questionObj', obj);
                    $rootScope.setData('questionType', obj.questionType);

                    $rootScope.setData('loadingfinished', true);
                    switch (obj.questionType) {
                        case 'Feedback Type':  //Feedbacktype
                            $rootScope.setData('qtype', obj.type);
                            $rootScope.setData('feedqts', obj.feedqts);
                            $rootScope.setData('listType', obj.listType);
                            $rootScope.setData('selfRate', obj.selfRate);
                            $state.go('feedbackAnswer');
                            break;
                        case 'Rating Type':
                            $rootScope.setData('ratingType', obj.ratingtype);
                            $rootScope.setData('ratingItems', obj.ratingItems);
                            $rootScope.setData('ratingOptions', obj.ratingOptions);
                            $rootScope.setData('shareRate', obj.shareRate);
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
                        case 'Answer Type':
                            $state.go('answer');
                            break;
                    }
                });
            } else {
                var myanswerRef = firebase.database().ref('GroupAnswers').orderByChild('uid').equalTo($rootScope.settings.userId);
                if (obj.questionType == 'Feedback Type') {
                    obj.groupFeedback = obj.groupFeedback ? obj.groupFeedback : 'team';
                }
                if (obj.groupFeedback == 'group') {
                    myanswerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo(obj.key);
                }
                myanswerRef.once('value', function (snapshot) {
                    $rootScope.setData('prevAnswer', undefined);
                    if (snapshot.val()) {
                        for (key in snapshot.val()) {
                            var answer = snapshot.val()[key];
                            if (answer.groupType != $scope.link.groupType || answer.questionKey != obj.key || answer.studentgroupkey != $rootScope.settings.groupKey
                                || answer.groupSetKey != $scope.link.groupSetKey || answer.subIndex != $rootScope.settings.subIndex) continue;
                            if ($scope.link.groupType == 'second') {
                                if (answer.subSetKey != $scope.link.subSetKey || answer.secondIndex != $rootScope.settings.secondIndex) continue;
                            }
                            $rootScope.setData('prevAnswer', answer['answer']);
                            $rootScope.setData('prevAnswerVal', answer['answerval']);
                            break;
                        };
                    }


                    // check if disabled question                
                    var disabled = false;
                    if ($scope.setData.DisabledQuestions && $scope.setData.DisabledQuestions[obj.key]) {
                        disabled = true;
                    }

                    $rootScope.setData('disabledQuestion', disabled);
                    $rootScope.setData('questionKey', obj.key);
                    $rootScope.setData('questionString', obj.question);
                    $rootScope.setData('questionType', obj.questionType);
                    $rootScope.setData('questionObj', obj);
                    $rootScope.setData('loadingfinished', true);

                    switch (obj.questionType) {
                        case 'Feedback Type':  //Feedbacktype
                            $rootScope.setData('qtype', obj.type);
                            $rootScope.setData('feedqts', obj.feedqts);
                            $rootScope.setData('listType', obj.listType);
                            $rootScope.setData('selfRate', obj.selfRate);

                            $state.go('groupFeedbackAnswer');
                            break;
                        case 'Rating Type':
                            $state.go('groupRatingAnswer');
                            break;
                        case 'Digit Type':
                            $state.go('groupDigitAnswer');
                            break;
                        case 'Text Type':
                            $state.go('groupTextAnswer');
                            break;
                        case 'Dropdown Type':
                            $state.go('groupDropdownAnswer');
                            break;
                        case 'Slide Type':
                            $state.go('groupSlideAnswer');
                            break;
                        case 'Multiple Type':
                            $state.go('groupMultipleAnswer');
                            break;
                        case 'Contingent Type':
                            $state.go('groupContingentAnswer');
                            break;
                    }
                });
            }
        }

        $scope.joinSubGroup = function () {
            $rootScope.setData('selectedTab', 'GroupSet');
            $rootScope.setData('selectedMenu', 'groups');
            $rootScope.go('studentGroupDetail');
        }
        $scope.joinSecondGroup = function () {
            $rootScope.setData('selectedTab', 'GroupSet');
            $rootScope.setData('selectedTab1', 'GroupSet');
            $rootScope.setData('selectedMenu', 'subGroupDetail');
            $rootScope.go('studentSubGroupDetail');
        }
    }
})();