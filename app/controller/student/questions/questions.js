(function () {

    angular
        .module('myApp')
        .controller('questionsController', questionsController)

    questionsController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function questionsController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "studentGroupDetail");
        $scope.questionSet = $rootScope.settings.questionSet;
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.qsetRef) $scope.qsetRef.off('value')
            if ($scope.hideRef) $scope.hideRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
            if ($scope.ansRefArr) {
                $scope.ansRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getSetData();
        }

        $scope.getSetData = function () {
            //============================================================            
            $scope.qsetRef = firebase.database().ref('QuestionSets/' + $rootScope.settings.questionSetKey);
            $scope.qsetRef.on('value', function (snapshot) {
                $scope.setData = snapshot.val();
                $scope.getHideState();
            });
        }
        $scope.getHideState = function () {
            if ($scope.hideRef) $scope.hideRef.off('value')
            $scope.hideRef = firebase.database().ref('HiddenQuestions/' + $rootScope.settings.groupKey + '/' + $rootScope.settings.questionSetKey);
            $scope.hideRef.on('value', function (snapshot) {
                $scope.hides = snapshot.val() ? snapshot.val() : {};
                $scope.getAllQuestions();
            });
        }
        $scope.getAllQuestions = function () {
            if ($scope.qstRef) $scope.qstRef.off('value')
            $scope.qstRef = firebase.database().ref('Questions/').orderByChild("Set").equalTo($rootScope.settings.questionSetKey)
            $scope.qstRef.on('value', function (snapshot) {
                $scope.questions = [];
                snapshot.forEach(function (childSnapshot) {
                    var question = childSnapshot.val();
                    if (!question.hideBy && !$scope.hides[childSnapshot.key] && !question.teamRate) {
                        question.key = childSnapshot.key;
                        $scope.questions.push(question);
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
                    var ansRef = firebase.database().ref('NewAnswers/' + qst.key + '/answer/' + $rootScope.settings.userId);
                    $scope.ansRefArr.push(ansRef)
                    ansRef.on('value', function (ans) {
                        if (ans.val() == undefined) {
                            qst.completed = false;
                            if ($scope.setData.MultipleType) {
                                $scope.note = "You can get feedback when you answer all questions.";
                            }
                        } else {
                            qst.completed = true;

                            if ($scope.setData.MultipleType) {
                                var qstScore = 0;
                                var answers = ans.val().answer.split(',');
                                if (qst.optionDetails) {
                                    for (var i = 0; i < answers.length; i++) {
                                        qstScore += qst.optionDetails[qst.options.indexOf(answers[i])].score;
                                    }
                                }
                                qst.score = qstScore;
                            }
                        }
                        length--;

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
                        }
                        $rootScope.safeApply();
                    });
                });

                //========== end get answered state===================
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
            var myanswer = firebase.database().ref('NewAnswers/' + obj.key + '/answer/' + $rootScope.settings.userId);
            myanswer.once('value', function (snapshot) {
                if (snapshot.val()) {
                    $rootScope.setData('prevAnswer', snapshot.val()['answer']);
                    $rootScope.setData('prevAnswerVal', snapshot.val()['answerval']);
                } else {
                    $rootScope.setData('prevAnswer', '');
                }

                // check if disabled question
                var set = $rootScope.settings.questionSet;
                var disabled = false;
                if (set.DisabledQuestions && set.DisabledQuestions[obj.key]) {
                    disabled = true;
                }
                $rootScope.setData('disabledQuestion', disabled);
                $rootScope.setData('questionKey', obj.key);
                $rootScope.setData('questionString', obj.question);
                $rootScope.setData('questionObj', obj);

                $rootScope.setData('questionType', obj.questionType);

                switch (obj.questionType) {
                    case 'Feedback Type':  //Feedbacktype
                        $rootScope.setData('qtype', obj.type);
                        $rootScope.setData('feedqts', obj.feedqts);
                        $rootScope.setData('listType', obj.listType);
                        $rootScope.setData('selfRate', obj.selfRate);
                        $state.go('feedbackAnswer');
                        break;
                    case 'Rating Type':
                        $rootScope.setData('ratingType', obj.ratingtype);
                        $rootScope.setData('ratingItems', obj.ratingItems);
                        $rootScope.setData('ratingOptions', obj.ratingOptions);
                        $rootScope.setData('shareRate', obj.shareRate);
                        $state.go('ratingAnswer');
                        break;
                    case 'Digit Type':
                        $state.go('digitAnswer');
                        break;
                    case 'Text Type':
                        $state.go('textAnswer');
                        break;
                    case 'Dropdown Type':
                        $state.go('dropdownAnswer');
                        break;
                    case 'Contingent Type':
                        $state.go('contingentAnswer');
                        break;
                    case 'Slide Type':
                        $state.go('slideAnswer');
                        break;
                    case 'Multiple Type':
                        $state.go('multipleAnswer');
                        break;
                    case 'Answer Type':
                        $state.go('answer');
                        break;
                    case 'External Activity':
                        $state.go('viewExternal');
                        break;
                }
            });

        }

    }
})();