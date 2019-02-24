(function () {

    angular
        .module('myApp')
        .controller('AdminOpitonsController', AdminOpitonsController)

    AdminOpitonsController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminOpitonsController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminGroup");
        // $rootScope.setData('selectedMenu', 'group');
        var types = ['Feedback Type', 'Rating Type', 'Digit Type', 'Text Type', 'Dropdown Type', 'Slide Type', 'Multiple Type', 'Contingent Type', 'Answer Type', 'External Activity']

        $scope.teacherKey = $rootScope.settings.selectedTeacherKey;
        $scope.teacherEmail = $rootScope.settings.selectedTeacherEmail;
        if (!$scope.teacherKey) {
            $rootScope.warning('You need to select teacher at first');
            $state.go('admin');
        }
        $rootScope.safeApply();


        $scope.$on('$destroy', function () {
            if ($scope.teacherRef) $scope.teacherRef.off('value')
            if ($scope.defaultCreateQuestionSettingsRef) $scope.defaultCreateQuestionSettingsRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getTeacherData();
            $scope.getDefaultCreateQuestionSettings();
        }
        $scope.getTeacherData = function () {
            $scope.teacherRef = firebase.database().ref('Users/' + $scope.teacherKey);
            $scope.teacherRef.on('value', function (snapshot) {
                $scope.settings = snapshot.val();
                if ($scope.settings.approval == 1) {
                    $scope.settings.approved = true;
                } else {
                    $scope.settings.approved = false;
                }
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }
        $scope.getDefaultCreateQuestionSettings = function () {
            $scope.defaultCreateQuestionSettingsRef = firebase.database().ref('Settings/createQuestionSettings');
            $scope.defaultCreateQuestionSettingsRef.on('value', snapshot => {
                $scope.defaultCQSettings = snapshot.val()
                $scope.ref_2 = true
                $scope.finalCalc()
            })
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            let createQuestionSettings = $scope.settings.createQuestionSettings || {}
            for (key in createQuestionSettings) {
                $scope.defaultCQSettings[key] = createQuestionSettings[key]
            }
            delete $scope.defaultCQSettings['Likert Type']

            $scope.createQuestionSettings = []
            for (type in $scope.defaultCQSettings) {
                $scope.createQuestionSettings[types.indexOf(type)] = {
                    type: type,
                    value: $scope.defaultCQSettings[type]
                }
            }
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }

        // ==================   Global Options   ==============================
        $scope.changeApprove = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/approval'] = 1 - $scope.settings.approval;
            firebase.database().ref().update(updates).then(function () {
                if ($scope.settings.approval == 0) { // disapprove->approve
                    $scope.sendApproveEmail($scope.settings.ID);
                }
                $rootScope.safeApply();
            });
        }
        $scope.sendApproveEmail = function (teacherEmail) {
            var sendAproveEmail = firebase.functions().httpsCallable('sendAproveEmail');
            sendAproveEmail({ adminEmail: $rootScope.adminEmail, teacherEmail: teacherEmail }).then(function (result) {
                $rootScope.success('Approval email sent to approved teacher!');
                $rootScope.safeApply();
            })
        }
        $scope.changeAnonym = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/anonym_enabled'] = $scope.settings.anonym_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Anoymous setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeExport = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/export_enabled'] = $scope.settings.export_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Export setting changed!');
                $rootScope.safeApply();
            });
        }



        // ==================   Group Related Options   ==============================
        $scope.changeEditGroupName = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/editGroupName_enabled'] = $scope.settings.editGroupName_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Edit group name setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeAddToGroup = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/addToGroup_enabled'] = $scope.settings.addToGroup_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Add student to group setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.exportUserListChanged = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/exportUserList_enabled'] = $scope.settings.exportUserList_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Export group user list setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeFeedback = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/feedback_enabled'] = $scope.settings.feedback_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Add feedback setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeReleaseRule = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/release_enabled'] = $scope.settings.release_enabled;
            if (!$scope.settings.release_enabled) {
                updates['/Users/' + $scope.teacherKey + '/combinedRelease_enabled'] = false;
            }
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Add Release Rule setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeCombinedReleaseRule = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/combinedRelease_enabled'] = $scope.settings.combinedRelease_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Combined Release Rule setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeReminder_enabled = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/reminder_enabled'] = $scope.settings.reminder_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Reminder function setting changed!');
                $rootScope.safeApply();
            });
        }



        // ==================   QuestionSet Related Options   ==============================
        $scope.changePrivate = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/private_enabled'] = $scope.settings.private_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Private setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeLockNext = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/lockNext_enabled'] = $scope.settings.lockNext_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Lock next question setting changed!');
                $rootScope.safeApply();
            });
        }






        // ==================   Question Related Options   ==============================
        $scope.changeEditQst = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/editqst_enabled'] = $scope.settings.editqst_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Edit questionset setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeShareQuestion = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/shareQuestion_enabled'] = $scope.settings.shareQuestion_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Share question setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeExtraLink = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/link_enabled'] = $scope.settings.link_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Extra link setting changed!');
                $rootScope.safeApply();
            });
        }
        $scope.changeAddVideo = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/video_enabled'] = $scope.settings.video_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Add question video setting changed!');
                $rootScope.safeApply();
            });
        }

        $scope.changeAddResultVideo = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/result_video_enabled'] = $scope.settings.result_video_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Add result video setting changed!');
                $rootScope.safeApply();
            });
        }

        $scope.changeAddImage = function () {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/image_enabled'] = $scope.settings.image_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Add image setting changed!');
                $rootScope.safeApply();
            });
        }

        // ===========   change Create Question Setting  ==================
        $scope.changeCreateQuestionSetting = function (item) {
            var updates = {};
            updates['/Users/' + $scope.teacherKey + '/createQuestionSettings/' + item.type] = item.value;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Create ' + item.type + ' setting changed!');
                $rootScope.safeApply();
            });
        }



    }

})();