(function () {

    angular
        .module('myApp')
        .controller('TeacherQuestionsInSetController', TeacherQuestionsInSetController)

    TeacherQuestionsInSetController.$inject = ['$state', '$scope', '$rootScope', 'dragulaService', '$sce', '$filter'];

    function TeacherQuestionsInSetController($state, $scope, $rootScope, dragulaService, $sce, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', $rootScope.settings.baseBackUrl);
        $scope.questions = [];
        $scope.subscales = [];
        $scope.selectedTab = ($rootScope.settings.selectedQuestionTab) ? $rootScope.settings.selectedQuestionTab : 'question';
        $scope.editable = $rootScope.settings.createdByMe;
        $scope.creatorEmail = $rootScope.settings.creatorEmail;
        $scope.creatorNickName = $rootScope.settings.creatorNickName;
        var setRef = firebase.database().ref('QuestionSets/' + $rootScope.settings.questionSetKey)
        $scope.operators = ["+", "-"];

        $rootScope.safeApply();

        //================== question drag functions
        dragulaService.options($scope, 'drag-div', {
            removeOnSpill: false
        });
        $scope.$on('drag-div.drop-model', function (e, el, target, source) {
            var rootRef = firebase.database().ref();
            var updates = {};
            var order = 0;
            $scope.questions.forEach(function (question) {
                updates['Questions/' + question.key + '/order'] = order++;
            });
            rootRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        });
        $scope.questionChanged = function (qst) {
            firebase.database().ref('Questions/' + qst.key + '/question').set(qst.question)
            $rootScope.safeApply();
        }


        //=================== scale drag functions
        dragulaService.options($scope, 'drag-div-subscale', {
            removeOnSpill: false
        });
        $scope.$on('drag-div-subscale.drop-model', function (e, el, target, source) {
            var rootRef = firebase.database().ref();
            var updates = {};
            var order = 0;

            $scope.subscales.forEach(function (subscale) {
                switch (subscale.type) {
                    case 'sub':
                        updates['QuestionSets/' + $rootScope.settings.questionSetKey + '/subscales/' + subscale.key + '/order'] = order++;
                        break;
                    case 'super':
                        updates['QuestionSets/' + $rootScope.settings.questionSetKey + '/superscales/' + subscale.key + '/order'] = order++;
                        break;
                    case 'label':
                        updates['QuestionSets/' + $rootScope.settings.questionSetKey + '/labels/' + subscale.key + '/order'] = order++;
                        break;
                }
            });

            rootRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        })


        //================ siblingsets drag functions
        dragulaService.options($scope, 'drag-div-sibling1', {
            removeOnSpill: false
        });
        $scope.$on('drag-div-sibling1.drop-model', function (e, el, target, source) {
            var newSets = {}
            $scope.siblingSets.forEach((obj, index) => {
                newSets[obj.setKey] = { order: index, show: obj.show }
            });
            setRef.child('/siblingSetOrders').set(newSets).then(function () {
                $rootScope.safeApply();
            });
        })

        //================ create sibling drag functions
        dragulaService.options($scope, 'drag-div-sibling', {
            removeOnSpill: false
        });

        $scope.$on('$destroy', function () {
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.allSetRef) $scope.allSetRef.off('value')
            if ($scope.setQuestionsRef) $scope.setQuestionsRef.off('value')
            if ($scope.questionsRef) $scope.questionsRef.off('value')
            $('#editSetTitleModal').modal('hide');
            $('#copyQuestionModal').modal('hide');
            $('#questionModal').modal('hide');
            $('#multipleSubscaleModal').modal('hide');
            $('#choiceTypeModal').modal('hide');
            $('#subscaleModal').modal('hide');
            $('#createSuperScaleModal').modal('hide');
            $('#createLabelModal').modal('hide');
            $('#copyModal').modal('hide');
            $('#siblingModal').modal('hide');
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $rootScope.loadTags();
            $scope.getNewQuestionCode();
            $scope.getTeacherData();
            $scope.getAllSets();
        }
        $scope.getNewQuestionCode = function () {
            $scope.questionsRef = firebase.database().ref("Questions")
            $scope.questionsRef.on('value', function (snapshot) {
                $scope.allQuestions = snapshot.val()
                $scope.newQuestionCode = $scope.getCode()
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
            } while (Object.keys($scope.allQuestions).indexOf(new_id) > -1);
            return new_id;
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            if ($scope.sharedTeachers[$rootScope.settings.userId] && $scope.sharedTeachers[$rootScope.settings.userId].editable) $scope.editable = true
            $rootScope.setData('loadingfinished', true);
        }

        $scope.getTeacherData = function () {
            $scope.userRef = firebase.database().ref('Users');
            $scope.userRef.on('value', function (snapshot) {
                $scope.allTeachers = snapshot.val() || {}
                $scope.userData = $scope.allTeachers[$rootScope.settings.userId];
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }
        $scope.getAllSets = function () {
            $scope.allSetRef = firebase.database().ref('QuestionSets');
            $scope.allSetRef.on('value', function (snapshot) {
                $scope.allSets = snapshot.val() || {};
                $scope.newSetKey = $scope.getSetCode();
                $scope.mySets = {}
                for (setKey in $scope.allSets) {
                    if ($scope.allSets[setKey].creator == $rootScope.settings.userId && !$scope.allSets[setKey].LikertType) {
                        $scope.mySets[setKey] = $scope.allSets[setKey];
                    }
                }
                $scope.getSetData()
            });
        }
        $scope.getSetCode = function () {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghijklmnopqrstuvwxyz1234567890'.split('');
            var new_id = '';
            do {
                new_id = '';
                for (var i = 0; i < 4; i++) {
                    new_id += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (Object.keys($scope.allSets).indexOf(new_id) > -1);
            return new_id;
        }
        $scope.getSetData = function () {
            $scope.setData = $scope.allSets[$rootScope.settings.questionSetKey]
            $rootScope.setData('questionSetName', $scope.setData.setname);
            $rootScope.selectedTags = [];
            $scope.subscales = [];
            $scope.subscaleArray = [];

            if ($scope.setData.tags) {
                var tags = $scope.setData.tags.split(",");
                tags.forEach(function (tag) {
                    $rootScope.selectedTags.push({ name: tag, type: 'origin' });
                });
            }
            if (!$scope.setData.compare) $scope.setData.compare = false;

            $scope.siblingEditable = !$scope.setData.siblingSetKey || $scope.setData.siblingSetKey == $rootScope.settings.questionSetKey
            if ($scope.setData.siblingSetKey) {
                $scope.siblingSetOrders = $scope.setData.siblingSetOrders || {}
                $scope.siblingSets = []
                for (setKey in $scope.allSets) {
                    if ($scope.allSets[setKey].siblingSetKey == $scope.setData.siblingSetKey && setKey != $rootScope.settings.questionSetKey) {
                        $scope.siblingSets.push({
                            setKey: setKey,
                            setname: $scope.allSets[setKey].setname,
                            order: $scope.siblingSetOrders[setKey] ? $scope.siblingSetOrders[setKey].order : 65535,
                            show: $scope.siblingSetOrders[setKey] ? $scope.siblingSetOrders[setKey].show : false,
                        })
                    }
                }
                $scope.siblingSets = $filter('orderBy')($scope.siblingSets, 'order');
                if (!$scope.siblingEditable) {
                    $scope.setData.subscales = $scope.allSets[$scope.setData.siblingSetKey].subscales
                    $scope.setData.superscales = $scope.allSets[$scope.setData.siblingSetKey].superscales
                    $scope.setData.labels = $scope.allSets[$scope.setData.siblingSetKey].labels
                    $scope.setData.options = $scope.allSets[$scope.setData.siblingSetKey].options
                    $scope.setData.optionScores = $scope.allSets[$scope.setData.siblingSetKey].optionScores
                    $scope.setData.method = $scope.allSets[$scope.setData.siblingSetKey].method
                    $scope.setData.optionCount = $scope.allSets[$scope.setData.siblingSetKey].optionCount
                    $scope.setData.yLabel = $scope.allSets[$scope.setData.siblingSetKey].yLabel
                }
            }

            for (var scaleKey in $scope.setData.subscales) {
                var scale = angular.copy($scope.setData.subscales[scaleKey])
                scale.key = scaleKey;
                scale.type = 'sub';
                if (scale.order == undefined) scale.order = 65535;
                $scope.subscales.push(scale);
                $scope.subscaleArray.push(scale);
            }
            for (var scaleKey in $scope.setData.superscales) {
                var scale = angular.copy($scope.setData.superscales[scaleKey])
                scale.key = scaleKey;
                scale.type = 'super';
                if (scale.order == undefined) scale.order = 65535;
                $scope.subscales.push(scale);
            }
            for (var scaleKey in $scope.setData.labels) {
                var scale = angular.copy($scope.setData.labels[scaleKey])
                scale.key = scaleKey;
                scale.type = 'label';
                if (scale.order == undefined) scale.order = 65535;
                $scope.subscales.push(scale);
            }
            $scope.subscales = $filter('orderBy')($scope.subscales, 'order');
            $scope.subscaleArray = $filter('orderBy')($scope.subscaleArray, 'order');


            if (document.getElementById('additional_info')) {
                document.getElementById('additional_info').innerHTML = $scope.setData.additional_info || "&nbsp;";
            }
            if ($scope.setData.LikertType) {

                if (!$scope.setData.optionScores) {
                    $scope.setData.optionScores = [];
                    $scope.setData.options = $scope.setData.options || []
                    for (var i = 0; i < $scope.setData.options.length; i++) {
                        $scope.setData.optionScores.push(i + 1);
                    }
                }
                if ($scope.setData.yScaleType == undefined) $scope.setData.yScaleType = 'Fixed';
            }
            $scope.setData.private = $scope.setData.private ? $scope.setData.private : false
            $scope.setData.yLabel = $scope.setData.yLabel ? $scope.setData.yLabel : 'Score'
            if ($scope.setData.videoID) {
                $scope.setData.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.setData.videoID + "?rel=0&enablejsapi=1");
                $rootScope.removeRecommnedVideo()
            }
            if ($scope.setData.result_videoID) {
                $scope.setData.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.setData.result_videoID + "?rel=0&enablejsapi=1");
                $rootScope.removeRecommnedVideo1()
            }
            $scope.sharedTeachers = $scope.setData.sharedTeachers || {}
            $scope.getAllQuestions()
        }

        $scope.getAllQuestions = function () {
            var setKey = $scope.setData.siblingSetKey ? $scope.setData.siblingSetKey : $rootScope.settings.questionSetKey
            if ($scope.setQuestionsRef) $scope.setQuestionsRef.off('value')
            $scope.setQuestionsRef = firebase.database().ref('Questions/').orderByChild("Set").equalTo(setKey)
            $scope.setQuestionsRef.on('value', function (snapshot) {
                $scope.questions = [];
                snapshot.forEach(function (childSnapshot) {
                    var question = childSnapshot.val();
                    question.key = childSnapshot.key;
                    $scope.questions.push(question);
                });
                if ($scope.questions.length == 0) {
                    $rootScope.warning("There isn't any question data.");
                }
                $scope.questions = $filter('orderBy')($scope.questions, 'order');
                var updates = {}
                $scope.questions.forEach((question, index) => {
                    if (question.order != index) {
                        updates[question.key + '/order'] = index
                    }
                });
                if (angular.equals(updates, {})) {
                    $scope.ref_2 = true
                    $scope.finalCalc()
                } else {
                    firebase.database().ref('Questions').update(updates)
                }
            });
        }

        $scope.updateTags = function () {
            var tags = '';

            $rootScope.selectedTags.forEach(function (tag) {
                if (tags == '') {
                    tags = tag.name;
                } else {
                    tags += ',' + tag.name;
                }
            });
            setRef.update({ tags: tags }).then(function () {
                $rootScope.success("Tags successfully updated!");
                $rootScope.safeApply();
            });
        }

        $scope.getPrivateEnable = function () {
            if (!$scope.editable || !$scope.userData.private_enabled) return false
            if ($scope.setData.origin_creator && $scope.setData.origin_creator != $rootScope.settings.userId) return false
            if (!$scope.siblingEditable) return false
            return true
        }

        $scope.get_additional_info = function () {
            document.getElementById('additional_info').innerHTML = $scope.setData.additional_info;
        }
        $scope.gotoChoiceQuestionType = function () {
            $rootScope.setData('backUrlInChoice', "questionsInSet");
            $rootScope.safeApply();
            $state.go('choiceQuestionType');
        }

        $scope.gotoMultipleType = function () {
            $rootScope.setData('setType', 'Multiple');
            $state.go('createByMultiple');
        }

        $scope.publishLikert = function () {
            if (!confirm("You can't add or edit question any more if set is published. Are you sure want to publish this question set?")) return false
            setRef.child('/isDraft').set({}).then(function () {
                $rootScope.success("Question Set is published successfully!")
                $rootScope.safeApply()
            })
        }

        $scope.videoIdChanged = function () {
            var updates = {};
            updates['/videoID'] = ($scope.setData.videoID) ? $scope.setData.videoID : {};
            setRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.result_videoIdChanged = function () {
            var updates = {};
            updates['/result_videoID'] = ($scope.setData.result_videoID) ? $scope.setData.result_videoID : {};
            setRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.resultStringChanged = function () {
            var updates = {};
            updates['/result_string'] = ($scope.setData.result_string) ? $scope.setData.result_string : {};
            setRef.update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.changeGraphType = function (type) {
            setRef.update({ graph: type }).then(function () {
                $rootScope.success("Likert question result type  successfully updated!");
                $rootScope.safeApply();
            });
        }
        $scope.changeTeacherInfo = function (infoForTeacher) {
            setRef.update({ infoForTeacher: infoForTeacher }).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.changeLockNext = function (lockNext) {
            setRef.update({ lockNext: lockNext }).then(function () {
                $rootScope.success("Lock next question setting successfully updated!");
                $rootScope.safeApply();
            });
        }

        $scope.changePrivate = function (private) {
            setRef.update({ private: private }).then(function () {
                if (private) {
                    $rootScope.success("Changed to private set!");
                } else {
                    $rootScope.success("Changed to public set!");
                }
                $rootScope.safeApply();
            });
        }
        $scope.optionChanged = function (option, index) {
            setRef.child('/options/' + index).set(option).then(function () {
                $rootScope.safeApply();
            });
        }

        $scope.checkShowLikertQuestionCreate = function () {
            if ($scope.selectedTab == 'question' && $scope.setData.LikertType && $scope.setData.isDraft) return true
            return false
        }
        $scope.checkShowMultipleQuestionCreate = function () {
            if ($scope.selectedTab == 'question' && $scope.setData.MultipleType) return true
            return false
        }
        $scope.checkShowQuestionCreate = function () {
            if ($scope.selectedTab == 'question' && !$scope.setData.LikertType && !$scope.setData.MultipleType) return true
            return false
        }
        $scope.checkShowLikertScaleCreate = function () {
            if ($scope.selectedTab == 'subscale' && $scope.setData.LikertType) {
                return $scope.siblingEditable
            }
            return false
        }
        $scope.checkShowMultipleScaleCreate = function () {
            if ($scope.selectedTab == 'subscale' && $scope.setData.MultipleType) {
                return true
            }
            return false
        }
        $scope.checkCopySet = function () {
            if (!$scope.setData.isDraft) {
                return $scope.siblingEditable
            }
            return false
        }
        $scope.checkCreateSiblingSet = function () {
            if (!$scope.setData.isDraft && $scope.setData.LikertType) return true
            return false
        }
        $scope.checkDrag = function () {
            if (!$scope.editable) return false
            return $scope.siblingEditable
        }
        $scope.checkEditQuestion = function (qst) {
            if ($scope.setData.LikertType && $scope.setData.isDraft && $scope.userData.editqst_enabled) return true
            return false
        }
        $scope.showDetail = function (obj) {
            $rootScope.setData('editable', $scope.editable)
            if (obj.questionType == 'Likert Type') {
                return;
            }
            $rootScope.setData('questionKey', obj.key);
            $state.go('questionDetail');
        }

        $scope.showSubScaleDetail = function (obj) {
            var editable = $scope.editable && $scope.siblingEditable
            $rootScope.setData('subscale', obj);
            $rootScope.setData('subscaleEditable', editable);
            $rootScope.setData('questionSetName', $scope.setData.setname);

            switch (obj.type) {
                case 'sub':
                    $rootScope.setData('questions', $scope.questions);
                    $rootScope.setData('subscaleOperation', $scope.setData.method);
                    $state.go('subscaleDetail');
                    break;
                case 'super':
                    $rootScope.setData('subscales', $scope.setData.subscales);
                    $state.go('superScaleDetail');
                    break;
                case 'label':
                    $rootScope.setData('subscales', $scope.setData.subscales);
                    $state.go('labelDetail');
                    break;
            }
        }

        $scope.deleteQuestionSet = function () {
            if (confirm("Collected data will be lost if questionset is deleted.\n Please export data before deleting the questionset.")) {
                $rootScope.setData('deleteType', 'Set');
                if ($scope.setData.LikertType) {
                    $state.go('deleteLikertSet');
                } else {
                    $state.go('deleteQuestionSet');
                }
            }
        }

        $scope.deleteQuestion = function (obj) {
            $rootScope.setData('qustionData', angular.copy(obj));

            if (confirm("Collected data will be lost if question is deleted.\n Please export data before deleting question.")) {
                $rootScope.setData('deleteType', 'Question');
                if ($scope.setData.LikertType) {
                    $state.go('deleteLikertSet');
                } else {
                    $state.go('deleteQuestion');
                }
            }
        }

        $scope.deleteSubscale = function (obj) {
            switch (obj.type) {
                case 'sub':
                    if (confirm("Collected data will be lost if subscale is deleted.\n Please export data before deleting subscale.")) {
                        $rootScope.setData('subScaleData', angular.copy(obj));
                        $rootScope.setData('deleteType', 'Subscale');
                        if ($scope.setData.LikertType) {
                            $state.go('deleteLikertSet');
                        } else {
                            $state.go('deleteQuestion');
                        }
                    }
                    break;
                case 'super':
                    if (confirm("Are you sure want to delete this super scale?")) {
                        setRef.child('/superscales/' + obj.key).set({}).then(function () {
                            $rootScope.success('Super scale deleted successfully!')
                        });
                    }
                    break;
                case 'label':
                    if (confirm("Are you sure want to delete this label?")) {
                        setRef.child('/labels/' + obj.key).set({}).then(function () {
                            $rootScope.success('Label deleted successfully!')
                        });
                    }
                    break;
            }
        }

        // ===================  Edit questionset name functions  =========================

        $scope.showEditTitleModal = function () {
            $scope.newSetName = $scope.setData.setname;
            $rootScope.safeApply();
            $('#editSetTitleModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.updateSetName = function () {
            if (confirm("Are you sure want to change question set title?")) {
                setRef.child('/setname').set($scope.newSetName).then(function () {
                    $rootScope.success("Questionset title has been changed successfully!");
                    $('#editSetTitleModal').modal('hide');
                });
            }
        }
        // ===================  copy question functions  =========================

        $scope.showCopyQuestionModal = function (question) {
            $scope.copyQst = angular.copy(question);
            $scope.copyToQstSetKey = undefined;
            $rootScope.safeApply();
            $('#copyQuestionModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.getOrder = function (setKey) {
            let order = -1
            let setQuestions = Object.values($scope.allQuestions).filter(qst => qst.Set == setKey);
            for (i = 0; i < setQuestions.length; i++) {
                if (setQuestions[i].order > order) order = setQuestions[i].order
            }
            return order + 1
        }
        $scope.copyTo = function (setKey) {
            if (!confirm("Are you sure want to copy this question to '" + $scope.mySets[setKey].setname + "' set?")) return
            $scope.copyQst.code = $scope.newQuestionCode
            $scope.copyQst.Set = setKey;
            $scope.copyQst.teacher = $scope.userData.ID;
            $scope.copyQst.order = $scope.getOrder(setKey);
            $scope.copyQst.new = {};
            $scope.copyQst.key = {};
            firebase.database().ref('Questions/' + $scope.newQuestionCode).set($scope.copyQst).then(function () {
                $rootScope.success('Question has been copied successfully!')
                $rootScope.safeApply();
                $('#copyQuestionModal').modal('hide');
            });
        }
        //fileUpload
        $scope.fileupload = function () {

            var fileButton = document.getElementById('fileButton');
            fileButton.addEventListener('change', function (e) {
                //Get File
                $rootScope.setData('loadingfinished', false);
                var file = e.target.files[0];
                //Create storage ref
                var storageRef = firebase.storage().ref('additional_info/' + $rootScope.settings.questionSetKey + file.name)
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
                            // $scope.userProfile.profile_image = downloadURL;
                            // var imgTagStr = "<img src='" + downloadURL + "' style=''/>";
                            var imgTagStr = `
                            <br/>
                            <div class='img-div' style="background: url('`+ downloadURL + `');">                           
                            </div>
                            <br/>`;

                            // "<img src='" + downloadURL + "' style=''/>";
                            $scope.setData.additional_info += imgTagStr;
                            $rootScope.setData('loadingfinished', true);
                            $rootScope.safeApply();
                        });
                    });
            })
        }
        $scope.infoChanged = function () {
            $scope.setData.additional_info = $("#additional_info_edit").html();
            setRef.child('/additional_info').set($scope.setData.additional_info).then(function () {
                $rootScope.success("Additional information/Comments saved successfully!");
                $rootScope.safeApply();
            });
        }

        $scope.showQstModal = function () {
            $scope.newQuestion = undefined;
            $rootScope.safeApply();
            $('#questionModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.createQuestion = function () {
            if (!$scope.newQuestion) {
                $rootScope.warning("Please input new question!");
                return;
            }
            for (var i = 0; i < $scope.questions.length; i++) {
                if ($scope.questions[i].question == $scope.newQuestion) {
                    $rootScope.warning("This question is already exist.");
                    return;
                }
            }
            //if ($rootScope.temp_image == undefined) $rootScope.temp_image = '';

            var teachermail = $rootScope.settings.userEmail;
            var anonymous = ($scope.selectedRadio) ? true : {};
            var qtdetails = {
                code: $scope.newQuestionCode,
                question: $scope.newQuestion,
                teacher: teachermail,
                image: '',
                Set: $rootScope.settings.questionSetKey,
                questionType: "Likert Type",
                anonymous: anonymous,
                order: $scope.getOrder($rootScope.settings.questionSetKey)
            };

            firebase.database().ref('Questions/' + $scope.newQuestionCode).set(qtdetails).then(function () {
                $rootScope.success('Question is created successfully!')
                $scope.showQstModal();
            });
        }


        $scope.getClass = function (selectedTab) {
            if ($scope.selectedTab == selectedTab) {
                return 'active';
            }
        }

        $scope.setActive = function (selectedTab) {
            $scope.selectedTab = selectedTab;
            $rootScope.setData('selectedQuestionTab', selectedTab);
        }


        // =============== option score functions  =======================

        $scope.changeDirection = function (dec) {
            if (dec) {
                for (var i = 0; i < $scope.setData.optionScores.length; i++) {
                    $scope.setData.optionScores[i] = $scope.setData.optionScores.length - i;
                }
            } else {
                for (var i = 0; i < $scope.setData.optionScores.length; i++) {
                    $scope.setData.optionScores[i] = i + 1;
                }
            }
            $rootScope.safeApply();
        }

        $scope.changeValue = function (val, index) {
            $scope.setData.optionScores[index] = (isNaN(val)) ? 0 : Number(val);
        }
        $scope.instructionChanged = function (instructions) {
            setRef.child('/instructions/').set(instructions ? instructions : {}).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.labelChanged = function (label) {
            setRef.child('/yLabel/').set(label ? label : {}).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.defaultSubscaleOpChanged = function (method) {
            setRef.child('/method/').set(method).then(function () {
                $rootScope.success('Default subscale operation method changed successfully!');
                $rootScope.safeApply();
            });
        }
        $scope.changeAllMethod = function () {
            if (!confirm("Are you sure want to change all subscale operation method to  '" + $scope.setData.method + "' ?")) return
            var updates = {};
            for (scaleKey in $scope.setData.subscales) {
                updates['/subscales/' + scaleKey + '/method'] = $scope.setData.method;
            }
            setRef.update(updates).then(function () {
                $rootScope.success('All subscale operation method changed successfully to "' + $scope.setData.method + '"!');
                $rootScope.safeApply();
            });
        }

        ///////////////////////////////////////////////////////////////////////////////////
        $scope.compareChanged = function (compare) {
            setRef.child('/compare/').set(compare ? compare : {}).then(function () {
                $rootScope.success('Compare state changed successfully!');
                $rootScope.safeApply();
            });
        }
        $scope.save_change = function () {
            if (!confirm("Are you sure want to save changed data?")) return;
            setRef.child('/optionScores').set(angular.copy($scope.setData.optionScores)).then(function () {
                $rootScope.success('Changed data saved successfully!');
            });
        }
        $scope.yScaleTypeChanged = function (yScaleType) {
            setRef.child('/yScaleType').set($scope.setData.yScaleType).then(function () {
                $rootScope.success("Y-Axis scale type changed successfully!");
                $rootScope.safeApply();
            });
        }
        // ================= create Multiple subscale functions  ============================

        $scope.showModalMultiple = function () {
            $scope.subscale = {};
            $scope.subscale.title = undefined;
            $scope.qstArray = [];

            for (var i = 0; i < $scope.questions.length; i++) {
                $scope.qstArray.push({
                    key: $scope.questions[i].key,
                    selected: false,
                });
            }
            $scope.selectAll = false;
            $rootScope.safeApply();
            $('#multipleSubscaleModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.createMultipleSubscale = function () {

            //check name
            if (!$scope.subscale.title) {
                $rootScope.warning("Please input subscale title!");
                return;
            }
            for (var key in $scope.setData.subscales) {
                if ($scope.subscale.title == $scope.setData.subscales[key].title) {
                    $rootScope.warning("This title is already exist.");
                    return;
                }
            }

            //add question
            $scope.subscale.questions = [];
            for (var i = 0; i < $scope.questions.length; i++) {
                if ($scope.qstArray[i].selected) {
                    $scope.subscale.questions.push($scope.qstArray[i].key);
                }
            }
            if ($scope.subscale.questions.length == 0) {
                $rootScope.warning("You need to choose more than one question!");
                return;
            }
            setRef.child('/subscales').push($scope.subscale).then(function () {
                $rootScope.success('New subscale has created successfully!')
                $scope.showModalMultiple();
            });
        }

        // ===================  create Likert subscale functions  =========================
        $scope.showChoiceModal = function () {
            $scope.scaleType = 'sub';
            $rootScope.safeApply();
            $('#choiceTypeModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.selectedScaleType = function () {
            $('#choiceTypeModal').modal('hide');
            switch ($scope.scaleType) {
                case 'sub':
                    $scope.showSubscaleModal();
                    break;
                case 'super':
                    $scope.showSuperscaleModal();
                    break;
                case 'label':
                    $scope.showLabelModal();
                    break;
            }
        }

        // show create likert subscale modal
        $scope.showSubscaleModal = function () {
            if ($scope.questions.length == 0) {
                $rootScope.warning("You need to add question at first!");
                return;
            }
            $scope.subscale = {};
            $scope.qstArray = [];
            $scope.subscale.method = $scope.setData.method;
            for (var i = 0; i < $scope.questions.length; i++) {
                $scope.qstArray.push({
                    key: $scope.questions[i].key,
                    selected: false,
                    reversed: false,
                });
            }
            $scope.subscale.title = undefined;
            $scope.selectAll = false;
            $rootScope.safeApply();
            $('#subscaleModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.toggle = function (index) {
            $scope.qstArray[index].selected = !$scope.qstArray[index].selected;
            if (!$scope.qstArray[index].selected) {
                $scope.qstArray[index].reversed = false;
            }
            $rootScope.safeApply();
        }
        $scope.toggleAll = function () {
            $scope.selectAll = !$scope.selectAll;
            if ($scope.selectAll) {
                $scope.qstArray.forEach(function (qst) {
                    qst.selected = true;
                })
            } else {
                $scope.qstArray.forEach(function (qst) {
                    qst.selected = false;
                    if ($scope.setData.LikertType) qst.reversed = false;
                })
            }
            $rootScope.safeApply();
        }
        $scope.toggleReverse = function (index) {
            if ($scope.qstArray[index].selected) {
                $scope.qstArray[index].reversed = !$scope.qstArray[index].reversed;
            }
            $rootScope.safeApply();
        }

        $scope.createSubscale = function () {

            //check name
            if (!$scope.subscale.title) {
                $rootScope.warning("Please input subscale title!");
                return;
            }
            for (var key in $scope.setData.subscales) {
                if ($scope.subscale.title == $scope.setData.subscales[key].title) {
                    $rootScope.warning("This title is already exist.");
                    return;
                }
            }

            //add question
            $scope.subscale.questions = [];
            $scope.subscale.reversed = [];
            for (var i = 0; i < $scope.questions.length; i++) {
                if ($scope.qstArray[i].selected) {
                    $scope.subscale.questions.push($scope.qstArray[i].key);
                    if ($scope.qstArray[i].reversed) {
                        $scope.subscale.reversed.push($scope.qstArray[i].key);
                    }
                }
            }
            if ($scope.subscale.questions.length == 0) {
                $rootScope.warning("You need to choose more than one question!");
                return;
            }

            var updates = {}
            var new_Key = setRef.child('/subscales').push().key;
            updates['/subscales/' + new_Key] = $scope.subscale
            if ($scope.setData.subscales == undefined) {
                updates['/method'] = $scope.subscale.method
            }
            setRef.update(updates).then(function () {
                $rootScope.success('New subscale created successfully!')
                $('#subscaleModal').modal('hide');
            });

        }
        //-------------------------------------------- create likert scale functions end------------------------------------------------------





        // ===================  create Likert super scale functions  =========================
        $scope.showSuperscaleModal = function () {
            if ($scope.subscaleArray.length == 0) {
                $rootScope.warning("You need to add subscale at first!");
                return;
            }
            $scope.superscale = { title: undefined, average: false, subscales: [] };

            $rootScope.safeApply();
            $('#createSuperScaleModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.appendSubscale = function () {
            $scope.superscale.subscales.push({
                operator: '+',
                subscaleKey: $scope.subscaleArray[0].key
            });
            $rootScope.safeApply();
        }
        $scope.removeSubscale = function (index) {
            if (!confirm("Are you sure want to delete this row?")) return;
            $scope.superscale.subscales.splice(index, 1);
            $rootScope.safeApply();
        }
        $scope.createSuperScale = function () {
            //check name
            if (!$scope.superscale.title) {
                $rootScope.warning("Please input title!");
                return;
            }
            if (!confirm("Are you sure want to create new superscale?")) return;
            for (var key in $scope.setData.superscales) {
                if ($scope.superscale.title == $scope.setData.superscales[key].title) {
                    $rootScope.warning("This title is already exist.");
                    return;
                }
            }


            if ($scope.superscale.subscales.length == 0) {
                $rootScope.warning("You need to choose more than one subscale!");
                return;
            }

            setRef.child('/superscales').push($scope.superscale, function () {
                $rootScope.success('New super scale has created successfully!')
                $('#createSuperScaleModal').modal('hide');
            });
        }


        // ===================  create Likert Label functions  =========================
        $scope.showLabelModal = function () {
            if ($scope.subscaleArray.length == 0) {
                $rootScope.warning("You need to add subscale at first!");
                return;
            }
            $scope.superscale = { title: undefined, subscales: [] };

            $rootScope.safeApply();
            $('#createLabelModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.appendLabel = function () {
            $scope.superscale.subscales.push({
                operator: '>',
                subscaleKey: $scope.subscaleArray[0].key,
                num: 0
            });
            $rootScope.safeApply();
        }
        $scope.removeLabel = function (index) {
            if (!confirm("Are you sure want to delete this row?")) return;
            $scope.superscale.subscales.splice(index, 1);
            $rootScope.safeApply();
        }
        $scope.createLabel = function () {
            //check name
            if (!$scope.superscale.title) {
                $rootScope.warning("Please input title!");
                return;
            }
            if (!confirm("Are you sure want to create new Label?")) return;
            for (var key in $scope.setData.superscales) {
                if ($scope.superscale.title == $scope.setData.superscales[key].title) {
                    $rootScope.warning("This title is already exist.");
                    return;
                }
            }


            if ($scope.superscale.subscales.length == 0) {
                $rootScope.warning("You need to choose more than one condition!");
                return;
            }

            setRef.child('/labels').push($scope.superscale, function () {
                $rootScope.success('New label has created successfully!')
                $('#createLabelModal').modal('hide');
            });
        }
        //-------------------------------------------- create likert super scale functions end------------------------------------------------------

        // ========================== copy set functions ==================================
        $scope.showCopyModal = function () {
            $scope.newSetName = $scope.setData.setname;
            $rootScope.safeApply();
            $('#copyModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.copySet = function () {
            $scope.newSetName = $scope.newSetName.trim()
            $rootScope.safeApply()
            if (!$scope.newSetName) {
                $rootScope.warning('Please input new questionset name.');
                return;
            }
            for (setKey in $scope.allSets) {
                if ($scope.allSets[setKey].setname == $scope.newSetName) {
                    $rootScope.warning('This questionset name is already exist.');
                    return;
                }
            }
            if (!confirm("Are you sure want to copy questionset?")) return;

            $rootScope.setData('loadingfinished', false);

            var setData = angular.copy($scope.setData);
            var questions = angular.copy($scope.questions);
            setData.private = true
            if (!setData.origin_creator) setData.origin_creator = setData.creator;
            setData.creator = $rootScope.settings.userId;
            setData.setname = $scope.newSetName;
            setData.siblingSetKey = {};

            var updates = {};
            var setKey = $scope.newSetKey
            setData.key = setKey

            for (var i = 0; i < questions.length; i++) {
                var qstkey = $scope.newQuestionCode
                if (setData.subscales) {
                    for (var scaleKey in setData.subscales) {
                        if (setData.subscales[scaleKey].questions) {
                            for (var j = 0; j < setData.subscales[scaleKey].questions.length; j++) {
                                if (setData.subscales[scaleKey].questions[j] == questions[i].key) {
                                    setData.subscales[scaleKey].questions[j] = qstkey;
                                }
                            }
                        }
                        if (setData.subscales[scaleKey].reversed) {
                            for (var j = 0; j < setData.subscales[scaleKey].reversed.length; j++) {
                                if (setData.subscales[scaleKey].reversed[j] == questions[i].key) {
                                    setData.subscales[scaleKey].reversed[j] = qstkey;
                                }
                            }
                        }
                    }
                }
                questions[i].code = qstkey
                questions[i].Set = setKey;
                questions[i].key = {};
                questions[i].order = i;
                questions[i].teacher = $rootScope.settings.userEmail;
                updates['Questions/' + qstkey] = questions[i];
                $scope.allQuestions[qstkey] = questions[i]
                $scope.newQuestionCode = $scope.getCode();
            }

            updates['QuestionSets/' + setKey] = setData;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.setData('loadingfinished', true);
                $rootScope.success('Questionset has been copied successfully!');
                $('#copyModal').modal('hide');
                $rootScope.safeApply();
            });
        }
        //-------------------------------------------- copy set functions end------------------------------------------------------

        //=============================== likert sibling functions  =======================
        $scope.hideSibling = function (set) {
            set.show = !set.show
            $rootScope.safeApply()
        }
        $scope.showSiblingModal = function () {
            $scope.newSetName = $scope.setData.setname;
            $scope.newSiblingSets = []
            if ($scope.setData.siblingSetKey) {
                for (setKey in $scope.allSets) {
                    if ($scope.allSets[setKey].siblingSetKey == $scope.setData.siblingSetKey) {
                        $scope.newSiblingSets.push({
                            setKey: setKey,
                            setname: $scope.allSets[setKey].setname,
                            order: $scope.siblingSetOrders[setKey] ? $scope.siblingSetOrders[setKey].order : 65535,
                            show: $scope.siblingSetOrders[setKey] ? $scope.siblingSetOrders[setKey].show : false,
                        })
                    }
                }
            } else {
                $scope.newSiblingSets = [{
                    setKey: $rootScope.settings.questionSetKey,
                    setname: $scope.setData.setname,
                    order: 0,
                    show: true,
                }]
            }

            $rootScope.safeApply();
            $('#siblingModal').modal({ backdrop: 'static', keyboard: false });
        }


        $scope.createSibling = function () {
            $scope.newSetName = $scope.newSetName.trim()
            $rootScope.safeApply()
            if (!$scope.newSetName) {
                $rootScope.warning('Please input new sibling set name.');
                return;
            }
            for (setKey in $scope.allSets) {
                if ($scope.allSets[setKey].setname == $scope.newSetName) {
                    $rootScope.warning('This questionset name is already exist.');
                    return;
                }
            }
            if (!confirm("Are you sure want to create new sibling set?")) {
                return;
            }
            $rootScope.setData('loadingfinished', false);

            var setData = angular.copy($scope.setData);
            setData.subscales = {}
            setData.superscales = {}
            setData.labels = {}
            setData.options = {}
            setData.optionScores = {}
            setData.method = {}
            setData.optionCount = {}
            setData.yLabel = {}

            setData.private = true
            if (!setData.origin_creator) setData.origin_creator = setData.creator;
            setData.creator = $rootScope.settings.userId;
            setData.setname = $scope.newSetName;
            setData.siblingSetOrders = {}
            $scope.newSiblingSets.forEach((set, index) => {
                setData.siblingSetOrders[set.setKey] = {
                    order: index,
                    show: set.show
                }
            })
            var updates = {};
            var setKey = $scope.newSetKey;
            setData.key = setKey

            if (!setData.siblingSetKey) {
                setData.siblingSetKey = $rootScope.settings.questionSetKey
                updates['QuestionSets/' + $rootScope.settings.questionSetKey + '/siblingSetKey'] = $rootScope.settings.questionSetKey;
                firebase.database().ref('Groups').once('value', function (snapshot) {

                    for (groupKey in snapshot.val()) {
                        var group = snapshot.val()[groupKey]
                        group.QuestionSets = group.QuestionSets || {}
                        if (group.QuestionSets[$rootScope.settings.questionSetKey]) {
                            updates['Groups/' + groupKey + '/QuestionSets/' + $rootScope.settings.questionSetKey + '/siblingSetKey'] = $rootScope.settings.questionSetKey
                        }
                        group.groupsets = group.groupsets || {}
                        for (subKey in group.groupsets) {
                            var groupSet = group.groupsets[subKey]
                            var subQSets = groupSet.QuestionSets || []
                            for (var subIndex = 0; subIndex < subQSets.length; subIndex++) {
                                if (subQSets[subIndex].key == $rootScope.settings.questionSetKey) {
                                    updates['Groups/' + groupKey + '/groupsets/' + subKey + '/QuestionSets/' + subIndex + '/siblingSetKey'] = $rootScope.settings.questionSetKey
                                }
                            }
                            var subgroupsets = groupSet.subgroupsets || {}
                            for (secKey in subgroupsets) {
                                var secQSets = subgroupsets[secKey].QuestionSets || []
                                for (var secIndex = 0; secIndex < secQSets.length; secIndex++) {
                                    if (secQSets[secIndex].key == $rootScope.settings.questionSetKey) {
                                        updates['Groups/' + groupKey + '/groupsets/' + subKey + '/subgroupsets/' + secKey + '/QuestionSets/' +
                                            '/' + secIndex + '/siblingSetKey'] = $rootScope.settings.questionSetKey
                                    }
                                }
                            }
                        };
                    }

                    updates['QuestionSets/' + setKey] = setData;
                    firebase.database().ref().update(updates).then(function () {
                        $rootScope.success('Sibling Set has been created successfully!');
                        $('#siblingModal').modal('hide');
                        $rootScope.setData('loadingfinished', true);
                        $rootScope.safeApply();
                    });
                })
            } else {
                updates['QuestionSets/' + setKey] = setData;
                firebase.database().ref().update(updates).then(function () {
                    $rootScope.success('Sibling Set has been created successfully!');
                    $('#siblingModal').modal('hide');
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.safeApply();
                });
            }
        }

        $scope.changeSiblingHideState = function (set) {
            set.show = !set.show
            var newSets = {}
            $scope.siblingSets.forEach((obj, index) => {
                newSets[obj.setKey] = { order: index, show: obj.show }
            });
            setRef.child('/siblingSetOrders').set(newSets).then(function () {
                $rootScope.safeApply();
            });
        }

        // share set functions
        $scope.showShareModal = function () {
            if (!$scope.userData.shareQuestion_enabled) {
                $rootScope.error("Sorry, You haven't permission for question share function. Please contact to administrator to enable it.")
                return
            }
            $scope.tempShared = angular.copy($scope.sharedTeachers)
            $scope.email = ""
            $('#shareModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.addTeacher = function () {
            if (!$scope.email) {
                $rootScope.warning('Please type teacher email');
                return;
            }
            for (teacherKey in $scope.tempShared) {
                if ($scope.email == $scope.tempShared[teacherKey].email) {
                    $rootScope.error('This teacher already added to current group.');
                    return;
                }
            }
            let newTeacher = undefined
            for (teacherKey in $scope.allTeachers) {
                if ($scope.allTeachers[teacherKey].ID == $scope.email) {
                    newTeacher = angular.copy($scope.allTeachers[teacherKey])
                    break
                }
            }
            if (!newTeacher) {
                $rootScope.error('Unregistered Teacher!');
                return;
            }

            $scope.tempShared[newTeacher.Userkey] = {
                email: newTeacher.ID,
                editable: false,
            }
            $scope.email = ""
        }
        $scope.deleteTeacher = function (key) {
            delete $scope.tempShared[key]
        }
        $scope.saveShare = function () {
            if (!confirm("Are you sure want to save this setting?")) return
            setRef.child('/sharedTeachers').set($scope.tempShared, function () {
                $rootScope.success('success!')
                $('#shareModal').modal('hide');
            });
        }
        //-------------------------------  create likert link functions end ----------------------

        // $scope.updateSubscaleDB = function () {
        //     firebase.database().ref('QuestionSets').once('value', function (snapshot) {
        //         var updates = {};

        //         for (setKey in snapshot.val()) {
        //             var set = snapshot.val()[setKey]
        //             if (set.LikertType) {
        //                 for (scaleKey in set.subscales) {
        //                     updates['QuestionSets/' + setKey + '/subscales/' + scaleKey + '/method'] = set.method;
        //                 }
        //             }
        //         }
        //         firebase.database().ref().update(updates).then(function () {
        //             $rootScope.success('Method Changed');
        //         });
        //     })
        // }
    }

})();