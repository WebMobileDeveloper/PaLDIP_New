(function () {
    angular
        .module('myApp')
        .controller('groupResponseOfFeedbackAnswerController', groupResponseOfFeedbackAnswerController)
    groupResponseOfFeedbackAnswerController.$inject = ['$state', '$scope', '$rootScope', '$filter'];
    function groupResponseOfFeedbackAnswerController($state, $scope, $rootScope, $filter) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");

        $scope.question = $rootScope.settings.question;
        $scope.feedqts = ($scope.question.feedqts) ? $scope.question.feedqts : [];

        $scope.type = $scope.question.type;
        $scope.groupSetKey = $rootScope.settings.groupSetKey;
        $scope.subSetKey = $rootScope.settings.subSetKey;
        $scope.groupsets = $rootScope.settings.groupsets;

        $scope.subNames = ["All Sub Groups"];
        $scope.secondNames = ["All 2nd Sub Groups"];
        $scope.orderBy = 'rating';
        for (var i = 0; i < $scope.groupsets.count; i++) {
            let name = $scope.groupsets.data.groups[i].name || $scope.groupsets.name + ' ' + (i + 1);
            $scope.subNames.push(name);
        }

        if ($rootScope.settings.groupType == 'second') {
            for (var i = 0; i < $scope.groupsets.subgroupsets[$scope.subSetKey].count; i++) {
                let name = $scope.groupsets.data.groups[0].subgroupsets[$scope.subSetKey].groups[i].name || $scope.groupsets.subgroupsets[$scope.subSetKey].name + ' ' + (i + 1);
                $scope.secondNames.push(name);
            }
        }

        $rootScope.safeApply();       

        $scope.initExport = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getAnswers();
        }

        $scope.getAnswers = function () {
            var answers = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($scope.question.code);
            answers.on('value', function (snapshot) {

                $scope.answers = [];

                for (var i = 0; i < $scope.subNames.length; i++) {
                    for (var j = 0; j < $scope.secondNames.length; j++) {
                        $scope.answers.push([]);
                    }
                }

                for (var key in snapshot.val()) {
                    var answer = snapshot.val()[key];

                    var checkSubGroup = true;
                    if ($rootScope.settings.groupType == 'second') {
                        if (answer.subSetKey != $scope.subSetKey) {
                            checkSubGroup = false;
                        }
                    }

                    if (answer.groupType == $rootScope.settings.groupType && answer.studentgroupkey == $rootScope.settings.groupKey
                        && answer.groupSetKey == $rootScope.settings.groupSetKey && checkSubGroup) {

                        var ans = {};
                        ans.answer = answer.answer;

                        ans.feedbacktext = [];
                        ans.scores = [];
                        for (i = 0; i < $scope.feedqts.length; i++) {
                            ans.scores[i] = 0;
                        }
                        var userCount = 0;

                        for (var feedkey in answer.Feedbacks) {
                            var feedback = answer.Feedbacks[feedkey];
                            if (feedback.userType == 'student') {
                                if (feedback.text) {
                                    ans.feedbacktext.push(feedback.text);
                                }
                                if (feedback.score) {
                                    userCount++;
                                    for (i = 0; i < feedback.score.length; i++) {
                                        ans.scores[i] += feedback.score[i];
                                    }
                                }
                            }
                        }

                        ans.avRating = 0;
                        if (userCount > 0) {
                            for (i = 0; i < ans.scores.length; i++) {
                                ans.scores[i] = Math.round(ans.scores[i] * 10 / userCount) / 10;
                                ans.avRating += ans.scores[i];
                            }
                        }
                        ans.awardScore = 0;
                        if (answer.awardScore) {
                            for (key in answer.awardScore) {
                                ans.awardScore += answer.awardScore[key];
                            }
                        }
                        if (ans.scores.length > 0) {
                            ans.avRating = Math.round(ans.avRating * 10 / ans.scores.length) / 10;
                        }

                        ans.userCount = userCount;



                        $scope.answers[0].push(ans);

                        $scope.answers[answer.subIndex + 1].push(ans);

                        if ($rootScope.settings.groupType == 'second') {
                            $scope.answers[(answer.subIndex + 1) * $scope.secondNames.length].push(ans);
                            $scope.answers[(answer.subIndex + 1) * $scope.secondNames.length + answer.secondIndex + 1].push(ans);
                        }
                    }
                }
                $scope.orderChanged('rating')

                $scope.GroupIndex = 0;
                $scope.SubGroupIndex = 0;
                $scope.itemIndex = 0;
                $scope.changeGroup();
                $rootScope.setData('loadingfinished', true);
            });
        }

        $scope.orderChanged = function (orderBy) {
            $scope.orderBy = orderBy;
            for (var i = 0; i < $scope.subNames.length; i++) {
                for (var j = 0; j < $scope.secondNames.length; j++) {
                    $scope.answers[i * $scope.secondNames.length + j] = $filter('orderBy')($scope.answers[i * $scope.secondNames.length + j],
                        ($scope.orderBy == 'rating') ? '-avRating' : '-awardScore');
                }
            }
            $rootScope.safeApply();
        }

        $scope.changeGroup = function () {
            $scope.selectedIndex = $scope.GroupIndex * $scope.secondNames.length + $scope.SubGroupIndex;
            $scope.description = "Answers in all subgroup." + $scope.subNames[$scope.GroupIndex];
            $rootScope.safeApply();
        }

        //When click next answer button( " > " )
        $scope.increaseindex = function () {
            if ($scope.answers[$scope.selectedIndex].length == 0) return;
            if ($scope.itemIndex == $scope.answers[$scope.selectedIndex].length - 1) {
                $rootScope.info('This is last Answer.');
            } else {
                $scope.itemIndex++;
            }
            $rootScope.safeApply();
        }

        //When click previous answer button( " < " )
        $scope.decreaseindex = function () {
            if ($scope.answers[$scope.selectedIndex].length == 0) return;
            if ($scope.itemIndex == 0) {
                $rootScope.info('This is first Answer.');
            } else {
                $scope.itemIndex--;
            }
            $rootScope.safeApply();
        }

        $scope.changeIndex = function (nextIndex) {
            if (nextIndex == $scope.itemIndex) return;
            $scope.itemIndex = nextIndex;

            $rootScope.safeApply();
        }

    }

})();