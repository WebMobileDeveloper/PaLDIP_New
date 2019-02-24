(function () {
    angular
        .module('myApp')
        .controller('teacherLinkGroupDetailController', teacherLinkGroupDetailController)

    teacherLinkGroupDetailController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherLinkGroupDetailController($state, $scope, $rootScope, $filter) {

        if ($rootScope.settings.groupKey == undefined) {
            $rootScope.warning('You need to select group at first');
            $state.go('teacherGroup');
            return;
        }
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'choiceGroupAction');
        $rootScope.setData('selectedMenu', 'group');


        $scope.$on('$destroy', function () {
            if ($scope.linkRef) $scope.linkRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
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
            $('#releaseRuleModal').modal('hide');
            $('#deadLineModal').modal('hide');
            $('#reminderModal').modal('hide');
            $('#bulkReminderModal').modal('hide');
        })


        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getLinks();
            $scope.getStudentGroups();
            $scope.getGroupSets();
        }
        $scope.getLinks = function () {
            $scope.linkRef = firebase.database().ref('Links');
            $scope.linkRef.on('value', function (snapshot) {
                $scope.links = {};
                $scope.allLinks = snapshot.val() || {}
                for (key in $scope.allLinks) {
                    let link = $scope.allLinks[key];
                    if (link.groupKey == $rootScope.settings.groupKey && link.linkType == 'set' && link.groupType == undefined) {
                        $scope.links[link.setKey] = link;
                    }
                }
            });
        }
        $scope.getStudentGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (snapshot) {
                $scope.usersInGroup = [];
                if (snapshot.val()) {
                    for (userKey in snapshot.val()) {
                        if (Object.values(snapshot.val()[userKey]).indexOf($rootScope.settings.groupKey) > -1) {
                            $scope.usersInGroup.push(userKey);
                        }
                    }
                }
                $rootScope.safeApply();
            });
        };
        $scope.getGroupSets = function () {
            $scope.groupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey);
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groupData = snapshot.val();
                var QuestionSets = [];
                for (var key in $scope.groupData.sections) {
                    QuestionSets.push($scope.groupData.sections[key]);
                }
                if ($scope.groupData.QuestionSets) {
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
                    $scope.allQstForFinal = {}
                    for (var key in $scope.groupData.QuestionSets) {
                        let set = $scope.groupData.QuestionSets[key]
                        set.setname = ""

                        let setKey = set.siblingSetKey ? set.siblingSetKey : set.key
                        var qstRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo(setKey)
                        $scope.qstRefArr.push(qstRef)
                        qstRef.on('value', snapshot => {
                            let allQuestions = snapshot.val() || {}
                            if (set.LikertType) {
                                let Questions = Object.values(allQuestions).map(question => question)
                                Questions = $filter('orderBy')(Questions, 'order');
                                set.code = Questions.length > 0 ? Questions[0].code : ''
                            } else {
                                for (questionKey in allQuestions) {
                                    let question = allQuestions[questionKey]
                                    if ((question.questionType == 'Text Type' || question.questionType == 'Feedback Type') && !$scope.allQstForFinal[questionKey]) {
                                        $scope.allQstForFinal[questionKey] = question
                                    }
                                }
                            }
                            $rootScope.safeApply()
                        })

                        let qsetNameRef = firebase.database().ref("QuestionSets/" + set.key + '/setname')
                        $scope.qsetNameRefArr.push(qsetNameRef)
                        qsetNameRef.on('value', snapshot => {
                            set.setname = snapshot.val()
                            $rootScope.safeApply()
                        })
                        QuestionSets.push(set);
                    }
                }
                QuestionSets = $filter('orderBy')(QuestionSets, 'order');
                var prevIndex = -1;
                for (var i = 0; i < QuestionSets.length; i++) {
                    if (!QuestionSets[i].isSection) {
                        QuestionSets[i].prevIndex = prevIndex
                        prevIndex = i
                    }
                }
                $scope.QuestionSets = QuestionSets;
                if ($scope.groupData.groupsets) {
                    $scope.groupsets = $scope.groupData.groupsets;
                    for (key in $scope.groupsets) {
                        let groupset = $scope.groupsets[key];
                        for (i = 0; i < groupset.count; i++) {
                            let group = groupset.data.groups[i];
                            group.name = group.name ? group.name : groupset.name + ' ' + (i + 1);
                        }
                    }
                    $scope.groupSetKey = $rootScope.settings.groupSetKey;
                    $scope.subIndex = $rootScope.settings.subIndex;
                    if (!$scope.groupSetKey) {
                        $scope.groupSetKey = Object.keys($scope.groupsets)[0];
                        $scope.subIndex = 0;
                        $rootScope.setData('groupSetKey', $scope.groupSetKey);
                        $rootScope.setData('subIndex', $scope.subIndex);
                    }
                    $scope.selectedGroup = $scope.groupsets[$scope.groupSetKey];
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


        $scope.questions = function (set) {
            if (set.isSection) return
            $rootScope.setData('questionSetKey', set.key);
            $rootScope.setData('questionSetName', set.setname);
            $rootScope.setData('questionSet', set);
            if (set.LikertType == true) {
                return;
            } else {
                $state.go('teacherLinkQuestions');
            }
        }
        $scope.getQstClass = function (obj) {
            if (obj.isSection) {
                return 'section';
            } else if ($rootScope.settings.questionSetKey == obj.key) {
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
            $rootScope.setData('selectedTab', selectedTab);
        }
        $scope.checkCompleteSet = function (set) {
            $rootScope.setData('questionSetKey', set.key);
            $rootScope.setData('questionSetName', set.setname);
            $rootScope.setData('questionSet', set);
            $rootScope.setData('usersInGroup', $scope.usersInGroup);
            $scope.go('completeQuestionSet')
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
            let subGroups = [];
            $scope.selectedGroup.data.groups.forEach((group, index) => {
                subGroups.push(group.name);
            });

            $scope.subIndex = index;
            $rootScope.setData('groupSetKey', $scope.groupSetKey);
            $rootScope.setData('subIndex', index);
            $rootScope.setData('subSetKey', undefined);
            $rootScope.setData('secondIndex', undefined);
            $rootScope.setData('selectedTab1', 'QuestionSet');
            $rootScope.setData('questionSetKey1', undefined);
            $rootScope.setData('subGroups', subGroups);
            $state.go('teacherLinkSubGroupDetail');
        }

        $scope.changeHideState = function (set) {
            var hidden = set.hidden ? {} : true
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/QuestionSets/' + set.key + '/hidden')
                .set(hidden).then(function () {
                    $rootScope.success("Questionset hide state changed successfully!")
                });
        }


        // =============================   release rule functions  ====================================

        $scope.showReleaseRuleModal = function (set) {
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
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/QuestionSets/' + $scope.ruleSet.key)
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
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/QuestionSets/' + $scope.ruleSet.key)
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


        // =============================   deadline functions  ====================================

        $scope.showAddDeadlineModal = function (set) {
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
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/QuestionSets/' + $scope.DeadlineSetKey)
                .update(updates).then(function () {
                    $rootScope.success("Deadline updated successfully!")
                    $('#deadLineModal').modal('hide');
                });
        }

        // =============================   Reminder functions  ====================================

        $scope.showAddReminderModal = function (set) {
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
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/QuestionSets/' + $scope.DeadlineSetKey + '/reminder')
                .set(reminder).then(function () {
                    $rootScope.success("Reminder setting saved successfully!")
                    $('#reminderModal').modal('hide');
                });
        }
        $scope.removeReminder = function () {
            if (!confirm("Are you sure want to remove reminder?")) return
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/QuestionSets/' + $scope.DeadlineSetKey + '/reminder')
                .set({}).then(function () {
                    $rootScope.success("Reminder deleted successfully!")
                    $('#reminderModal').modal('hide');
                });
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
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/reminder')
                .set(reminder).then(function () {
                    $rootScope.success("Reminder setting saved successfully!")
                    $('#bulkReminderModal').modal('hide');
                });
        }
        $scope.removeBulkReminder = function () {
            if (!confirm("Are you sure want to remove bulk reminder?")) return
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/reminder')
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
            firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/finalScore').set($scope.finalScore).then(() => {
                $rootScope.success("Final Score saved successfully!")
            })
        }
        $scope.removeFinalScore = function () {
            if (!confirm("Are you sure want to remove final score?")) return
            firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/finalScore').set({}).then(() => {
                $scope.finalScore = {}
                $rootScope.success("Final Score removed successfully!")
            })
        }

        // ============link functions==================
        $scope.addLink = function (set) {
            var link = {
                teacherId: $rootScope.settings.teacherId,
                groupKey: $rootScope.settings.groupKey,
                setKey: set.key,
                questionType: 'Likert Type',
                linkType: 'set',
                key: $scope.getCode(),
            };
            firebase.database().ref('Links/' + link.key).set(link);
        }

        $scope.copyToClipboard = function (setKey) {
            var str = $scope.links[setKey].key;
            str = window.location.origin + '/directLink/' + str;
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(str).select();
            document.execCommand("copy");
            $temp.remove();
        }
        $scope.deletelink = function (setKey) {
            var key = $scope.links[setKey].key;
            firebase.database().ref('Links/' + key).set({});
        }
        $scope.getCode = function () {
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
    }
})();