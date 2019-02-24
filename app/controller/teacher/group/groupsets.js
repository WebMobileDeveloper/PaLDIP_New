(function () {
    angular
        .module('myApp')
        .controller('GroupsetsController', GroupsetsController)
    GroupsetsController.$inject = ['$state', '$scope', '$rootScope', '$filter'];
    function GroupsetsController($state, $scope, $rootScope, $filter) {
        // **************   router:    groupRoot  *****************

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        $scope.groupsets = {};
        $scope.criteria_types = ['Age', 'Gender', 'Language', 'Nationality', 'Institution']
        $scope.criteria_options = ['Same', 'Different']
        $scope.genders = ["Male", "Female"]
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            $('#createGroupModal').modal('hide');
            $('#createGroupModal1').modal('hide');
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
            if ($scope.qsetRef) $scope.qsetRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.userGroupRef) $scope.userGroupRef.off()
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);

            $scope.getAllQuestionSets();
            $scope.getAllQuestions();
            $scope.getGroupsets();
            $scope.getUserList();
            $scope.getUserGroups();
        }
        $scope.getAllQuestionSets = function () {
            $scope.qsetRef = firebase.database().ref('QuestionSets');
            $scope.qsetRef.once('value', function (snapshot) {
                $scope.allSets = snapshot.val() || {}
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }
        $scope.getAllQuestions = function () {
            $scope.qstRef = firebase.database().ref('Questions');
            $scope.qstRef.once('value', function (snapshot) {
                $scope.allQuestions = {}
                var allQuestions = snapshot.val();
                for (key in allQuestions) {
                    var question = allQuestions[key]
                    if (question.questionType == 'Answer Type') continue;
                    var setKey = question.Set
                    $scope.allQuestions[setKey] = $scope.allQuestions[setKey] || {}
                    $scope.allQuestions[setKey][key] = question
                }
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }

        $scope.getGroupsets = function () {
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets');
            $scope.subGroupRef.on('value', function (snapshot) {
                $scope.originGroupSets = snapshot.val();
                $scope.ref_3 = true;
                $scope.finalCalc()
            });
        }
        $scope.getUserList = function () {
            $scope.userRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            $scope.userRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val() || {}
                $scope.ref_4 = true;
                $scope.finalCalc()
            })
        }
        $scope.getUserGroups = function () {
            $scope.userGroupRef = firebase.database().ref('StudentGroups');
            $scope.userGroupRef.on('value', function (snapshot) {
                let userGroups = snapshot.val() || {}
                $scope.groupUsers = {}
                for (userKey in userGroups) {
                    if (Object.values(userGroups[userKey]).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.groupUsers[userKey] = {}
                    }
                }
                $scope.ref_5 = true;
                $scope.finalCalc()
            })
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4 || !$scope.ref_5) return

            for (userKey in $scope.groupUsers) {
                $scope.groupUsers[userKey] = angular.copy($scope.allUsers[userKey])
            }
            var groupSets = angular.copy($scope.originGroupSets)
            for (key in groupSets) {
                var groupset = groupSets[key];
                if (!groupset.addRule) groupset.addRule = { type: 'manually' };
                // get questionset
                var sets = groupset.QuestionSets;
                groupset.questions = {};
                if (sets) {
                    sets.forEach(qSet => {
                        qSet.setname = $scope.allSets[qSet.key].setname
                        groupset.questions[qSet.key] = [];
                        var qsts = $scope.allQuestions[qSet.key];
                        for (var qstKey in qsts) {
                            qsts[qstKey].key = qstKey;
                            groupset.questions[qSet.key].push(qsts[qstKey]);
                        }
                        groupset.questions[qSet.key] = $filter('orderBy')(groupset.questions[qSet.key], 'order');
                    });
                }
                for (var subKey in groupset.subgroupsets) {
                    var subset = groupset.subgroupsets[subKey];
                    if (!subset.addRule) subset.addRule = { type: 'manually' };
                    var sets = subset.QuestionSets;
                    subset.questions = {};
                    if (sets) {
                        sets.forEach(qSet => {
                            qSet.setname = $scope.allSets[qSet.key].setname
                            subset.questions[qSet.key] = [];
                            var qsts = $scope.allQuestions[qSet.key];
                            for (var qstKey in qsts) {
                                qsts[qstKey].key = qstKey;
                                subset.questions[qSet.key].push(qsts[qstKey]);
                            }
                            subset.questions[qSet.key] = $filter('orderBy')(subset.questions[qSet.key], 'order');
                        });
                    }
                }

            }
            $scope.groupsets = groupSets;
            $rootScope.setData('loadingfinished', true);
        }

        $scope.changeGroupsetName = function (groupSet) {
            var nameRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + groupSet.key + '/name');
            nameRef.set(groupSet.name);
        }

        $scope.changeTeamSetName = function (groupSetKey, subgroupSetKey, name) {
            var nameRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + groupSetKey + '/subgroupsets/' + subgroupSetKey + '/name');
            nameRef.set(name);
        }

        $scope.changeGroupName = function (groupSet, index) {
            var nameRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + groupSet.key + '/data/groups/' + index + '/name');
            nameRef.set(groupSet.data.groups[index].name);
        }
        $scope.changeTeamName = function (groupSet, subgroupSetKey, index, name) {
            var updates = {}
            for (var i = 0; i < groupSet.data.groups.length; i++) {
                updates['Groups/' + $rootScope.settings.groupKey + '/groupsets/' + groupSet.key + '/data/groups/' + i + '/subgroupsets/' +
                    subgroupSetKey + '/groups/' + index + '/name'] = name;
            }
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }


        $scope.changeLock = function (selectedKey) {
            var lockRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + selectedKey + '/locked');
            lockRef.set($scope.groupsets[selectedKey].locked);
        }
        $scope.changeLock1 = function (setKey, subSetKey) {
            var lockRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + setKey + '/subgroupsets/' + subSetKey + '/locked');
            lockRef.set($scope.groupsets[setKey].subgroupsets[subSetKey].locked);

        }
        //================================ create group set functions=============================
        $scope.showCreateModal = function () {
            $scope.groupset = {};
            $scope.groupset.name = '';
            $scope.groupset.count = 4;
            $scope.groupset.max_member = 5;
            $scope.groupset.exclusive = false;
            $scope.groupset.addRule = { type: 'manually' }
            $scope.groupset.criteria = { type: 'Age', option: 'Same' }
            $rootScope.safeApply();
            $('#createGroupModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.showCreateModal1 = function (groupSetKey) {
            $scope.subset = {};
            $scope.subset.name = '';
            $scope.subset.count = 4;
            $scope.subset.max_member = 5;
            $scope.subset.exclusive = false;
            $scope.subset.addRule = { type: 'manually' }
            $scope.subset.criteria = { type: 'Age', option: 'Same' }
            $scope.selectedKey = groupSetKey;
            $rootScope.safeApply();
            $('#createGroupModal1').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.createGroupSet = function () {
            let userKeys = Object.keys($scope.groupUsers)
            if ($scope.groupset.name == '') {
                $rootScope.warning("You need to input Groupset name!");
                return;
            }

            $rootScope.setData('loadingfinished', false);
            var subSets = $scope.groupsets;
            for (key in subSets) {
                if (subSets[key].name == $scope.groupset.name) {
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.warning('duplicated name!');
                    return;
                }
            }

            if ($scope.groupset.addRule.type != 'manually' && userKeys.length == 0) {
                $rootScope.error("There isn't any user in this group. Please create groups by manually.")
                $rootScope.setData('loadingfinished', true);
                return;
            }

            $scope.groupset.data = { member_count: 0, groups: [] };
            switch ($scope.groupset.addRule.type) {
                case 'manually':
                    $scope.groupset.data.groups = Array($scope.groupset.count).fill().map(() => { return { member_count: 0 } })
                    break;
                case 'randomly':
                    $scope.groupset.data.member_count = userKeys.length;
                    $scope.groupset.data.members = angular.copy(userKeys);
                    $scope.groupset.count = 0;
                    while (userKeys.length) {
                        let group = {
                            members: [],
                            member_count: 0
                        }
                        while (userKeys.length && group.member_count < $scope.groupset.max_member) {
                            let userIndex = Math.floor(Math.random() * userKeys.length);
                            group.members.push(userKeys[userIndex]);
                            group.member_count++;
                            userKeys.splice(userIndex, 1);
                        }
                        $scope.groupset.data.groups.push(group)
                        $scope.groupset.count++;
                    }
                    break;
                case 'criteria':
                    userKeys = sortUserKeys(userKeys, $scope.groupset.criteria.type)

                    $scope.groupset.count = Math.ceil(userKeys.length / $scope.groupset.max_member);
                    $scope.groupset.data.member_count = userKeys.length;
                    $scope.groupset.data.members = angular.copy(userKeys);
                    $scope.groupset.data.groups = []
                    for (i = 0; i < $scope.groupset.count; i++) {
                        $scope.groupset.data.groups[i] = { member_count: 0, members: [] }
                    }
                    if ($scope.groupset.criteria.option == "Same") {
                        let groupIndex = 0;
                        userKeys.forEach(userKey => {
                            $scope.groupset.data.groups[groupIndex].member_count++;
                            $scope.groupset.data.groups[groupIndex].members.push(userKey)
                            if ($scope.groupset.data.groups[groupIndex].member_count == $scope.groupset.max_member) groupIndex++;
                        });
                    } else {
                        userKeys.forEach((userKey, index) => {
                            let groupIndex = index % $scope.groupset.max_member;
                            $scope.groupset.data.groups[groupIndex].member_count++;
                            $scope.groupset.data.groups[groupIndex].members.push(userKey)
                        });
                    }
                    break;
            }
            $rootScope.setData('loadingfinished', true);
            if (confirm("Are you sure want to create this groupset?")) {
                $rootScope.setData('loadingfinished', false);
                var subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets').push();
                $scope.groupset.key = subGroupRef.key;
                subGroupRef.set($scope.groupset).then(function () {
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.success('New group set is created successfully!');
                    $('#createGroupModal').modal('hide');
                });
            }
        }

        $scope.createGroupSet1 = function () {
            var groupKey = $rootScope.settings.groupKey;
            var setKey = $scope.selectedKey;

            if ($scope.subset.name == '') {
                $rootScope.warning("You need to input sub groupset name!");
                return;
            }
            $rootScope.setData('loadingfinished', false);

            var subSets = $scope.groupsets[setKey].subgroupsets;
            for (key in subSets) {
                if (subSets[key].name == $scope.subset.name) {
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.warning('duplicated name!');
                    return;
                }
            }

            $scope.subset.key = firebase.database().ref('Groups/' + groupKey + '/groupsets/' + setKey + '/subgroupsets').push().key;

            var updates = {};

            switch ($scope.subset.addRule.type) {
                case 'manually':
                    for (var i = 0; i < $scope.groupsets[setKey].count; i++) {
                        let subsetData = {
                            member_count: 0,
                            groups: Array($scope.subset.count).fill().map(() => { return { member_count: 0 } })
                        };
                        updates['Groups/' + groupKey + '/groupsets/' + setKey + '/data/groups/' + i + '/subgroupsets/' + $scope.subset.key] = subsetData;
                    }
                    break;
                case 'randomly':
                    $scope.subset.count = Math.ceil($scope.groupsets[setKey].max_member / $scope.subset.max_member);
                    for (var i = 0; i < $scope.groupsets[setKey].count; i++) {
                        let userKeys = angular.copy($scope.groupsets[setKey].data.groups[i].members || [])
                        let subsetData = {
                            member_count: userKeys.length,
                            members: angular.copy(userKeys),
                        };

                        for (j = 0; j < $scope.subset.count; j++) {
                            if (!userKeys.length) break
                            let group = {
                                members: [],
                                member_count: 0
                            }
                            while (userKeys.length && group.member_count < $scope.subset.max_member) {
                                let userIndex = Math.floor(Math.random() * userKeys.length);
                                group.members.push(userKeys[userIndex]);
                                group.member_count++;
                                userKeys.splice(userIndex, 1);
                            }
                            subsetData.groups[j] = group
                        }
                        updates['Groups/' + groupKey + '/groupsets/' + setKey + '/data/groups/' + i + '/subgroupsets/' + $scope.subset.key] = subsetData;
                    }
                    break;
                case 'criteria':
                    $scope.subset.count = Math.ceil($scope.groupsets[setKey].max_member / $scope.subset.max_member);
                    for (var i = 0; i < $scope.groupsets[setKey].count; i++) {

                        let userKeys = angular.copy($scope.groupsets[setKey].data.groups[i].members || [])
                        userKeys = sortUserKeys(userKeys, $scope.subset.criteria.type)

                        let subsetData = {
                            member_count: userKeys.length,
                            members: angular.copy(userKeys),
                            groups: []
                        };

                        for (j = 0; j < $scope.subset.count; j++) {
                            subsetData.groups[j] = { member_count: 0, members: [] }
                        }
                        if ($scope.subset.criteria.option == "Same") {
                            let groupIndex = 0;
                            userKeys.forEach(userKey => {
                                subsetData.groups[groupIndex].member_count++;
                                subsetData.groups[groupIndex].members.push(userKey)
                                if (subsetData.groups[groupIndex].member_count == $scope.subset.max_member) {
                                    groupIndex++;
                                }
                            });
                        } else {
                            userKeys.forEach((userKey, index) => {
                                let groupIndex = index % $scope.subset.max_member;
                                subsetData.groups[groupIndex].member_count++;
                                subsetData.groups[groupIndex].members.push(userKey)
                            });
                        }
                        updates['Groups/' + groupKey + '/groupsets/' + setKey + '/data/groups/' + i + '/subgroupsets/' + $scope.subset.key] = subsetData;
                    }
                    break;
            }

            updates['Groups/' + groupKey + '/groupsets/' + setKey + '/subgroupsets/' + $scope.subset.key] = $scope.subset;
            $rootScope.setData('loadingfinished', true);

            if (confirm("Are you sure want to create this subgroupset?")) {
                $rootScope.setData('loadingfinished', false);
                firebase.database().ref().update(updates).then(function () {
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.success('New sub groupset is created successfully!');
                    $('#createGroupModal1').modal('hide');
                });
            }
        }
        sortUserKeys = function (userKeys, type) {
            let tempUsers = []
            let sortField = '';
            switch (type) {
                case 'Age':
                    userKeys.forEach(userKey => {
                        let user = angular.copy($scope.allUsers[userKey])
                        user.age = user.age || Math.floor(Math.random() * 10 + 18);
                        tempUsers.push(user);
                    });
                    sortField = 'age';
                    break;
                case 'Gender':
                    userKeys.forEach(userKey => {
                        let user = angular.copy($scope.allUsers[userKey])
                        user.gender = user.gender || $scope.genders[Math.floor(Math.random() * $scope.genders.length)];
                        tempUsers.push(user);
                    });
                    sortField = 'gender';
                    break;
                case 'Language':
                    userKeys.forEach(userKey => {
                        let user = angular.copy($scope.allUsers[userKey])
                        user.countrylanguage = user.countrylanguage || $scope.countrylanguages[Math.floor(Math.random() * $scope.countrylanguages.length)];
                        tempUsers.push(user);
                    });
                    sortField = 'countrylanguage';
                    break;
                case 'Nationality':
                    userKeys.forEach(userKey => {
                        let user = angular.copy($scope.allUsers[userKey])
                        user.country = user.country || $scope.countries[Math.floor(Math.random() * $scope.countries.length)];
                        tempUsers.push(user);
                    });
                    sortField = 'country';
                    break;
                case 'Institution':
                    userKeys.forEach(userKey => {
                        let user = angular.copy($scope.allUsers[userKey])
                        tempUsers.push(user);
                    });
                    sortField = 'institution';
                    break;
            }
            tempUsers.sort((a, b) => {
                if (a[sortField] < b[sortField])
                    return -1;
                if (a[sortField] > b[sortField])
                    return 1;
                return 0;
            })
            let sortedKeys = []
            tempUsers.forEach(user => {
                sortedKeys.push(user.Userkey)
            });
            return sortedKeys;
        }
        //================================ edit Question set functions=============================
        $scope.editQuestionSets = function (selectedKey) {
            $rootScope.setData('groupSetKey', selectedKey);
            $rootScope.setData('GroupSetName', $scope.groupsets[selectedKey].name);
            $rootScope.setData('groupSetType', 'firstGroupSet');
            $state.go('editQuestionsetsInGroupSet');
        }

        $scope.editQuestionSets1 = function (groupSetKey, subSetKey) {
            $rootScope.setData('groupSetKey', groupSetKey);
            $rootScope.setData('GroupSetName', $scope.groupsets[groupSetKey].name);
            $rootScope.setData('subSetKey', subSetKey);
            $rootScope.setData('subGroupSetName', $scope.groupsets[groupSetKey].subgroupsets[subSetKey].name);
            $rootScope.setData('groupSetType', 'secondGroupSet');
            $state.go('editQuestionsetsInGroupSet');
        }
        // $scope.likertResponse = function (set, groupSetKey, subSetKey = undefined) {
        //     $rootScope.setData('groupSetKey', groupSetKey);
        //     $rootScope.setData('subSetKey', subSetKey);
        //     $rootScope.setData('groupsets', $scope.groupsets[groupSetKey]);
        //     $rootScope.setData('setData', set);
        //     var groupType = 'sub';
        //     if (subSetKey) {
        //         groupType = 'second';
        //     }
        //     $rootScope.setData('groupType', groupType);

        //     $state.go('groupResponseOfLikertAnswer');
        // }
        // $scope.exportQuestionDatas = function (question, groupSetKey, subSetKey = undefined) {
        //     // localStorage.setItem("exportQuestion", JSON.stringify(question));
        //     var groupType = 'sub';
        //     if (subSetKey) {
        //         groupType = 'second';
        //     }
        //     $rootScope.setData('exportQuestion', question);
        //     $rootScope.setData('groupSetKey', groupSetKey);
        //     $rootScope.setData('subSetKey', subSetKey);
        //     $rootScope.setData('groupsets', $scope.groupsets[groupSetKey]);
        //     $rootScope.setData('groupType', groupType);

        //     setTimeout(() => {
        //         if (question.questionType == "Dropdown Type") {
        //             $state.go('groupResponseOfDropdownAnswer');
        //         } else if (question.questionType == "Multiple Type") {
        //             $state.go('groupResponseOfMultipleAnswer');
        //         } else if (question.questionType == "Contingent Type") {
        //             $state.go('groupResponseOfContingentAnswer');
        //         } else if (question.questionType == "Feedback Type") {
        //             $state.go('groupResponseOfFeedbackAnswer');
        //         } else if (question.questionType == "Rating Type") {
        //             $state.go('groupResponseOfRatingAnswer');
        //         } else {
        //             $state.go('groupResponseOfAnswer');
        //         }
        //     }, 0);
        // }


        $scope.deleteGroupset = function (groupSetKey) {
            if ($scope.groupsets[groupSetKey].subgroupsets) {
                $rootScope.warning("Please delete all contained sub groupsets at first!");
                return;
            }
            if (confirm("You will be lost all of data if group set is deleted.\n Please export data before deleting the group set.")) {
                var subset = $scope.groupsets[groupSetKey];
                $rootScope.setData('groupType', 'sub');
                $rootScope.setData('exportGroupName', $rootScope.settings.groupName + ' / ' + $scope.groupsets[groupSetKey].name);
                $rootScope.setData('childGroupName', subset.name);
                $rootScope.setData('groupSetKey', groupSetKey);
                $rootScope.setData('questions', subset.questions);
                $state.go('deleteGroupset');
            }
        }

        $scope.deleteSubGroupset = function (groupSetKey, subGroupSetKey) {
            if (confirm("You will be lost all of data if subgroupset is deleted.\n Please export data before deleting the subgroupset.")) {
                var subset = $scope.groupsets[groupSetKey].subgroupsets[subGroupSetKey];
                $rootScope.setData('groupType', 'second');
                $rootScope.setData('exportGroupName', $rootScope.settings.groupName + ' / ' + $scope.groupsets[groupSetKey].name + ' / ' + subset.name);
                $rootScope.setData('childGroupName', subset.name);
                $rootScope.setData('groupSetKey', groupSetKey);
                $rootScope.setData('subSetKey', subGroupSetKey);
                $rootScope.setData('questions', subset.questions);
                $rootScope.setData('groupsetMemberData', $scope.groupsets[groupSetKey].data.groups);
                $state.go('deleteGroupset');
            }

        }

        $scope.addNewGroup = function (groupSet) {
            if (!confirm("Are you sure want to add new group?")) return
            var groupKey = $rootScope.settings.groupKey;
            var setKey = groupSet.key;
            var newGroup = angular.copy(groupSet.data.groups[0]);
            newGroup.member_count = 0
            newGroup.members = {}
            newGroup.name = {}
            var subgroupsets = newGroup.subgroupsets;
            for (var subSetKey in subgroupsets) {
                var subset = subgroupsets[subSetKey]
                subset.member_count = 0
                subset.members = {}
                var subGroups = subset.groups;
                for (var i = 0; i < subGroups.length; i++) {
                    subGroups[i].member_count = 0
                    subGroups[i].members = {}
                }
            }
            var updates = {};
            updates['/count'] = groupSet.count + 1;
            updates['/data/groups/' + groupSet.count] = newGroup;

            firebase.database().ref('Groups/' + groupKey + '/groupsets/' + setKey).update(updates).then(function () {
                $rootScope.success('New group added successfully!');
            });
        }

        $scope.addNewSubGroup = function (groupSet, subSet) {
            if (!confirm("Are you sure want to add new group?")) return
            var groupKey = $rootScope.settings.groupKey;
            var setKey = groupSet.key;
            var updates = {};
            updates['/subgroupsets/' + subSet.key + '/count'] = subSet.count + 1;
            for (var i = 0; i < groupSet.count; i++) {
                updates['/data/groups/' + i + '/subgroupsets/' + subSet.key +
                    '/groups/' + subSet.count + '/member_count'] = 0;
            }
            firebase.database().ref('Groups/' + groupKey + '/groupsets/' + setKey).update(updates).then(function () {
                $rootScope.success('New group added successfully!');
            });
        }

        $scope.addUsers = function (groupSetKey, subSetKey = undefined) {
            $rootScope.setData('groupSetKey', groupSetKey)
            if (subSetKey) {
                $rootScope.setData('subSetKey', subSetKey);
                $rootScope.setData('groupCount', $scope.groupsets[groupSetKey].count);
                $state.go('subSetUsers')
            } else {
                $state.go('groupsetUsers')
            }
        }

        $scope.exportUsers = function (groupSetKey, subSetKey = undefined) {
            $rootScope.setData('groupSetKey', groupSetKey)
            if (subSetKey) {
                // $rootScope.setData('subSetKey', subSetKey);
                // $rootScope.setData('groupCount', $scope.groupsets[groupSetKey].count);
                // $state.go('subSetUsers')
            } else {
                $state.go('exportGroupsetUsers')
            }
        }

        $scope.countries = [
            { name: 'Afghanistan', code: 'AF' },
            { name: 'Åland Islands', code: 'AX' },
            { name: 'Albania', code: 'AL' },
            { name: 'Algeria', code: 'DZ' },
            { name: 'American Samoa', code: 'AS' },
            { name: 'Andorra', code: 'AD' },
            { name: 'Angola', code: 'AO' },
            { name: 'Anguilla', code: 'AI' },
            { name: 'Antarctica', code: 'AQ' },
            { name: 'Antigua and Barbuda', code: 'AG' },
            { name: 'Argentina', code: 'AR' },
            { name: 'Armenia', code: 'AM' },
            { name: 'Aruba', code: 'AW' },
            { name: 'Australia', code: 'AU' },
            { name: 'Austria', code: 'AT' },
            { name: 'Azerbaijan', code: 'AZ' },
            { name: 'Bahamas', code: 'BS' },
            { name: 'Bahrain', code: 'BH' },
            { name: 'Bangladesh', code: 'BD' },
            { name: 'Barbados', code: 'BB' },
            { name: 'Belarus', code: 'BY' },
            { name: 'Belgium', code: 'BE' },
            { name: 'Belize', code: 'BZ' },
            { name: 'Benin', code: 'BJ' },
            { name: 'Bermuda', code: 'BM' },
            { name: 'Bhutan', code: 'BT' },
            { name: 'Bolivia', code: 'BO' },
            { name: 'Bosnia and Herzegovina', code: 'BA' },
            { name: 'Botswana', code: 'BW' },
            { name: 'Bouvet Island', code: 'BV' },
            { name: 'Brazil', code: 'BR' },
            { name: 'British Indian Ocean Territory', code: 'IO' },
            { name: 'Brunei Darussalam', code: 'BN' },
            { name: 'Bulgaria', code: 'BG' },
            { name: 'Burkina Faso', code: 'BF' },
            { name: 'Burundi', code: 'BI' },
            { name: 'Cambodia', code: 'KH' },
            { name: 'Cameroon', code: 'CM' },
            { name: 'Canada', code: 'CA' },
            { name: 'Cape Verde', code: 'CV' },
            { name: 'Cayman Islands', code: 'KY' },
            { name: 'Central African Republic', code: 'CF' },
            { name: 'Chad', code: 'TD' },
            { name: 'Chile', code: 'CL' },
            { name: 'China', code: 'CN' },
            { name: 'Christmas Island', code: 'CX' },
            { name: 'Cocos (Keeling) Islands', code: 'CC' },
            { name: 'Colombia', code: 'CO' },
            { name: 'Comoros', code: 'KM' },
            { name: 'Congo', code: 'CG' },
            { name: 'Congo, The Democratic Republic of the', code: 'CD' },
            { name: 'Cook Islands', code: 'CK' },
            { name: 'Costa Rica', code: 'CR' },
            { name: 'Cote D\'Ivoire', code: 'CI' },
            { name: 'Croatia', code: 'HR' },
            { name: 'Cuba', code: 'CU' },
            { name: 'Cyprus', code: 'CY' },
            { name: 'Czech Republic', code: 'CZ' },
            { name: 'Denmark', code: 'DK' },
            { name: 'Djibouti', code: 'DJ' },
            { name: 'Dominica', code: 'DM' },
            { name: 'Dominican Republic', code: 'DO' },
            { name: 'Ecuador', code: 'EC' },
            { name: 'Egypt', code: 'EG' },
            { name: 'El Salvador', code: 'SV' },
            { name: 'Equatorial Guinea', code: 'GQ' },
            { name: 'Eritrea', code: 'ER' },
            { name: 'Estonia', code: 'EE' },
            { name: 'Ethiopia', code: 'ET' },
            { name: 'Falkland Islands (Malvinas)', code: 'FK' },
            { name: 'Faroe Islands', code: 'FO' },
            { name: 'Fiji', code: 'FJ' },
            { name: 'Finland', code: 'FI' },
            { name: 'France', code: 'FR' },
            { name: 'French Guiana', code: 'GF' },
            { name: 'French Polynesia', code: 'PF' },
            { name: 'French Southern Territories', code: 'TF' },
            { name: 'Gabon', code: 'GA' },
            { name: 'Gambia', code: 'GM' },
            { name: 'Georgia', code: 'GE' },
            { name: 'Germany', code: 'DE' },
            { name: 'Ghana', code: 'GH' },
            { name: 'Gibraltar', code: 'GI' },
            { name: 'Greece', code: 'GR' },
            { name: 'Greenland', code: 'GL' },
            { name: 'Grenada', code: 'GD' },
            { name: 'Guadeloupe', code: 'GP' },
            { name: 'Guam', code: 'GU' },
            { name: 'Guatemala', code: 'GT' },
            { name: 'Guernsey', code: 'GG' },
            { name: 'Guinea', code: 'GN' },
            { name: 'Guinea-Bissau', code: 'GW' },
            { name: 'Guyana', code: 'GY' },
            { name: 'Haiti', code: 'HT' },
            { name: 'Heard Island and Mcdonald Islands', code: 'HM' },
            { name: 'Holy See (Vatican City State)', code: 'VA' },
            { name: 'Honduras', code: 'HN' },
            { name: 'Hong Kong', code: 'HK' },
            { name: 'Hungary', code: 'HU' },
            { name: 'Iceland', code: 'IS' },
            { name: 'India', code: 'IN' },
            { name: 'Indonesia', code: 'ID' },
            { name: 'Iran, Islamic Republic Of', code: 'IR' },
            { name: 'Iraq', code: 'IQ' },
            { name: 'Ireland', code: 'IE' },
            { name: 'Isle of Man', code: 'IM' },
            { name: 'Israel', code: 'IL' },
            { name: 'Italy', code: 'IT' },
            { name: 'Jamaica', code: 'JM' },
            { name: 'Japan', code: 'JP' },
            { name: 'Jersey', code: 'JE' },
            { name: 'Jordan', code: 'JO' },
            { name: 'Kazakhstan', code: 'KZ' },
            { name: 'Kenya', code: 'KE' },
            { name: 'Kiribati', code: 'KI' },
            { name: 'Korea, Democratic People\'s Republic of', code: 'KP' },
            { name: 'Korea, Republic of', code: 'KR' },
            { name: 'Kuwait', code: 'KW' },
            { name: 'Kyrgyzstan', code: 'KG' },
            { name: 'Lao People\'s Democratic Republic', code: 'LA' },
            { name: 'Latvia', code: 'LV' },
            { name: 'Lebanon', code: 'LB' },
            { name: 'Lesotho', code: 'LS' },
            { name: 'Liberia', code: 'LR' },
            { name: 'Libyan Arab Jamahiriya', code: 'LY' },
            { name: 'Liechtenstein', code: 'LI' },
            { name: 'Lithuania', code: 'LT' },
            { name: 'Luxembourg', code: 'LU' },
            { name: 'Macao', code: 'MO' },
            { name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK' },
            { name: 'Madagascar', code: 'MG' },
            { name: 'Malawi', code: 'MW' },
            { name: 'Malaysia', code: 'MY' },
            { name: 'Maldives', code: 'MV' },
            { name: 'Mali', code: 'ML' },
            { name: 'Malta', code: 'MT' },
            { name: 'Marshall Islands', code: 'MH' },
            { name: 'Martinique', code: 'MQ' },
            { name: 'Mauritania', code: 'MR' },
            { name: 'Mauritius', code: 'MU' },
            { name: 'Mayotte', code: 'YT' },
            { name: 'Mexico', code: 'MX' },
            { name: 'Micronesia, Federated States of', code: 'FM' },
            { name: 'Moldova, Republic of', code: 'MD' },
            { name: 'Monaco', code: 'MC' },
            { name: 'Mongolia', code: 'MN' },
            { name: 'Montserrat', code: 'MS' },
            { name: 'Morocco', code: 'MA' },
            { name: 'Mozambique', code: 'MZ' },
            { name: 'Myanmar', code: 'MM' },
            { name: 'Namibia', code: 'NA' },
            { name: 'Nauru', code: 'NR' },
            { name: 'Nepal', code: 'NP' },
            { name: 'Netherlands', code: 'NL' },
            { name: 'Netherlands Antilles', code: 'AN' },
            { name: 'New Caledonia', code: 'NC' },
            { name: 'New Zealand', code: 'NZ' },
            { name: 'Nicaragua', code: 'NI' },
            { name: 'Niger', code: 'NE' },
            { name: 'Nigeria', code: 'NG' },
            { name: 'Niue', code: 'NU' },
            { name: 'Norfolk Island', code: 'NF' },
            { name: 'Northern Mariana Islands', code: 'MP' },
            { name: 'Norway', code: 'NO' },
            { name: 'Oman', code: 'OM' },
            { name: 'Pakistan', code: 'PK' },
            { name: 'Palau', code: 'PW' },
            { name: 'Palestinian Territory, Occupied', code: 'PS' },
            { name: 'Panama', code: 'PA' },
            { name: 'Papua New Guinea', code: 'PG' },
            { name: 'Paraguay', code: 'PY' },
            { name: 'Peru', code: 'PE' },
            { name: 'Philippines', code: 'PH' },
            { name: 'Pitcairn', code: 'PN' },
            { name: 'Poland', code: 'PL' },
            { name: 'Portugal', code: 'PT' },
            { name: 'Puerto Rico', code: 'PR' },
            { name: 'Qatar', code: 'QA' },
            { name: 'Reunion', code: 'RE' },
            { name: 'Romania', code: 'RO' },
            { name: 'Russian Federation', code: 'RU' },
            { name: 'Rwanda', code: 'RW' },
            { name: 'Saint Helena', code: 'SH' },
            { name: 'Saint Kitts and Nevis', code: 'KN' },
            { name: 'Saint Lucia', code: 'LC' },
            { name: 'Saint Pierre and Miquelon', code: 'PM' },
            { name: 'Saint Vincent and the Grenadines', code: 'VC' },
            { name: 'Samoa', code: 'WS' },
            { name: 'San Marino', code: 'SM' },
            { name: 'Sao Tome and Principe', code: 'ST' },
            { name: 'Saudi Arabia', code: 'SA' },
            { name: 'Senegal', code: 'SN' },
            { name: 'Serbia and Montenegro', code: 'CS' },
            { name: 'Seychelles', code: 'SC' },
            { name: 'Sierra Leone', code: 'SL' },
            { name: 'Singapore', code: 'SG' },
            { name: 'Slovakia', code: 'SK' },
            { name: 'Slovenia', code: 'SI' },
            { name: 'Solomon Islands', code: 'SB' },
            { name: 'Somalia', code: 'SO' },
            { name: 'South Africa', code: 'ZA' },
            { name: 'South Georgia and the South Sandwich Islands', code: 'GS' },
            { name: 'Spain', code: 'ES' },
            { name: 'Sri Lanka', code: 'LK' },
            { name: 'Sudan', code: 'SD' },
            { name: 'Suriname', code: 'SR' },
            { name: 'Svalbard and Jan Mayen', code: 'SJ' },
            { name: 'Swaziland', code: 'SZ' },
            { name: 'Sweden', code: 'SE' },
            { name: 'Switzerland', code: 'CH' },
            { name: 'Syrian Arab Republic', code: 'SY' },
            { name: 'Taiwan, Province of China', code: 'TW' },
            { name: 'Tajikistan', code: 'TJ' },
            { name: 'Tanzania, United Republic of', code: 'TZ' },
            { name: 'Thailand', code: 'TH' },
            { name: 'Timor-Leste', code: 'TL' },
            { name: 'Togo', code: 'TG' },
            { name: 'Tokelau', code: 'TK' },
            { name: 'Tonga', code: 'TO' },
            { name: 'Trinidad and Tobago', code: 'TT' },
            { name: 'Tunisia', code: 'TN' },
            { name: 'Turkey', code: 'TR' },
            { name: 'Turkmenistan', code: 'TM' },
            { name: 'Turks and Caicos Islands', code: 'TC' },
            { name: 'Tuvalu', code: 'TV' },
            { name: 'Uganda', code: 'UG' },
            { name: 'Ukraine', code: 'UA' },
            { name: 'United Arab Emirates', code: 'AE' },
            { name: 'United Kingdom', code: 'GB' },
            { name: 'United States', code: 'US' },
            { name: 'United States Minor Outlying Islands', code: 'UM' },
            { name: 'Uruguay', code: 'UY' },
            { name: 'Uzbekistan', code: 'UZ' },
            { name: 'Vanuatu', code: 'VU' },
            { name: 'Venezuela', code: 'VE' },
            { name: 'Vietnam', code: 'VN' },
            { name: 'Virgin Islands, British', code: 'VG' },
            { name: 'Virgin Islands, U.S.', code: 'VI' },
            { name: 'Wallis and Futuna', code: 'WF' },
            { name: 'Western Sahara', code: 'EH' },
            { name: 'Yemen', code: 'YE' },
            { name: 'Zambia', code: 'ZM' },
            { name: 'Zimbabwe', code: 'ZW' }
        ];

        $scope.countrylanguages = [
            "Afrikanns",
            "Albanian",
            "Arabic",
            "Armenian",
            "Basque",
            "Bengali",
            "Bulgarian",
            "Catalan",
            "Cambodian",
            "Chinese",
            "Croation",
            "Czech",
            "Danish",
            "Dutch",
            "English",
            "Estonian",
            "Fiji",
            "Finnish",
            "French",
            "Georgian",
            "German",
            "Greek",
            "Gujarati",
            "Hebrew",
            "Hindi",
            "Hungarian",
            "Icelandic",
            "Indonesian",
            "Irish",
            "Italian",
            "Japanese",
            "Javanese",
            "Korean",
            "Latin",
            "Latvian",
            "Lithuanian",
            "Macedonian",
            "Malay",
            "Malayalam",
            "Maltese",
            "Maori",
            "Marathi",
            "Mongolian",
            "Nepali",
            "Norwegian",
            "Persian",
            "Polish",
            "Portuguese",
            "Punjabi",
            "Quechua",
            "Romanian",
            "Russian",
            "Samoan",
            "Serbian",
            "Slovak",
            "Spanish",
            "Swahili",
            "Swedish",
            "Tamil",
            "Tatar",
            "Telugu",
            "Thai",
            "Tibetan",
            "Tonga",
            "Turkish",
            "Ukranian",
            "Urdu",
            "Uzbek",
            "Vietnamese",
            "Welsh",
            "Xhosa"
        ]

    }
})();