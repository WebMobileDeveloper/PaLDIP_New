
angular
    .module('myApp')
    .run(['$rootScope', '$state', '$stateParams', 'toaster', 'Excel', '$timeout',
        function ($rootScope, $state, $stateParams, toaster, Excel, $timeout) {

            // =====================================================
            //            Global Consts
            // =====================================================

            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.DevServer = DevServer
            if ($rootScope.DevServer) {
                $rootScope.templateExternalLink = "https://firebasestorage.googleapis.com/v0/b/temp-548d0.appspot.com/o/templateFiles%2FUpload%20External%20Activity%20Result%20Sample.xlsx?alt=media&token=8eae80ab-6fc9-48e7-8c3e-e4ee8c5f982c"
                $rootScope.sampleUploadListLink = "https://firebasestorage.googleapis.com/v0/b/temp-548d0.appspot.com/o/templateFiles%2FUpload%20list%20sample%20file.xlsx?alt=media&token=91d923bc-e79a-4425-b299-cc1906b94ed9"
                $rootScope.templateUploadListLink = "https://firebasestorage.googleapis.com/v0/b/temp-548d0.appspot.com/o/templateFiles%2FUpload%20list%20template.xlsx?alt=media&token=24910295-884f-4b90-ba76-ba3f7d926875"
            } else {
                $rootScope.templateExternalLink = "https://firebasestorage.googleapis.com/v0/b/paldip-a467e.appspot.com/o/templateFiles%2FUpload%20External%20Activity%20Result%20Sample.xlsx?alt=media&token=0b796be8-ad71-481b-8559-521192c78ce9"
                $rootScope.sampleUploadListLink = "https://firebasestorage.googleapis.com/v0/b/paldip-a467e.appspot.com/o/templateFiles%2FUpload%20list%20sample%20file.xlsx?alt=media&token=e9017eff-514e-4ef1-b5c3-64c12a6eb377"
                $rootScope.templateUploadListLink = "https://firebasestorage.googleapis.com/v0/b/paldip-a467e.appspot.com/o/templateFiles%2FUpload%20list%20template.xlsx?alt=media&token=13d2e80d-fa80-403c-b37b-34d2f74842a9"
            }
            var toaster_time = 2000;
            $rootScope.adminEmail = 'ehssan.sakhaee@gmail.com';
            $rootScope.settings = {};
            // --------------------------------------------------------
            //                  end of global Consts
            // --------------------------------------------------------



            // ======================================================
            //                   global functions
            // ======================================================

            sumArray = function (array1, array2) {
                var sum = array1.map(function (num, idx) {
                    return num + array2[idx];
                });
                return sum;
            }
            divArray = function (array1, value) {
                var result = value == 0 ? array1 : array1.map(function (num, idx) {
                    return num / value;
                });
                return result;
            }

            chunkArray = function (arr, size) {
                var myArray = [];
                for (var i = 0; i < arr.length; i += size) {
                    myArray.push(arr.slice(i, i + size));
                }
                return myArray;
            }
            getDateTime = function () {
                var currentdate = new Date();
                var datetime = currentdate.getDate() + "/"
                    + (currentdate.getMonth() + 1) + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
                return datetime;
            }
            addJquery = function () {
                $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });
                $('.navbar-nav>li>a').on('click', function () {
                    $('.navbar-collapse').collapse('hide');
                });
            }
            getFormattedDate = function (date) {

                var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                var weekday = weekday[date.getDay()];

                var day = date.getDate().toString();
                day = day.length > 1 ? day : '0' + day;

                var hours = date.getHours();
                var ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                hours = hours > 9 ? hours : '0' + hours;

                var min = date.getMinutes().toString();
                min = min.length > 1 ? min : '0' + min;

                return {
                    weekday: weekday,
                    time: ' ' + hours + ':' + min + ' ' + ampm
                }
            }
            // --------------------------------------------------------
            //                  end of global functions
            // --------------------------------------------------------

            $rootScope.setData = function (name, value) {
                $rootScope.settings[name] = value;
                localStorage.setItem("appData", JSON.stringify($rootScope.settings));
                $rootScope.safeApply();
            }

            $rootScope.getData = function () {
                $rootScope.settings = {};
                var lastData = localStorage.getItem('appData');
                if (lastData) {
                    $rootScope.settings = JSON.parse(lastData);
                }
                $rootScope.settings.feeds = [{ type: 'Text', value: 0 }, { type: 'Scale', value: 1 }, { type: 'Scale and Text', value: 2 }];
                // ************  Global  Variables Init ********************

                // ----------------------admin info-------------------------------------

                // if ($rootScope.settings.selectedTeacherKey == undefined) $rootScope.settings.selectedTeacherKey = undefined;           
                // if ($rootScope.settings.selectedTeacherEmail == undefined) $rootScope.settings.selectedTeacherEmail = undefined;           
                // if ($rootScope.settings.globalQuestionSetKey == undefined) $rootScope.settings.globalQuestionSetKey = undefined;           
                // if ($rootScope.settings.globalQuestionSetName == undefined) $rootScope.settings.globalQuestionSetName = undefined;  



                // ----------ui info -------------------
                if ($rootScope.settings.loadingfinished == undefined) $rootScope.settings.loadingfinished = true;    //true: show loading loop
                if ($rootScope.settings.showMenubar == undefined) $rootScope.settings.showMenubar = false;    // true: show menubar 
                if ($rootScope.settings.selectedMenu == undefined) $rootScope.settings.selectedMenu = '';
                // if ($rootScope.settings.backUrl == undefined) $rootScope.settings.backUrl = undefined;    //true: back menu show
                // if ($rootScope.settings.backUrlInChoice == undefined) $rootScope.settings.backUrlInChoice = undefined;    //true: back menu show

                // ----------user info -------------------
                // if ($rootScope.settings.userId == undefined) $rootScope.settings.userId = undefined;
                // if ($rootScope.settings.userType == undefined) $rootScope.settings.userType = undefined;
                // if ($rootScope.settings.userEmail == undefined) $rootScope.settings.userEmail = undefined;

                // // ----------db info -------------------
                // if ($rootScope.settings.groupKey == undefined) $rootScope.settings.groupKey = undefined;
                // if ($rootScope.settings.groupName == undefined) $rootScope.settings.groupName = undefined;

                if ($rootScope.settings.questionSets == undefined) $rootScope.settings.questionSets = [];
                if ($rootScope.settings.questionSet == undefined) $rootScope.settings.questionSet = {};
                // if ($rootScope.settings.questionSetKey == undefined) $rootScope.settings.questionSetKey = undefined;
                // if ($rootScope.settings.questionSetName == undefined) $rootScope.settings.questionSetName = undefined;
                if ($rootScope.settings.createdByMe == undefined) $rootScope.settings.createdByMe = true;
                if ($rootScope.settings.showSetOption == undefined) $rootScope.settings.showSetOption = 'Used';  //'ByMe','ByOther','Used'
                //---------- export Info  ------------------
                if ($rootScope.settings.questionType == undefined) $rootScope.settings.questionType = 'Feedback Type';
                // if ($rootScope.settings.exportQuestionString == undefined) $rootScope.settings.exportQuestionString = '';
                // if ($rootScope.settings.anoymous == undefined) $rootScope.settings.anoymous = undefined;
                // if ($rootScope.settings.questionArr == undefined) $rootScope.settings.questionArr = undefined;
                // if ($rootScope.settings.question == undefined) $rootScope.settings.question = undefined;   //for questionDetail

                //-----------  student answer ------------------

                if ($rootScope.settings.prevAnswer == undefined) $rootScope.settings.prevAnswer = '';
                // if ($rootScope.settings.prevAnswerVal == undefined) $rootScope.settings.prevAnswerVal = undefined;
                // if ($rootScope.settings.questionKey == undefined) $rootScope.settings.questionKey = undefined;
                // if ($rootScope.settings.questionString == undefined) $rootScope.settings.questionString = undefined;
                // if ($rootScope.settings.qtype == undefined) $rootScope.settings.qtype = undefined;
                // if ($rootScope.settings.listType == undefined) $rootScope.settings.listType = undefined;
                // if ($rootScope.settings.selfRate == undefined) $rootScope.settings.selfRate = undefined;

                // if ($rootScope.settings.ratingType == undefined) $rootScope.settings.ratingType = undefined;
                // if ($rootScope.settings.ratingItems == undefined) $rootScope.settings.ratingItems = undefined;
                // if ($rootScope.settings.ratingOptions == undefined) $rootScope.settings.ratingOptions = undefined;
                // if ($rootScope.settings.shareRate == undefined) $rootScope.settings.shareRate = undefined;

                if ($rootScope.settings.feedqts == undefined) $rootScope.settings.feedqts = [];
                if ($rootScope.settings.disabledQuestion == undefined) $rootScope.settings.disabledQuestion = false;   //defalult :false(enabled)

                if ($rootScope.settings.userType == 'Teacher') {
                    $rootScope.getTeacherSettings()
                }
                $rootScope.safeApply();
            }


            $rootScope.warning = function (msg) {
                toaster.pop('warning', "Warning", msg, toaster_time);
                $rootScope.safeApply();
            };
            $rootScope.warning1 = function (msg) {
                toaster.pop('warning', "Warning", msg, 0);
                $rootScope.safeApply();
            };
            $rootScope.success = function (msg) {
                toaster.pop('success', "Success", msg, toaster_time);
                $rootScope.safeApply();
            };
            $rootScope.error = function (msg) {
                toaster.pop("error", "Error", msg, toaster_time);
                $rootScope.safeApply();
            };
            $rootScope.info = function (msg) {
                toaster.pop("info", "info", msg, toaster_time);
                $rootScope.safeApply();
            };

            $rootScope.safeApply = function (fn) {
                var phase = this.$root.$$phase;
                if (phase == '$apply' || phase == '$digest') {
                    if (fn && (typeof (fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
            $rootScope.go = function (url) {
                $state.go(url);
            }
            $rootScope.back = function () {
                $state.go($rootScope.settings.backUrl);
            }
            $rootScope.activeMenu = function (selectedMenu) {
                if ($rootScope.settings.selectedMenu == selectedMenu) return 'selected';
                return '';
            }

            $rootScope.exportToExcel = function (tableId) { // ex: '#my-table'
                var exportHref = Excel.tableToExcel(tableId, 'sheet name');
                $timeout(function () { location.href = exportHref; }, 100); // trigger download
            }
            // =====================================================================================|
            //                                                                  					|
            // 								Chip functions   										|
            //                                                                  					|
            // =====================================================================================|

            /**
             * Return the proper object when the append is called.
             */
            $rootScope.transformChip = function (chip) {
                // If it is an object, it's already a known chip
                if (angular.isObject(chip)) {
                    return chip;
                }

                // Otherwise, create a new one
                return { name: chip, type: 'new' };
            }

            /**
             * Search for vegetables.
             */
            $rootScope.querySearch = function (query) {
                var results = query ? $rootScope.originTags.filter($rootScope.createFilterFor(query)) : [];
                return results;
            }

            /**
             * Create filter function for a query string
             */
            $rootScope.createFilterFor = function (query) {
                var lowercaseQuery = angular.lowercase(query);

                return function filterFn(tag) {
                    return (tag.lowername.indexOf(lowercaseQuery) === 0);
                };
            }

            $rootScope.loadTags = function () {
                $rootScope.searchText = null;
                $rootScope.originTags = [];
                $rootScope.selectedTags = [];
                var tagRef = firebase.database().ref('Tags');
                tagRef.once('value', function (snapshot) {
                    for (key in snapshot.val()) {
                        let tag = snapshot.val()[key]
                        $rootScope.originTags.push({ 'name': tag, 'type': 'origin', 'lowername': tag.toLowerCase() })
                    }
                    $rootScope.safeApply();
                });
            }

            //question image Upload
            $rootScope.fileupload = function (update = false) {
                var uploader = document.getElementById('uploader');
                var fileButton = document.getElementById('fileButton');
                $rootScope.temp_image = undefined;
                fileButton.addEventListener('change', function (e) {
                    //Get File
                    var file = e.target.files[0];
                    //Create storage ref
                    var storageRef = firebase.storage().ref('QuestionImages/' + $rootScope.newQuestionKey)
                    //Upload file
                    var task = storageRef.put(file);
                    $rootScope.temp_image = $rootScope.newQuestionKey;
                    //Update Progressbar
                    task.on('state_changed',
                        function progress(snapshot) {
                            var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            uploader.value = percentage;
                            if (percentage == 100) {
                                if (update) {
                                    var questionRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey + '/image');
                                    questionRef.set("")
                                    questionRef.set($rootScope.temp_image).then(function () {
                                        $rootScope.success('Success!');
                                        $rootScope.safeApply();
                                    })
                                } else {
                                    $rootScope.success('Success!');
                                    $rootScope.safeApply();
                                }
                            }
                        },
                    );
                })
            }

            //result image upload
            $rootScope.result_image_upload = function (update = false) {
                var uploader = document.getElementById('uploader1');
                var fileButton = document.getElementById('fileButton1');
                $rootScope.temp_result_image = undefined
                fileButton.addEventListener('change', function (e) {

                    var file = e.target.files[0];                               //Get File
                    var storageRef = firebase.storage().ref('ResultImages/' + $rootScope.newQuestionKey)        //Create storage ref
                    var task = storageRef.put(file);            //Upload file
                    $rootScope.temp_result_image = $rootScope.newQuestionKey;
                    task.on('state_changed',            //Update Progressbar
                        function progress(snapshot) {
                            var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            uploader.value = percentage;
                            if (percentage == 100) {
                                if (update) {
                                    var questionRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey + '/result_image');
                                    questionRef.set("")
                                    questionRef.set($rootScope.temp_result_image).then(function () {
                                        $rootScope.success('Success!');
                                        $rootScope.safeApply();
                                    })
                                } else {
                                    $rootScope.success('Success!');
                                    $rootScope.safeApply();
                                }
                            }
                        },
                    );
                })
            }

            //Load Image
            $rootScope.loadimage = function () {
                $rootScope.imgSrc = ""
                $rootScope.questionImageRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey + '/image');
                $rootScope.questionImageRef.on('value', function (snapshot) {
                    var imgname = snapshot.val()
                    if (!imgname) return
                    var storageRef = firebase.storage().ref();
                    storageRef.child('QuestionImages/' + imgname).getDownloadURL().then(function (url) {
                        $rootScope.imgSrc = url + '?_ts=' + new Date().getTime()
                        $rootScope.safeApply();
                    }).catch(function (error) { })
                })
            }
            $rootScope.load_result_image = function () {
                $rootScope.result_imgSrc = '';
                $rootScope.questionResultImageRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey + '/result_image');
                $rootScope.questionResultImageRef.on('value', function (snapshot) {
                    var imgname = snapshot.val()
                    if (!imgname) return
                    var storageRef = firebase.storage().ref();
                    storageRef.child('ResultImages/' + imgname).getDownloadURL().then(function (url) {
                        $rootScope.result_imgSrc = url + '?_ts=' + new Date().getTime()
                        $rootScope.safeApply();
                    }).catch(function (error) { })
                })
            }

            //extra link function
            $rootScope.getTeacherSettings = function () {
                if ($rootScope.userRef) $rootScope.userRef.off('value')
                $rootScope.userRef = firebase.database().ref('Users/' + $rootScope.settings.userId);
                $rootScope.userRef.on('value', function (snapshot) {
                    $rootScope.teacherSettings = snapshot.val();
                    if ($rootScope.teacherSettings.link_enabled) {
                        $rootScope.links = [{ title: "", url: '' }];
                    } else {
                        $rootScope.links = [];
                    }
                    $rootScope.safeApply();
                });
            }
            $rootScope.addLink = function (index) {
                $rootScope.links.splice(index + 1, 0, { title: "", url: '' });
            }
            $rootScope.removeLink = function (index) {
                $rootScope.links.splice(index, 1);
                if ($rootScope.links.length == 0) {
                    $rootScope.links = [{ title: "", url: '' }];
                }
            }


            // get addtional information
            $rootScope.getAddInfo = function () {
                $rootScope.additional_info = undefined;
                var infoRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey + '/additional_info');
                infoRef.on('value', function (snapshot) {
                    var info_div = document.getElementById('additional_info');
                    if (!info_div) {
                        $rootScope.additional_info = undefined;
                        infoRef.off('value');
                    } else {
                        $rootScope.additional_info = snapshot.val();
                        if ($rootScope.additional_info == '&nbsp;' || $rootScope.additional_info == '<br>') $rootScope.additional_info = '';
                        if ($rootScope.additional_info) {
                            document.getElementById('additional_info').innerHTML = $rootScope.additional_info;
                        }
                    }
                    $rootScope.safeApply();
                });
            }
            //  Instructor feedback functions
            $rootScope.getInstFeedback = function (gk, sk, qk) {
                $rootScope.setData('instructor_feedback', undefined);
                let refStr = 'InstrFeedback/' + gk + '/' + sk + (qk ? '/' + qk : '')
                $rootScope.instFeedRef = firebase.database().ref(refStr);
                $rootScope.instFeedRef.on('value', function (snapshot) {
                    if (snapshot.val()) {
                        $rootScope.setData('instructor_feedback', snapshot.val());
                    }
                })
            }

            $rootScope.update_instFeedRef = function (gk, sk, qk) {
                let refStr = 'InstrFeedback/' + gk + '/' + sk + (qk ? '/' + qk : '')
                let instFeedRef = firebase.database().ref(refStr);
                instFeedRef.set($rootScope.settings.instructor_feedback ? $rootScope.settings.instructor_feedback : {})
            }


            // ====================Teacher Question Note functions===========================
            $rootScope.getTeacherNote = function (noteKey, isForResponse = false) {
                $rootScope.noteKey = noteKey
                $rootScope.isForResponse = isForResponse
                $rootScope.getTePublicNotes()
                $rootScope.getTeTeacherNotes()
                $rootScope.getTePrivateNotes()
            }
            $rootScope.getTePublicNotes = function () {
                $rootScope.publicNoteRef = firebase.database().ref('Notes/' + $rootScope.noteKey + '/public');
                $rootScope.publicNoteRef.on('value', function (snapshot) {
                    $rootScope.allPublicNotes = snapshot.val()
                    if ($rootScope.allPublicNotes && $rootScope.isForResponse) {
                        let i = 1
                        for (stKey in $rootScope.allPublicNotes) {
                            $rootScope.allPublicNotes[stKey] = '- Student' + i + ':   ' + $rootScope.allPublicNotes[stKey]
                            i++
                        }
                    }
                    $rootScope.safeApply()
                })
            }
            $rootScope.getTeTeacherNotes = function () {
                $rootScope.teacherNoteRef = firebase.database().ref('Notes/' + $rootScope.noteKey + '/teacher');
                $rootScope.teacherNoteRef.on('value', function (snapshot) {
                    $rootScope.allTeacherNotes = snapshot.val()
                    if ($rootScope.allTeacherNotes && $rootScope.isForResponse) {
                        let i = 1
                        for (stKey in $rootScope.allTeacherNotes) {
                            $rootScope.allTeacherNotes[stKey] = '- Student' + i + ':   ' + $rootScope.allTeacherNotes[stKey]
                            i++
                        }
                    }
                    $rootScope.safeApply()
                })
            }
            $rootScope.getTePrivateNotes = function () {
                $rootScope.privateNoteRef = firebase.database().ref('Notes/' + $rootScope.noteKey + '/private');
                $rootScope.privateNoteRef.on('value', function (snapshot) {
                    $rootScope.allPrivateNotes = snapshot.val()
                    if ($rootScope.allPrivateNotes && $rootScope.isForResponse) {
                        let i = 1
                        for (stKey in $rootScope.allPrivateNotes) {
                            $rootScope.allPrivateNotes[stKey] = '- Student' + i + ':   ' + $rootScope.allPrivateNotes[stKey]
                            i++
                        }
                    }
                    $rootScope.safeApply()
                })
            }


            // ====================Student Question Note functions===========================
            $rootScope.getNote = function (noteKey) {
                $rootScope.noteKey = noteKey
                $rootScope.getStPrivateNote()
                $rootScope.getStPublicNotes()
                $rootScope.getStTeacherNotes()
            }
            $rootScope.getStPrivateNote = function () {
                $rootScope.privateNoteRef = firebase.database().ref('Notes/' + $rootScope.noteKey + '/private/' + $rootScope.settings.userId);
                $rootScope.privateNoteRef.on('value', function (snapshot) {
                    $rootScope.privateNote = snapshot.val()
                    $rootScope.safeApply()
                })
            }
            $rootScope.getStPublicNotes = function () {
                $rootScope.publicNoteRef = firebase.database().ref('Notes/' + $rootScope.noteKey + '/public');
                $rootScope.publicNoteRef.on('value', function (snapshot) {
                    $rootScope.allPublicNotes = snapshot.val()
                    if (!$rootScope.allPublicNotes) {
                        $rootScope.publicNote = undefined
                    } else {
                        $rootScope.publicNote = angular.copy($rootScope.allPublicNotes[$rootScope.settings.userId])
                        let i = 1
                        for (stKey in $rootScope.allPublicNotes) {
                            $rootScope.allPublicNotes[stKey] = '- Student' + i + ':   ' + $rootScope.allPublicNotes[stKey]
                            i++
                        }
                    }
                    $rootScope.safeApply()
                })
            }
            $rootScope.getStTeacherNotes = function () {
                $rootScope.teacherNoteRef = firebase.database().ref('Notes/' + $rootScope.noteKey + '/teacher/' + $rootScope.settings.userId);
                $rootScope.teacherNoteRef.on('value', function (snapshot) {
                    $rootScope.teacherNote = snapshot.val()
                    $rootScope.safeApply()
                })
            }
            $rootScope.changeTeacherNote = function () {
                firebase.database().ref('Notes/' + $rootScope.noteKey + '/teacher/' + $rootScope.settings.userId).set($rootScope.teacherNote);
            }
            $rootScope.changePrivateNote = function () {
                firebase.database().ref('Notes/' + $rootScope.noteKey + '/private/' + $rootScope.settings.userId).set($rootScope.privateNote);
            }
            $rootScope.changePublicNote = function () {
                firebase.database().ref('Notes/' + $rootScope.noteKey + '/public/' + $rootScope.settings.userId).set($rootScope.publicNote);
            }


            //============================= save answer

            $rootScope.saveanswer = function () {
                var TextType = true;
                if ($rootScope.settings.questionType == 'Dropdown Type') TextType = false;

                if ($rootScope.currAnswer == undefined) {
                    if (TextType) {
                        $rootScope.warning('Please Input your Answer.');
                    } else {
                        $rootScope.warning('Please select your Answer.')
                    }
                    return;
                }
                $rootScope.setData('loadingfinished', false);
                var updates = {};
                var questionKey = $rootScope.settings.questionKey;
                var uid = $rootScope.settings.userId;

                updates['/NewAnswers/' + questionKey + '/question'] = $rootScope.settings.questionString;
                updates['/NewAnswers/' + questionKey + '/answer/' + uid + '/answer'] = $rootScope.currAnswer;
                updates['/NewAnswers/' + questionKey + '/answer/' + uid + '/mail'] = $rootScope.settings.userEmail;
                updates['/NewAnswers/' + questionKey + '/answer/' + uid + '/datetime'] = getDateTime();
                updates['/NewAnswers/' + questionKey + '/answer/' + uid + '/studentgroupkey'] = $rootScope.settings.groupKey;
                updates['/NewAnswers/' + questionKey + '/answer/' + uid + '/studentgroupname'] = $rootScope.settings.groupName;


                if (!TextType) { // if type is dropdown answer
                    updates['/NewAnswers/' + questionKey + '/answer/' + uid + '/answerkey'] = $rootScope.currAnswerKey;
                }

                firebase.database().ref().update(updates).then(function () {
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.success('Your Answer is Saved Successfully!');
                    $rootScope.setData('prevAnswer', $rootScope.currAnswer);

                    if ($rootScope.settings.disabledQuestion) {
                        $state.reload();
                        return;
                    }
                    switch ($rootScope.settings.questionType) {
                        case 'Feedback Type':
                            $state.go('feedbackAnswer1');
                            break;
                        case 'Digit Type':
                            $state.go('viewDigit');
                            break;
                        case 'Text Type':
                            $state.go('viewText');
                            break;
                        case 'Dropdown Type':
                            $state.go('viewDropdown');
                            break;
                        case 'Multiple Type':
                            $state.go('viewMultiple');
                            break;
                        case 'Contingent Type':
                            $state.go('viewContingent');
                            break;
                        case 'Slide Type':
                            $state.go('viewSlide');
                            break;
                    }
                }).catch(function (error) {
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.error('Submit Error!');
                });
            }

            $rootScope.saveGroupanswer = function () {
                var TextType = true;
                if ($rootScope.settings.questionType == 'Dropdown Type') TextType = false;

                if ($rootScope.currAnswer == undefined) {
                    if (TextType) {
                        $rootScope.warning('Please Input your Answer.');
                    } else {
                        $rootScope.warning('Please select your Answer.')
                    }
                    return;
                }
                $rootScope.setData('loadingfinished', false);
                var questionKey = $rootScope.settings.questionKey;
                var uid = $rootScope.settings.userId;


                var answerData = {
                    groupType: $rootScope.settings.groupType,
                    questionKey: questionKey,
                    question: $rootScope.settings.questionString,
                    answer: $rootScope.currAnswer,
                    mail: $rootScope.settings.userEmail,
                    datetime: getDateTime(),
                    studentgroupkey: $rootScope.settings.groupKey,
                    studentgroupname: $rootScope.settings.groupName,
                    groupSetKey: $rootScope.settings.groupSetKey,
                    subIndex: $rootScope.settings.subIndex,
                    uid: uid,
                }
                if ($rootScope.settings.groupType == 'second') {
                    answerData.subSetKey = $rootScope.settings.subSetKey;
                    answerData.secondIndex = $rootScope.settings.secondIndex;
                }


                if (!TextType) { // if type is dropdown answer
                    answerData.answerkey = $rootScope.currAnswerKey;
                }
                var setRef = firebase.database().ref("GroupAnswers").push();
                answerData.key = setRef.key;
                setRef.set(answerData).then(function () {
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.success('Your Answer is Saved Successfully!');
                    $rootScope.setData('prevAnswer', $rootScope.currAnswer);

                    if ($rootScope.settings.disabledQuestion) {
                        $state.reload();
                        return;
                    }
                    switch ($rootScope.settings.questionType) {
                        case 'Feedback Type':
                            $state.go('groupFeedbackAnswer1');
                            break;
                        case 'Digit Type':
                            $state.go('groupViewDigit');
                            break;
                        case 'Text Type':
                            $state.go('groupViewText');
                            break;
                        case 'Dropdown Type':
                            $state.go('groupViewDropdown');
                            break;
                        case 'Multiple Type':
                            $state.go('groupViewMultiple');
                            break;
                        case 'Contingent Type':
                            $state.go('groupViewContingent');
                            break;
                        case 'Slide Type':
                            $state.go('groupViewSlide');
                            break;
                    }
                }).catch(function (error) {
                    $rootScope.setData('loadingfinished', true);
                    $rootScope.error('Submit Error!')
                });
            }
            $rootScope.randomString = function (length) {
                var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

                if (!length) {
                    length = Math.floor(Math.random() * chars.length);
                }

                var str = '';
                for (var i = 0; i < length; i++) {
                    str += chars[Math.floor(Math.random() * chars.length)];
                }
                return str;
            }



            $rootScope.checkLast = function () {
                var questions = $rootScope.settings.questionsInSet;
                var currentIndex = $rootScope.settings.currentIndex;

                if (currentIndex == questions.length - 1) {
                    return true;
                } else {
                    return false;
                }
            }

            $rootScope.goSubmitNextAnswer = function () {
                var questions = $rootScope.settings.questionsInSet;
                var currentIndex = $rootScope.settings.currentIndex;

                if (currentIndex == questions.length - 1) {
                    $rootScope.warning("This is last question!");
                    return;
                }
                $rootScope.setData('currentIndex', currentIndex + 1);
                var obj = questions[currentIndex + 1];
                var myanswer = firebase.database().ref('NewAnswers/' + obj.key + '/answer/' + $rootScope.settings.userId);
                myanswer.once('value', function (snapshot) {
                    if (snapshot.val()) {
                        $rootScope.setData('prevAnswer', snapshot.val()['answer']);
                        $rootScope.setData('prevAnswerVal', snapshot.val()['answerval']);
                    } else {
                        $rootScope.setData('prevAnswer', '');
                    }

                    // check if disabled question
                    var set = $rootScope.settings.questionSet;
                    var disabled = false;
                    if (set.DisabledQuestions) {
                        if (set.DisabledQuestions[obj.key]) {
                            disabled = true;
                        }
                    }
                    $rootScope.setData('disabledQuestion', disabled);
                    $rootScope.setData('questionKey', obj.key);
                    $rootScope.setData('questionString', obj.question);
                    $rootScope.setData('questionObj', obj);

                    $rootScope.setData('questionType', obj.questionType);

                    switch (obj.questionType) {
                        case 'Feedback Type':  //Feedbacktype
                            $rootScope.setData('qtype', obj.type);
                            $rootScope.setData('feedqts', obj.feedqts);
                            $rootScope.setData('listType', obj.listType);
                            $rootScope.setData('selfRate', obj.selfRate);
                            $state.go('feedbackAnswer');
                            break;
                        case 'Rating Type':
                            $rootScope.setData('ratingType', obj.ratingtype);
                            $rootScope.setData('ratingItems', obj.ratingItems);
                            $rootScope.setData('ratingOptions', obj.ratingOptions);
                            $rootScope.setData('shareRate', obj.shareRate);
                            $state.go('ratingAnswer');
                            break;
                        case 'Digit Type':
                            $state.go('digitAnswer');
                            break;
                        case 'Text Type':
                            $state.go('textAnswer');
                            break;
                        case 'Dropdown Type':
                            $state.go('dropdownAnswer');
                            break;
                        case 'Slide Type':
                            $state.go('slideAnswer');
                            break;
                        case 'Multiple Type':
                            $state.go('multipleAnswer');
                            break;
                        case 'Contingent Type':
                            $state.go('contingentAnswer');
                            break;
                    }
                });

            }

            $rootScope.goSubmitNextGroupAnswer = function () {
                var questions = $rootScope.settings.questionsInSet;
                var currentIndex = $rootScope.settings.currentIndex;
                var groupSetKey = $rootScope.settings.groupSetKey;
                var subSetKey = $rootScope.settings.subSetKey;
                var groupType = $rootScope.settings.groupType;
                var uid = $rootScope.settings.userId;
                var obj = questions[currentIndex + 1];

                if (currentIndex == questions.length - 1) {
                    $rootScope.warning("This is last question!");
                    return;
                }
                $rootScope.setData('currentIndex', currentIndex + 1);

                var myanswer = firebase.database().ref('GroupAnswers').orderByChild('uid').equalTo(uid);
                myanswer.once('value', function (snapshot) {
                    $rootScope.setData('prevAnswer', '');
                    if (snapshot.val()) {
                        for (key in snapshot.val()) {
                            var answer = snapshot.val()[key];
                            var checkSecond = true;
                            if (groupType == 'second') {
                                if (answer.subSetKey != subSetKey || answer.secondIndex != $rootScope.settings.secondIndex) {
                                    checkSecond = false;
                                }
                            }
                            if (answer.groupType == groupType && answer.questionKey == obj.key && answer.studentgroupkey == $rootScope.settings.groupKey
                                && answer.groupSetKey == groupSetKey && answer.subIndex == $rootScope.settings.subIndex && checkSecond) {
                                $rootScope.setData('prevAnswer', answer['answer']);
                                $rootScope.setData('prevAnswerVal', answer['answerval']);
                            }
                        };
                    }



                    // // check if disabled question                
                    // var disabled = false;
                    // if (qset.DisabledQuestions) {
                    //     if (qset.DisabledQuestions[obj.key]) {
                    //         disabled = true;
                    //     }
                    // }

                    // $rootScope.setData('disabledQuestion', disabled);
                    $rootScope.setData('questionKey', obj.key);
                    $rootScope.setData('questionString', obj.question);
                    $rootScope.setData('questionType', obj.questionType);
                    $rootScope.setData('questionObj', obj);




                    switch (obj.questionType) {
                        case 'Feedback Type':  //Feedbacktype
                            $rootScope.setData('qtype', obj.type);
                            $rootScope.setData('feedqts', obj.feedqts);
                            $rootScope.setData('listType', obj.listType);
                            $rootScope.setData('selfRate', obj.selfRate);

                            $state.go('groupFeedbackAnswer');
                            break;
                        case 'Rating Type':
                            $rootScope.setData('ratingType', obj.ratingtype);
                            $rootScope.setData('ratingItems', obj.ratingItems);
                            $rootScope.setData('ratingOptions', obj.ratingOptions);
                            $rootScope.setData('shareRate', obj.shareRate);
                            $state.go('groupRatingAnswer');
                            break;
                        case 'Digit Type':
                            $state.go('groupDigitAnswer');
                            break;
                        case 'Text Type':
                            $state.go('groupTextAnswer');
                            break;
                        case 'Dropdown Type':
                            $state.go('groupDropdownAnswer');
                            break;
                        case 'Slide Type':
                            $state.go('groupSlideAnswer');
                            break;
                        case 'Multiple Type':
                            $state.go('groupMultipleAnswer');
                            break;
                        case 'Contingent Type':
                            $state.go('groupContingentAnswer');
                            break;
                    }
                });

            }

            $rootScope.wordWrap = function (str, maxWidth) {
                var newLineStr = "\n"; done = false; res = '';
                do {
                    found = false;
                    // Inserts new line at first whitespace of the line
                    for (i = maxWidth - 1; i >= 0; i--) {
                        if (testWhite(str.charAt(i))) {
                            res = res + [str.slice(0, i), newLineStr].join('');
                            str = str.slice(i + 1);
                            found = true;
                            break;
                        }
                    }
                    // Inserts new line at maxWidth position, the word is too long to wrap
                    if (!found) {
                        res += [str.slice(0, maxWidth), newLineStr].join('');
                        str = str.slice(maxWidth);
                    }

                    if (str.length < maxWidth)
                        done = true;
                } while (!done);

                return res + str;
            }
            function testWhite(x) {
                var white = new RegExp(/^\s$/);
                return white.test(x.charAt(0));
            };
            $rootScope.removeRecommnedVideo = function () {
                let playerFrame = document.getElementById("video-iframe");
                let tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                let firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                let player;
                window.onYouTubeIframeAPIReady = function () {
                    player = new YT.Player(playerFrame, {
                        events: { 'onStateChange': onPlayerStateChange }
                    });
                };
                window.onPlayerStateChange = function (event) {
                    if (event.data == YT.PlayerState.ENDED) {
                        document.getElementById("playerWrap").classList.add("shown");
                    }
                };
                document.getElementById("playerWrap").addEventListener("click", function () {
                    player.seekTo(0); document.getElementById("playerWrap").classList.remove("shown");
                });
            }

            $rootScope.removeRecommnedVideo1 = function () {
                let playerFrame = document.getElementById("video-iframe1");
                let tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                let firstScriptTag = document.getElementsByTagName('script')[1];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                let player;
                window.onYouTubeIframeAPIReady1 = function () {
                    player = new YT.Player(playerFrame, {
                        events: { 'onStateChange': onPlayerStateChange1 }
                    });
                };
                window.onPlayerStateChange1 = function (event) {
                    if (event.data == YT.PlayerState.ENDED) {
                        document.getElementById("playerWrap1").classList.add("shown");
                    }
                };
                document.getElementById("playerWrap1").addEventListener("click", function () {
                    player.seekTo(0); document.getElementById("playerWrap1").classList.remove("shown");
                });
            }

            //=============== init================

            $rootScope.getData();   //get last data
            $rootScope.$on('$stateChangeError',
                function (event, toState, toParams, fromState, fromParams, error) {
                    $state.go('login');
                });

            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    $rootScope.setData('userId', user.uid);
                } else {
                    $rootScope.setData('loadingfinished', true);
                    $state.go('login');
                }
            });
        }])