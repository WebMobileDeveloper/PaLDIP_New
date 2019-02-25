(function () {
    angular
        .module('myApp')
        .controller('groupResponseOfAnswerController', groupResponseOfAnswerController)
    groupResponseOfAnswerController.$inject = ['$state', '$scope', '$rootScope'];
    function groupResponseOfAnswerController($state, $scope, $rootScope) {
        // **************   router:    groupResponseOfAnswer  *****************

        $rootScope.setData('showMenubar', true);
        var groupType = $rootScope.settings.groupType;
        $rootScope.setData('backUrl', groupType == 'sub' ? "groupSubRoot" : "groupSecondRoot");


        $scope.question = $rootScope.settings.question;
        $scope.groupKey = $rootScope.settings.groupKey;
        $scope.groupSetKey = $rootScope.settings.groupSetKey;
        $scope.subIndex = $rootScope.settings.subIndex;
        $scope.subSetKey = $rootScope.settings.subSetKey;
        $scope.secondIndex = $rootScope.settings.secondIndex;


        if (groupType == 'sub') {
            thumbupRefStr = 'Groups/' + $scope.groupKey
                + '/groupTextSettings/groupsets/' + $scope.groupSetKey
                + '/' + $scope.question.Set + '/' + $scope.question.code + '/thumbup'
        } else {
            thumbupRefStr = 'Groups/' + $scope.groupKey
                + '/groupTextSettings/subgroupsets/' + $scope.groupSetKey + '/' + $scope.subSetKey
                + '/' + $scope.question.Set + '/' + $scope.question.code + '/thumbup'
        }
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($scope.usersRef) $scope.usersRef.off('value');
            if ($scope.answersRef) $scope.answersRef.off('value');
            if ($scope.groupSettingRef) $scope.groupSettingRef.off('value');
            $('#textGroupSettingModal').modal('hide');
        });
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getUsers();
            $scope.getGroupSetting()
            $scope.getAnswers()
        }

        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.users = snapshot.val() || {}
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }

        $scope.getGroupSetting = function () {
            $scope.groupSettingRef = firebase.database().ref(thumbupRefStr)
            $scope.groupSettingRef.on('value', snapshot => {
                $scope.groupSetting = {
                    thumbup: snapshot.val() ? true : false
                }
                $scope.ref_2 = true
                $scope.finalCalc()
            })
        }

        $scope.getAnswers = function () {
            $scope.answersRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($scope.question.code);
            $scope.answersRef.on('value', function (snapshot) {
                $scope.allAnswers = {}
                for (key in snapshot.val()) {
                    let answer = snapshot.val()[key];
                    if (answer.groupType != groupType || answer.studentgroupkey != $scope.groupKey
                        || answer.groupSetKey != $scope.groupSetKey || answer.subIndex != $scope.subIndex) continue;
                    if (groupType == 'second') {
                        if (answer.subSetKey != $scope.subSetKey || answer.secondIndex != $scope.secondIndex) continue;
                    }
                    $scope.allAnswers[key] = answer;
                }
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            $scope.answers = [];

            for (var key in $scope.allAnswers) {
                var answer = $scope.allAnswers[key];
                if ($scope.groupSetting.thumbup) {
                    answer.likeCount = answer.likeUsers ? answer.likeUsers.length : 0
                    answer.dislikeCount = answer.dislikeUsers ? answer.dislikeUsers.length : 0
                    answer.order = answer.likeCount - answer.dislikeCount;
                }

                answer.show_id = $scope.users[answer.uid].show_id;
                $scope.answers.push(answer);
            }
            $rootScope.setData('loadingfinished', true);
        }

        // =============================   text Type Group Setting functions  ====================================

        $scope.showtTextGroupSettingModal = function () {
            $scope.tempSetting = angular.copy($scope.groupSetting)
            $('#textGroupSettingModal').modal({ backdrop: 'static', keyboard: false });
            $rootScope.safeApply();
        }
        $scope.saveSettings = function () {
            if (!confirm("Are you sure want to change this setting?")) return

            firebase.database().ref(thumbupRefStr).set($scope.tempSetting.thumbup ? true : {}).then(() => {
                $('#textGroupSettingModal').modal('hide');
                if (groupType == 'sub') {
                    $rootScope.success("Groupset setting has been changed successfully!")
                } else {
                    $rootScope.success("Subgroupset setting has been changed successfully!")
                }
            })
        }
    }

})();