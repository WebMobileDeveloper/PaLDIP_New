(function () {

    angular
        .module('myApp')
        .controller('TeacherQuestionDetailController', TeacherQuestionDetailController)

    TeacherQuestionDetailController.$inject = ['$state', '$scope', '$rootScope', '$sce', '$filter'];

    function TeacherQuestionDetailController($state, $scope, $rootScope, $sce, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questionsInSet");
        $scope.Types = ['Text', 'Scale', 'Scale & Text'];
        $rootScope.newQuestionKey = $rootScope.settings.questionKey
        $scope.qstRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey);
        $scope.editable = $rootScope.settings.editable
        $rootScope.safeApply();
        $scope.$on("$destroy", function () {
            if ($scope.userRef) $scope.userRef.off('value');
            if ($scope.setQuestionsRef) $scope.setQuestionsRef.off('value');
            if ($scope.qstRef) $scope.qstRef.off('value');
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
            if ($rootScope.questionResultImageRef) $rootScope.questionResultImageRef.off('value')
        });
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getUserData();
            $scope.getSetQuestions();
            $scope.getQuestionData();
        }
        $scope.getUserData = function () {
            $scope.userRef = firebase.database().ref('Users/' + $rootScope.settings.userId);
            $scope.userRef.on('value', function (snapshot) {
                $scope.userData = snapshot.val();
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }
        $scope.getSetQuestions = function () {
            $scope.setQuestionsRef = firebase.database().ref('Questions/').orderByChild("Set").equalTo($rootScope.settings.questionSetKey)
            $scope.setQuestionsRef.on('value', function (snapshot) {
                $scope.setQuestions = Object.values(snapshot.val() || {}).filter(question => question.questionType != "Answer Type");
                $scope.setQuestions = $filter('orderBy')($scope.setQuestions, 'order');
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }
        $scope.getQuestionData = function () {
            $scope.qstRef.on('value', function (snapshot) {
                $scope.question = snapshot.val();
                $scope.question.additional_info = $scope.question.additional_info ? $scope.question.additional_info : "&nbsp;";

                if (!$scope.editable) {
                    document.getElementById('additional_info').innerHTML = $scope.question.additional_info;
                }
                if ($scope.question.videoID) {
                    $scope.question.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.videoID + "?rel=0&enablejsapi=1");
                    $rootScope.removeRecommnedVideo()
                }
                if ($scope.question.result_videoID) {
                    $scope.question.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.result_videoID + "?rel=0&enablejsapi=1");
                    $rootScope.removeRecommnedVideo1()
                }
                if (!$scope.question.top_answers) {
                    $scope.question.top_answers = 0;
                }
                if (!$scope.question.awardScore) {
                    $scope.question.awardScore = 0;
                }
                if (!$scope.question.awardPeoples) {
                    $scope.question.awardPeoples = 0;
                }
                if ($scope.question.questionType == "Multiple Type") {                    //for multiple type question
                    if (!$scope.question.optionDetails) {
                        $scope.question.optionDetails = [];
                        for (var i = 0; i < $scope.question.options.length; i++) {
                            $scope.question.optionDetails.push({ option: $scope.question.options[i], score: 0, feedback: "" });
                        }
                    }
                    if (!$scope.question.feedbacks) {   //for multiple type question
                        $scope.question.feedbacks = [{ from: -1, to: 0, text: '' }];
                    }
                }
                if ($scope.question.questionType == "Slide Type") {                    //for slide type question
                    $scope.question.isContingent = $scope.question.isContingent ? $scope.question.isContingent : false
                }
                if ($scope.question.questionType == "Dropdown Type" || $scope.question.questionType == "Slide Type" || $scope.question.questionType == "Multiple Type") {
                    $scope.question.enableGroup = $scope.question.enableGroup ? $scope.question.enableGroup : 'disabled';
                }
                if ($scope.question.questionType == "Rating Type") {
                    $scope.question.shareRate = $scope.question.shareRate || false;
                    $scope.question.showTeamFeedback = $scope.question.showTeamFeedback || false;
                    $scope.question.selfRate = $scope.question.selfRate || false;
                }
                $scope.question.showState = $scope.question.hideBy ? false : true;
                $scope.question.isInvestment = $scope.question.isInvestment ? $scope.question.isInvestment : false;
                $scope.question.groupFeedback = $scope.question.groupFeedback ? $scope.question.groupFeedback : 'team';

                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return

            if (!$scope.question.links && $scope.editable && $scope.userData.link_enabled) {
                $scope.question.links = [{ title: "", url: '' }];
            }
            if ($scope.question.questionType == 'Answer Type') {
                $scope.question.questionKeys = $scope.question.questionKeys || []
                $scope.selectAll = true
                $scope.setQuestions.forEach(question => {
                    question.selected = ($scope.question.questionKeys.indexOf(question.code) > -1) ? true : false
                    if (!question.selected) $scope.selectAll = false
                });
            }
            $rootScope.setData('loadingfinished', true);
        }


        $scope.titleChanged = function () {
            var updates = {};
            updates['/title'] = ($scope.question.title) ? $scope.question.title : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.questionChanged = function () {
            var updates = {};
            updates['/question'] = ($scope.question.question) ? $scope.question.question : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.resultStringChanged = function () {
            var updates = {};
            updates['/result_string'] = ($scope.question.result_string) ? $scope.question.result_string : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.videoIdChanged = function () {
            var updates = {};
            updates['/videoID'] = ($scope.question.videoID) ? $scope.question.videoID : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.result_videoIdChanged = function () {
            var updates = {};
            updates['/result_videoID'] = ($scope.question.result_videoID) ? $scope.question.result_videoID : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.instructionChanged = function () {
            var updates = {};
            updates['/instruction'] = ($scope.question.instruction) ? $scope.question.instruction : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }

        $scope.hideByChanged = function () {
            var updates = {};
            updates['/hideBy'] = ($scope.question.showState == false) ? $rootScope.settings.userId : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Show state changed successfuly!');
                $rootScope.safeApply();
            });
        }


        //=================   Answer Type question functions  =============================
        $scope.show_id_state_Changed = function () {
            var updates = {};
            updates['/show_id'] = ($scope.question.show_id == false) ? $rootScope.settings.show_id : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Show Unique ID state changed successfuly!');
                $rootScope.safeApply();
            });
        }

        $scope.toggleAll = function () {
            $scope.selectAll = !$scope.selectAll
            $scope.setQuestions.forEach(qst => {
                qst.selected = $scope.selectAll
            });
            let questionKeys = []
            $scope.setQuestions.forEach(qst => {
                if (qst.selected) questionKeys.push(qst.code)
            });
            var updates = {};
            updates['/questionKeys'] = questionKeys
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.toggle = function (index) {
            $scope.setQuestions[index].selected = !$scope.setQuestions[index].selected
            let questionKeys = []
            $scope.setQuestions.forEach(qst => {
                if (qst.selected) questionKeys.push(qst.code)
            });
            var updates = {};
            updates['/questionKeys'] = questionKeys
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        // -------------------------------------------------------------------------------




        $scope.groupFeedbackChanged = function () {
            var updates = {};
            updates['/groupFeedback'] = $scope.question.groupFeedback;
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Team Feedback type changed successfuly!');
                $rootScope.safeApply();
            });
        }
        $scope.awardTypeChanged = function () {
            var updates = {};
            updates['/isInvestment'] = $scope.question.isInvestment;
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Award type changed successfuly!');
                $rootScope.safeApply();
            });
        }
        $scope.anonymousChanged = function () {
            var updates = {};
            updates['/anonymous'] = ($scope.question.anonymous) ? true : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Anonymous changed successfuly!');
                $rootScope.safeApply();
            });
        }

        $scope.topAnswerChanged = function () {
            $scope.question.top_answers = Math.round($scope.question.top_answers);
            if ($scope.question.top_answers < 0) $scope.question.top_answers = 0;
            var updates = {};
            updates['/top_answers'] = ($scope.question.top_answers) ? $scope.question.top_answers : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Top answers changed successfuly!');
                $rootScope.safeApply();
            });
        }
        $scope.infoChanged = function () {
            $scope.question.additional_info = $("#additional_info_edit").html();
            var updates = {};
            updates['/additional_info'] = $scope.question.additional_info
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success("Additional information/Comments saved successfully!");
                $rootScope.safeApply();
            });
        }
        $scope.requiredChanged = function () {
            var updates = {};
            updates['/unRequired'] = ($scope.question.unRequired) ? true : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Answer required changed successfuly!');
                $rootScope.safeApply();
            });
        }

        $scope.editableChanged = function () {
            var updates = {};
            updates['/editable'] = ($scope.question.editable) ? true : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Answer editable button show state changed successfuly!');
                $rootScope.safeApply();
            });
        }
        $scope.enableGroupChanged = function () {
            var updates = {};
            updates['/enableGroup'] = $scope.question.enableGroup == 'disabled' ? {} : $scope.question.enableGroup
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Enable Group state changed successfuly!');
                $rootScope.safeApply();
            });
        }
        $scope.ratingOptionChanged = function () {
            var updates = {};
            updates['/ratingOptions'] = $scope.question.ratingOptions;
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.selfRateChanged = function () {
            var updates = {};
            updates['/selfRate'] = $scope.question.selfRate == false ? {} : $scope.question.selfRate
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Self rate state changed successfuly!');
                $rootScope.safeApply();
            });
        }
        $scope.shareRateChanged = function () {
            var updates = {};
            updates['/shareRate'] = $scope.question.shareRate == false ? {} : $scope.question.shareRate
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Share rate state changed successfuly!');
                $rootScope.safeApply();
            });
        }
        $scope.showTeamFeedbackChanged = function () {
            var updates = {};
            updates['/showTeamFeedback'] = $scope.question.showTeamFeedback == false ? {} : $scope.question.showTeamFeedback
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Show Team Result state changed successfuly!');
                $rootScope.safeApply();
            });
        }
        $scope.awardScoreChanged = function () {
            $scope.question.awardScore = Math.round($scope.question.awardScore);
            if ($scope.question.awardScore < 1) $scope.question.awardScore = 0;
            var updates = {};
            updates['/awardScore'] = ($scope.question.awardScore) ? $scope.question.awardScore : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.awardPeopleChanged = function () {
            $scope.question.awardPeoples = Math.round($scope.question.awardPeoples);
            if ($scope.question.awardPeoples < 1) $scope.question.awardPeoples = 0;
            var updates = {};
            updates['/awardPeoples'] = ($scope.question.awardPeoples) ? $scope.question.awardPeoples : {};
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }

        //link functions
        $scope.addLink = function (index) {
            $scope.question.links.splice(index + 1, 0, { title: "", url: '' });
        }
        $scope.removeLink = function (index) {
            $scope.question.links.splice(index, 1);
            if ($scope.question.links.length == 0) {
                $scope.question.links = [{ title: "", url: '' }];
            }
        }

        $scope.saveLinks = function () {
            if (!confirm("Are you sure want to save these links?")) return;
            var links = angular.copy($scope.question.links);
            links = links.filter(function (link) {
                if (link.title == '' && link.url == '') {
                    return false;
                } else {
                    return true;
                }
            })
            var updates = {};
            updates['/links'] = links
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Links saved successfuly!');
                $rootScope.safeApply();
            });
        }
        //    ==============Question  Feedback related functions===========================================
        $scope.addFeedback = function (index) {
            var start = $scope.question.feedbacks[index].to;
            $scope.question.feedbacks.splice(index + 1, 0, { from: start, to: start, text: '' });
        }
        $scope.removeFeedback = function (index) {
            if ($scope.question.feedbacks.length == 1) {
                $rootScope.warning("This is a last feedback!");
                return;
            }
            $scope.question.feedbacks.splice(index, 1);
        }
        //    ============== Multiple type option related functions===========================================
        $scope.addNewOption = function () {
            if (!confirm("You couldn't delete option if you add new option.  Are you sure want to add new option?")) return
            let lastIndex = $scope.question.options.length
            $scope.question.optionDetails[lastIndex] = { option: "", score: 0, feedback: "" }
            var updates = {};
            updates['/options/' + $scope.question.options.length] = "";
            updates['/optionDetails'] = angular.copy($scope.question.optionDetails);
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success("New Option appended successfully!")
                $rootScope.safeApply();
            });
        }
        $scope.saveOptionDetail = function () {
            var updates = {};
            updates['/optionDetails'] = angular.copy($scope.question.optionDetails);
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.optionChanged = function () {
            let options = []
            $scope.question.optionDetails.forEach(item => {
                options.push(item.option)
            });
            var updates = {};
            updates['/options'] = options;
            updates['/optionDetails'] = angular.copy($scope.question.optionDetails);
            $scope.qstRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.saveFeedbacks = function () {
            if (!confirm("Are you sure want to save changed feedback data?")) return;
            var updates = {};
            updates['/feedbacks'] = angular.copy($scope.question.feedbacks);
            $scope.qstRef.update(updates).then(function () {
                $rootScope.success('Feedback data saved successfuly!');
                $rootScope.safeApply();
            });
        }
        // ===================contingent type functions============================
        // $scope.slideType_Changed = function () {
        //     $scope.qstRef.update({ 'isContingent': $scope.question.isContingent ? $scope.question.isContingent : {} }).then(function () {
        //         $rootScope.success('Slide Type Changed!');
        //         $rootScope.safeApply();
        //     });
        // }
        //fileUpload
        $scope.fileupload = function () {

            var fileButton = document.getElementById('fileButton2');
            fileButton.addEventListener('change', function (e) {
                //Get File
                var file = e.target.files[0];
                var storageRef = firebase.storage().ref('additional_info/' + $rootScope.settings.questionKey + file.name)
                //Upload file
                var uploadTask = storageRef.put(file);
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                    function (snapshot) {
                        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                        // var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        // uploader.value = percentage;
                    }, function (error) {
                        $rootScope.warning('Upload Error!');
                    }, function () {
                        // Upload completed successfully, now we can get the download URL
                        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                            var imgTagStr = `
                            <br/>
                            <div class='img-div' style="background: url('`+ downloadURL + `');">                           
                            </div>
                            <br/>`;

                            $scope.question.additional_info += imgTagStr;
                            $rootScope.safeApply();
                        });
                    });
            })
        }
    }
})();