(function () {

    angular
        .module('myApp')
        .controller('TextViewController', TextViewController)

    TextViewController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function TextViewController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "textAnswer");
        $scope.question = $rootScope.settings.questionObj;
        if ($scope.question.result_videoID) {
            $scope.question.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.result_videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        let uid = $rootScope.settings.userId
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($scope.groupSettingRef) $scope.groupSettingRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
        });
        $scope.init = function () {
            $scope.setData("loadingfinished", false)
            $scope.groupSetting()
            $scope.getAllAnswer()
            $scope.getStudentGroups()
        }
        $scope.groupSetting = function () {
            $scope.groupSettingRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupTextSettings/group/' +
                $rootScope.settings.questionSetKey + '/' + $rootScope.settings.questionKey)
            $scope.groupSettingRef.on('value', snapshot => {
                let setting = snapshot.val() || {}
                $scope.groupSetting = {
                    thumbup: setting.thumbup ? true : false,
                    otherGroup: setting.otherGroup ? true : false
                }
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }
        $scope.getAllAnswer = function () {
            $scope.answerRef = firebase.database().ref('NewAnswers/' + $rootScope.settings.questionKey + '/answer');
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {}
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }
        $scope.getStudentGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (snapshot) {
                $scope.usersInGroup = [];
                let allGserGroups = snapshot.val() || {}
                for (userKey in allGserGroups) {
                    if (Object.values(allGserGroups[userKey]).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.usersInGroup.push(userKey);
                    }
                }
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        };
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return



            $scope.otherAnswers = [];
            for (userKey in $scope.allAnswers) {
                var ans = $scope.allAnswers[userKey];
                if (userKey != uid) {
                    ans.key = userKey;
                    if ($scope.groupSetting.thumbup) {
                        ans.checked = false;  //selected thumb up or down
                        if (!ans.likeUsers) {
                            ans.likeUsers = [];
                        } else {
                            if (ans.likeUsers.indexOf(uid) > -1) {
                                ans.checked = true;
                                ans.like = true;
                            }
                        }
                        if (!ans.dislikeUsers) {
                            ans.dislikeUsers = [];
                        } else {
                            if (ans.dislikeUsers.indexOf(uid) > -1) {
                                ans.checked = true;
                                ans.dislike = true;
                            }
                        }
                        ans.likeCount = ans.likeUsers.length;
                        ans.dislikeCount = ans.dislikeUsers.length;
                        ans.order = ans.likeCount - ans.dislikeCount;
                    }
                    ans.existInGroup = $scope.usersInGroup.indexOf(userKey) > -1 ? true : false,
                        $scope.otherAnswers.push(ans);
                } else {
                    $scope.myAns = ans
                }
            }
            $scope.groupChoice = $scope.groupChoice ? $scope.groupChoice : 'main';
            $scope.changeGroupChoice()
            $scope.setData("loadingfinished", true)
            $rootScope.safeApply();
        }       
        $scope.changeGroupChoice = function () {
            switch ($scope.groupChoice) {
                case 'main':
                    $scope.description = "Answers in current group.";
                    break;
                case 'other':
                    $scope.description = "Answers in all groups except current group.";
                    break;
                case 'all':
                    $scope.description = "Answers in all groups.";
                    break;
            }
            $rootScope.safeApply();
        }
       
        $scope.getLikeClass = function (ans) {
            if (!ans.checked) return "";
            var classStr = 'checked';
            if (ans.like) {
                classStr += ' like';
            }
            return classStr;
        }
        $scope.getDisLikeClass = function (ans) {
            if (!ans.checked) return "";
            var classStr = 'checked';
            if (ans.dislike) {
                classStr += ' dislike';
            }
            return classStr
        }
        $scope.thumbUp = function (ans) {
            if (ans.checked && ans.dislike) return;
            if (ans.checked) {
                ans.likeUsers.splice(ans.likeUsers.indexOf(uid), 1);
            } else {
                ans.likeUsers.push(uid);
            }
            var updates = {};
            updates['NewAnswers/' + $rootScope.settings.questionKey + '/answer/' + ans.key + '/likeUsers'] = ans.likeUsers;
            firebase.database().ref().update(updates);
        }

        $scope.thumbDown = function (ans) {
            if (ans.checked && ans.like) return;
            if (ans.checked) {
                ans.dislikeUsers.splice(ans.dislikeUsers.indexOf(uid), 1);
            } else {
                ans.dislikeUsers.push(uid);
            }
            var updates = {};
            updates['NewAnswers/' + $rootScope.settings.questionKey + '/answer/' + ans.key + '/dislikeUsers'] = ans.dislikeUsers;
            firebase.database().ref().update(updates);
        }
    }

})();