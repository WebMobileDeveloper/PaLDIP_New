(function () {

    angular
        .module('myApp')
        .controller('questionsSubController', questionsSubController)

    questionsSubController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function questionsSubController($state, $scope, $rootScope, $filter) {

        var groupSetKey = $rootScope.settings.groupSetKey;
        var subSetKey = $rootScope.settings.subSetKey;
        var groupType = $rootScope.settings.groupType;
        var uid = $rootScope.settings.userId;

        $rootScope.setData('showMenubar', true);
        if (groupType == 'sub') {
            $rootScope.setData('backUrl', "studentSubGroupDetail");
            $scope.questionSetKey = $rootScope.settings.questionSetKey1;
        } else {
            $rootScope.setData('backUrl', "studentSecondGroupDetail");
            $scope.questionSetKey = $rootScope.settings.questionSetKey2;
        }

        $rootScope.safeApply();


        $scope.$on('$destroy', function () {
            if ($scope.qsetRef) $scope.qsetRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
            if ($scope.ansRefArr) {
                $scope.ansRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        })
        $scope.getSetData = function () {
            //============================================================            
            // $scope.loopCount++;
            $scope.qsetRef = firebase.database().ref('QuestionSets/' + $scope.questionSetKey);
            $scope.qsetRef.on('value', function (snapshot) {
                $scope.setData = snapshot.val();
                $scope.getAllQuestions();
            });
        }

        $scope.getAllQuestions = function () {
            $rootScope.setData('loadingfinished', false);
            if ($scope.qstRef) $scope.qstRef.off('value')
            $scope.qstRef = firebase.database().ref('Questions/').orderByChild("Set").equalTo($scope.questionSetKey)
            $scope.qstRef.on('value', function (snapshot) {
                $scope.questions = [];
                snapshot.forEach(function (childSnapshot) {
                    var question = childSnapshot.val();
                    if (!question.hideBy || question.hideBy == $rootScope.settings.teacherId) {
                        if (question.questionType != 'Answer Type') {
                            question.key = childSnapshot.key;
                            $scope.questions.push(question);
                        }
                    }
                });
                var length = $scope.questions.length;
                if (length == 0) {
                    $rootScope.warning("There isn't any question data.");
                    $rootScope.setData('loadingfinished', true);
                    return;
                }
                $scope.questions = $filter('orderBy')($scope.questions, 'order');

                //========== get answered state===================
                if ($scope.ansRefArr) {
                    $scope.ansRefArr.forEach(ref => {
                        ref.off('value')
                    });
                }
                $scope.ansRefArr = []
                $scope.questions.forEach(function (qst) {
                    var ansRef = firebase.database().ref('GroupAnswers/').orderByChild('questionKey').equalTo(qst.key);
                    $scope.ansRefArr.push(ansRef)
                    ansRef.on('value', function (ans) {
                        var answered = false;
                        ans.forEach(function (answers) {
                            var answer = answers.val();
                            if (groupType == 'sub') {
                                if (answer.studentgroupkey == $rootScope.settings.groupKey
                                    && answer.groupType == 'sub'
                                    && answer.groupSetKey == groupSetKey
                                    && answer.subIndex == $rootScope.settings.subIndex
                                    && answer.uid == uid) {
                                    answered = true;
                                    if ($scope.setData.MultipleType) {
                                        var qstScore = 0;
                                        var answers = answer.answer.split(',');
                                        if (qst.optionDetails) {
                                            for (var i = 0; i < answers.length; i++) {
                                                qstScore += qst.optionDetails[qst.options.indexOf(answers[i])].score;
                                            }
                                        }
                                        qst.score = qstScore;
                                    }
                                }
                            } else {
                                if (answer.studentgroupkey == $rootScope.settings.groupKey
                                    && answer.groupType == 'second'
                                    && answer.groupSetKey == groupSetKey
                                    && answer.subIndex == $rootScope.settings.subIndex
                                    && answer.subSetKey == subSetKey
                                    && answer.secondIndex == $rootScope.settings.secondIndex
                                    && answer.uid == uid) {
                                    answered = true;
                                    if ($scope.setData.MultipleType) {
                                        var qstScore = 0;
                                        var answers = answer.answer.split(',');
                                        if (qst.optionDetails) {
                                            for (var i = 0; i < answers.length; i++) {
                                                qstScore += qst.optionDetails[qst.options.indexOf(answers[i])].score;
                                            }
                                        }
                                        qst.score = qstScore;
                                    }
                                }
                            }

                        });

                        length--;
                        if (!answered && $scope.setData.MultipleType) {
                            $scope.note = "You can get feedback when you answer all questions.";
                        }
                        if (length == 0 && $scope.setData.MultipleType && $scope.setData.subscales) {
                            for (key in $scope.setData.subscales) {
                                var scale = $scope.setData.subscales[key];
                                var totalScore = 0;
                                scale.questions.forEach(function (qstkey) {
                                    $scope.questions.forEach(function (qst) {
                                        if (qstkey == qst.key) {
                                            totalScore += qst.score;
                                        }
                                    })
                                });

                                scale.result = { score: totalScore, text: "" }
                                if (scale.Feedback) {
                                    scale.Feedback.forEach(function (feedback) {
                                        if (totalScore > feedback.start && totalScore <= feedback.end) {
                                            scale.result.text = feedback.text;
                                        }
                                    })
                                }
                            }
                            $rootScope.safeApply();
                        }

                        qst.completed = answered;
                        $rootScope.safeApply();
                    });
                });

                //==========end  get answered state===================

                $rootScope.setData('loadingfinished', true);
            });
        }

        $scope.showByLastCompleted = function (index) {
            if (!$scope.setData.lockNext || index == 0) return true
            for (var i = 0; i < index; i++) {
                if (!$scope.questions[i].completed) return false
            }
            return true
        }
        $scope.goSubmitAnswer = function (obj, index) {
            $rootScope.setData('questionsInSet', $scope.questions);
            $rootScope.setData('currentIndex', index);
            var myanswerRef = firebase.database().ref('GroupAnswers').orderByChild('uid').equalTo(uid);
            if (obj.questionType == 'Feedback Type') {
                obj.groupFeedback = obj.groupFeedback ? obj.groupFeedback : 'team';
            }
            if (obj.groupFeedback == 'group') {
                myanswerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo(obj.key);
            }
            myanswerRef.once('value', function (snapshot) {
                $rootScope.setData('prevAnswer', undefined);
                if (snapshot.val()) {
                    for (key in snapshot.val()) {
                        var answer = snapshot.val()[key];
                        if (answer.groupType != groupType || answer.questionKey != obj.key || answer.studentgroupkey != $rootScope.settings.groupKey
                            || answer.groupSetKey != groupSetKey || answer.subIndex != $rootScope.settings.subIndex) continue;
                        if (groupType == 'second') {
                            if (answer.subSetKey != subSetKey || answer.secondIndex != $rootScope.settings.secondIndex) continue;
                        }
                        $rootScope.setData('prevAnswer', answer['answer']);
                        $rootScope.setData('prevAnswerVal', answer['answerval']);
                        break;
                    };
                }

                var set = $rootScope.settings.questionSet;
                // check if disabled question                
                var disabled = false;
                if (set.DisabledQuestions && set.DisabledQuestions[obj.key]) {
                    disabled = true;
                }

                $rootScope.setData('disabledQuestion', disabled);
                $rootScope.setData('questionKey', obj.key);
                $rootScope.setData('questionString', obj.question);
                $rootScope.setData('questionType', obj.questionType);
                $rootScope.setData('questionObj', obj);


                switch (obj.questionType) {
                    case 'Feedback Type':  //Feedbacktype
                        $rootScope.setData('qtype', obj.type);
                        $rootScope.setData('feedqts', obj.feedqts);
                        $rootScope.setData('listType', obj.listType);
                        $rootScope.setData('selfRate', obj.selfRate);

                        $state.go('groupFeedbackAnswer');
                        break;
                    case 'Rating Type':
                        $state.go('groupRatingAnswer');
                        break;
                    case 'Digit Type':
                        $state.go('groupDigitAnswer');
                        break;
                    case 'Text Type':
                        $state.go('groupTextAnswer');
                        break;
                    case 'Dropdown Type':
                        $state.go('groupDropdownAnswer');
                        break;
                    case 'Slide Type':
                        $state.go('groupSlideAnswer');
                        break;
                    case 'Multiple Type':
                        $state.go('groupMultipleAnswer');
                        break;
                    case 'Contingent Type':
                        $state.go('groupContingentAnswer');
                        break;
                }
            });

        }
    }
})();