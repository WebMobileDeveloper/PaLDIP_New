(function () {
    angular
        .module('myApp')
        .controller('groupResponseOfAnswerController', groupResponseOfAnswerController)
    groupResponseOfAnswerController.$inject = ['$state', '$scope', '$rootScope'];
    function groupResponseOfAnswerController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");


        $scope.question = $rootScope.settings.question;
        $scope.groupSetKey = $rootScope.settings.groupSetKey;
        $scope.subSetKey = $rootScope.settings.subSetKey;
        $scope.groupsets = $rootScope.settings.groupsets;

        $scope.subNames = ["All Sub Groups"];
        $scope.secondNames = ["All 2nd Sub Groups"];
        for (var i = 0; i < $scope.groupsets.count; i++) {
            let name = $scope.groupsets.data.groups[i].name || $scope.groupsets.name + ' ' + (i + 1);
            $scope.subNames.push(name);
        }

        if ($rootScope.settings.groupType == 'sub') {
            thumbupRefStr = 'Groups/' + $rootScope.settings.groupKey
                + '/groupTextSettings/groupsets/' + $scope.groupSetKey
                + '/' + $scope.question.Set + '/' + $scope.question.code + '/thumbup'
        } else {
            thumbupRefStr = 'Groups/' + $rootScope.settings.groupKey
                + '/groupTextSettings/subgroupsets/' + $scope.groupSetKey + '/' + $scope.subSetKey
                + '/' + $scope.question.Set + '/' + $scope.question.code + '/thumbup'

            for (var i = 0; i < $scope.groupsets.subgroupsets[$scope.subSetKey].count; i++) {
                let name = $scope.groupsets.data.groups[0].subgroupsets[$scope.subSetKey].groups[i].name || $scope.groupsets.subgroupsets[$scope.subSetKey].name + ' ' + (i + 1);
                $scope.secondNames.push(name);
            }
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
                $scope.allAnswers = snapshot.val() || {}
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            $scope.answers = [];

            for (var i = 0; i < $scope.subNames.length; i++) {
                for (var j = 0; j < $scope.secondNames.length; j++) {
                    $scope.answers.push([]);
                }
            }

            for (var key in $scope.allAnswers) {
                var answer = $scope.allAnswers[key];

                var checkSubGroup = true;
                if ($rootScope.settings.groupType == 'second') {
                    if (answer.subSetKey != $scope.subSetKey) {
                        checkSubGroup = false;
                    }
                }

                if (answer.groupType == $rootScope.settings.groupType && answer.studentgroupkey == $rootScope.settings.groupKey
                    && answer.groupSetKey == $rootScope.settings.groupSetKey && checkSubGroup) {

                    if ($scope.groupSetting.thumbup) {
                        answer.likeCount = answer.likeUsers ? answer.likeUsers.length : 0
                        answer.dislikeCount = answer.dislikeUsers ? answer.dislikeUsers.length : 0
                        answer.order = answer.likeCount - answer.dislikeCount;
                    }

                    answer.show_id = $scope.users[answer.uid].show_id;
                    $scope.answers[0].push(answer);
                    $scope.answers[answer.subIndex + 1].push(answer);

                    if ($rootScope.settings.groupType == 'second') {
                        $scope.answers[(answer.subIndex + 1) * $scope.secondNames.length].push(answer);
                        $scope.answers[(answer.subIndex + 1) * $scope.secondNames.length + answer.secondIndex + 1].push(answer);
                    }
                }
            }

            $scope.GroupIndex = 0;
            $scope.SubGroupIndex = 0;
            $scope.changeGroup();
            $rootScope.setData('loadingfinished', true);
        }

        $scope.changeGroup = function () {
            $scope.selectedIndex = $scope.GroupIndex * $scope.secondNames.length + $scope.SubGroupIndex;
            $scope.description = "Answers in all subgroup." + $scope.subNames[$scope.GroupIndex];
            $rootScope.safeApply();
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
                if ($rootScope.settings.groupType == 'sub') {
                    $rootScope.success("Groupset setting has been changed successfully!")
                } else {
                    $rootScope.success("Subgroupset setting has been changed successfully!")
                }
            })
        }
    }

})();