(function () {

    angular
        .module('myApp')
        .controller('exportToExcelAllController', exportToExcelAllController)

    exportToExcelAllController.$inject = ['$state', '$scope', '$rootScope'];

    function exportToExcelAllController($state, $scope, $rootScope) {
        // **************   router:    exportToExcelAll  *****************
        $rootScope.setData('showMenubar', true);
        var groupType = $rootScope.settings.groupType;
        switch (groupType) {
            case 'group':
                $rootScope.setData('backUrl', "groupRoot");
                $scope.groupName = $rootScope.settings.groupName;
                break;
            case 'sub':
                $rootScope.setData('backUrl', "groupSubRoot");
                $scope.groupName = $rootScope.settings.groupName + ' / ' + $rootScope.settings.subGroupName;
                break;
            case 'second':
                $rootScope.setData('backUrl', "groupSecondRoot");
                $scope.groupName = $rootScope.settings.groupName + ' / ' + $rootScope.settings.subGroupName + ' / ' + $rootScope.settings.secondGroupName;
                break;
            default:
                break;
        }
        $scope.show_email = false;

        $scope.hidefeedfield = false;
        $scope.feedtextlimit = 3;
        switch ($rootScope.settings.exportItem.key) {
            case "Rating_Type":
                $scope.ratingType = true;
                break;
            case "Feedback_Type":
                $(".detachingfield").detach();
                $scope.feedtextlimit = 0;
                $scope.hidefeedfield = true;
                break;
        }
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.answersRefRefArr) {
                $scope.answersRefRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        })

        $scope.initExportAll = function () {
            $rootScope.setData('loadingfinished', false);


            $scope.getGroups();
            $scope.getUsers();
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
                $scope.ref_1 = true
                $scope.finalCalc()
            })
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
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $scope.answers = [];
            var questionArr = $rootScope.settings.exportItem.questions;
            $scope.totalLoopCount = questionArr.length;

            if ($scope.answersRefRefArr) {
                $scope.answersRefRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
            $scope.answersRefRefArr = []
            questionArr.forEach(question => {
                $scope.getAnswers(question);
            });
        }
        $scope.getAnswers = function (question) {
            let exportQuestionKey = question.code;
            let anonymous = question.anonymous;
            if (groupType == 'group') {
                var answersRef = firebase.database().ref('NewAnswers/' + exportQuestionKey + '/answer/');
            } else {
                var answersRef = firebase.database().ref('GroupAnswers/').orderByChild('questionKey').equalTo(exportQuestionKey);
            }
            $scope.answersRefRefArr.push(answersRef)
            answersRef.on('value', function (ansSnapshot) {
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
                        rowData['mail'] = (anonymous) ? "Anonymous" : answer.mail;
                        rowData['show_id'] = (anonymous) ? "Anonymous" : profileinformation.show_id;
                        rowData['answer'] = typeof (answer.answer) == "string" ? answer.answer.replace(/#%%#/g, ",  ") : answer.answer;
                        rowData['datetime'] = answer.datetime;
                        rowData['question'] = question;
                        rowData['Age'] = profileinformation.age;
                        rowData['Country'] = profileinformation.country;
                        rowData['Gender'] = profileinformation.gender;
                        rowData['Profession'] = profileinformation.profession;
                        rowData['Mothertongue'] = profileinformation.countrylanguage;
                        if ($rootScope.settings.exportItem.key == "Feedback_Type") {
                            rowData['feedtxt'] = {};
                            rowData['score'] = 0;
                            var totalscore = 0;
                            var scoreCount = 0;
                            for (var key in answer.Feedbacks) {
                                var feedback = answer.Feedbacks[key];
                                if (feedback.userType == 'student') {
                                    rowData['feedtxt'][key] = {
                                        mail: (anonymous) ? $scope.users[key].show_id : $scope.users[key].ID,
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
                $scope.totalLoopCount--;
                if ($scope.totalLoopCount == 0) {
                    if ($scope.answers.length == 0) {
                        $scope.noAnswerMessage = "There isn't any answers.";
                    }
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.safeApply();
                }
            });
        }

        $scope.change_show_user = function () {
            $scope.show_email = !$scope.show_email;
        }


    }
})();