(function () {

    angular
        .module('myApp')
        .controller('createBySlideController', createBySlideController)

    createBySlideController.$inject = ['$state', '$scope', '$rootScope'];

    function createBySlideController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceQuestionType");
        $scope.selectedRadio = 0;
        $scope.slideQuestions = [];
        $scope.isContingent = false;
        $rootScope.newQuestionKey = undefined
        $scope.enableGroup = 'disabled'
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


        $scope.addNewslideRecord = function () {
            if ($scope.slideQuestions.length > 40) {
                $rootScope.warning('Fields are too much!');
                return;
            }
            $scope.slideQuestions.push($scope.isContingent ? { propertyquestion: '', left: '0%', right: '100%' } : { propertyquestion: '', left: '', right: '' });
            $rootScope.safeApply();
        };

        $scope.removeslideRecord = function (index) {
            $scope.slideQuestions.splice(index, 1);
        };

        $scope.getOrder = function () {
            let order = -1
            let setQuestions = Object.values($scope.Questions).filter(qst => qst.Set == $rootScope.settings.questionSetKey);
            for (i = 0; i < setQuestions.length; i++) {
                if (setQuestions[i].order > order) order = setQuestions[i].order
            }
            return order + 1
        }
        $scope.changeType = function (isContingent) {
            $scope.isContingent = isContingent;
            $scope.slideQuestions.forEach(qst => {
                if (isContingent) {
                    qst.left = "0%";
                    qst.right = "100%";
                } else {
                    qst.left = qst.right = "";
                }
            });
        }
        $scope.creatSlideQuestion = function () {
            if (!$scope.mainQuestion) {
                $rootScope.warning('Please Input Question!');
                return;
            }

            if ($scope.slideQuestions.length == 0) {
                $rootScope.error("You need to input more than one field.");
                return;
            }

            var properties = [];
            var empty = false;
            $scope.slideQuestions.forEach(function (childval) {
                if (!childval.propertyquestion || !childval.left || !childval.right) {
                    empty = true;
                }
                properties.push({ propertyquestion: childval.propertyquestion, right: childval.right, left: childval.left });
            });
            if (empty) {
                $rootScope.error('Please Input all field data!');
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
                title: $scope.title ? $scope.title : {},
                question: $scope.mainQuestion,
                teacher: $rootScope.settings.userEmail,
                properties: properties,
                isContingent: $scope.isContingent,
                image: $rootScope.temp_image || {},
                videoID: ($scope.videoID) ? $scope.videoID : {},
                Set: $rootScope.settings.questionSetKey,
                questionType: 'Slide Type',
                enableGroup: $scope.enableGroup == 'disabled' ? {} : $scope.enableGroup,
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
                    $state.reload();
                }, 1000);
            });
        }
        $scope.radioChanged = function (selectedRadio) {
            $scope.selectedRadio = selectedRadio;
            $rootScope.safeApply();
        }
    }
})();