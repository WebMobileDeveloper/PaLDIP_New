(function () {

    angular
        .module('myApp')
        .controller('createByDigitController', createByDigitController)

    createByDigitController.$inject = ['$state', '$scope', '$rootScope'];

    function createByDigitController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceQuestionType");
        $scope.selectedRadio = 0;
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

        $scope.creatDigitQuestion = function () {
            //if question doesn't exist, return
            if (!$scope.mainQuestion) {
                $rootScope.error('Please Input Question!');
                return;
            }
            var links = angular.copy($rootScope.links);
            links = links.filter(function (link) {
                if (link.title == '' && link.url == '') {
                    return false;
                } else {
                    return true;
                }
            })

            var qtdetails = {
                title: $scope.title || {},
                question: $scope.mainQuestion,
                teacher: $rootScope.settings.userEmail,
                image: $rootScope.temp_image || {},
                videoID: $scope.videoID || {},
                Set: $rootScope.settings.questionSetKey,
                questionType: "Digit Type",
                anonymous: $scope.selectedRadio || {},
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
            });
        }
        $scope.radioChanged = function (selectedRadio) {
            $scope.selectedRadio = selectedRadio;
            $rootScope.safeApply();
        }
    }
})();