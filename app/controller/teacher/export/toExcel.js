(function () {

    angular
        .module('myApp')
        .controller('exportToExcelController', exportToExcelController)

    exportToExcelController.$inject = ['$state', '$scope', '$rootScope'];

    function exportToExcelController($state, $scope, $rootScope) {
        // **************   router:    exportToExcel  *****************

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
            $scope.hidefeedfield = false;
            $scope.feedtextlimit = 3;
            if ($scope.question.questionType != "Feedback Type") {
                $(".detachingfield").detach();
                $scope.hidefeedfield = true;
                if ($scope.question.questionType == "Text Type") {
                    $scope.feedtextlimit = 2;
                } else {
                    $scope.feedtextlimit = 0;
                }
            }
            $scope.getUsers();
            $scope.getGroups()
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.users = {};
                if (snapshot.val()) {
                    snapshot.forEach(function (childsnapshot) {
                        $scope.users[childsnapshot.key] = childsnapshot.val();
                        if (childsnapshot.key == $rootScope.settings.userId) {
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
            var groupRef = firebase.database().ref('StudentGroups');
            groupRef.once('value', function (studentGroups) {
                $scope.studentsInGroup = [];
                var studentGroup = studentGroups.val();
                for (var studentKey in studentGroup) {
                    var obj = studentGroup[studentKey];
                    if (Object.values(obj).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                $scope.ref_2 = true
                $scope.getAnswers();
            })
        }

        $scope.getAnswers = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $scope.answers = [];

            if (groupType == 'group') {
                $scope.answersRef = firebase.database().ref('NewAnswers/' + $scope.question.code + '/answer/');
            } else {
                $scope.answersRef = firebase.database().ref('GroupAnswers/').orderByChild('questionKey').equalTo($scope.question.code);
            }
            if ($scope.answersRef) $scope.answersRef.off('value')
            $scope.answersRef.on('value', function (ansSnapshot) {
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
                        var profileinformation = $scope.users[userKey];
                        rowData['Userkey'] = profileinformation.Userkey;
                        rowData['mail'] = ($scope.anonymous) ? "Anonymous" : answer.mail;
                        rowData['show_id'] = ($scope.anonymous) ? "Anonymous" : profileinformation.show_id;
                        rowData.anonymous = $scope.anonymous;
                        rowData['answer'] = $scope.convertAnswer(answer.answer, $scope.question.questionType);
                        rowData['datetime'] = answer.datetime;
                        rowData['question'] = $scope.question.question;
                        rowData['Age'] = profileinformation.age;
                        rowData['Country'] = profileinformation.country;
                        rowData['Gender'] = profileinformation.gender;
                        rowData['Profession'] = profileinformation.profession;
                        rowData['Mothertongue'] = profileinformation.countrylanguage;
                        if ($scope.question.questionType == "Text Type") {
                            rowData['score'] = answer.score;
                            rowData['feedback'] = answer.feedback;
                        }
                        if ($scope.question.questionType == "Feedback Type") {
                            rowData['feedtxt'] = {};
                            var totalscore = 0;
                            var scoreCount = 0;
                            for (var key in answer.Feedbacks) {
                                var feedback = answer.Feedbacks[key];
                                if (feedback.userType == 'student') {
                                    rowData['feedtxt'][key] = {
                                        mail: $scope.users[key].ID,
                                        show_id: $scope.users[key].show_id,
                                        text: feedback.text,
                                        score: feedback.score
                                    }
                                    if (feedback.score) {
                                        feedback.score.forEach(score => {
                                            totalscore += score;
                                            scoreCount++;
                                        });
                                    }
                                }
                            }
                            if (totalscore !== 0)
                                rowData['averagescore'] = Math.round(totalscore / scoreCount * 10) / 10;
                            rowData.awardScore = 0;
                            if (answer.awardScore) {
                                for (key in answer.awardScore) {
                                    rowData.awardScore += answer.awardScore[key];
                                }
                            }
                        }
                        $scope.answers.push(rowData);
                    }
                });

                if ($scope.answers.length == 0) {
                    $scope.noAnswerMessage = "There isn't any answers.";
                }
                $rootScope.setData('loadingfinished', true);

            });
        }

        $scope.change_show_user = function () {
            $scope.show_email = !$scope.show_email;
        }
        $scope.convertAnswer = function (origin, type) {
            switch (type) {
                case 'Contingent Type':
                    var ansIndex = 0;
                    for (var i = 0; i < origin.length; i++) {
                        ansIndex += origin[i] * Math.pow(2, origin.length - i - 1);
                    }
                    var answer = String("00000000000000" + ansIndex.toString(2)).slice(-1 * origin.length);
                    answer = answer.replace(/0/g, "A");
                    answer = answer.replace(/1/g, "B");
                    return answer;
                case 'Multiple Type':
                    var answer = origin.replace(/#%%#/g, ",  ")
                    return answer
                default:
                    return origin
            }
        }
    }
})();