(function () {

    angular
        .module('myApp')
        .controller('createByContingentController', createByContingentController)

    createByContingentController.$inject = ['$state', '$scope', '$rootScope'];

    function createByContingentController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "choiceQuestionType");
        $scope.subQuestions = [];
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
                $scope.fileupload()
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
        $scope.showAddModal = function () {
            $scope.subQuestion = undefined;
            $scope.options = ["Yes", "No"];

            $scope.temp_image = undefined;
            var uploader = document.getElementById('uploader');
            var fileButton = document.getElementById('fileButton');
            uploader.value = 0;
            fileButton.value = "";

            $scope.videoID = undefined;
            $rootScope.safeApply();
            $('#addModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.fileupload = function () {

            var uploader = document.getElementById('uploader');
            var fileButton = document.getElementById('fileButton');
            fileButton.addEventListener('change', function (e) {

                //Get File
                var file = e.target.files[0];
                //Create storage ref
                var storageRef = firebase.storage().ref('Questions/' + $scope.newQuestionKey + $scope.subQuestions.length)
                //Upload file
                var task = storageRef.put(file);
                $scope.temp_image = $scope.newQuestionKey + $scope.subQuestions.length
                //Update Progressbar
                task.on('state_changed',
                    function progress(snapshot) {
                        var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        uploader.value = percentage;
                        if (percentage == 100) {
                            $rootScope.success('Success!');
                            $rootScope.safeApply();
                        }
                    },
                );
            })
        }
        $scope.addQuestion = function () {
            if (!$scope.subQuestion) {
                $rootScope.warning("Please input question string.");
                return;
            }
            if (!$scope.options[0] || !$scope.options[1]) {
                $rootScope.warning("Please input valid option values.");
                return;
            }

            var last_index = $scope.subQuestions.length;
            $scope.subQuestions[last_index] = {
                question: $scope.subQuestion,
                image: $scope.temp_image || {},
                videoID: $scope.videoID || {},
                options: $scope.options,
            }
            $('#addModal').modal('hide');
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

            if ($scope.mainQuestion == '' || $scope.mainQuestion == undefined) {
                $rootScope.error('Please Input Question Title!');
                return;
            }
            if ($scope.subQuestions.length < 2) {
                $rootScope.error("You need to add more than two sub questions.");
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
                editable: $scope.editable || {},
                subQuestions: angular.copy($scope.subQuestions),
                Set: $rootScope.settings.questionSetKey,
                questionType: 'Contingent Type',
                links: links,
                result_videoID: $scope.result_videoID || {},
                result_image: $rootScope.temp_result_image || {},
                result_string: $scope.result_string || {},
                code: $rootScope.newQuestionKey,
                order: $scope.getOrder()
            };
            firebase.database().ref("Questions/" + $rootScope.newQuestionKey).set(qtdetails).then(function () {
                $rootScope.success('Question is created successfully!')
                $rootScope.safeApply();
                setTimeout(function () {
                    $state.reload()
                }, 500);
            })
        }
    }
})();