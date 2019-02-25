(function () {

    angular
        .module('myApp')
        .controller('responseOfFeedbackAnswerController', responseOfFeedbackAnswerController)

    responseOfFeedbackAnswerController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function responseOfFeedbackAnswerController($state, $scope, $rootScope, $filter) {
        // **************   router:    responseOfFeedbackAnswer  *****************

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        $scope.question = $rootScope.settings.question;

        $scope.feedqts = ($scope.question.feedqts) ? $scope.question.feedqts : [];
        $scope.type = $scope.question.type;
        $scope.answer = [];
        $scope.tempAnswer = [];
        $scope.orderBy = 'rating';
        $rootScope.safeApply();


        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
			if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
			if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
			if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
        });
        $scope.getGroups = function () {
            $rootScope.setData('loadingfinished', false);
            var groupRef = firebase.database().ref('StudentGroups');
            groupRef.once('value', function (studentGroups) {
                $scope.studentsInGroup = [];
                var studentGroup = studentGroups.val();
                for (var studentKey in studentGroup) {
                    var obj = studentGroup[studentKey];
                    if (Object.values(obj).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                $scope.getanswer();
            })
        }


        $scope.getanswer = function () {

            var answerRef = firebase.database().ref('NewAnswers/' + $scope.question.code+ '/answer');
            answerRef.on('value', function (snapshot) {
                $scope.answers = [];
                snapshot.forEach(function (childSnapshot) {
                    if ($scope.studentsInGroup.indexOf(childSnapshot.key) > -1) {
                        var answer = childSnapshot.val();
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
                        if (ans.scores.length > 0) {
                            ans.avRating = Math.round(ans.avRating * 10 / ans.scores.length) / 10;
                        }

                        ans.userCount = userCount;
                        if (answer.studentgroupkey == $rootScope.settings.groupKey) {
                            ans.thisGroup = true;
                        } else {
                            ans.thisGroup = false;
                        }
                        ans.awardScore = 0;
                        if (answer.awardScore) {
                            for (key in answer.awardScore) {
                                ans.awardScore += answer.awardScore[key];
                            }
                        }
                        $scope.answers.push(ans);
                    }
                });

                $scope.answers = $filter('orderBy')($scope.answers, ($scope.orderBy == 'rating') ? '-avRating' : '-awardScore');
                $scope.itemIndex = 0;
                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
            });
        }
        $scope.orderChanged = function (orderBy) {
            $scope.orderBy = orderBy;
            $scope.answers = $filter('orderBy')($scope.answers, ($scope.orderBy == 'rating') ? '-avRating' : '-awardScore');
        }
        //When click next answer button( " > " )
        $scope.increaseindex = function () {
            if ($scope.itemIndex == $scope.answers.length - 1) {
                $rootScope.info('This is last Answer.');
            } else {
                $scope.itemIndex++;
            }
            $rootScope.safeApply();
        }

        //When click previous answer button( " < " )
        $scope.decreaseindex = function () {
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