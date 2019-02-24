(function () {
    angular
        .module('myApp')
        .controller('groupRootController', groupRootController)

    groupRootController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function groupRootController($state, $scope, $rootScope, $filter) {
        // **************   router:    groupRoot  *****************


        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'teacherGroup');
        $rootScope.setData('selectedMenu', 'group');
        const ruleTitles = {
            after: 'By Complete',
            time: 'By Time',
            or: 'By Complete And Time',
            and: 'By Complete Or Time',
        }
        $scope.groupKey = $rootScope.settings.groupKey;
        $scope.pageSetting = $rootScope.settings.rootPageSetting;

        $scope.$on('$destroy', function () {
            if ($scope.groupsRef) $scope.groupsRef.off('value')
            if ($scope.linkRef) $scope.linkRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.setRef) $scope.setRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
            if ($scope.hideRef) $scope.hideRef.off('value')

            $('#releaseRuleModal').modal('hide');
            $('#deadLineModal').modal('hide');
            $('#reminderModal').modal('hide');
            $('#bulkReminderModal').modal('hide');
            $('#editGroupNameModal').modal('hide');
            $('#copyClassModal').modal('hide');
            $('#addModal').modal('hide');

            $rootScope.setData('groupType', 'group');
            $rootScope.setData('rootPageSetting', $scope.pageSetting);
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getGroups();
            $scope.getLinks();
            $scope.getStudentGroups();
            $scope.getQuestionSets();
            $scope.getQuestions();
            $scope.getHideState();
        }
        $scope.getGroups = function () {
            $scope.groupsRef = firebase.database().ref('Groups');
            $scope.groupsRef.on('value', function (snapshot) {
                $scope.groupNames = [];
                $scope.groupCodes = [];
                for (groupKey in snapshot.val()) {
                    let group = snapshot.val()[$scope.groupKey]
                    $scope.groupNames.push(group.groupname);
                    $scope.groupCodes.push(group.code);
                    if (groupKey == $scope.groupKey) {
                        $rootScope.setData('groupName', group.groupname);
                        $rootScope.setData('origin_groupKey', group.origin_groupKey);
                        group.sharedList = group.sharedList || {};
                        $scope.groupData = group;
                        if ($scope.groupData.groupsets) {
                            $scope.groupsets = $scope.groupData.groupsets;
                            for (key in $scope.groupsets) {
                                let groupSet = $scope.groupsets[key];
                                for (i = 0; i < groupSet.count; i++) {
                                    let group = groupSet.data.groups[i];
                                    group.name = group.name || groupSet.name + ' ' + (i + 1);
                                }
                                groupSet.locked = groupSet.locked || false;
                            }
                            let groupSetKey = $rootScope.settings.groupSetKey || Object.keys($scope.groupsets)[0];
                            $scope.selectGroupset(groupSetKey, $rootScope.settings.subIndex)
                            $scope.groupSet = $scope.groupsets[groupSetKey];
                        }
                    }
                }
                $scope.ref_1 = true;
                $scope.finalCalc();
            });
        }
        $scope.getLinks = function () {
            $scope.linkRef = firebase.database().ref('Links');
            $scope.linkRef.on('value', function (snapshot) {
                $scope.links = {};
                $scope.allLinks = snapshot.val() || {}
                for (key in $scope.allLinks) {
                    let link = $scope.allLinks[key];
                    if (link.groupKey == $scope.groupKey && link.groupType == undefined) {
                        if (link.linkType == 'set') {
                            $scope.links[link.setKey] = link;
                        } else {         //    link.linkType == 'question'
                            $scope.links[link.questionKey] = link;
                        }
                    }
                }
                $scope.ref_2 = true;
                $scope.finalCalc();
            });
        }
        $scope.getStudentGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (snapshot) {
                $scope.usersInGroup = [];
                if (snapshot.val()) {
                    for (userKey in snapshot.val()) {
                        if (Object.values(snapshot.val()[userKey]).indexOf($scope.groupKey) > -1) {
                            $scope.usersInGroup.push(userKey);
                        }
                    }
                }
                $scope.ref_3 = true;
                $scope.finalCalc();
            });
        };
        $scope.getQuestionSets = function () {
            $scope.setRef = firebase.database().ref('QuestionSets');
            $scope.setRef.on('value', function (snapshot) {
                $scope.allQuestionSets = snapshot.val() || {}
                $scope.ref_4 = true;
                $scope.finalCalc();
            });
        };
        $scope.getQuestions = function () {
            $scope.qstRef = firebase.database().ref('Questions');
            $scope.qstRef.on('value', function (snapshot) {
                $scope.allQuestions = {}
                if (snapshot.val()) {
                    for (key in snapshot.val()) {
                        let question = snapshot.val()[key];
                        if (question.teamRate) continue;
                        if (question.hideBy && question.hideBy != $rootScope.settings.teacherId) continue;
                        $scope.allQuestions[question.Set] = $scope.allQuestions[question.Set] || {}
                        $scope.allQuestions[question.Set][key] = question;
                    }
                }
                $scope.ref_5 = true;
                $scope.finalCalc();
            });
        };
        $scope.getHideState = function () {
            $scope.hideRef = firebase.database().ref('HiddenQuestions/' + $scope.groupKey);
            $scope.hideRef.on('value', function (snapshot) {
                $scope.allHideQuestions = snapshot.val() || {};
                $scope.ref_6 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4 || !$scope.ref_5 || !$scope.ref_6) return;
            $scope.QuestionSets = [];
            $scope.QuestionsByType = [];
            $scope.allQstForFinal = {}
            QUESTION_TYPES.forEach(type => {
                let item = {
                    key: type.replace(/ /g, '_'),
                    setname: type,
                    questions: [],
                    isExportAll: (type == 'Answer Type' || type == 'External Activity' || type == 'Likert Type') ? false : true,
                }
                $scope.QuestionsByType.push(item);
                $scope.pageSetting.expand[item.key] = $scope.pageSetting.expand[item.key] || false;
            });
            for (var key in $scope.groupData.sections) {
                let section = $scope.groupData.sections[key];
                // =====  item data========
                section.questions = [];
                // ------------------------
                $scope.QuestionSets.push(section);
            }
            for (var key in $scope.groupData.QuestionSets) {
                let set = $scope.groupData.QuestionSets[key]
                set.setname = $scope.allQuestionSets[key].setname;
                // =====  item data========
                set.questions = [];
                $scope.pageSetting.expand[set.key] = $scope.pageSetting.expand[set.key] || false;
                set.hideQuestions = $scope.allHideQuestions[set.key] || {}

                if (set.releaseRule) {
                    set.ruleTitle = ruleTitles[set.releaseRule.type];
                    set.ruleTooltip = 'Update Release Rule';
                } else {
                    set.ruleTitle = 'Add Rule';
                    set.ruleTooltip = 'Add Release Rule';
                }

                // ------------------------
                let setKey = set.siblingSetKey ? set.siblingSetKey : set.key
                let setQuestions = $filter('orderBy')(Object.values($scope.allQuestions[setKey] || {}), 'order');

                if (set.LikertType) {
                    set.code = setQuestions.length > 0 ? setQuestions[0].code : '';
                    var childData = {
                        code: set.code,
                        setname: set.setname,
                        Set: set.key,
                        question: '*************** likert QuestionSet ***************',
                        questionType: 'Likert Type',
                        siblingSetKey: set.siblingSetKey,
                        disabled: set.DisabledQuestions,
                    }
                    set.questions.push(childData);
                    $scope.QuestionsByType[QUESTION_TYPES.indexOf('Likert Type')].questions.push(childData);
                } else {
                    set.DisabledQuestions = set.DisabledQuestions || {}
                    setQuestions.forEach(question => {
                        if (question.questionType == 'Text Type' || question.questionType == 'Feedback Type') {
                            $scope.allQstForFinal[question.code] = angular.copy(question)
                        }
                        question.setname = set.setname;
                        question.disabled = Object.keys(set.DisabledQuestions).indexOf(question.code) > -1 ? true : false
                        question.hide = set.hideQuestions[question.code] ? true : false
                        $scope.QuestionsByType[QUESTION_TYPES.indexOf(question.questionType)].questions.push(question);
                    });
                    set.questions = setQuestions;
                }
                $scope.QuestionSets.push(set);
            }
            $scope.QuestionSets = $filter('orderBy')($scope.QuestionSets, 'order');
            var prevIndex = -1;
            $scope.QuestionSets.forEach((set, index) => {
                if (set.isSection) return;
                set.prevIndex = prevIndex;
                prevIndex = index;
            });
            $scope.sortChanged();
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }
        // ---------------------------------------------------------

        //  =========== expand all function =======================
        $scope.expandAll = function () {

            for (key in $scope.pageSetting.expand) {
                $scope.pageSetting.expand[key] = $scope.pageSetting.expandAll;
            }
            $scope.pageSetting.expandAll = !$scope.pageSetting.expandAll;
            $rootScope.safeApply();
        }
        // ===========sort change function=========================
        $scope.sortChanged = function () {
            $scope.items = $scope.pageSetting.sort ? $scope.QuestionSets : $scope.QuestionsByType;
            $rootScope.safeApply();
        }
        // $scope.showStateChanged = function () {
        //     if ($scope.pageSetting.show == 'set') {
        //         $scope.pageSetting.sort = true;
        //         $scope.sortChanged();
        //     }
        //     $rootScope.safeApply();
        // }
        $scope.toggleQuestions = function (item_key) {
            $scope.pageSetting.expand[item_key] = !$scope.pageSetting.expand[item_key];
            $scope.selectItem(item_key);
            $rootScope.safeApply();
        }
        $scope.selectItem = function (item_key) {
            if ($scope.pageSetting.sort) {
                if ($scope.pageSetting.setKey != item_key) {
                    $scope.pageSetting.setKey = item_key;
                    $scope.pageSetting.questionKey = undefined;
                }
            } else {
                if ($scope.pageSetting.itemKey != item_key) {
                    $scope.pageSetting.itemKey = item_key;
                    $scope.pageSetting.questionKey = undefined;
                }
            }
            $rootScope.safeApply();
        }
        $scope.selectQuestion = function (question) {
            let key = question.questionType == 'Likert Type' ? question.Set : question.code;
            $scope.pageSetting.questionKey = key;
            $scope.pageSetting.setKey = question.Set;
            $scope.pageSetting.itemKey = question.questionType.replace(/ /g, '_');
            $rootScope.safeApply();
        }
        $scope.getQstActive = function (item, question) {
            let key = question.questionType == 'Likert Type' ? question.Set : question.code;
            if ((item.key == $scope.pageSetting.setKey || item.key == $scope.pageSetting.itemKey) && key == $scope.pageSetting.questionKey) return 'active';
            return '';
        }
        // --------------------------------------------------------



        // ================== questionset Hidden state  function=================================
        $scope.changeHideState = function (set) {
            $scope.selectItem(set.key);
            var hidden = set.hidden ? {} : true
            firebase.database().ref('/Groups/' + $scope.groupKey + '/QuestionSets/' + set.key + '/hidden')
                .set(hidden).then(function () {
                    $rootScope.success("Questionset hide state changed successfully!")
                });
        }
        // -------------------------------------------------------------


        // =============================   release rule functions  ====================================

        $scope.showReleaseRuleModal = function (set) {
            $scope.selectItem(set.key);
            $scope.ruleSet = angular.copy(set)
            if (!$rootScope.teacherSettings.release_enabled && !$scope.ruleSet.releaseRule) {
                $rootScope.error("You haven't permission about add release rule. Please contact to administrator to enable it.")
                return
            }
            $scope.prevSet = set.prevIndex > -1 ? angular.copy($scope.QuestionSets[set.prevIndex]) : {}

            var defaultDate = moment().utc().format()
            if ($scope.ruleSet.releaseRule) {
                $scope.isRuleExist = true
                if ($scope.ruleSet.releaseRule.date) {
                    defaultDate = $scope.ruleSet.releaseRule.date
                } else {
                    $scope.ruleSet.releaseRule.date = defaultDate
                }
            } else {
                $scope.isRuleExist = false
                $scope.ruleSet.releaseRule = { type: 'after', date: defaultDate }
            }

            var datePickter = $('#releaseTimePicker')

            if (datePickter.data("DateTimePicker")) datePickter.data("DateTimePicker").destroy()

            datePickter.datetimepicker({
                date: defaultDate,
                ignoreReadonly: true
            });
            datePickter.on("dp.change", function (e) {
                // e.date=
                // _d: Date 2018-12-04T07:11:00.000Z
                // _f: "MM/DD/YYYY h:mm A"
                // _i: "11/13/2018 9:11 AM"
                $scope.ruleSet.releaseRule.date = moment(e.date).utc().format()
                $scope.deadline = moment(e.date).add(7, 'day').utc().format()
                if (datePickter1.data("DateTimePicker")) datePickter1.data("DateTimePicker").destroy()
                datePickter1.datetimepicker({
                    date: $scope.deadline,
                    ignoreReadonly: true
                });
            });

            if ($scope.ruleSet.deadline) {
                $scope.deadline = $scope.ruleSet.deadline
                $scope.isDeadlineExist = true
                $scope.setDeadline = true
            } else {
                $scope.deadline = moment(defaultDate).add(7, 'day').utc().format()
                $scope.isDeadlineExist = false
                $scope.setDeadline = false
            }
            var datePickter1 = $('#releaseTimePicker2')
            if (datePickter1.data("DateTimePicker")) datePickter1.data("DateTimePicker").destroy()
            datePickter1.datetimepicker({
                date: $scope.deadline,
                ignoreReadonly: true
            });

            datePickter1.on("dp.change", function (e) {
                // e.date=
                // _d: Date 2018-12-04T07:11:00.000Z
                // _f: "MM/DD/YYYY h:mm A"
                // _i: "11/13/2018 9:11 AM"
                $scope.deadline = moment(e.date).utc().format()
            });

            $scope.note = "This question set will be release when release condition is satisfied.";
            $scope.noteHidden = $scope.ruleSet.hidden ? "This question set is hidden set and release rule will be override hide setting." : undefined;
            $scope.notePrevHidden = $scope.prevSet.hidden ? "Previous question set is hidden set and you can set only time release rule in this question set." : undefined;
            $scope.noteFirst = $scope.ruleSet.prevIndex == -1 ? "This question set is first set in this group and you can set only time release rule to first question set." : undefined;
            if (!$rootScope.teacherSettings.release_enabled) {
                $scope.noteEnable = "You haven't permittion all of release rule. Please contact to administrator if you want to use release rule.";
                $scope.noteCombinedEnable = undefined;
            } else {
                $scope.noteEnable = undefined
                $scope.noteCombinedEnable = !$rootScope.teacherSettings.combinedRelease_enabled ? "You haven't permittion for combined rule. Please contact to administrator if you want to use combined rule." : undefined;
            }


            $('#releaseRuleModal').modal({ backdrop: 'static', keyboard: false });
            $rootScope.safeApply();
        }
        $scope.addRelaseRule = function () {
            if ($scope.isRuleExist) {
                if (!confirm("Are you sure want to update this rule?")) return
            } else {
                if (!confirm("Are you sure want to add this rule?")) return
            }

            if ($scope.ruleSet.releaseRule.type == 'after') {
                $scope.ruleSet.releaseRule.date = {}
            }
            var updates = {}
            updates['/releaseRule'] = $scope.ruleSet.releaseRule
            updates['/deadline'] = $scope.setDeadline ? $scope.deadline : {}
            if ($scope.setDeadline) {
                updates['/deadline'] = $scope.deadline
            } else {
                updates['/deadline'] = {}
                updates['/reminder'] = {}
            }
            firebase.database().ref('/Groups/' + $scope.groupKey + '/QuestionSets/' + $scope.ruleSet.key)
                .update(updates).then(function () {
                    if ($scope.isRuleExist) {
                        $rootScope.success("Release Rule updated successfully!")
                    } else {
                        $rootScope.success("Release Rule added successfully!")
                    }
                    $('#releaseRuleModal').modal('hide');
                });
        }
        $scope.removeRelaseRule = function () {
            if (!confirm("Are you sure want to remove this rule?")) return
            var updates = {}
            updates['/releaseRule'] = {}
            if ($scope.setDeadline && !$scope.ruleSet.hidden) {
                updates['/deadline'] = $scope.deadline
            } else {
                updates['/deadline'] = {}
                updates['/reminder'] = {}
            }
            firebase.database().ref('/Groups/' + $scope.groupKey + '/QuestionSets/' + $scope.ruleSet.key)
                .update(updates).then(function () {
                    $rootScope.success("Release Rule deleted successfully!")
                    $('#releaseRuleModal').modal('hide');
                });
        }
        $scope.getDisabled = function () {
            if (!$scope.ruleSet) return { after: true, time: true, or: true, and: true }
            if (!$rootScope.teacherSettings.release_enabled) return { after: true, time: true, or: true, and: true }
            if ($scope.ruleSet.prevIndex == -1 || $scope.prevSet.hidden) return { after: true, time: false, or: true, and: true }
            if ($rootScope.teacherSettings.combinedRelease_enabled) {
                return { after: false, time: false, or: false, and: false }
            } else {
                return { after: false, time: false, or: true, and: true }
            }
        }
        // ---------------------------------------------------------



        // =============================   deadline functions  ====================================

        $scope.showAddDeadlineModal = function (set) {
            $scope.selectItem(set.key);
            $scope.DeadlineSetName = set.setname
            $scope.DeadlineSetKey = set.key

            var defaultDate = moment().add(7, 'day').utc().format()
            if (set.releaseRule && set.releaseRule.date) {
                defaultDate = moment(set.releaseRule.date).add(7, 'day').format()
            }
            if (set.deadline) {
                $scope.isDeadlineExist = true
                $scope.setDeadline = true
                var defaultDate = set.deadline
            } else {
                $scope.isDeadlineExist = false
                $scope.setDeadline = false
                if (set.releaseRule && set.releaseRule.date) {
                    var defaultDate = moment(set.releaseRule.date).add(7, 'day').format()
                } else {
                    var defaultDate = moment().add(7, 'day').utc().format()
                }
            }
            $scope.deadline = defaultDate


            var datePickter = $('#releaseTimePicker1')
            if (datePickter.data("DateTimePicker")) datePickter.data("DateTimePicker").destroy()
            datePickter.datetimepicker({
                date: defaultDate,
                ignoreReadonly: true
            });
            datePickter.on("dp.change", function (e) {
                // e.date=
                // _d: Date 2018-12-04T07:11:00.000Z
                // _f: "MM/DD/YYYY h:mm A"
                // _i: "11/13/2018 9:11 AM"
                $scope.deadline = moment(e.date).utc().format()
            });
            $('#deadLineModal').modal({ backdrop: 'static', keyboard: false });
            $rootScope.safeApply();
        }

        $scope.updateDeadline = function () {
            if (!confirm("Are you sure want to update deadline setting?")) return
            var updates = {}
            if ($scope.setDeadline) {
                updates['/deadline'] = $scope.deadline
            } else {
                updates['/deadline'] = {}
                updates['/reminder'] = {}
            }
            firebase.database().ref('/Groups/' + $scope.groupKey + '/QuestionSets/' + $scope.DeadlineSetKey)
                .update(updates).then(function () {
                    $rootScope.success("Deadline updated successfully!")
                    $('#deadLineModal').modal('hide');
                });
        }
        // -------------------------------------------------------------



        // =============================   Reminder functions  ====================================

        $scope.showAddReminderModal = function (set) {
            $scope.selectItem(set.key);
            $scope.DeadlineSetName = set.setname
            $scope.DeadlineSetKey = set.key

            if (set.reminder) {
                $scope.isReminderExist = true
                $scope.reminder = angular.copy(set.reminder)
                $scope.reminder.day2 = $scope.reminder.day2 != undefined ? $scope.reminder.day2 : 7
                $scope.reminder.hour2 = $scope.reminder.hour2 != undefined ? $scope.reminder.hour2 : 0
            } else {
                $scope.isReminderExist = false
                $scope.reminder = { count: 2, day1: 3, hour1: 0, day2: 7, hour2: 0 }
            }

            $('#reminderModal').modal({ backdrop: 'static', keyboard: false });
            $rootScope.safeApply();
        }
        $scope.updateReminder = function () {
            if (!confirm("Are you sure want to save this setting?")) return
            var reminder = angular.copy($scope.reminder)
            $scope.reminder.day1 = reminder.day1 = getNumber(reminder.day1)
            $scope.reminder.hour1 = reminder.hour1 = getNumber(reminder.hour1)
            if (reminder.count == 1) {
                reminder.day2 = {}
                reminder.hour2 = {}
            } else {
                $scope.reminder.day2 = reminder.day2 = getNumber($scope.reminder.day2)
                $scope.reminder.hour2 = reminder.hour2 = getNumber($scope.reminder.hour2)
            }
            firebase.database().ref('/Groups/' + $scope.groupKey + '/QuestionSets/' + $scope.DeadlineSetKey + '/reminder')
                .set(reminder).then(function () {
                    $rootScope.success("Reminder setting saved successfully!")
                    $('#reminderModal').modal('hide');
                });
        }
        $scope.removeReminder = function () {
            if (!confirm("Are you sure want to remove reminder?")) return
            firebase.database().ref('/Groups/' + $scope.groupKey + '/QuestionSets/' + $scope.DeadlineSetKey + '/reminder')
                .set({}).then(function () {
                    $rootScope.success("Reminder deleted successfully!")
                    $('#reminderModal').modal('hide');
                });
        }
        // ------------------------------------------

        // ==================go to check complete set  ===============
        $scope.checkCompleteSet = function (set) {
            $scope.selectItem(set.key);
            $rootScope.setData('questionSet', set);
            $rootScope.setData('usersInGroup', $scope.usersInGroup);
            $scope.go('completeQuestionSet')
        }
        // -----------------------------------------------------------




        // *************************************************************************
        //                  Question related functions
        // *************************************************************************


        //================ question Hide state function========================
        $scope.setHideState = function (question) {
            $scope.selectQuestion(question);
            firebase.database().ref('HiddenQuestions/' + $scope.groupKey + '/' + question.Set + '/' + question.code).set(question.hide ? {} : true);
        }
        // --------------------------------------------------------------------------


        // ===============  export functions =============================
        $scope.exportQuestionDatas = function (obj, type) {
            $rootScope.setData('question', obj);
            $scope.selectQuestion(obj);
            if (type == 'Likert Type') {
                $state.go('exportLikertToExcel');
            } else if (type == 'Rating Type') {
                $state.go('exportRatingToExcel');
            } else {
                $state.go('exportToExcel');
            }
        }
        $scope.exportAllQuestionDatas = function (item) {
            // let item = angular.copy(itemData)
            // item.questions = itemData.questions.filter(ele => !ele.teamRate);
            $rootScope.setData('exportItem', item);
            switch (item.key) {
                case 'Rating_Type':
                    $state.go('ratingToExcelAll');
                    break;
                case 'Contingent_Type':
                    $state.go('contingentToExcelAll');
                    break;
                default:
                    $state.go('exportToExcelAll');
                    break;
            }
        }
        // ---------------------------------


        // ==========   response functions  ==============
        $scope.showResponse = function (question) {
            $rootScope.setData('question', question);
            $rootScope.setData('questionSetKey', question.Set);
            $scope.selectQuestion(question);
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

            // if ($scope.subIndex == 0) {             // group root

            // } else {                                // groupset, subgroupset

            //     var groupType = 'sub';
            //     if ($scope.secondIndex > 0) {
            //         groupType = 'second';
            //     }
            //     $rootScope.setData('groupType', groupType);
            //     $rootScope.setData('groupSetKey', $scope.groupsets[$scope.subIndex].key);
            //     $rootScope.setData('subSetKey', groupType == 'second' ? $scope.subGroupsets[$scope.secondIndex].key : undefined);
            //     $rootScope.setData('groupsets', $scope.groupRoot.groupsets[$scope.groupsets[$scope.subIndex].key]);

            //     // $rootScope.setData('setData', set);

            //     switch (question.questionType) {
            //         case 'Likert Type':
            //             $state.go('groupResponseOfLikertAnswer');
            //             break;
            //         case "Dropdown Type":
            //             $state.go('groupResponseOfDropdownAnswer');
            //             break;
            //         case "Multiple Type":
            //             $state.go('groupResponseOfMultipleAnswer');
            //             break;
            //         case "Contingent Type":
            //             $state.go('groupResponseOfContingentAnswer');
            //             break;
            //         case "Feedback Type":
            //             $state.go('groupResponseOfFeedbackAnswer');
            //             break;
            //         case "Rating Type":
            //             $state.go('groupResponseOfRatingAnswer');
            //             break;
            //         default:
            //             $state.go('groupResponseOfAnswer');
            //             break;
            //     }
            // }

        }
        // ---------------------------------------------------------------------


        //=================  disable/enable show result =================
        $scope.disableView = function (question) {
            $scope.selectQuestion(question);
            var disabled = question.disabled ? {} : true
            var disableRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey +
                '/QuestionSets/' + question.Set + '/DisabledQuestions/')
            if (question.questionType == 'Likert Type') {
                disableRef.set(disabled);
            } else {
                disableRef.child(question.code).set(disabled);
            }
            // if ($scope.subIndex > 0) {
            //     disableRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' +
            //         $scope.groupsets[$scope.subIndex].key +
            //         '/QuestionSets/' + index + '/DisabledQuestions/');
            //     if ($scope.secondIndex > 0) {
            //         disableRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' +
            //             $scope.groupsets[$scope.subIndex].key + '/subgroupsets/' + $scope.subGroupsets[$scope.secondIndex].key +
            //             '/QuestionSets/' + index + '/DisabledQuestions/');
            //     }
            // }

        }
        // -----------------------------------------------------------


        // ============link functions==================
        $scope.addLink = function (question) {
            $scope.selectQuestion(question);
            var link = {
                teacherId: $rootScope.settings.teacherId,
                groupKey: $scope.groupKey,
                setKey: question.Set,
                questionType: question.questionType,
                linkType: question.questionType == 'Likert Type' ? 'set' : 'question',
                questionKey: question.questionType == 'Likert Type' ? {} : question.code,
                key: $scope.getLinkCode(),

            };
            firebase.database().ref('Links/' + link.key).set(link);
        }
        $scope.copyToClipboard = function (question) {
            $scope.selectQuestion(question);
            let key = question.questionType == 'Likert Type' ? question.Set : question.code;
            let linkKey = $scope.links[key].key;
            linkKey = window.location.origin + '/directLink/' + linkKey;
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(str).select();
            document.execCommand("copy");
            $temp.remove();
        }
        $scope.deletelink = function (question) {
            $scope.selectQuestion(question);
            let key = question.questionType == 'Likert Type' ? question.Set : question.code;
            let linkKey = $scope.links[key].key;
            firebase.database().ref('Links/' + linkKey).set({});
        }
        $scope.getLinkCode = function () {
            var chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
            var new_id = '';
            do {
                new_id = '';
                for (var i = 0; i < 5; i++) {
                    new_id += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (Object.keys($scope.allLinks).indexOf(new_id) > -1);
            return new_id;
        }
        // --------------------------------------------------------------------------


        // ============give Score and goto upload external result functions==================
        $scope.isSetScoreType = function (question) {
            let scoreTypes = ['Feedback Type', 'Rating Type', 'Text Type']
            return scoreTypes.indexOf(question.questionType) > -1;
        }
        $scope.setScore = function (question) {
            $scope.selectQuestion(question);
            $rootScope.setData("question", question)
            switch (question.questionType) {
                case 'Feedback Type':
                    $state.go('teacherGiveFeedback');
                    break;
                case 'Rating Type':
                    $state.go('teacherRating');
                    break;
                case 'Text Type':
                    $state.go('teacherGiveScore');
                    break;
                case 'External Activity':
                    $state.go('teacherUploadExternal');
                    break;
            }
        }
        // ---------------------------------------------------------------
        // *************************************************************************





        // *************************************************************************
        //                  Groupset related functions
        // *************************************************************************

        // ======================  groupset functions  ==========================
        $scope.selectGroupset = function (groupSetKey, subIndex = undefined) {
            if ($scope.groupSetKey != groupSetKey) {
                $scope.groupSetKey = groupSetKey;
                $scope.groupSet = $scope.groupsets[groupSetKey];
                $scope.subIndex = subIndex || 0;
                $scope.groupSetRef = firebase.database().ref('Groups/' + $scope.groupKey + '/groupsets/' + groupSetKey)
                $rootScope.setData('groupSetKey', $scope.groupSetKey);
                $rootScope.setData('subIndex', $scope.subIndex);
                $rootScope.safeApply()
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

        $scope.selectGroup = function (index) {
            let subGroups = [];
            $scope.groupSet.data.groups.forEach((group, index) => {
                subGroups.push(group.name);
            });

            $scope.subIndex = index;
            $rootScope.setData('groupSetKey', $scope.groupSetKey);
            $rootScope.setData('subIndex', index);
            $rootScope.setData('subSetKey', undefined);
            $rootScope.setData('secondIndex', undefined);
            $rootScope.setData('subGroups', subGroups);
            $rootScope.setData('subPageSetting', DEFAULT_PAGE_SETTING);
            $state.go('groupSubRoot');
        }
        // ----------------------------------------------------------------------
        // *************************************************************************
        // *************************************************************************



        // *************************************************************************
        //                  Group related functions
        // *************************************************************************
        // ==============   update group name    =================================
        $scope.showEditGroupNameModal = function () {
            $scope.newGroupName = $scope.groupData.groupname;
            $rootScope.safeApply();
            $('#editGroupNameModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.updateGroupName = function () {
            $scope.newGroupName = ($scope.newGroupName || "").trim();
            if (!$scope.newGroupName) {
                $rootScope.error('Please input group name!');
                return;
            }
            if ($scope.newGroupName == $scope.groupData.groupname) {
                $rootScope.info("There isn't any change in group name!");
                return;
            }
            if ($scope.groupNames.indexOf($scope.newGroupName) > -1) {
                $rootScope.warning('This group name is exist already!');
                return;
            }
            firebase.database().ref('Groups/' + $scope.groupKey + '/groupname').set($scope.newGroupName).then(function () {
                $rootScope.success("Group name has been changed successfully!");
                $('#editGroupNameModal').modal('hide');
            });
        }
        //------------------------------------------------------------------------------

        // ===================  Edit copy group name functions  =========================

        $scope.showCopyClassModal = function () {
            $scope.newGroupName = $scope.groupData.groupname;
            $rootScope.safeApply();
            $('#copyClassModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.copyGroup = function () {
            $scope.newGroupName = ($scope.newGroupName || "").trim();
            if (!$scope.newGroupName) {
                $rootScope.warning('Please input new group name!');
                return;
            }
            if ($scope.groupNames.indexOf($scope.newGroupName) > -1) {
                $rootScope.warning('This group name is exist already!');
                return;
            }
            if (!confirm('Are you sure want to copy this group?')) {
                return;
            }

            let newGroup = angular.copy($scope.groupData)
            newGroup.groupname = $scope.newGroupName
            newGroup.code = $scope.getGroupCode();

            if (!newGroup.origin_groupKey) {
                newGroup.origin_groupKey = $scope.groupKey
                updates['Groups/' + $scope.groupKey + '/origin_groupKey'] = $scope.groupKey
            }

            for (setKey in newGroup.groupsets) {
                var setData = newGroup.groupsets[setKey].data
                setData.member_count = 0
                setData.members = {}
                for (var subIndex = 0; subIndex < setData.groups.length; subIndex++) {
                    var subGroupData = setData.groups[subIndex]
                    subGroupData.member_count = 0
                    subGroupData.members = {}
                    for (var subSetKey in subGroupData.subgroupsets) {
                        var subSetData = subGroupData.subgroupsets[subSetKey]
                        subSetData.member_count = 0
                        subSetData.members = {}
                        for (var secondIndex = 0; secondIndex < subSetData.groups.length; secondIndex++) {
                            var secondGroupData = subSetData.groups[secondIndex]
                            secondGroupData.member_count = 0
                            secondGroupData.members = {}
                        }
                    }
                }
            }

            firebase.database().ref('Groups').push(newGroup).then(function () {
                $rootScope.success('Group is copied successfully!')
                $('#copyClassModal').modal('hide');
                $rootScope.safeApply();
            });
        }
        $scope.getGroupCode = function () {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZ'.split('');
            var new_id = '';
            do {
                new_id = '';
                for (var i = 0; i < 4; i++) {
                    new_id += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (Object.keys($scope.groupCodes).indexOf(new_id) > -1);

            return new_id;
        }
        // ------------------------------------------------------------------------------------


        // ===================  add/remove shared teacher functions  =========================
        $scope.showAddModal = function () {
            $scope.email = undefined;
            $rootScope.safeApply();
            $('#addModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.addTeacher = function () {
            if (!$scope.email) {
                $rootScope.warning('Please type teacher email');
                return;
            }
            for (var teacherKey in $scope.sharedList) {
                if ($scope.email == $scope.sharedList[teacherKey].email) {
                    $rootScope.error('This teacher already added to current group.');
                    return;
                }
            }
            var teacheRef = firebase.database().ref('Users/').orderByChild('ID').equalTo($scope.email);
            teacheRef.once('value', function (snapshot) {
                var user = snapshot.val();
                if (!user) {
                    $rootScope.error('Unregistered Teacher!');
                    return;
                }

                for (var key in user) {
                    if (user[key].Usertype != 'Teacher') {
                        $rootScope.error('Unregistered Teacher!');
                        return;
                    } else {
                        var data = {
                            email: user[key].ID,
                            key: key,
                        }
                        var updates = {};
                        updates['Groups/' + $scope.groupKey + '/sharedList/' + key] = data;
                        updates['SharedList/' + key + '/' + $rootScope.settings.userId + '/' + $scope.groupKey] = $rootScope.settings.groupName;
                        $rootScope.setData('loadingfinished', false);
                        firebase.database().ref().update(updates).then(function () {
                            $rootScope.setData('loadingfinished', true);
                            $rootScope.success('New Teacher added successfully!');
                            $scope.showAddModal();
                        });
                    }
                }
            });
        }
        $scope.deleteTeacher = function (teacher) {
            if (!confirm("Are you sure want to delete this teacher from this group?")) return;
            var updates = {};
            updates['Groups/' + $scope.groupKey + '/sharedList/' + teacher.key] = {};
            updates['SharedList/' + teacher.key + '/' + $rootScope.settings.userId + '/' + $scope.groupKey] = {};
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Teacher deleted successfully!');
            });
        }
        // ---------------------------------------------------------------



        //============ export users, scores ================
        $scope.exportUsers = function () {
            if (!$rootScope.teacherSettings.exportUserList_enabled) {
                $rootScope.error("You have not permission about to export group user data. Please contact to administrator to enable permission.")
                return
            }
            $rootScope.setData('usersInGroup', $scope.usersInGroup)
            $state.go('exportGroupUsers')
        }
        $scope.exportScores = function () {
            $rootScope.setData('finalScoreQuestions', Object.keys($scope.groupData.finalScore || {}))
            $state.go('exportScores')
        }
        // -------------------------------------------

        // *************************************************************************


        $scope.getClass = function (selectedTab) {
            if ($scope.pageSetting.selectedTab == selectedTab) {
                return 'active';
            }
        }
        $scope.setActive = function (selectedTab) {
            $scope.pageSetting.selectedTab = selectedTab;
        }








        // ============================= Bulk  Reminder functions  ====================================

        $scope.showAddBulkReminderModal = function () {
            if ($scope.groupData.reminder) {
                $scope.isReminderExist = true
                $scope.reminder = angular.copy($scope.groupData.reminder)
                $scope.reminder.day2 = $scope.reminder.day2 != undefined ? $scope.reminder.day2 : 7
                $scope.reminder.hour2 = $scope.reminder.hour2 != undefined ? $scope.reminder.hour2 : 0
            } else {
                $scope.isReminderExist = false
                $scope.reminder = { count: 2, day1: 3, hour1: 0, day2: 7, hour2: 0 }
            }

            $('#bulkReminderModal').modal({ backdrop: 'static', keyboard: false });
            $rootScope.safeApply();
        }
        $scope.updateBulkReminder = function () {
            if (!confirm("Are you sure want to save this setting?")) return
            var reminder = angular.copy($scope.reminder)
            $scope.reminder.day1 = reminder.day1 = getNumber(reminder.day1)
            $scope.reminder.hour1 = reminder.hour1 = getNumber(reminder.hour1)
            if (reminder.count == 1) {
                reminder.day2 = {}
                reminder.hour2 = {}
            } else {
                $scope.reminder.day2 = reminder.day2 = getNumber($scope.reminder.day2)
                $scope.reminder.hour2 = reminder.hour2 = getNumber($scope.reminder.hour2)
            }
            firebase.database().ref('/Groups/' + $scope.groupKey + '/reminder')
                .set(reminder).then(function () {
                    $rootScope.success("Reminder setting saved successfully!")
                    $('#bulkReminderModal').modal('hide');
                });
        }
        $scope.removeBulkReminder = function () {
            if (!confirm("Are you sure want to remove bulk reminder?")) return
            firebase.database().ref('/Groups/' + $scope.groupKey + '/reminder')
                .set({}).then(function () {
                    $rootScope.success("Bulk Reminder deleted successfully!")
                    $('#bulkReminderModal').modal('hide');
                });
        }
        getNumber = function (num) {
            num = Number(num)
            if (isNaN(num)) num = 0
            num = Math.round(num)
            return num
        }




        // =============================   Create Final Score functions  ====================================

        $scope.showCreateFinalScoreModal = function (set) {
            $scope.finalScore = {}
            $scope.selectAll = true
            for (key in $scope.allQstForFinal) {
                if ($scope.groupData.finalScore && $scope.groupData.finalScore[key]) {
                    $scope.finalScore[key] = true
                } else {
                    $scope.selectAll = false
                }
            }
            $rootScope.safeApply()
            $('#createFinalScoreModal').modal({ backdrop: 'static', keyboard: false });
            $rootScope.safeApply();
        }
        $scope.toggleAll = function () {
            $scope.selectAll = !$scope.selectAll
            if ($scope.selectAll) {
                for (key in $scope.allQstForFinal) {
                    $scope.finalScore[key] = true
                }
            } else {
                $scope.finalScore = {}
            }
            $rootScope.safeApply()
        }
        $scope.toggle = function (key) {
            if ($scope.finalScore[key]) {
                delete $scope.finalScore[key]
            } else {
                $scope.finalScore[key] = true
            }
            $rootScope.safeApply()
        }
        $scope.saveFinalScore = function () {
            if (!confirm("Are you sure want to save this change?")) return
            firebase.database().ref('Groups/' + $scope.groupKey + '/finalScore').set($scope.finalScore).then(() => {
                $rootScope.success("Final Score saved successfully!")
                $('#createFinalScoreModal').modal('hide');
            })

        }
        $scope.removeFinalScore = function () {
            if (!confirm("Are you sure want to remove final score?")) return
            firebase.database().ref('Groups/' + $scope.groupKey + '/finalScore').set({}).then(() => {
                $scope.finalScore = {}
                $rootScope.success("Final Score removed successfully!")
                $('#createFinalScoreModal').modal('hide');
            })
        }


    }
})();