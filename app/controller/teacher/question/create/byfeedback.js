(function () {

    angular
        .module('myApp')
        .controller('createByFeedbackController', createByFeedbackController)

    createByFeedbackController.$inject = ['$state', '$scope', '$rootScope'];

    function createByFeedbackController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceQuestionType");
        $scope.selectedRadio = 0;
        $scope.listType = false;
        $scope.anonymous = false;
        $scope.selfRate = false;
        $scope.top_answers = 0;
        $scope.groupFeedback = 'team';
        $scope.isInvestment = false;
        $scope.awardScore = 0;
        $scope.awardPeoples = 0;
        $rootScope.newQuestionKey = undefined
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.questionsRef) $scope.questionsRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getAllQuestions()
        }
        $scope.getAllQuestions = function () {
            $scope.questionsRef = firebase.database().ref("Questions")
            $scope.questionsRef.on('value', function (snapshot) {
                $scope.Questions = snapshot.val() || {}
                $rootScope.newQuestionKey = $scope.getCode()
                $rootScope.setData("loadingfinished", true)
                $rootScope.fileupload()
                $rootScope.result_image_upload()
            })
        }
        $scope.getCode = function () {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghijklmnopqrstuvwxyz1234567890'.split('');
            var new_id = '';
            do {
                new_id = '';
                for (var i = 0; i < 5; i++) {
                    new_id += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (Object.keys($scope.Questions).indexOf(new_id) > -1);
            return new_id;
        }

        //  create feedback type question
        $scope.awardScoreChanged = function () {
            $scope.awardScore = Math.round($scope.awardScore);
            if ($scope.awardScore < 1) $scope.awardScore = 0;
        }
        $scope.awardPeopleChanged = function () {
            $scope.awardPeoples = Math.round($scope.awardPeoples);
            if ($scope.awardPeoples < 1) $scope.awardPeoples = 0;
        }
        

        $scope.getOrder = function () {
            let order = -1
            let setQuestions = Object.values($scope.Questions).filter(qst => qst.Set == $rootScope.settings.questionSetKey);
            for (i = 0; i < setQuestions.length; i++) {
                if (setQuestions[i].order > order) order = setQuestions[i].order
            }
            return order + 1
        }

        $scope.creatQuestion = function () {
            //if question doesn't exist, return
            if ($scope.mainQuestion == '' || $scope.mainQuestion == undefined) {
                $rootScope.error('Please Input Question!');
                return;
            }
            //if feedback type is not selected, return
            if ($scope.feedbacktype == undefined) {
                $rootScope.error('Please Select Feedback Type!');
                return;
            }
            var feedqts = [];
            //Scale 10 questions
            if ($scope.feedqt1)
                feedqts.push($scope.feedqt1);
            if ($scope.feedqt2)
                feedqts.push($scope.feedqt2);
            if ($scope.feedqt3)
                feedqts.push($scope.feedqt3);
            if ($scope.feedqt4)
                feedqts.push($scope.feedqt4);
            if ($scope.feedqt5)
                feedqts.push($scope.feedqt5);
            if ($scope.feedqt6)
                feedqts.push($scope.feedqt6);
            if ($scope.feedqt7)
                feedqts.push($scope.feedqt7);
            if ($scope.feedqt8)
                feedqts.push($scope.feedqt8);
            if ($scope.feedqt9)
                feedqts.push($scope.feedqt9);
            if ($scope.feedqt10)
                feedqts.push($scope.feedqt10);
            //user mail

            $scope.top_answers = Math.round($scope.top_answers);
            if ($scope.top_answers < 0) $scope.top_answers = 0;

            var links = angular.copy($rootScope.links);
            links = links.filter(function (link) {
                if (link.title == '' && link.url == '') {
                    return false;
                } else {
                    return true;
                }
            })
            var qtdetails = {
                title: $scope.title ? $scope.title : {},
                question: $scope.mainQuestion,
                type: $scope.feedbacktype,
                feedqts: feedqts,
                teacher: $rootScope.settings.userEmail,
                image: $rootScope.temp_image || {},
                videoID: $scope.videoID || {},
                Set: $rootScope.settings.questionSetKey,
                questionType: "Feedback Type",
                anonymous: $scope.anonymous || {},
                selfRate: $scope.selfRate || {},
                unRequired: $scope.unRequired || {},
                listType: $scope.listType || {},
                top_answers: $scope.top_answers || {},
                links: links,
                isInvestment: $scope.isInvestment,
                groupFeedback: $scope.groupFeedback,
                awardScore: $scope.awardScore || {},
                awardPeoples: $scope.awardPeoples || {},
                instruction: $scope.instruction || {},
                result_videoID: $scope.result_videoID || {},
                result_image: $rootScope.temp_result_image || {},
                result_string: $scope.result_string || {},
                code: $rootScope.newQuestionKey,
                order: $scope.getOrder()
            };//Questions

            firebase.database().ref('Questions/' + $rootScope.newQuestionKey).set(qtdetails).then(function () {
                $rootScope.success('Question is created successfully!')
                $rootScope.safeApply();
                setTimeout(function () {
                    $state.reload()
                }, 500);
            })
        }

    }

})();