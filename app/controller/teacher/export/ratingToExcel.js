(function () {

    angular
        .module('myApp')
        .controller('exportRatingToExcelController', exportRatingToExcelController)

    exportRatingToExcelController.$inject = ['$state', '$scope', '$rootScope'];

    function exportRatingToExcelController($state, $scope, $rootScope) {
        // **************   router:    exportRatingToExcel  *****************

        $rootScope.setData('showMenubar', true);
        var groupType = $rootScope.settings.groupType;
        switch (groupType) {
            case 'group':
                $rootScope.setData('backUrl', "groupRoot");
                $scope.groupName = $rootScope.settings.groupName;
                break;
            case 'sub':
                $rootScope.setData('backUrl', "exportSub");
                $scope.title = $rootScope.settings.subGroupName;
                $scope.groupName = $rootScope.settings.subGroupName;
                break;
            case 'second':
                $rootScope.setData('backUrl', "exportSecond");
                $scope.groupName = $rootScope.settings.secondGroupName;
                break;
            default:
                break;
        }

        $scope.question = $rootScope.settings.question;
        $scope.anonymous = $scope.question.anonymous;
        $scope.show_email = false;
       
        $scope.items = $scope.question.teamRate ? $rootScope.settings.groupNames : ($scope.question.ratingItems || []);
        $scope.options = ($scope.question.ratingOptions) ? $scope.question.ratingOptions : [];

        $scope.$on('$destroy', function () {
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.answersRef) $scope.answersRef.off('value')
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
        })

        $scope.initExport = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getUsers();
            $scope.getGroups();
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.users = {};
                if (snapshot.val()) {
                    snapshot.forEach(function (childsnapshot) {
                        $scope.users[childsnapshot.key] = childsnapshot.val();
                        if (childsnapshot.key == $rootScope.settings.teacherId) {
                            $scope.anonym_enabled = childsnapshot.val().anonym_enabled;
                            $rootScope.safeApply();
                        }
                    });
                }
                $scope.ref_1 = true
                $scope.getAnswers()
            });
        }
        $scope.getGroups = function () {
            $scope.groupRef = firebase.database().ref('StudentGroups');
            $scope.groupRef.once('value', function (studentGroups) {
                $scope.studentsInGroup = [];
                var studentGroup = studentGroups.val();
                for (var studentKey in studentGroup) {
                    var obj = studentGroup[studentKey];
                    if (Object.values(obj).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                $scope.ref_2 = true
                $scope.getAnswers()
            })
        }

        $scope.getAnswers = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $scope.answers = [];
            for (var i = 0; i < $scope.items.length; i++) {
                $scope.answers[i] = {
                    avScore: 0,
                    item: $scope.items[i],
                    userDatas: [],
                }
            }
            if (groupType == 'group') {
                $scope.answersRef = firebase.database().ref('NewAnswers/' + $scope.question.code + '/answer/');
            } else {
                $scope.answersRef = firebase.database().ref('GroupAnswers/').orderByChild('questionKey').equalTo($scope.question.code);
            }
            $scope.answersRef.on('value', function (ansSnapshot) {
                $scope.userCount = 0;
                ansSnapshot.forEach(function (childSnapshot) {
                    var answer = childSnapshot.val();
                    var condition = false;
                    var userKey = undefined;
                    switch (groupType) {
                        case 'group':
                            userKey = childSnapshot.key;
                            if ($scope.studentsInGroup.indexOf(userKey) > -1) {
                                condition = true;
                            }
                            break;
                        case 'sub':
                            userKey = answer.uid;
                            if (answer.groupType == 'sub' && answer.studentgroupkey == $rootScope.settings.groupKey && answer.groupSetKey == $rootScope.settings.groupSetKey &&
                                answer.subIndex == $rootScope.settings.subIndex) {
                                condition = true;
                            }
                            break;
                        case 'second':
                            userKey = answer.uid;
                            if (answer.groupType == 'second' && answer.studentgroupkey == $rootScope.settings.groupKey && answer.groupSetKey == $rootScope.settings.groupSetKey &&
                                answer.subIndex == $rootScope.settings.subIndex && answer.subSetKey == $rootScope.settings.subSetKey && answer.secondIndex == $rootScope.settings.secondIndex) {
                                condition = true;
                            }
                            break;
                        default:
                            break;
                    }
                    if (condition) {
                        var rowData = {};
                        $scope.userCount++;
                        var profileinformation = $scope.users[userKey];

                        for (var i = 0; i < $scope.items.length; i++) {
                            var rowData = {};
                            rowData['Userkey'] = profileinformation.Userkey;
                            rowData['mail'] = ($scope.anonymous) ? "Anonymous" : answer.mail;
                            rowData['show_id'] = ($scope.anonymous) ? "Anonymous" : profileinformation.show_id;
                            rowData.anonymous = $scope.anonymous;
                            // rowData['answer'] = answer.answer;
                            rowData['datetime'] = answer.datetime;
                            // rowData['question'] = exportQuestionString;
                            rowData['Age'] = profileinformation.age;
                            rowData['Country'] = profileinformation.country;
                            rowData['Gender'] = profileinformation.gender;
                            rowData['Profession'] = profileinformation.profession;
                            rowData['Mothertongue'] = profileinformation.countrylanguage;

                            rowData['feedText'] = (answer.answer[i].feedbacktext) ? answer.answer[i].feedbacktext : '';
                            rowData['scores'] = answer.answer[i].rating;
                            rowData['avScore'] = 0;
                            for (var j = 0; j < $scope.options.length; j++) {
                                $scope.answers[i].avScore += answer.answer[i].rating[j];
                                rowData['avScore'] += answer.answer[i].rating[j];
                            }
                            if ($scope.options.length > 0) {
                                rowData['avScore'] = Math.round(rowData['avScore'] * 10 / $scope.options.length) / 10;
                            }
                            $scope.answers[i].userDatas.push(rowData);
                        }
                    }
                });


                if ($scope.userCount == 0) {
                    $scope.noAnswerMessage = "There isn't any answers.";
                }
                var userCount1 = $scope.userCount * $scope.options.length;
                if (userCount1 != 0) {
                    for (var i = 0; i < $scope.items.length; i++) {
                        $scope.answers[i].avScore = Math.round($scope.answers[i].avScore * 10 / userCount1) / 10;
                    }
                }
                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.change_show_user = function () {
            $scope.show_email = !$scope.show_email;
        }
    }
})();