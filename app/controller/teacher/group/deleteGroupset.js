(function () {

    angular
        .module('myApp')
        .controller('deleteGroupsetController', deleteGroupsetController)

    deleteGroupsetController.$inject = ['$state', '$scope', '$rootScope'];

    function deleteGroupsetController($state, $scope, $rootScope) {

        $scope.initExportAll = function () {
            $rootScope.setData('showMenubar', true);
            $rootScope.setData('backUrl', "groupsets");
            $scope.groupType = $rootScope.settings.groupType;
            $scope.groupName = $rootScope.settings.exportGroupName;
            $scope.questions = $rootScope.settings.questions;
            $scope.show_email = false;
            $scope.GroupAnswerKeys = [];

            if (angular.equals($scope.questions, {})) {
                $scope.noAnswerMessage = "There isn't any answers.";
                $rootScope.safeApply();
                return;
            }
            $rootScope.setData('loadingfinished', false);
            $scope.getDBAnswers();
        }
        $scope.getDBAnswers = function () {
            var answersRef = firebase.database().ref('GroupAnswers/').orderByChild('groupSetKey').equalTo($rootScope.settings.groupSetKey);
            if ($scope.groupType == 'second') {
                answersRef = firebase.database().ref('GroupAnswers/').orderByChild('subSetKey').equalTo($rootScope.settings.subSetKey);
            }
            answersRef.on('value', function (ansSnapshot) {
                $scope.dbAnswers = [];
                $scope.userKeys = [];
                $scope.GroupAnswerKeys = [];
                ansSnapshot.forEach(function (childSnapshot) {
                    $scope.dbAnswers.push(childSnapshot.val());
                    $scope.userKeys.push(childSnapshot.val().uid);
                    $scope.GroupAnswerKeys.push(childSnapshot.key);
                });

                if ($scope.dbAnswers.length == 0) {
                    $scope.noAnswerMessage = "There isn't any answers.";
                    $rootScope.setData('loadingfinished', true);
                } else {
                    $scope.getQuestions();
                }
            });
        }
        $scope.getQuestions = function () {
            $scope.qstArr = {}
            for (var setKey in $scope.questions) {
                var qstArr = $scope.questions[setKey];
                qstArr.forEach(qst => {
                    $scope.qstArr[qst.key] = qst;
                });
            }

            $scope.getUsers();
        }

        $scope.getUsers = function () {
            var usersRef = firebase.database().ref('Users');
            usersRef.on('value', function (snapshot) {
                $scope.users = {};

                snapshot.forEach(function (childsnapshot) {
                    $scope.users[childsnapshot.key] = childsnapshot.val();
                    if (childsnapshot.key == $rootScope.settings.teacherId) {
                        $scope.anonym_enabled = childsnapshot.val().anonym_enabled;
                    }
                });

                $scope.getAnswers();
            });
        }

        $scope.getAnswers = function () {
            $scope.allAnswers = {};
            $scope.dbAnswers.forEach(function (answer) {
                var rowData = {};
                var profile = $scope.users[answer.uid];
                var questionType = $scope.qstArr[answer.questionKey].questionType;
                var anonymous = $scope.qstArr[answer.questionKey].anonymous;

                rowData['mail'] = (anonymous) ? "Anonymous" : answer.mail;
                rowData['show_id'] = (anonymous) ? "Anonymous" : profile.show_id;
                rowData['answer'] = answer.answer;
                rowData['datetime'] = answer.datetime;
                rowData['question'] = $scope.qstArr[answer.questionKey];
                rowData['Age'] = profile.age;
                rowData['Country'] = profile.country;
                rowData['Gender'] = profile.gender;
                rowData['Profession'] = profile.profession;
                rowData['Mothertongue'] = profile.countrylanguage;
                rowData['groupIndex'] = ($scope.groupType == 'sub') ? answer.subIndex + 1 : answer.secondIndex + 1;
                if (questionType == "Feedback Type") {
                    rowData['feedtxt'] = {};
                    rowData['score'] = 0;
                    for (var key in answer['FeedbackTexts']) {
                        if (rowData['feedtxt'][key]) {
                            rowData['feedtxt'][key].text = answer['FeedbackTexts'][key];
                        } else {
                            rowData['feedtxt'][key] = {
                                mail: (anonymous) ? $scope.users[key].show_id : $scope.users[key].ID,
                                show_id: $scope.users[key].show_id,
                                text: answer['FeedbackTexts'][key]
                            };
                        }
                    }
                    j = 0;
                    var totalscore = 0;
                    for (var key in answer['Feedbacks']) {
                        answer['Feedbacks'][key].forEach(score => {
                            totalscore += score;
                            j++;
                        });
                        if (rowData['feedtxt'][key]) {
                            rowData['feedtxt'][key].score = answer['Feedbacks'][key];
                        } else {
                            rowData['feedtxt'][key] = {
                                mail: (anonymous) ? $scope.users[key].show_id : $scope.users[key].ID,
                                show_id: $scope.users[key].show_id,
                                score: answer['Feedbacks'][key]
                            };
                        }
                    }
                    if (totalscore !== 0)
                        rowData['averagescore'] = Math.round(totalscore / j * 10) / 10;
                }
                if (!$scope.allAnswers[questionType]) {
                    $scope.allAnswers[questionType] = [];
                }
                $scope.allAnswers[questionType].push(rowData);

            });
            $rootScope.setData('loadingfinished', true);
        }

        $scope.change_show_user = function () {
            $scope.show_email = !$scope.show_email;
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
        $scope.exportData = function () {
            i = 0;
            for (key in $scope.allAnswers) {
                $rootScope.exportToExcel('#table-' + i);
                i++;
            }
        }
        $scope.deleteGroupset = function () {
            if (confirm("Are you sure want to delete this groupset?")) {
                var teacherId = $rootScope.settings.teacherId;
                var groupKey = $rootScope.settings.groupKey;
                var groupSetKey = $rootScope.settings.groupSetKey;

                var updates = {};
                updates['Groups/' + groupKey + '/groupsets/' + groupSetKey] = {};

                $scope.GroupAnswerKeys.forEach(function (key) {
                    updates['GroupAnswers/' + key] = {};
                })

                firebase.database().ref().update(updates).then(function () {
                    $rootScope.success('Groupset has been deleted successfully!');
                    $state.go('groupsets');
                });
            }
        }
        $scope.deleteSubGroupset = function () {
            if (confirm("Are you sure want to delete this sub groupset?")) {
                var teacherId = $rootScope.settings.teacherId;
                var groupKey = $rootScope.settings.groupKey;
                var groupSetKey = $rootScope.settings.groupSetKey;
                var subSetKey = $rootScope.settings.subSetKey;
                var groupsetMemberData = angular.copy($rootScope.settings.groupsetMemberData);
                var updates = {};
                updates['Groups/' + groupKey + '/groupsets/' + groupSetKey + '/subgroupsets/' + subSetKey] = {};

                groupsetMemberData.forEach(function (group) {
                    group.subgroupsets[subSetKey] = {}
                })
                updates['Groups/' + groupKey + '/groupsets/' + groupSetKey + '/data/groups/'] = groupsetMemberData;

                $scope.GroupAnswerKeys.forEach(function (key) {
                    updates['GroupAnswers/' + key] = {};
                });

                firebase.database().ref().update(updates).then(function () {
                    $rootScope.success('Sub groupset has been deleted successfully!');
                    $state.go('groupsets');
                });
            }
        }

        $scope.replaceAnswer = function (answer) {
            return answer.replace(/#%%#/g, ", ");
        }
    }
})();