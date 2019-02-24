(function () {

    angular
        .module('myApp')
        .controller('createByMultipleController', createByMultipleController)

    createByMultipleController.$inject = ['$state', '$scope', '$rootScope'];

    function createByMultipleController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        if ($rootScope.settings.setType == 'Multiple') {
            $rootScope.setData('backUrl', "questionsInSet");
        } else {
            $rootScope.setData('backUrl', "choiceQuestionType");
        }
        $scope.selectedRadio = 0;
        $scope.choices = [];
        var optionindex = 0;
        $rootScope.newQuestionKey = undefined
        $scope.enableGroup = 'disabled'
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.questionsRef) $scope.questionsRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getAllQuestions()
            $rootScope.result_image_upload()
        }
        $scope.getAllQuestions = function () {
            $scope.questionsRef = firebase.database().ref("Questions")
            $scope.questionsRef.on('value', function (snapshot) {
                $scope.Questions = snapshot.val() || {}
                $rootScope.newQuestionKey = $scope.getCode()
                $rootScope.setData("loadingfinished", true)
                $rootScope.fileupload()
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

        $scope.addNewChoice = function () {
            if ($scope.mainQuestion == '' || $scope.mainQuestion == undefined) {
                $rootScope.warning('Please Input Question first!');
                return
            }
            if (optionindex > 20) {
                $rootScope.warning('Options are too much!');
                return;
            }
            var newItemNo = $scope.choices.length + 1;
            try {
                if ($scope.choices[optionindex * 1 - 1].name == undefined) {
                    $rootScope.warning('Please Input option correctly!');
                    return;
                }
            } catch (e) { }

            $scope.choices.push({ 'id': 'option' + newItemNo });
            optionindex++;
        };

        $scope.removeChoice = function () {
            var lastItem = $scope.choices.length - 1;
            $scope.choices.splice(lastItem);
            optionindex--;
        };

        $scope.getOrder = function () {
            let order = -1
            let setQuestions = Object.values($scope.Questions).filter(qst => qst.Set == $rootScope.settings.questionSetKey);
            for (i = 0; i < setQuestions.length; i++) {
                if (setQuestions[i].order > order) order = setQuestions[i].order
            }
            return order + 1
        }

        $scope.creatMultipleQuestion = function () {
            if ($scope.choices.length > 0) {
                if (!$scope.choices[$scope.choices.length - 1].name) $scope.removeChoice();
            }

            if (!$scope.mainQuestion) {
                $rootScope.error('Please Input Question!');
                return;
            }
            if (!$scope.maximumSelection) {
                $rootScope.error('Please Input muximum selection count!');
                return;
            } else {
                if ($scope.maximumSelection >= $scope.choices.length) {
                    $rootScope.error("Maximum selection count must be less than field count!");
                    return;
                }
            }

            //if feedback type is not selected, return
            //user mail
            var options = [];
            var i = 0;
            $scope.choices.forEach(function (childval) {
                options[i] = childval.name;
                i++;
            })
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
                teacher: $rootScope.settings.userEmail,
                options: options,
                maximumSelection: $scope.maximumSelection,
                image: $rootScope.temp_image || {},
                videoID: $scope.videoID || {},
                Set: $rootScope.settings.questionSetKey,
                questionType: 'Multiple Type',
                enableGroup: $scope.enableGroup == 'disabled' ? {} : $scope.enableGroup,
                anonymous: $scope.selectedRadio ? true : {},
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
        $scope.radioChanged = function (selectedRadio) {
            $scope.selectedRadio = selectedRadio;
            $rootScope.safeApply();
        }
    }
})();