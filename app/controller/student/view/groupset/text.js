(function () {

    angular
        .module('myApp')
        .controller('GroupTextViewController', GroupTextViewController)

    GroupTextViewController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function GroupTextViewController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupTextAnswer");
        $scope.question = $rootScope.settings.questionObj;
        if ($scope.question.result_videoID) {
            $scope.question.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.result_videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.questionResultImageRef) $rootScope.questionResultImageRef.off('value')
            if ($scope.groupSettingRef) $scope.groupSettingRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        });

        $scope.trustHTML = function (origin) {
            return $sce.trustAsHtml(origin);
        }

        $scope.init = function () {
            $rootScope.setData("loadingfinished", false)
            $scope.groupSetting()
            $scope.getclassAllAnswer()
        }
        $scope.groupSetting = function () {
            if ($rootScope.settings.groupType == 'sub') {
                $scope.groupSettingRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey
                    + '/groupTextSettings/groupsets/' + $rootScope.settings.groupSetKey
                    + '/' + $rootScope.settings.questionSetKey + '/' + $rootScope.settings.questionKey + '/thumbup')
            } else {
                $scope.groupSettingRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey
                    + '/groupTextSettings/subgroupsets/' + $rootScope.settings.groupSetKey + '/' + $rootScope.settings.subSetKey
                    + '/' + $rootScope.settings.questionSetKey + '/' + $rootScope.settings.questionKey + '/thumbup')
            }
            $scope.groupSettingRef.on('value', snapshot => {
                $scope.groupSetting.thumbup = snapshot.val() ? true : false
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }

        $scope.getclassAllAnswer = function () {
            $scope.answerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($rootScope.settings.questionKey);
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {}
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $scope.sumval = '';
            $scope.otherAnswers = [];
            for (var key in $scope.allAnswers) {
                var ans = $scope.allAnswers[key];
                var checkSubGroup = true;
                if ($rootScope.settings.groupType == 'second') {
                    if (ans.subSetKey != $rootScope.settings.subSetKey || ans.secondIndex != $rootScope.settings.secondIndex) {
                        checkSubGroup = false;
                    }
                }
                if (ans.groupType == $rootScope.settings.groupType && ans.studentgroupkey == $rootScope.settings.groupKey
                    && ans.groupSetKey == $rootScope.settings.groupSetKey && ans.subIndex == $rootScope.settings.subIndex
                    && checkSubGroup) {
                    if ($rootScope.settings.userId != ans.uid) {
                        ans.key = key;
                        if ($scope.groupSetting.thumbup) {
                            ans.checked = false;  //selected thumb up or down
                            if (!ans.likeUsers) {
                                ans.likeUsers = [];
                            } else {
                                if (ans.likeUsers.indexOf($rootScope.settings.userId) > -1) {
                                    ans.checked = true;
                                    ans.like = true;
                                }
                            }
                            if (!ans.dislikeUsers) {
                                ans.dislikeUsers = [];
                            } else {
                                if (ans.dislikeUsers.indexOf($rootScope.settings.userId) > -1) {
                                    ans.checked = true;
                                    ans.dislike = true;
                                }
                            }
                            ans.likeCount = ans.likeUsers.length;
                            ans.dislikeCount = ans.dislikeUsers.length;
                            ans.order = ans.likeCount - ans.dislikeCount;
                        }
                        $scope.otherAnswers.push(ans);
                    }
                }
            }
            $rootScope.setData("loadingfinished", true)
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
                ans.likeUsers.splice(ans.likeUsers.indexOf($rootScope.settings.userId), 1);
            } else {
                ans.likeUsers.push($rootScope.settings.userId);
            }
            var updates = {};
            updates['GroupAnswers/' + ans.key + '/likeUsers'] = ans.likeUsers;
            firebase.database().ref().update(updates);
        }

        $scope.thumbDown = function (ans) {
            if (ans.checked && ans.like) return;
            if (ans.checked) {
                ans.dislikeUsers.splice(ans.dislikeUsers.indexOf($rootScope.settings.userId), 1);
            } else {
                ans.dislikeUsers.push($rootScope.settings.userId);
            }
            ans.dislikeUsers.push($rootScope.settings.userId);
            var updates = {};
            updates['NewAnswers/' + ans.key + '/dislikeUsers'] = ans.dislikeUsers;
            firebase.database().ref().update(updates);
        }

    }
})();