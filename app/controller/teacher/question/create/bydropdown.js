(function () {

    angular
        .module('myApp')
        .controller('createByDropdownController', createByDropdownController)

    createByDropdownController.$inject = ['$state', '$scope', '$rootScope'];

    function createByDropdownController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceQuestionType");
        $scope.selectedRadio = 0;
        $scope.choices = [];
        $scope.enableGroup = 'disabled'
        var optionindex = 0;

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

        $scope.addNewChoice = function () {

            if ($scope.mainQuestion == '' || $scope.mainQuestion == undefined) {
                $rootScope.warning('Please Input Question first!');
                return
            }
            if (optionindex > 20) {
                $rootScope.warning('Fields are too much!');
                return;
            }
            var newItemNo = $scope.choices.length + 1;
            try {
                if (!$scope.choices[optionindex * 1 - 1].name) {
                    $rootScope.warning('Please Input field content correctly!');
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

        $scope.creatDropdownQuestion = function () {
            if ($scope.choices.length > 0) {
                if ($scope.choices[$scope.choices.length - 1].name == undefined) $scope.removeChoice();
            }
            if ($scope.choices.length < 2) {
                $rootScope.error('You need to add at least more than two fields!');
                return;
            }
            if (!$scope.mainQuestion) {
                $rootScope.error('Please Input Question!');
                return;
            }

            //if feedback type is not selected, return
            //user mail
            var options = [];
            var i = 0;
            $scope.choices.forEach(function (childval) {
                options[i] = childval.name;
                i++;
            });

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
                image: $rootScope.temp_image || {},
                videoID: $scope.videoID || {},
                Set: $rootScope.settings.questionSetKey,
                questionType: 'Dropdown Type',
                enableGroup: $scope.enableGroup == 'disabled' ? {} : $scope.enableGroup,
                anonymous: ($scope.selectedRadio) ? true : {},
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