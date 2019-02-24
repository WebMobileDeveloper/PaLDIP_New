(function () {

    angular
        .module('myApp')
        .controller('uploadListController', uploadListController)

    uploadListController.$inject = ['$state', '$scope', '$rootScope'];

    function uploadListController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'teacherGroup');

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);

            $scope.fields = ["No", "Email", "Group", "Tutorial Set", "Tutorial", "Team Set", "Team", "Result", "Gender", "Institution", "Age", "Language", "Nationality", "Other"];
            $scope.resultFields = ["Email", "Group", "Tutorial Set", "Tutorial", "Team Set", "Team"];
            $scope.list = [];
            $scope.getUsers();
        }

        $scope.getUsers = function () {
            var usersRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            usersRef.on('value', function (snapshot) {
                $scope.users = {};
                if (snapshot.val()) {
                    snapshot.forEach(function (childsnapshot) {
                        $scope.users[childsnapshot.key] = childsnapshot.val();
                    });
                }
                $scope.getGroups();
            });
        }
        $scope.getGroups = function () {
            var groupdata = firebase.database().ref('Groups').orderByChild('teacherKey').equalTo($rootScope.settings.userId);
            groupdata.on('value', function (snapshot) {
                $scope.groups = snapshot.val() || {};
                $scope.getSharedGroups();
            });
        }
        $scope.getSharedGroups = function () {
            var shareRef = firebase.database().ref('SharedList/' + $rootScope.settings.userId);
            shareRef.once('value', function (snapshot) {
                var count = 0;
                if (snapshot.val()) {
                    for (var fromKey in snapshot.val()) {
                        var fromTeacher = snapshot.val()[fromKey];
                        for (var groupKey in fromTeacher) {
                            count++;
                            var groupRef = firebase.database().ref('Groups/' + groupKey);
                            groupRef.on('value', function (snapshot) {
                                count--;
                                if (snapshot.val()) {
                                    $scope.groups[groupKey] = snapshot.val();
                                    $scope.groups[groupKey].teacherId = fromKey;
                                }
                                if (count <= 0) {
                                    $scope.getStudentGroups();
                                }
                            });
                        }
                    }
                }
                if (count <= 0) {
                    $scope.getStudentGroups();
                }

            });
        }
        $scope.getStudentGroups = function () {
            var groupRef = firebase.database().ref('StudentGroups');
            groupRef.once('value', function (studentGroups) {
                $scope.studentsInGroup = studentGroups.val() || {};
                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
            })
        }

        $scope.showUploadModal = function () {
            $('#uploadModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.file_changed = function (element) {
            $scope.uploadData = {};
            var file = element.files[0];

            $scope.filename = file.name;
            var uploader = document.getElementById('uploader');
            uploader.value = 10;
            var reader = new FileReader();
            reader.readAsBinaryString(file);
            uploader.value = 20;
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    uploader.value = 50;
                    var data = evt.target.result;
                    var workbook = XLSX.read(data, { type: 'binary' });
                    $scope.default_group = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])[0];
                    uploader.value = 70;
                    var headerNames = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], { header: 1 })[0];
                    $scope.list = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
                    $scope.fields = [];
                    headerNames.forEach(function (h) {
                        $scope.fields.push(h);
                    });
                    $scope.resultList = undefined;
                    uploader.value = 100;
                });
            };
        }
        $scope.applyUpload = function () {
            // if (!confirm("Are you sure want to apply this table data?")) return;
            var updates = {};
            $scope.resultList = [];
            for (var i = 0; i < $scope.list.length; i++) {
                var student = $scope.list[i];
                student.Result = "Failed";
                var result = {
                    Email: {
                        result: '-',
                        class: 'Failed',
                    },
                    Group: {
                        result: '--',
                        class: 'Failed'
                    },
                    'Tutorial Set': {
                        result: '--',
                        class: 'Failed'
                    },
                    'Tutorial': {
                        result: '--',
                        class: 'Failed'
                    },
                    'Team Set': {
                        result: '--',
                        class: 'Failed'
                    },
                    'Team': {
                        result: '--',
                        class: 'Failed'
                    }
                }


                //=============================================================================
                //                check email
                //============================================================================
                if (!student.Email) {
                    result.Email.result = 'Email Missed !';
                    $scope.resultList.push(result);
                    continue;
                }
                student['Email'] = student['Email'].trim();
                result.Email.result = "Unregistered!";
                for (var key in $scope.users) {
                    var user = $scope.users[key];
                    if (user.ID == student['Email']) {
                        student.userKey = key;
                        result.Email = {
                            result: "Checked!",
                            class: 'Success'
                        }
                    }
                }

                if (result.Email.result == 'Checked!') {
                    if (student.Gender) updates['Users/' + student.userKey + '/gender'] = student.Gender
                    if (student.Institution) updates['Users/' + student.userKey + '/institution'] = student.Institution
                    if (student.Age) updates['Users/' + student.userKey + '/age'] = student.Age
                    if (student.Language) updates['Users/' + student.userKey + '/countrylanguage'] = student.Language
                    if (student.Nationality) updates['Users/' + student.userKey + '/country'] = student.Nationality
                    if (student.Other) updates['Users/' + student.userKey + '/other'] = student.Other
                }

                if (result.Email.class == 'Failed') {
                    $scope.resultList.push(result);
                    continue;
                }

                //=============================================================================
                //                check group
                //============================================================================

                var groupName = student.Group ? student.Group : $scope.default_group['Group'];

                // check group name
                if (!groupName) {
                    result.Group.result = 'Unspecified!';
                    $scope.resultList.push(result);
                    continue;
                }
                groupName = groupName.trim();
                // check group exist
                var existGroup = false;
                var group = undefined;
                for (key in $scope.groups) {
                    group = $scope.groups[key];
                    if (group.groupname == groupName) {
                        student.groupKey = key;
                        existGroup = true;
                        break;
                    }
                }
                if (!existGroup) {
                    result.Group.result = 'Unknown Group!';
                    $scope.resultList.push(result);
                    continue;
                }

                // check if joined to group
                $scope.studentsInGroup[student.userKey] = $scope.studentsInGroup[student.userKey] || {};
                var userGroups = $scope.studentsInGroup[student.userKey];
                if (Object.values(userGroups).indexOf(student.groupKey) > -1) {
                    result.Group.result = 'Already Joined to "' + groupName + '"!';
                    result.Group.class = 'Success';
                } else {
                    var ref = firebase.database().ref('/StudentGroups/' + student.userKey);
                    var refKey = ref.push().key;
                    userGroups[refKey] = student.groupKey;
                    updates['/StudentGroups/' + student.userKey + '/' + ref.push().key] = student.groupKey;
                    result.Group.result = 'Join success to "' + groupName + '"!';
                    result.Group.class = 'New';
                }




                //=============================================================================
                //                check groupset
                //============================================================================

                var teacherKey = group.teacherId ? group.teacherId : $rootScope.settings.userId;
                var setName = student['Tutorial Set'] ? student['Tutorial Set'] : $scope.default_group['Tutorial Set'];

                if (!setName) {
                    result['Tutorial Set'].result = 'Unspecified!';
                    $scope.resultList.push(result);
                    continue;
                }
                setName = setName.trim();
                // check groupset exist
                group.groupsets = group.groupsets || {};
                var groupset = undefined;
                var existGroupset = false;
                for (key in group.groupsets) {
                    groupset = group.groupsets[key];
                    if (groupset.name == setName) {
                        student.setKey = key;
                        existGroupset = true;
                        break;
                    }
                }
                if (!existGroupset) {
                    result['Tutorial Set'].result = 'Unknown GroupSet!';
                    $scope.resultList.push(result);
                    continue;
                }
                // check if joined to groupset

                var setData = groupset.data;
                setData.members = setData.members || [];


                // check set index
                var childGroup = undefined;
                var joinedTutorialIndex = -1;
                var setIndex = 'auto';
                if (student['Tutorial']) {
                    student['Tutorial'] = student['Tutorial'].trim();
                    setIndex = undefined;
                    for (var gi = 0; gi < setData.groups.length; gi++) {
                        if (setData.groups[gi].name == undefined) {
                            setData.groups[gi].name = groupset.name + ' ' + (gi + 1);
                        }
                        if (setData.groups[gi].name == student['Tutorial']) {
                            setIndex = gi;
                        }
                    }
                }

                // get joined groupset
                for (var gi = 0; gi < setData.groups.length; gi++) {
                    setData.groups[gi].members = setData.groups[gi].members || [];
                    if (setData.groups[gi].members.indexOf(student.userKey) > -1) {
                        joinedTutorialIndex = gi;
                        break;
                    }
                }
                if (setData.members.indexOf(student.userKey) > -1) {//********** if joined subgroup
                    result['Tutorial Set'].result = 'Already Joined to "' + setName + '"!';
                    result['Tutorial Set'].class = 'Success';

                    switch (setIndex) {
                        case undefined:
                            result['Tutorial'].result = 'Unknown Tutorial Name!';
                            break;
                        case 'auto':
                            setIndex = joinedTutorialIndex
                            childGroup = setData.groups[setIndex];
                            result['Tutorial'].result = 'Already joined to "' + setData.groups[setIndex].name + '"';
                            result['Tutorial'].class = 'Success';
                            break;
                        default:
                            if (setData.groups[setIndex].members.indexOf(student.userKey) > -1) {
                                childGroup = setData.groups[setIndex];
                                result['Tutorial'].result = 'Already joined to "' + setData.groups[setIndex].name + '"';
                                result['Tutorial'].class = 'Success';
                            } else {
                                if (groupset.exclusive) {
                                    result['Tutorial'].result = 'Already joined to "' + setData.groups[joinedTutorialIndex].name + '"';
                                } else {
                                    if (groupset.max_member > setData.groups[setIndex].member_count) {
                                        setData.groups[setIndex].member_count++;
                                        setData.groups[setIndex].members.push(student.userKey);
                                        childGroup = setData.groups[setIndex];

                                        updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/' + setIndex + '/member_count'] = childGroup.member_count;
                                        updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/' + setIndex + '/members'] = childGroup.members;
                                        result['Tutorial'].result = 'Joined to "' + setData.groups[setIndex].name + '"';
                                        result['Tutorial'].class = 'New';
                                    } else {
                                        result['Tutorial'].result = '"' + setData.groups[setIndex].name + '" is full.';
                                    }
                                }
                            }
                            break;
                    }
                    if (!childGroup) {
                        $scope.resultList.push(result);
                        continue;
                    }
                } else {                                            // if************ unjoined subgroup
                    switch (setIndex) {
                        case undefined:
                            result['Tutorial'].result = 'Unknown Tutorial Name!';
                            break;
                        case 'auto':
                            for (var gi = 0; gi < setData.groups.length; gi++) {
                                if (groupset.max_member > setData.groups[gi].member_count) {
                                    setIndex = gi;
                                    childGroup = setData.groups[gi];
                                    childGroup.member_count++;
                                    childGroup.members = setData.groups[gi].members || [];
                                    childGroup.members.push(student.userKey);
                                    updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/' + gi + '/member_count'] = childGroup.member_count;
                                    updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/' + gi + '/members'] = childGroup.members;
                                    result['Tutorial'].result = 'Joined to "' + setData.groups[setIndex].name + '"';
                                    result['Tutorial'].class = 'New';
                                    break;
                                }
                            }
                            if (!childGroup) {
                                result['Tutorial'].result = 'All tutorials are fulled!';
                                result['Tutorial'].class = 'Failed';
                            }
                            break;
                        default:   //specified index
                            if (groupset.max_member > setData.groups[setIndex].member_count) {
                                setData.groups[setIndex].member_count++;
                                setData.groups[setIndex].members.push(student.userKey);
                                childGroup = setData.groups[setIndex];

                                updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/' + setIndex + '/member_count'] = childGroup.member_count;
                                updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/' + setIndex + '/members'] = childGroup.members;
                                result['Tutorial'].result = 'Joined to (' + setData.groups[setIndex].name + ')';
                                result['Tutorial'].class = 'New';
                            } else {
                                result['Tutorial'].result = '"' + setData.groups[setIndex].name + '" is full.';
                            }
                            break;
                    }
                    if (!childGroup) {
                        result['Tutorial Set'].result = 'Join Failed!';
                        $scope.resultList.push(result);
                        continue;
                    } else {
                        setData.member_count++;
                        setData.members.push(student.userKey);
                        updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/member_count'] = setData.member_count;
                        updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/members'] = setData.members;
                        result['Tutorial Set'].result = 'Joined to "' + setData.groups[setIndex].name + '"';
                        result['Tutorial Set'].class = 'New';
                    }
                }


                //=============================================================================
                //                check sub groupset
                //============================================================================

                var subsetName = student['Team Set'] ? student['Team Set'] : $scope.default_group['Team Set'];
                if (!subsetName) {
                    result['Team Set'].result = 'Unspecified!';
                    $scope.resultList.push(result);
                    continue;
                }
                subsetName = subsetName.trim();

                // check subgroupset exist
                groupset.subgroupsets = groupset.subgroupsets || {};
                var subgroupset = undefined;
                var existSubGroupset = false;
                for (key in groupset.subgroupsets) {
                    subgroupset = groupset.subgroupsets[key];
                    if (subgroupset.name == subsetName) {
                        student.subSetKey = key;
                        existSubGroupset = true;
                        break;
                    }
                }
                if (!existSubGroupset) {
                    result['Team Set'].result = 'Team Set Name!';
                    $scope.resultList.push(result);
                    continue;
                }

                // check if joined to subgroupset
                //   childGroup is joined subgroup

                var subSetData = childGroup.subgroupsets[student.subSetKey];
                subSetData.members = subSetData.members || [];
                // check Tutorial
                var childSubGroup = undefined;
                var joinedSubGroupsetIndex = -1;
                var subSetIndex = 'auto';
                if (student['Team']) {
                    student['Team'] = student['Team'].trim();
                    subSetIndex = undefined;
                    for (var gi = 0; gi < subSetData.groups.length; gi++) {
                        if (subSetData.groups[gi].name == undefined) {
                            subSetData.groups[gi].name = groupset.name + ' ' + (gi + 1);
                        }
                        if (subSetData.groups[gi].name == student['Team']) {
                            subSetIndex = gi;
                        }
                    }
                }
                // get joined subgroupset
                for (var gi = 0; gi < subSetData.groups.length; gi++) {
                    subSetData.groups[gi].members = subSetData.groups[gi].members || [];
                    if (subSetData.groups[gi].members.indexOf(student.userKey) > -1) {
                        joinedSubGroupsetIndex = gi;
                        break;
                    }
                }

                if (subSetData.members.indexOf(student.userKey) > -1) {//********** if joined secondsubgroup
                    result['Team Set'].result = 'Already Joined to "' + subsetName + '"!';
                    result['Team Set'].class = 'Success';

                    switch (subSetIndex) {
                        case undefined:
                            result['Team'].result = 'Unknown team name!';
                            break;
                        case 'auto':
                            subSetIndex = joinedSubGroupsetIndex
                            childSubGroup = subSetData.groups[subSetIndex];
                            result['Team'].result = 'Already joined to "' + subSetData.groups[subSetIndex].name + '"';
                            result['Team'].class = 'Success';
                            break;
                        default:
                            if (subSetData.groups[subSetIndex].members.indexOf(student.userKey) > -1) {
                                childSubGroup = subSetData.groups[subSetIndex];
                                result['Team'].result = 'Already joined to "' + subSetData.groups[subSetIndex].name + '"';
                                result['Team'].class = 'Success';
                            } else {
                                if (subgroupset.exclusive) {
                                    result['Team'].result = 'Already joined to "' + subSetData.groups[joinedSubGroupsetIndex].name + '"';
                                } else {
                                    if (subgroupset.max_member > subSetData.groups[subSetIndex].member_count) {
                                        subSetData.groups[subSetIndex].member_count++;
                                        subSetData.groups[subSetIndex].members.push(student.userKey);
                                        childSubGroup = subSetData.groups[subSetIndex];
                                        updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/'
                                            + setIndex + '/subgroupsets/' + student.subSetKey + '/groups/' + subSetIndex + '/member_count'] = childSubGroup.member_count;
                                        updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/'
                                            + setIndex + '/subgroupsets/' + student.subSetKey + '/groups/' + subSetIndex + '/members'] = childSubGroup.members;
                                        result['Team'].result = 'Joined to "' + subSetData.groups[subSetIndex].name + '"';
                                        result['Team'].class = 'New';
                                    } else {
                                        result['Team'].result = '"' + subSetData.groups[subSetIndex].name + '" is full.';
                                    }
                                }
                            }
                            break;
                    }
                    if (!childSubGroup) {
                        $scope.resultList.push(result);
                        continue;
                    }
                } else {                                            // if************ unjoined subgroup
                    switch (subSetIndex) {
                        case undefined:
                            result['Team'].result = 'Unknown team name!';
                            break;
                        case 'auto':
                            for (var gi = 0; gi < subSetData.groups.length; gi++) {
                                if (groupset.max_member > subSetData.groups[gi].member_count) {
                                    subSetIndex = gi;
                                    childSubGroup = subSetData.groups[gi];
                                    childSubGroup.member_count++;
                                    childSubGroup.members = subSetData.groups[gi].members || [];
                                    childSubGroup.members.push(student.userKey);
                                    updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/'
                                        + setIndex + '/subgroupsets/' + student.subSetKey + '/groups/' + gi + '/member_count'] = childSubGroup.member_count;
                                    updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/'
                                        + setIndex + '/subgroupsets/' + student.subSetKey + '/groups/' + gi + '/members'] = childSubGroup.members;
                                    result['Team'].result = 'Joined to "' + subSetData.groups[subSetIndex].name + '"';
                                    result['Team'].class = 'New';
                                    break;
                                }
                            }
                            if (!childSubGroup) {
                                result['Team'].result = 'All teams are fulled!';
                                result['Team'].class = 'Failed';
                            }
                            break;
                        default:   //specified index
                            if (subgroupset.max_member > subSetData.groups[subSetIndex].member_count) {
                                subSetData.groups[subSetIndex].member_count++;
                                subSetData.groups[subSetIndex].members.push(student.userKey);
                                childSubGroup = subSetData.groups[subSetIndex];
                                updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/'
                                    + setIndex + '/subgroupsets/' + student.subSetKey + '/groups/' + subSetIndex + '/member_count'] = childSubGroup.member_count;
                                updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/'
                                    + setIndex + '/subgroupsets/' + student.subSetKey + '/groups/' + subSetIndex + '/members'] = childSubGroup.members;
                                result['Team'].result = 'Joined to "' + subSetData.groups[subSetIndex].name + '"';
                                result['Team'].class = 'New';
                            } else {
                                result['Team'].result = '"' + subSetData.groups[subSetIndex].name + '" is full.';
                            }
                            break;
                    }
                    if (!childSubGroup) {
                        result['Team Set'].result = 'Join Failed!';
                        $scope.resultList.push(result);
                        continue;
                    } else {
                        subSetData.member_count++;
                        subSetData.members.push(student.userKey);
                        updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/'
                            + setIndex + '/subgroupsets/' + student.subSetKey + '/member_count'] = setData.member_count;
                        updates['/Groups/' + teacherKey + '/' + student.groupKey + '/groupsets/' + student.setKey + '/data/groups/'
                            + setIndex + '/subgroupsets/' + student.subSetKey + '/members'] = setData.members;
                        result['Team Set'].result = 'Joined to "' + setName + '"!';
                        result['Team Set'].class = 'New';
                    }
                }
                if (childSubGroup) {
                    student.Result = "Success";
                }
                $scope.resultList.push(result);
            }
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Upload finished!');
            });
            $rootScope.safeApply();
        }
        $scope.getClass = function (field, user) {
            if (field != 'Result') return '';
            return user['Result'];
        }
        $scope.getRowSpan = function (index) {
            if (!$scope.resultList) return 1;
            if (index > 0 && index < $scope.fields.length - 1) return 1;
            return 2;
        }
    }
})();