(function () {

    angular
        .module('myApp')
        .controller('createByRatingController', createByRatingController)

    createByRatingController.$inject = ['$state', '$scope', '$rootScope'];

    function createByRatingController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceQuestionType");

        $scope.anonymous = false;
        $scope.items = [''];
        $scope.options = [''];
        $scope.top_answers = 0;
        $scope.teamRate = false;
        $scope.ratingtype = 0;
        $scope.selfRate = false;
        $scope.isInvestment = false;
        $scope.showTeamFeedback = true;
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

        $scope.getOrder = function () {
            let order = -1
            let setQuestions = Object.values($scope.Questions).filter(qst => qst.Set == $rootScope.settings.questionSetKey);
            for (i = 0; i < setQuestions.length; i++) {
                if (setQuestions[i].order > order) order = setQuestions[i].order
            }
            return order + 1
        }
        $scope.awardScoreChanged = function () {
            $scope.awardScore = Math.round($scope.awardScore);
            if ($scope.awardScore < 1) $scope.awardScore = 0;
        }
        $scope.awardPeopleChanged = function () {
            $scope.awardPeoples = Math.round($scope.awardPeoples);
            if ($scope.awardPeoples < 1) $scope.awardPeoples = 0;
        }
        $scope.creatQuestion = function () {
            //if question doesn't exist, return
            if (!$scope.mainQuestion) {
                $rootScope.error('Please Input Question!');
                return;
            }

            if (!$scope.teamRate) {
                var ratingItems = [];
                for (i = 0; i < $scope.items.length; i++) {
                    if ($scope.items[i]) {
                        ratingItems.push($scope.items[i]);
                    }
                }
                if (ratingItems.length < 1) {
                    $rootScope.error("Please input rating items more than one.");
                    return;
                }

            }

            var ratingOptions = [];
            if ($scope.ratingtype) {
                for (i = 0; i < $scope.options.length; i++) {
                    if ($scope.options[i]) {
                        ratingOptions.push($scope.options[i]);
                    }
                }
                if (ratingOptions.length < 1) {
                    $rootScope.error("Please input rating options more than one.");
                    return;
                }
            }

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
                ratingtype: $scope.ratingtype,
                ratingOptions: ratingOptions,
                teacher: $rootScope.settings.userEmail,
                image: $rootScope.temp_image || {},
                videoID: $scope.videoID || {},
                Set: $rootScope.settings.questionSetKey,
                questionType: "Rating Type",
                teamRate: $scope.teamRate,
                ratingItems: $scope.teamRate ? {} : ratingItems,
                selfRate: $scope.teamRate && $scope.selfRate ? true : {},
                showTeamFeedback: $scope.teamRate && $scope.showTeamFeedback ? true : {},

                shareRate: $scope.shareRate || {},
                anonymous: $scope.anonymous || {},
                top_answers: $scope.top_answers || {},
                isInvestment: $scope.isInvestment,
                awardScore: $scope.awardScore || {},
                awardPeoples: $scope.awardPeoples || {},
                links: links,
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
        $scope.add_item = function () {
            var item_count = $scope.items.length;
            $scope.items[item_count] = '';
        }
        $scope.add_option = function () {
            var option_count = $scope.options.length;
            $scope.options[option_count] = '';
        }
    }

})();