(function () {

    angular
        .module('myApp')
        .controller('contingentToExcelAllController', contingentToExcelAllController)

    contingentToExcelAllController.$inject = ['$state', '$scope', '$rootScope'];

    function contingentToExcelAllController($state, $scope, $rootScope) {
        // **************   router:    contingentToExcelAll  *****************

        $rootScope.setData('showMenubar', true);
        $scope.show_email = false;
        $scope.note = ["A", "B"];

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
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.ansRefArr) {
                $scope.ansRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        });

        $scope.initExportAll = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getGroups();
        }

        $scope.getGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (studentGroups) {
                $scope.studentsInGroup = [];
                var studentGroup = studentGroups.val();
                for (var studentKey in studentGroup) {
                    var obj = studentGroup[studentKey];
                    if (Object.values(obj).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                $scope.getUsers();
            })
        }
        $scope.getUsers = function () {
            if ($scope.usersRef) $scope.usersRef.off('value')
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
                $scope.answers = {};
                var questionArr = $rootScope.settings.exportItem.questions;
                $scope.totalLoopCount = questionArr.length;

                if ($scope.ansRefArr) {
                    $scope.ansRefArr.forEach(ref => {
                        ref.off('value')
                    });
                }
                $scope.ansRefArr = []
                questionArr.forEach(question => {
                    $scope.getAnswers(question);
                });
                for (var i = 0; i < questionArr.length; i++) {
                    var anonymous = questionArr[i].anonymous;
                    $scope.getAnswers(questionArr[i].code, questionArr[i], anonymous);
                }
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
            $scope.ansRefArr.push(answersRef)
            answersRef.on('value', function (ansSnapshot) {
                $scope.answers[exportQuestionKey] = {
                    key: exportQuestionKey,
                    question: question.question,
                    subQuestions: question.subQuestions,
                    answers: [],
                };
                var tempAnswer = $scope.answers[exportQuestionKey];
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
                        var rowData = {};
                        rowData['mail'] = (anonymous) ? "Anonymous" : answer.mail;
                        rowData['show_id'] = (anonymous) ? "Anonymous" : profileinformation.show_id;
                        rowData['datetime'] = answer.datetime;
                        rowData['Age'] = profileinformation.age;
                        rowData['Country'] = profileinformation.country;
                        rowData['Gender'] = profileinformation.gender;
                        rowData['Profession'] = profileinformation.profession;
                        rowData['Mothertongue'] = profileinformation.countrylanguage;
                        rowData['answer'] = answer.answer;
                        tempAnswer.answers.push(rowData);
                    }
                });
                $scope.totalLoopCount--;
                if ($scope.totalLoopCount == 0) {
                    $rootScope.setData('loadingfinished', true);
                }
            });
        }

        $scope.change_show_user = function () {
            $scope.show_email = !$scope.show_email;
        }

        $scope.getUserData = function (question, index, subCount) {
            var user = undefined;
            if (index % subCount == 0) {
                userIndex = Math.floor(index / subCount);
                user = question.answers[userIndex];
            }
            return user;
        }
        $scope.getSubData = function (question, index, userCount) {
            var sub = undefined;
            if (index % userCount == 0) {
                subIndex = Math.floor(index / userCount);
                sub = question.subQuestions[subIndex];
            }
            return sub;
        }

        $scope.convertAnswer = function (arr) {
            var ansIndex = 0;
            for (var i = 0; i < arr.length; i++) {
                ansIndex += arr[i] * Math.pow(2, arr.length - i - 1);
            }
            var answer = String("00000000000000" + ansIndex.toString(2)).slice(-1 * arr.length);
            answer = answer.replace(/0/g, "A");
            answer = answer.replace(/1/g, "B");
            return answer;
        }

    }
})();