(function () {
    angular
        .module('myApp')
        .controller('responseOfAnswerController', responseOfAnswerController)
    responseOfAnswerController.$inject = ['$state', '$scope', '$rootScope'];
    function responseOfAnswerController($state, $scope, $rootScope) {
        // **************   router:    groupRoot  *****************

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        $scope.question = $rootScope.settings.question;
        var groupSettingRefStr = 'Groups/' + $rootScope.settings.groupKey + '/groupTextSettings/group/' +
            $scope.question.Set + '/' + $scope.question.questionKey
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value');
            if ($scope.stGroupRef) $scope.stGroupRef.off('value');
            if ($scope.answersRef) $scope.answersRef.off('value');
            if ($scope.groupSettingRef) $scope.groupSettingRef.off('value');
            $('#textGroupSettingModal').modal('hide');
        });

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getUsers();
            $scope.getStudentGroups();
            $scope.getAnswers();
            $scope.getGroupSetting();
        }

        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.users = snapshot.val() || {}
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }

        $scope.getStudentGroups = function () {
            $scope.stGroupRef = firebase.database().ref("StudentGroups")
            $scope.stGroupRef.on('value', snapshot => {
                let studentGroups = snapshot.val() || {}
                $scope.groupUsers = []
                for (userKey in studentGroups) {
                    if (Object.values(studentGroups[userKey]).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.groupUsers.push(userKey)
                    }
                }
                $scope.ref_2 = true
                $scope.finalCalc()
            })
        }

        $scope.getAnswers = function () {
            $scope.answersRef = firebase.database().ref('NewAnswers/' + $scope.question.code+ '/answer');
            $scope.answersRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val()
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }

        $scope.getGroupSetting = function () {
            $scope.groupSettingRef = firebase.database().ref(groupSettingRefStr)
            $scope.groupSettingRef.on('value', snapshot => {
                let setting = snapshot.val() || {}
                $scope.groupSetting = {
                    thumbup: setting.thumbup ? true : false,
                    otherGroup: setting.otherGroup ? true : false
                }
                $scope.ref_4 = true
                $scope.finalCalc()
            })
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return
            $scope.answers = [];
            if (!$scope.allAnswers) {
                $rootScope.warning("There isn't any answers.");
                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
                return;
            }
            for (answeredUserKey in $scope.allAnswers) {
                var ans = $scope.allAnswers[answeredUserKey];
                if ($scope.groupSetting.thumbup) {
                    ans.likeCount = ans.likeUsers ? ans.likeUsers.length : 0
                    ans.dislikeCount = ans.dislikeUsers ? ans.dislikeUsers.length : 0
                    ans.order = ans.likeCount - ans.dislikeCount;
                    $scope.answers.push({
                        answer: ans.answer,
                        show_id: $scope.users[answeredUserKey].show_id,
                        existInGroup: $scope.groupUsers.indexOf(answeredUserKey) > -1 ? true : false,
                        key: answeredUserKey,
                        likeCount: ans.likeCount,
                        dislikeCount: ans.dislikeCount,
                        order: ans.order
                    })
                } else {
                    $scope.answers.push({
                        answer: ans.answer,
                        show_id: $scope.users[answeredUserKey].show_id,
                        existInGroup: $scope.groupUsers.indexOf(answeredUserKey) > -1 ? true : false,
                        key: answeredUserKey
                    })
                }
            }
            if (Object.keys($scope.answers).length == 0) {
                $rootScope.warning("There isn't any answer.");
            }
            $scope.groupChoice = $scope.groupChoice ? $scope.groupChoice : 'main';
            $scope.changeGroupChoice()
            $rootScope.safeApply();
            $rootScope.setData('loadingfinished', true);
        }

        $scope.changeGroupChoice = function () {
            switch ($scope.groupChoice) {
                case 'main':
                    $scope.description = "All answers in current group.";
                    break;
                case 'other':
                    $scope.description = "All answers in all groups except current group.";
                    break;
                case 'all':
                    $scope.description = "All answers in all groups.";
                    break;
            }
            $rootScope.safeApply();
        }
       
        $scope.deleteAnswer = function (obj) {
            if (!confirm("That answer will be deleted permanently. \n Are you sure you want to continue?")) return;
            var updates = {};
            updates['NewAnswers/' + $scope.question.code+ '/answer/' + obj.key] = {};
            firebase.database().ref().update(updates);
        }


        // =============================   text Type Group Setting functions  ====================================

        $scope.showtTextGroupSettingModal = function () {
            $scope.tempSetting = angular.copy($scope.groupSetting)
            $('#textGroupSettingModal').modal({ backdrop: 'static', keyboard: false });
            $rootScope.safeApply();
        }
        $scope.saveSettings = function () {
            if (!confirm("Are you sure want to change this setting?")) return

            firebase.database().ref(groupSettingRefStr).set({
                thumbup: $scope.tempSetting.thumbup ? true : {},
                otherGroup: $scope.tempSetting.otherGroup ? true : {}
            }).then(() => {
                $('#textGroupSettingModal').modal('hide');
                $rootScope.success("Group setting has been changed successfully!")
            })
        }
    }

})();