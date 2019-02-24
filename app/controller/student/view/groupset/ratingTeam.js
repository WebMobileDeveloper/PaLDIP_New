(function () {

    angular
        .module('myApp')
        .controller('GroupTeamRatingViewController', GroupTeamRatingViewController)

    GroupTeamRatingViewController.$inject = ['$state', '$scope', '$rootScope', '$sce', '$filter'];

    function GroupTeamRatingViewController($state, $scope, $rootScope, $sce, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRatingAnswer");

        $scope.groupSetKey = $rootScope.settings.groupSetKey;
        $scope.subSetKey = $rootScope.settings.subSetKey;

        $scope.question = $rootScope.settings.questionObj;
        $scope.type = $scope.question.ratingtype;
        $scope.items = $rootScope.settings.subGroups;
        $scope.options = $scope.question.ratingOptions || [];
        $scope.isAward = $scope.question.awardScore && $scope.question.awardPeoples
        $scope.groupIndex = $rootScope.settings.groupType == 'sub' ? $rootScope.settings.subIndex : $rootScope.settings.secondIndex;
        let settingRefStr = 'Questions/' + $scope.question.code + '/teacherFeedback/' + $rootScope.settings.groupKey +
            + '/' + $scope.groupSetKey + '/';

        // $scope.userIndex = 0;
        if ($scope.question.result_videoID) {
            $scope.question.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.result_videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }

        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.questionResultImageRef) $rootScope.questionResultImageRef.off('value')
            if ($scope.settingRef) $scope.settingRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
            if ($scope.shareRef) $scope.shareRef.off('value')
        });
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getFeedbackSetting();
            $scope.getanswers();
        }
        $scope.getFeedbackSetting = function () {
            if ($rootScope.settings.groupType == 'sub') {       //if 1st child group answer
                $scope.settingRef = firebase.database().ref(settingRefStr + 'data');
            } else {
                $scope.settingRef = firebase.database().ref(settingRefStr + $scope.subSetKey + '/data');
            }

            $scope.settingRef.on('value', function (snapshot) {
                if (snapshot.val()) {
                    $scope.feedbackSetting = snapshot.val();
                } else {
                    $scope.feedbackSetting = {
                        studentRate: 100,
                        teacherRate: 0,
                        showIndividual: false
                    }
                }
                $scope.ref_1 = true;
                $scope.finalCalc();
            })
        }
        $scope.getanswers = function () {
            $scope.answerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($scope.question.code);
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = {}
                for (var key in snapshot.val()) {
                    var answer = snapshot.val()[key];
                    if (answer.groupType != $rootScope.settings.groupType ||
                        answer.studentgroupkey != $rootScope.settings.groupKey ||
                        answer.groupSetKey != $scope.groupSetKey
                    ) continue;

                    if ($rootScope.settings.groupType == 'second') {        //if 2nd child group answer
                        if (answer.subIndex != $rootScope.settings.subIndex || answer.subSetKey != $scope.subSetKey) continue;
                    }
                    $scope.allAnswers[answer.uid] = answer
                }
                $scope.ref_2 = true;
                $scope.finalCalc();
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $scope.result = {
                rating: [],
                avRating: 0,
                teCount: 0,
                stCount: 0,
                feedbacktext: [],
                awardScore: 0,
                awardUsers: 0,
            };
            for (j = 0; j < $scope.options.length; j++) {
                $scope.result.rating[j] = {
                    teRating: 0,
                    stRating: 0,
                    totalRating: 0,
                    teCount: 0,
                    stCount: 0,
                    totalCount: 0,
                }
            }
            for (userKey in $scope.allAnswers) {
                let userAns = $scope.allAnswers[userKey];
                let itemAnswer = angular.copy(userAns.answer[$scope.groupIndex]);

                if (itemAnswer.feedbacktext) {                 
                    $scope.result.feedbacktext.push(itemAnswer.feedbacktext);
                }
                if (itemAnswer.awardScore) {
                    $scope.result.awardScore += itemAnswer.awardScore;
                    $scope.result.awardUsers++;
                }
                let valueExist = false;
                itemAnswer.rating = itemAnswer.rating || []
                itemAnswer.rating.map((rate, optionIndex) => {
                    if (rate) {
                        valueExist = true;
                        if (userAns.isTeacherRating) {
                            $scope.result.rating[optionIndex].teRating += rate;
                            $scope.result.rating[optionIndex].teCount++;
                        } else {
                            $scope.result.rating[optionIndex].stRating += rate;
                            $scope.result.rating[optionIndex].stCount++;
                        }
                        $scope.result.rating[optionIndex].totalCount++;
                    }
                })
                if (valueExist) {
                    if (userAns.isTeacherRating) {
                        $scope.result.teCount++;
                    } else {
                        $scope.result.stCount++;
                    }
                }
            }
            let optionCount = 0;
            $scope.result.rating.map(optionAnswers => {
                let tempStRate = $scope.feedbackSetting.studentRate;
                let tempTeRate = $scope.feedbackSetting.teacherRate;
                if (optionAnswers.teCount) {
                    optionAnswers.teRating = Math.round(optionAnswers.teRating / optionAnswers.teCount * 10) / 10;
                } else {
                    tempStRate = 100;
                    tempTeRate = 0;
                }
                if (optionAnswers.stCount) {
                    optionAnswers.stRating = Math.round(optionAnswers.stRating / optionAnswers.stCount * 10) / 10;
                } else {
                    tempStRate = 0;
                    tempTeRate = 100;
                }

                optionAnswers.totalRating = (optionAnswers.stRating * tempStRate + optionAnswers.teRating * tempTeRate) / 100;
                if (optionAnswers.totalRating) {
                    $scope.result.avRating += optionAnswers.totalRating;
                    optionCount++;
                }
                optionAnswers.totalRating = Math.round(optionAnswers.totalRating * 10) / 10;
            })
            $scope.result.avRating = optionCount ? Math.round($scope.result.avRating / optionCount * 10) / 10 : '-';
            $rootScope.setData('loadingfinished', true);
           
            $rootScope.safeApply();
        }      
        $scope.gotoGroupView = function () {
            $rootScope.setData('backUrl', "groupTeamRatingView");
            $state.go('groupRatingView');
        }
    }
})();