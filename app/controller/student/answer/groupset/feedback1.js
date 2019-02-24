(function () {

    angular
        .module('myApp')
        .controller('GroupFeedbackAnswer1Controller', GroupFeedbackAnswer1Controller)

    GroupFeedbackAnswer1Controller.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function GroupFeedbackAnswer1Controller($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupFeedbackAnswer");
        $scope.question = $rootScope.settings.questionObj;
        var uid = $rootScope.settings.userId;
        $scope.uid = uid;


        $scope.qtype = $scope.qtype2 = $rootScope.settings.qtype;
        if ($scope.qtype == 2) {
            $scope.qtype2 = 0
        }

        $scope.feedbackquestions = $rootScope.settings.feedqts;
        if ($scope.feedbackquestions) {
            $scope.scalehide = 0;
        } else {
            $scope.scalehide = 1;
        }
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.answersRef) $scope.answersRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.selectedUserKey = undefined;
            $scope.getGroups();
        }
        $scope.getGroups = function () {
            var membersRefStr = '';
            if ($rootScope.settings.groupType == 'sub') {
                var membersRefStr = 'Groups/'  + $rootScope.settings.groupKey + '/groupsets/' + $rootScope.settings.groupSetKey
                    + '/data/groups/' + $rootScope.settings.subIndex + '/members/';
            } else {
                var membersRefStr = 'Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $rootScope.settings.groupSetKey
                    + '/data/groups/' + $rootScope.settings.subIndex + '/subgroupsets/' + $rootScope.settings.subSetKey + '/groups/' + $rootScope.settings.secondIndex + '/members/';
            }

            $scope.studentsInGroup = [];
            var membersRef = firebase.database().ref(membersRefStr);
            membersRef.once('value', function (members) {
                if (members.val()) {
                    $scope.studentsInGroup = members.val();
                }
                $scope.getanswers();
            })
        }
        $scope.getanswers = function () {
            var tempScores = [];
            if ($scope.feedbackquestions) {
                for (var i = 0; i < $scope.feedbackquestions.length; i++) {
                    tempScores.push(0);
                }
            }
            $scope.answersRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($rootScope.settings.questionKey);
            $scope.answersRef.on('value', function (snapshot) {
                $scope.answers = [];
                $scope.totalAwardScore = 0;
                $scope.totalAwardPeople = 0;
                for (var key in snapshot.val()) {
                    var ans = snapshot.val()[key];

                    if (ans.groupType != $rootScope.settings.groupType ||
                        ans.studentgroupkey != $rootScope.settings.groupKey ||
                        ans.groupSetKey != $rootScope.settings.groupSetKey

                    ) continue;
                    if ($rootScope.settings.groupType == 'sub') { //if 1st child group answer
                        var isInvalid = false;
                        switch ($scope.question.groupFeedback) {
                            case 'team':
                                if (ans.subIndex != $rootScope.settings.subIndex) isInvalid = true;
                                if (ans.uid == uid) isInvalid = true;
                                break;
                            case 'group':
                                if (ans.subIndex == $rootScope.settings.subIndex && !$rootScope.settings.selfRate) isInvalid = true;
                                break;
                            case 'other':
                                if (ans.subIndex == $rootScope.settings.subIndex) isInvalid = true;
                                break;
                        }
                        if (isInvalid) continue;

                    } else {                                        //if 2nd child group answer
                        if (ans.subIndex != $rootScope.settings.subIndex || ans.subSetKey != $rootScope.settings.subSetKey) continue;
                        var isInvalid = false;
                        switch ($scope.question.groupFeedback) {
                            case 'team':
                                if (ans.secondIndex != $rootScope.settings.secondIndex) isInvalid = true;
                                if (ans.uid == uid) isInvalid = true;
                                break;
                            case 'group':
                                if (ans.secondIndex == $rootScope.settings.secondIndex && !$rootScope.settings.selfRate) isInvalid = true;
                                break;
                            case 'other':
                                if (ans.secondIndex == $rootScope.settings.secondIndex) isInvalid = true;
                                break;
                        }
                        if (isInvalid) continue;
                    }


                    ans['Feedbacks'] = ans['Feedbacks'] || {};
                    ans['Feedbacks'][uid] = ans['Feedbacks'][uid] || {};
                    ans['Feedbacks'][uid]['score'] = ans['Feedbacks'][uid]['score'] || angular.copy(tempScores);
                    ans['Feedbacks'][uid]['text'] = ans['Feedbacks'][uid]['text'] || '';
                    ans['Feedbacks'][uid]['userType'] = 'student';


                    ans['awardScore'] = ans['awardScore'] || {};
                    ans['awardScore'][uid] = ans['awardScore'][uid] || 0;
                    ans['prevAwardScore'] = ans['prevAwardScore'] || {};
                    ans['prevAwardScore'][uid] = ans['awardScore'][uid];
                    $scope.totalAwardScore += ans['awardScore'][uid];

                    if (ans['awardScore'][uid]) {
                        $scope.totalAwardPeople++;
                    }
                    $scope.answers.push(ans);
                };
                $scope.answers = $filter('orderBy')($scope.answers, 'answer');
                $scope.selectUser();
                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
            });
        }
        $scope.selectUser = function () {
            if ($scope.answers.length == 0) {
                $scope.selectedUserKey = undefined;
                $scope.answerIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                $scope.answerIndex = 0;
                if ($scope.selectedUserKey) {
                    for (var i = 0; i < $scope.answers.length; i++) {
                        if ($scope.answers[i].key == $scope.selectedUserKey) {
                            $scope.answerIndex = i;
                            break;
                        }
                    }
                }
                $scope.selectedUserKey = $scope.answers[$scope.answerIndex].key;
            }
            $rootScope.safeApply();
        }
        //When click next answer button( " > " )
        $scope.increaseindex = function () {
            if ($scope.answers.length == 0) {
                $scope.selectedUserKey = undefined;
                $scope.selectedIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                if ($scope.answerIndex == $scope.answers.length - 1) {
                    $rootScope.info('This is last Answer.');
                } else {
                    $scope.answerIndex++;
                    $scope.selectedUserKey = $scope.answers[$scope.answerIndex].uid;
                }
            }
            $rootScope.safeApply();
        }

        //When click previous answer button( " < " )
        $scope.decreaseindex = function () {
            if ($scope.answers.length == 0) {
                $scope.selectedUserKey = undefined;
                $scope.selectedIndex = undefined;
                $rootScope.warning("There isn't any answer data!");
            } else {
                if ($scope.answerIndex == 0) {
                    $rootScope.info('This is first Answer.');
                } else {
                    $scope.answerIndex--;
                    $scope.selectedUserKey = $scope.answers[$scope.answerIndex].uid;
                }
            }
            $rootScope.safeApply();
        }

        $scope.changeIndex = function (nextIndex) {
            if (nextIndex == $scope.answerIndex) return;
            $scope.answerIndex = nextIndex;
            $scope.selectedUserKey = $scope.answers[$scope.answerIndex].uid;
            $rootScope.safeApply();
        }
        $scope.setstar = function (index, rowindex) {
            if ($scope.answers.length == 0) return;
            var ans = $scope.answers[$scope.answerIndex];
            index++;
            let currValue = ans.Feedbacks[uid].score[rowindex];
            if (index == currValue) {
                currValue = index - 1;
            } else {
                currValue = index;
            }
            ans.Feedbacks[uid].score[rowindex] = currValue;
            var updates = {};
            updates['GroupAnswers/' + ans.key + '/Feedbacks/' + uid + '/score/'] = ans.Feedbacks[uid].score;
            updates['GroupAnswers/' + ans.key + '/Feedbacks/' + uid + '/userType/'] = 'student';

            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            }).catch(function (error) {
                $rootScope.error('Submit Error!')
            });
        }
        $scope.saveFeedbackText = function () {
            if ($scope.answers.length == 0) return;
            var ans = $scope.answers[$scope.answerIndex];

            var updates = {};
            updates['GroupAnswers/' + ans.key + '/Feedbacks/' + uid + '/text/'] = ans.Feedbacks[uid].text;
            updates['GroupAnswers/' + ans.key + '/Feedbacks/' + uid + '/userType/'] = 'student';

            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            }).catch(function (error) {
                $rootScope.error('Submit Error!')
            });
        }
        $scope.getStarState = function (index, rowindex) {
            if ($scope.answers.length == 0) return;
            if (index < $scope.answers[$scope.answerIndex].Feedbacks[uid].score[rowindex]) {
                return "checked";
            }
        }
        $scope.changeAward = function () {
            if ($scope.answers.length == 0) return;
            var ans = $scope.answers[$scope.answerIndex];
            var prevscore = ans.prevAwardScore[uid];
            var score = 0;
            if ($scope.totalAwardPeople == $scope.question.awardPeoples && prevscore == 0) {
                $rootScope.error("You reached max award user count!");
            } else {
                score = parseInt(ans.awardScore[uid]);
                if (isNaN(score)) {
                    score = prevscore;
                }
                score = Math.round(score);
                if (score < 0) score = 0;
                if (prevscore) {
                    $scope.totalAwardPeople--;
                    $scope.totalAwardScore -= prevscore;
                }
                if ($scope.totalAwardScore + score > $scope.question.awardScore) {
                    $rootScope.error("You reached max award score!");
                    score = $scope.question.awardScore - $scope.totalAwardScore;
                }
                if (score) {
                    $scope.totalAwardPeople++;
                    $scope.totalAwardScore += score;
                }
            }
            var updates = {};
            updates['GroupAnswers/' + ans.key + '/awardScore/' + uid] = score ? score : {};
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            }).catch(function (error) {
                $rootScope.error('Submit Error!')
            });
        }

        $scope.gotoView = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('viewGroupFeedbacks');
            }
        }
    }
})();