(function () {
    angular
        .module('myApp')
        .controller('teacherCompleteQuestionSetController', teacherCompleteQuestionSetController)

    teacherCompleteQuestionSetController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherCompleteQuestionSetController($state, $scope, $rootScope, $filter) {
        // **************   router:    completeQuestionSet  *****************

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'groupRoot');
        $rootScope.setData('selectedMenu', 'link');

        $scope.setData = $rootScope.settings.questionSet;
        const setKey = $scope.setData.siblingSetKey ? $scope.setData.siblingSetKey : $scope.setData.key;
        const usersInGroup = $rootScope.settings.usersInGroup;
        $scope.note = "<Student> tag will be replace with student name or string 'Student' if name is exist or not."
        
        
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getUsers();
        }
        $scope.getUsers = function () {
            var userRef = firebase.database().ref('Users');
            userRef.once('value', function (snapshot) {

                $scope.users = {};
                if (snapshot.val()) {
                    usersInGroup.forEach(function (userKey) {
                        $scope.users[userKey] = snapshot.val()[userKey];
                    })
                }
                $scope.getAllQuestions();
            });
        }
        $scope.getAllQuestions = function () {
            var qtdata = firebase.database().ref('Questions/').orderByChild('Set').equalTo(setKey)
            qtdata.on('value', function (snapshot) {
                $scope.questions = {};
                snapshot.forEach(function (childSnapshot) {
                    var question = childSnapshot.val();
                    question.key = childSnapshot.key;
                    $scope.questions[childSnapshot.key] = question;
                });
                $scope.getAnswers();
            });
        }


        $scope.getAnswers = function () {
            $scope.results = {};
            var completeQsts = {};
            var completeUsers = {};
            Object.keys($scope.questions).forEach(function (qstKey) {
                completeQsts[qstKey] = false;
            })
            usersInGroup.forEach(function (userKey) {
                $scope.results[userKey] = angular.copy(completeQsts);
                completeUsers[userKey] = false;
            });

            for (qstKey in $scope.questions) {
                $scope.questions[qstKey].users = angular.copy(completeUsers);
            }

            // get Answers
            if ($scope.setData.LikertType) {
                var ansRef = firebase.database().ref('LikertAnswer/' + setKey)

                ansRef.once('value', function (snapshot) {
                    if (snapshot.val()) {
                        for (answereduserKey in snapshot.val()) {
                            if (snapshot.val()[answereduserKey].answer) {
                                Object.keys(snapshot.val()[answereduserKey].answer).forEach(function (qstKey) {
                                    if ($scope.results[answereduserKey]) {
                                        $scope.results[answereduserKey][qstKey] = true;
                                        $scope.questions[qstKey].users[answereduserKey] = true;
                                    }
                                })
                            }
                        }
                    }
                    $scope.calcResult();
                })
            } else {
                var count = 0;
                Object.keys($scope.questions).forEach(function (qstKey) {
                    var ansRef = firebase.database().ref('NewAnswers/' + qstKey);
                    ansRef.once('value', function (snapshot) {
                        count++;
                        if (snapshot.val()) {
                            if (snapshot.val().answer) {
                                Object.keys(snapshot.val().answer).forEach(function (answereduserKey) {
                                    if ($scope.results[answereduserKey]) {
                                        $scope.results[answereduserKey][qstKey] = true;
                                        $scope.questions[qstKey].users[answereduserKey] = true;
                                    }
                                })
                            }
                        }
                        if (count == Object.keys($scope.questions).length) {
                            $scope.calcResult();
                        }
                    })
                })
                if (Object.keys($scope.questions).length == 0) {
                    $scope.calcResult();
                }
            }
        }

        $scope.calcResult = function () {
            // calc complete users
            $scope.userList = [];
            for (userKey in $scope.results) {
                var result = $scope.results[userKey];
                var userItem = { userKey: userKey, show_id: $scope.users[userKey].show_id, questions: [], completeSet: true, email: $scope.users[userKey].ID };

                for (qstKey in result) {
                    userItem.questions.push({ question: $scope.questions[qstKey].question, complete: result[qstKey] })
                    if (!result[qstKey]) {
                        userItem.completeSet = false;
                    }
                }
                $scope.userList.push(userItem)
            }
            $scope.userList = $filter('orderBy')($scope.userList, '-completeSet');
            for (var i = 0; i < $scope.userList.length; i++) {
                $scope.userList[i].questions = $filter('orderBy')($scope.userList[i].questions, '-complete');
            }


            //calc complete questions

            $scope.questionList = [];
            for (qstKey in $scope.questions) {
                var result = $scope.questions[qstKey];
                var qstItem = { qstKey: qstKey, question: result.question, users: [], completeSet: true };
                for (userKey in result.users) {
                    qstItem.users.push({ show_id: $scope.users[userKey].show_id, complete: result.users[userKey] });
                    if (!result.users[userKey]) {
                        qstItem.completeSet = false;
                    }
                }
                $scope.questionList.push(qstItem);
            }
            $scope.questionList = $filter('orderBy')($scope.questionList, '-completeSet');

            for (var i = 0; i < $scope.questionList.length; i++) {
                $scope.questionList[i].users = $filter('orderBy')($scope.questionList[i].users, '-complete');
            }


            // init indexs
            if (!$scope.userIndex) {
                if ($scope.userList.length > 0) {
                    $scope.userIndex = 0;
                }
            }
            if (!$scope.questionIndex) {
                if ($scope.questionList.length > 0) {
                    $scope.questionIndex = 0;
                }
            }
            if (!$scope.selectedTab) {
                $scope.selectedTab = 'questionList';
            }
            $rootScope.setData('loadingfinished', true);
        }

        $scope.selectUser = function (index) {
            $scope.userIndex = index;
            $rootScope.safeApply();
        }
        $scope.selectQuestion = function (index) {
            $scope.questionIndex = index;
            $rootScope.safeApply();
        }
        $scope.setActive = function (tabStr) {
            $scope.selectedTab = tabStr;
        }

        $scope.showEmailModal = function () {
            $scope.emailTemplate = `  Dear <Student>,
  You didn't complete all questions in below Question Set 
  `+ $rootScope.settings.groupName + `(Group)/ ` + $scope.setData.setname + `(Question Set).
  Please answer all questions in this Question Set.
  Thanks, from teacher.`
            $rootScope.safeApply()
            $('#sendMailModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.sendEmail = function () {
            if (!confirm("Are you sure want to send email to all users who didn't complete all questions?")) return
            var studentList = []
            $scope.userList.forEach(user => {
                if (!user.completeSet) {
                    studentList.push({ email: user.email, name: user.nick_name ? user.nick_name : 'Student' })
                }
            });
            if (studentList.length == 0) {
                $rootScope.warning("There isn't any user who didn't complete questions")
                return;
            }
            var sendReminderEmail = firebase.functions().httpsCallable('sendReminderEmail');
            sendReminderEmail({ studentList: studentList, emailTemplate: $scope.emailTemplate }).then(function (result) {
                if (result.data && result.data.result == 'success') {
                    $rootScope.success('Reminder email sent to ' + result.data.sendCount + ' students!');
                    $('#sendMailModal').modal('hide');
                } else {
                    $rootScope.error('Email send error! Please retry after 5 min!');
                }
            })
        }
    }
})();