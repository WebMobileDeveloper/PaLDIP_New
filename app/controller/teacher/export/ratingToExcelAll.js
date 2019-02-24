(function () {

    angular
        .module('myApp')
        .controller('ratingToExcelAllController', ratingToExcelAllController)

    ratingToExcelAllController.$inject = ['$state', '$scope', '$rootScope'];

    function ratingToExcelAllController($state, $scope, $rootScope) {
        // **************   router:    ratingToExcelAll  *****************

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
        $scope.show_email = false;

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
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }
        $scope.getUsers = function () {
            var usersRef = firebase.database().ref('Users');
            usersRef.on('value', function (snapshot) {
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
            $scope.answers = {};
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
                $scope.answers[exportQuestionKey] = {
                    key: exportQuestionKey,
                    userCount: 0,
                    items: question.teamRate ? $rootScope.settings.groupNames : (question.ratingItems || []),
                    options: (question.ratingOptions) ? question.ratingOptions : [],
                    question: question.question,
                    answers: [],
                };
                var tempAnswer = $scope.answers[exportQuestionKey];
                for (var i = 0; i < tempAnswer.items.length; i++) {
                    tempAnswer.answers[i] = {
                        avScore: 0,
                        item: tempAnswer.items[i],
                        userDatas: [],
                    }
                }
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
                        tempAnswer.userCount++;
                        var profileinformation = $scope.users[userKey];

                        for (var i = 0; i < tempAnswer.items.length; i++) {
                            var rowData = {};
                            rowData['mail'] = (anonymous) ? "Anonymous" : answer.mail;
                            rowData['show_id'] = (anonymous) ? "Anonymous" : profileinformation.show_id;
                            rowData['datetime'] = answer.datetime;
                            rowData['question'] = question;
                            rowData['Age'] = profileinformation.age;
                            rowData['Country'] = profileinformation.country;
                            rowData['Gender'] = profileinformation.gender;
                            rowData['Profession'] = profileinformation.profession;
                            rowData['Mothertongue'] = profileinformation.countrylanguage;

                            rowData['feedText'] = (answer.answer[i].feedbacktext) ? answer.answer[i].feedbacktext : '';
                            rowData['scores'] = answer.answer[i].rating;
                            rowData['avScore'] = 0;
                            for (var j = 0; j < tempAnswer.options.length; j++) {
                                tempAnswer.answers[i].avScore += answer.answer[i].rating[j];
                                rowData['avScore'] += answer.answer[i].rating[j];
                            }
                            if (tempAnswer.options.length > 0) {
                                rowData['avScore'] = Math.round(rowData['avScore'] * 10 / tempAnswer.options.length) / 10;
                            }
                            tempAnswer.answers[i].userDatas.push(rowData);
                        }
                    }
                });
                var userCount1 = tempAnswer.userCount * tempAnswer.options.length;
                if (userCount1 != 0) {
                    for (var i = 0; i < tempAnswer.items.length; i++) {
                        tempAnswer.answers[i].avScore = Math.round(tempAnswer.answers[i].avScore * 10 / userCount1) / 10;
                    }
                }
                $scope.totalLoopCount--;
                if ($scope.totalLoopCount == 0) {
                    // if ($scope.answers.length == 0) {
                    //     $scope.noAnswerMessage = "There isn't any answers.";
                    // }

                    $rootScope.setData('loadingfinished', true);
                }
            });
        }

        $scope.change_show_user = function () {
            $scope.show_email = !$scope.show_email;
        }


    }
})();