app.config(
    function ($stateProvider, $urlRouterProvider, $locationProvider, $mdAriaProvider) {

        // disable aria-label warning
        $mdAriaProvider.disableWarnings();
        // $qProvider.errorOnUnhandledRejections(false);

        $urlRouterProvider.otherwise('/login');

        $locationProvider.html5Mode(true);

        function checkAuth($q, $rootScope, userType = undefined) {
            $rootScope.getData();   //get last data
            if (isLogedIn($rootScope) || checkUserType($rootScope, userType)) {
                return $q.when();
            } else {
                return $q.reject();
            }
        }
        function isLogedIn($rootScope) {
            return $rootScope.settings.userId ? true : false;
        }
        function checkUserType($rootScope, userType = undefined) {
            return (userType == undefined) ? true : ($rootScope.settings.userType == userType)
        }
        $stateProvider
            //===========================================================
            //                      admin
            //=========================================================== 
            .state('admin', {
                url: '/admin',
                templateUrl: 'app/templates/admin/admin.html',
                controller: 'AdminController',
                data: {
                    pageTitle: 'Admin'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminExportAllTeachers', {
                url: '/admin/export',
                templateUrl: 'app/templates/admin/exportAllTeachers.html',
                controller: 'AdminExportAllTeachersController',
                data: {
                    pageTitle: 'Export All Teachers'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminGroup', {
                url: '/admin/group',
                templateUrl: 'app/templates/admin/group.html',
                controller: 'AdminGroupController',
                data: {
                    pageTitle: 'Groups'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('editOptions', {
                url: '/admin/Options',
                templateUrl: 'app/templates/admin/options.html',
                controller: 'AdminOpitonsController',
                data: {
                    pageTitle: 'Options'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminExportAllGroups', {
                url: '/admin/exportGroups',
                templateUrl: 'app/templates/admin/exportAllGroups.html',
                controller: 'AdminExportAllGroupsController',
                data: {
                    pageTitle: 'Export All Groups'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminGroupDetails', {
                url: '/admin/groupDetails',
                templateUrl: 'app/templates/admin/groupDetails.html',
                controller: 'adminGroupDetailsController',
                data: {
                    pageTitle: 'Group Details'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminSecondGroupDetails', {
                url: '/admin/secondGroupDetails',
                templateUrl: 'app/templates/admin/groupDetailsSecond.html',
                controller: 'adminSecondGroupDetailsController',
                data: {
                    pageTitle: 'Second Group Details'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminExportInGroup', {
                url: '/admin/exportInGroup',
                templateUrl: 'app/templates/admin/exportInGroup.html',
                controller: 'AdminExportInGroupController',
                data: {
                    pageTitle: 'Export All In Group'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminQuestions', {
                url: '/admin/questions',
                templateUrl: 'app/templates/admin/questions.html',
                controller: 'AdminQuestionsController',
                data: {
                    pageTitle: 'Questions'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminQuestionDetail', {
                url: '/admin/questionDetail',
                templateUrl: 'app/templates/admin/questionDetail.html',
                controller: 'AdminQuestionDetailController',
                data: {
                    pageTitle: 'Question Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminAllQuestionSet', {
                url: '/admin/allSets',
                templateUrl: 'app/templates/admin/allSets.html',
                controller: 'AdminAllSetsController',
                data: {
                    pageTitle: 'All Question Sets'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminQuestionSetUseDetail', {
                url: '/admin/setUse',
                templateUrl: 'app/templates/admin/setUse.html',
                controller: 'AdminSetUseController',
                data: {
                    pageTitle: 'Question Set Use Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminExportQuestionSet', {
                url: '/admin/exportQuestionSet',
                templateUrl: 'app/templates/admin/exportQuestionSet.html',
                controller: 'AdminExportQuestionSetController',
                data: {
                    pageTitle: 'Export Question Set'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminExportQuestion', {
                url: '/admin/exportQuestion',
                templateUrl: 'app/templates/admin/exportQuestion.html',
                controller: 'AdminExportQuestionController',
                data: {
                    pageTitle: 'Export Question'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('adminSettings', {
                url: '/admin/settings',
                templateUrl: 'app/templates/admin/settings.html',
                controller: 'AdminSettingsController',
                data: {
                    pageTitle: 'Settings'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })
            .state('platformStatus', {
                url: '/admin/status',
                templateUrl: 'app/templates/admin/status.html',
                controller: 'AdminStatusController',
                data: {
                    pageTitle: 'Platform Status'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Admin') }
                }
            })







            //===========================================================
            //                      common
            //=========================================================== 

            .state('login', {
                url: '/login',
                templateUrl: 'app/templates/common/login.html',
                controller: 'LoginController',
                data: {
                    pageTitle: 'Login'
                },
            })
            .state('register', {
                url: '/register',
                templateUrl: 'app/templates/common/register.html',
                controller: 'RegisterController',
                data: {
                    pageTitle: 'Register'
                }
            })
            .state('resetPass', {
                url: '/resetPassword',
                templateUrl: 'app/templates/common/reset.html',
                controller: 'ResetController',
                data: {
                    pageTitle: 'Reset Password'
                }
            })
            .state('chatHome', {
                url: '/messages',
                templateUrl: 'app/templates/common/chat/home.html',
                controller: 'chatHomeController',
                data: {
                    pageTitle: 'Messages'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('chatTeacher', {
                url: '/teacher/messages',
                templateUrl: 'app/templates/common/chat/home.teacher.html',
                controller: 'chatTeacherController',
                data: {
                    pageTitle: 'Messages'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })

            //===========================================================
            //                      teacher
            //=========================================================== 


            .state('teacher', {
                url: '/teacher',
                templateUrl: 'app/templates/teacher/teachermain.html',
                controller: function ($scope, $rootScope) {
                    $rootScope.setData('selectedMenu', 'home');
                },
                data: {
                    pageTitle: 'Teacher Main'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherGroup', {
                url: '/teacher/group',
                templateUrl: 'app/templates/teacher/teacherGroups.html',
                controller: 'TeacherGroupController',
                data: {
                    pageTitle: 'Teacher Groups'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createGroup', {
                url: '/teacher/group/createGroup',
                templateUrl: 'app/templates/teacher/group/createGroup.html',
                controller: 'createGroupController',
                data: {
                    pageTitle: 'Create Group'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            // ================upload list ======================
            .state('uploadList', {
                url: '/teacher/uploadList',
                templateUrl: 'app/templates/teacher/group/uploadList.html',
                controller: 'uploadListController',
                data: {
                    pageTitle: 'Upload List'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupRoot', {
                url: '/teacher/group/root',
                templateUrl: 'app/templates/teacher/group/groupRoot.html',
                controller: 'groupRootController',
                data: {
                    pageTitle: 'Group Root'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupSubRoot', {
                url: '/teacher/group/subRoot',
                templateUrl: 'app/templates/teacher/group/groupSubRoot.html',
                controller: 'groupSubRootController',
                data: {
                    pageTitle: 'Sub Group Root'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupSecondRoot', {
                url: '/teacher/group/secondRoot',
                templateUrl: 'app/templates/teacher/group/groupSecondRoot.html',
                controller: 'groupSecondRootController',
                data: {
                    pageTitle: 'Second Group  Root'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('choiceGroupAction', {
                url: '/teacher/group/choiceGroupAction',
                templateUrl: 'app/templates/teacher/group/choiceGroupAction.html',
                controller: 'choiceGroupActionController',
                data: {
                    pageTitle: 'Choice Group Action'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('editGroup', {
                url: '/teacher/group/editGroup',
                templateUrl: 'app/templates/teacher/group/editGroupQuestionSets.html',
                controller: 'editGroupController',
                data: {
                    pageTitle: 'Edit Group'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupsets', {
                url: '/teacher/group/groupsets',
                templateUrl: 'app/templates/teacher/group/groupsets.html',
                controller: 'GroupsetsController',
                data: {
                    pageTitle: 'Groupsets'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupsetUsers', {
                url: '/teacher/group/groupsetUsers',
                templateUrl: 'app/templates/teacher/group/groupsetUsers.html',
                controller: 'GroupsetUsersController',
                data: {
                    pageTitle: 'Groupset Users'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportGroupsetUsers', {
                url: '/teacher/exportGroupsetUsers',
                templateUrl: 'app/templates/teacher/group/exportGroupsetUsers.html',
                controller: 'exportGroupsetUsersController',
                data: {
                    pageTitle: 'Export Groupset Users'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('subSetUsers', {
                url: '/teacher/group/subsetUsers',
                templateUrl: 'app/templates/teacher/group/subsetUsers.html',
                controller: 'SubsetUsersController',
                data: {
                    pageTitle: 'Subgroupset Users'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('editGroupSet', {
                url: '/teacher/group/editGroupSet',
                templateUrl: 'app/templates/teacher/group/editGroupsetQuestionSets.html',
                controller: 'editGroupSetController',
                data: {
                    pageTitle: 'Import Questionsets in Groupset'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('questionsInGroup', {
                url: '/teacher/group/questionsInGroup',
                templateUrl: 'app/templates/teacher/group/questionsInGroup.html',
                controller: 'questionsInGroupController',
                data: {
                    pageTitle: 'Questions In Group'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('deleteGroupset', {
                url: '/teacher/group/deleteGroupset',
                templateUrl: 'app/templates/teacher/group/deleteGroupset.html',
                controller: 'deleteGroupsetController',
                data: {
                    pageTitle: 'Delete Groupset'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportGroupUsers', {
                url: '/teacher/operation/exportUsers',
                templateUrl: 'app/templates/teacher/group/operation/exportUsers.html',
                controller: 'exportUsersController',
                data: {
                    pageTitle: 'Export Group Users'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportScores', {
                url: '/teacher/operation/exportScores',
                templateUrl: 'app/templates/teacher/group/operation/exportScores.html',
                controller: 'exportScoresController',
                data: {
                    pageTitle: 'Export Final Scores'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherLinkGroupDetail', {
                url: '/teacher/operation/groupDetail',
                templateUrl: 'app/templates/teacher/group/operation/groupDetail.html',
                controller: 'teacherLinkGroupDetailController',
                data: {
                    pageTitle: 'Group Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherLinkQuestions', {
                url: '/teacher/operation/questions',
                templateUrl: 'app/templates/teacher/group/operation/questions.html',
                controller: 'teacherLinkQuestionsController',
                data: {
                    pageTitle: 'Question Links'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherLinkSubGroupDetail', {
                url: '/teacher/operation/subGroupDetail',
                templateUrl: 'app/templates/teacher/group/operation/groupDetail.sub.html',
                controller: 'teacherLinkSubGroupDetailController',
                data: {
                    pageTitle: 'Group Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherLinkSecondGroupDetail', {
                url: '/teacher/operation/secondGroupDetail',
                templateUrl: 'app/templates/teacher/group/operation/groupDetail.second.html',
                controller: 'teacherLinkSecondGroupDetailController',
                data: {
                    pageTitle: 'Group Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherLinkGroupQuestions', {
                url: '/teacher/operation/subquestions',
                templateUrl: 'app/templates/teacher/group/operation/questions.sub.html',
                controller: 'teacherLinkGroupQuestionsController',
                data: {
                    pageTitle: 'Question Links'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            // Feedback and score 
            .state('teacherGiveFeedback', {
                url: '/teacher/operation/giveFeedback',
                templateUrl: 'app/templates/teacher/group/operation/feedback.html',
                controller: 'teacherFeedbackController',
                data: {
                    pageTitle: 'Give Feedback'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherGiveGroupFeedback', {
                url: '/teacher/operation/giveGroupFeedback',
                templateUrl: 'app/templates/teacher/group/operation/feedback.sub.html',
                controller: 'teacherGroupFeedbackController',
                data: {
                    pageTitle: 'Give Feedback'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherRating', {
                url: '/teacher/operation/rating',
                templateUrl: 'app/templates/teacher/group/operation/rating.html',
                controller: 'teacherRatingController',
                data: {
                    pageTitle: 'Teacher Rating'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherRatingResult', {
                url: '/teacher/operation/ratingResult',
                templateUrl: 'app/templates/teacher/group/operation/rating.result.html',
                controller: 'teacherRatingResultController',
                data: {
                    pageTitle: 'Teacher Rating Result'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherGroupRating', {
                url: '/teacher/operation/groupRating',
                templateUrl: 'app/templates/teacher/group/operation/rating.sub.html',
                controller: 'teacherGroupRatingController',
                data: {
                    pageTitle: 'Teacher Rating'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherGroupRatingResult', {
                url: '/teacher/operation/groupRatingResult',
                templateUrl: 'app/templates/teacher/group/operation/rating.sub.result.html',
                controller: 'teacherGroupRatingResultController',
                data: {
                    pageTitle: 'Teacher Rating Result'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('completeQuestionSet', {
                url: '/teacher/operation/complete/questionset',
                templateUrl: 'app/templates/teacher/group/operation/completeSet.html',
                controller: 'teacherCompleteQuestionSetController',
                data: {
                    pageTitle: 'Complete Questionset'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherGiveScore', {
                url: '/teacher/operation/giveScore',
                templateUrl: 'app/templates/teacher/group/operation/score.html',
                controller: 'teacherScoreController',
                data: {
                    pageTitle: 'Give Score'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('teacherUploadExternal', {
                url: '/teacher/operation/UploadExternal',
                templateUrl: 'app/templates/teacher/group/operation/external.html',
                controller: 'teacherUploadExternalController',
                data: {
                    pageTitle: 'Upload External Data'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            // ============= response ==========================
            .state('responseOfAnswer', {
                url: '/teacher/group/response/general',
                templateUrl: 'app/templates/teacher/response/group/general.html',
                controller: 'responseOfAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfPerAnswer', {
                url: '/teacher/group/response/answerPerStudent',
                templateUrl: 'app/templates/teacher/response/group/answer.html',
                controller: 'responseOfPerAnswerController',
                data: {
                    pageTitle: 'Response Of Answer Per Students'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfDropdownAnswer', {
                url: '/teacher/group/response/dropdown',
                templateUrl: 'app/templates/teacher/response/group/dropdown.html',
                controller: 'responseOfDropdownAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfMultipleAnswer', {
                url: '/teacher/group/response/multiple',
                templateUrl: 'app/templates/teacher/response/group/multiple.html',
                controller: 'responseOfMultipleAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfContingentAnswer', {
                url: '/teacher/group/response/contingent',
                templateUrl: 'app/templates/teacher/response/group/contingent.html',
                controller: 'responseOfContingentAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfLikertAnswer', {
                url: '/teacher/group/response/likert',
                templateUrl: 'app/templates/teacher/response/group/likert.html',
                controller: 'responseOfLikertAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfFeedbackAnswer', {
                url: '/teacher/group/response/feedback',
                templateUrl: 'app/templates/teacher/response/group/feedback.html',
                controller: 'responseOfFeedbackAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfRatingAnswer', {
                url: '/teacher/group/response/rating',
                templateUrl: 'app/templates/teacher/response/group/rating.html',
                controller: 'responseOfRatingAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfSlideAnswer', {
                url: '/teacher/group/response/slide',
                templateUrl: 'app/templates/teacher/response/group/slide.html',
                controller: 'responseOfSlideAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('responseOfExternal', {
                url: '/teacher/group/response/external',
                templateUrl: 'app/templates/teacher/response/group/external.html',
                controller: 'responseOfExternalController',
                data: {
                    pageTitle: 'Response Of External Activity'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })

            // ============= groupset response ==========================
            .state('groupResponseOfAnswer', {
                url: '/teacher/groupset/response/general',
                templateUrl: 'app/templates/teacher/response/groupset/general.html',
                controller: 'groupResponseOfAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupResponseOfFeedbackAnswer', {
                url: '/teacher/groupset/response/feedback',
                templateUrl: 'app/templates/teacher/response/groupset/feedback.html',
                controller: 'groupResponseOfFeedbackAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupResponseOfRatingAnswer', {
                url: '/teacher/groupset/response/rating',
                templateUrl: 'app/templates/teacher/response/groupset/rating.html',
                controller: 'groupResponseOfRatingAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupResponseOfDropdownAnswer', {
                url: '/teacher/groupset/response/dropdown',
                templateUrl: 'app/templates/teacher/response/groupset/dropdown.html',
                controller: 'groupResponseOfDropdownAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupResponseOfMultipleAnswer', {
                url: '/teacher/groupset/response/multiple',
                templateUrl: 'app/templates/teacher/response/groupset/multiple.html',
                controller: 'groupResponseOfMultipleAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupResponseOfContingentAnswer', {
                url: '/teacher/groupset/response/contingent',
                templateUrl: 'app/templates/teacher/response/groupset/contingent.html',
                controller: 'groupResponseOfContingentAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('groupResponseOfLikertAnswer', {
                url: '/teacher/groupset/response/likert',
                templateUrl: 'app/templates/teacher/response/groupset/likert.html',
                controller: 'groupResponseOfLikertAnswerController',
                data: {
                    pageTitle: 'Response Of Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })



            // ============= groupset response ==========================

            .state('teacherQuestion', {
                url: '/teacher/questionsets',
                templateUrl: 'app/templates/teacher/questionSets.html',
                controller: 'TeacherQuestionController',
                data: {
                    pageTitle: 'Question Sets'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createQuestionSet', {
                url: '/teacher/question/createQuestionSet',
                templateUrl: 'app/templates/teacher/createQuestion/createQuestionSet.html',
                controller: 'createQuestionSetController',
                data: {
                    pageTitle: 'Create Question Set'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('choiceQuestionType', {
                url: '/teacher/question/choiceType',
                templateUrl: 'app/templates/teacher/createQuestion/choiceType.html',
                controller: 'choiceQuestionTypeController',
                data: {
                    pageTitle: 'Choice Question Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByFeedback', {
                url: '/teacher/question/createByFeedback',
                templateUrl: 'app/templates/teacher/createQuestion/byFeedback.html',
                controller: 'createByFeedbackController',
                data: {
                    pageTitle: 'Create By Feedback Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByRating', {
                url: '/teacher/question/createByRating',
                templateUrl: 'app/templates/teacher/createQuestion/byRating.html',
                controller: 'createByRatingController',
                data: {
                    pageTitle: 'Create By Rating Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByDigit', {
                url: '/teacher/question/createByDigit',
                templateUrl: 'app/templates/teacher/createQuestion/byDigit.html',
                controller: 'createByDigitController',
                data: {
                    pageTitle: 'Create By Digit Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByText', {
                url: '/teacher/question/createByText',
                templateUrl: 'app/templates/teacher/createQuestion/byText.html',
                controller: 'createByTextController',
                data: {
                    pageTitle: 'Create By Text Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByDropdown', {
                url: '/teacher/question/createByDropdown',
                templateUrl: 'app/templates/teacher/createQuestion/byDropdown.html',
                controller: 'createByDropdownController',
                data: {
                    pageTitle: 'Create By Dropdown Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByMultiple', {
                url: '/teacher/question/createByMultiple',
                templateUrl: 'app/templates/teacher/createQuestion/byMultiple.html',
                controller: 'createByMultipleController',
                data: {
                    pageTitle: 'Create By Multiple Answer Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createBySlide', {
                url: '/teacher/question/createBySlide',
                templateUrl: 'app/templates/teacher/createQuestion/bySlide.html',
                controller: 'createBySlideController',
                data: {
                    pageTitle: 'Create By Slide Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByContingent', {
                url: '/teacher/question/createByContingent',
                templateUrl: 'app/templates/teacher/createQuestion/byContingent.html',
                controller: 'createByContingentController',
                data: {
                    pageTitle: 'Create By Contingent Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByAnswer', {
                url: '/teacher/question/createByAnswer',
                templateUrl: 'app/templates/teacher/createQuestion/byAnswers.html',
                controller: 'createByAnswerController',
                data: {
                    pageTitle: 'Create By Answers Per Student Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByExternal', {
                url: '/teacher/question/createByExternal',
                templateUrl: 'app/templates/teacher/createQuestion/byExternal.html',
                controller: 'createByExternalController',
                data: {
                    pageTitle: 'Create By External Activity'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('createByLikert', {
                url: '/teacher/question/createByLikert',
                templateUrl: 'app/templates/teacher/createQuestion/byLikert.html',
                controller: 'createByLikertController',
                data: {
                    pageTitle: 'Create By Likert Type'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })

            // question routers
            .state('questionsInSet', {
                url: '/teacher/question/questionsInSet',
                templateUrl: 'app/templates/teacher/questions.html',
                controller: 'TeacherQuestionsInSetController',
                data: {
                    pageTitle: 'Questions In Question Set'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('deleteQuestionSet', {
                url: '/teacher/question/deleteQuestionSet',
                templateUrl: 'app/templates/teacher/deleteQuestionSet.html',
                controller: 'deleteQuestionSetController',
                data: {
                    pageTitle: 'Export Question Set'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('deleteLikertSet', {
                url: '/teacher/question/deleteLikertSet',
                templateUrl: 'app/templates/teacher/deleteLikertSet.html',
                controller: 'deleteLikertSetController',
                data: {
                    pageTitle: 'Export Question Set'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('deleteQuestion', {
                url: '/teacher/question/deleteQuestion',
                templateUrl: 'app/templates/teacher/deleteQuestion.html',
                controller: 'deleteQuestionController',
                data: {
                    pageTitle: 'Export Question'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('questionDetail', {
                url: '/teacher/question/questionDetail',
                templateUrl: 'app/templates/teacher/questionDetail.html',
                controller: 'TeacherQuestionDetailController',
                data: {
                    pageTitle: 'Question Detail'
                }
            })
            .state('subscaleDetail', {
                url: '/teacher/question/subscaleDetail',
                templateUrl: 'app/templates/teacher/subscaleDetail.html',
                controller: 'TeacherSubscaleDetailController',
                data: {
                    pageTitle: 'Subscale Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('superScaleDetail', {
                url: '/teacher/question/superScaleDetail',
                templateUrl: 'app/templates/teacher/superScaleDetail.html',
                controller: 'TeacherSuperScaleDetailController',
                data: {
                    pageTitle: 'Super Scale Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('labelDetail', {
                url: '/teacher/question/labelDetail',
                templateUrl: 'app/templates/teacher/labelDetail.html',
                controller: 'TeacherLabelDetailController',
                data: {
                    pageTitle: 'Label Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('choiceExportGroup', {
                url: '/teacher/export/choiceGroup',
                templateUrl: 'app/templates/teacher/exportAnswer/choiceGroups.html',
                controller: 'TeacherExportChoiceGroupController',
                data: {
                    pageTitle: 'Choice Group'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('export', {
                url: '/teacher/export/questions',
                templateUrl: 'app/templates/teacher/exportAnswer/export.html',
                controller: 'exportController',
                data: {
                    pageTitle: 'Export Questions'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportSub', {
                url: '/teacher/export/questions.sub',
                templateUrl: 'app/templates/teacher/exportAnswer/export.sub.html',
                controller: 'exportSubController',
                data: {
                    pageTitle: 'Export Questions'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportSecond', {
                url: '/teacher/export/questions.second',
                templateUrl: 'app/templates/teacher/exportAnswer/export.second.html',
                controller: 'exportSecondController',
                data: {
                    pageTitle: 'Export Questions'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportToExcel', {
                url: '/teacher/export/toExcel',
                templateUrl: 'app/templates/teacher/exportAnswer/exportToExcel.html',
                controller: 'exportToExcelController',
                data: {
                    pageTitle: 'Export To Excel'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportLikertToExcel', {
                url: '/teacher/export/likertToExcel',
                templateUrl: 'app/templates/teacher/exportAnswer/likertToExcel.html',
                controller: 'exportLikertToExcelController',
                data: {
                    pageTitle: 'Export To Excel'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportRatingToExcel', {
                url: '/teacher/export/ratingToExcel',
                templateUrl: 'app/templates/teacher/exportAnswer/ratingToExcel.html',
                controller: 'exportRatingToExcelController',
                data: {
                    pageTitle: 'Export To Excel'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('exportToExcelAll', {
                url: '/teacher/export/toExcelAll',
                templateUrl: 'app/templates/teacher/exportAnswer/exportToExcelAll.html',
                controller: 'exportToExcelAllController',
                data: {
                    pageTitle: 'Export To Excel All'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('contingentToExcelAll', {
                url: '/teacher/export/contingentToExcelAll',
                templateUrl: 'app/templates/teacher/exportAnswer/contingentToExcelAll.html',
                controller: 'contingentToExcelAllController',
                data: {
                    pageTitle: 'Export To Excel All'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })
            .state('ratingToExcelAll', {
                url: '/teacher/export/ratingToExcelAll',
                templateUrl: 'app/templates/teacher/exportAnswer/ratingToExcelAll.html',
                controller: 'ratingToExcelAllController',
                data: {
                    pageTitle: 'Export To Excel All'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Teacher') }
                }
            })



            //############################################
            //                  student 
            //############################################
            .state('student', {
                url: '/student',
                templateUrl: 'app/templates/student/studentmain.html',
                controller: function ($scope, $rootScope) {
                    $rootScope.setData('selectedMenu', 'home');
                },
                data: {
                    pageTitle: 'Student Main'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('profile', {
                url: '/profile',
                templateUrl: 'app/templates/common/profile.html',
                controller: 'profileController',
                data: {
                    pageTitle: 'User Profile'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('directLink', {
                url: '/directLink/:linkKey',
                templateUrl: 'app/templates/student/link/directLink.html',
                controller: 'directLinkController',
                data: {
                    pageTitle: 'Direct Link'
                },
                resolve: {
                    authenticate: function ($q, $rootScope, $stateParams) {
                        $rootScope.setData('linkKey', $stateParams.linkKey);
                        return checkAuth($q, $rootScope, 'Student')
                    }
                }
            })
            .state('joinGroup', {
                url: '/student/joinGroup',
                templateUrl: 'app/templates/student/group/joingroup.html',
                controller: 'JoinGroupController',
                data: {
                    pageTitle: 'Join Group'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('myGroups', {
                url: '/student/mygroup',
                templateUrl: 'app/templates/student/group/mygroup-student.html',
                controller: 'MyGroupController',
                data: {
                    pageTitle: 'My Groups'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) {
                        return checkAuth($q, $rootScope, 'Student');
                    }
                }
            })
            .state('studentGroupDetail', {
                url: '/student/groupDetail',
                templateUrl: 'app/templates/student/group/groupDetail.html',
                controller: 'studentGroupDetailController',
                data: {
                    pageTitle: 'Group Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('studentSubGroupDetail', {
                url: '/student/subGroupDetail',
                templateUrl: 'app/templates/student/group/groupDetail.sub.html',
                controller: 'studentSubGroupDetailController',
                data: {
                    pageTitle: 'Sub Group Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('studentSecondGroupDetail', {
                url: '/student/secondGroupDetail',
                templateUrl: 'app/templates/student/group/groupDetail.second.html',
                controller: 'studentSecondGroupDetailController',
                data: {
                    pageTitle: 'Second Group Detail'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })

            .state('questions', {
                url: '/student/questions',
                templateUrl: 'app/templates/student/question/questions.html',
                controller: 'questionsController',
                data: {
                    pageTitle: 'Questions'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('subQuestions', {
                url: '/student/subGroupQuestions',
                templateUrl: 'app/templates/student/question/questions.sub.html',
                controller: 'questionsSubController',
                data: {
                    pageTitle: 'Sub Group Questions'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            // .state('secondQuestions', {
            //     url: '/student/secondGroupQuestions',
            //     templateUrl: 'app/templates/student/question/questions.second.html',
            //     controller: 'questionsSecondController',
            //     data: {
            //         pageTitle: 'Second Group Questions'
            //     },
            //     resolve: {
            //         authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
            //     }
            // })






            // ==========================================
            //              group answer
            //============================================
            .state('answer', {
                url: '/student/answer/answer',
                templateUrl: 'app/templates/student/answer/group/answer.html',
                controller: 'AnswerController',
                data: {
                    pageTitle: 'Answers Per Student'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('feedbackAnswer', {
                url: '/student/answer/feedback',
                templateUrl: 'app/templates/student/answer/group/feedback.html',
                controller: 'FeedbackAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('feedbackAnswer1', {
                url: '/student/answer/feedback1',
                templateUrl: 'app/templates/student/answer/group/feedback1.html',
                controller: 'FeedbackAnswer1Controller',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('feedbackAnswer2', {
                url: '/student/answer/feedback2',
                templateUrl: 'app/templates/student/answer/group/feedback2.html',
                controller: 'FeedbackAnswer2Controller',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('ratingAnswer', {
                url: '/student/answer/rating',
                templateUrl: 'app/templates/student/answer/group/rating.html',
                controller: 'RatingAnswerController',
                data: {
                    pageTitle: 'Rating Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('digitAnswer', {
                url: '/student/answer/digit',
                templateUrl: 'app/templates/student/answer/group/digit.html',
                controller: 'DigitAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('textAnswer', {
                url: '/student/answer/text',
                templateUrl: 'app/templates/student/answer/group/text.html',
                controller: 'TextAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('dropdownAnswer', {
                url: '/student/answer/dropdown',
                templateUrl: 'app/templates/student/answer/group/dropdown.html',
                controller: 'DropdownAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('contingentAnswer', {
                url: '/student/answer/contingent',
                templateUrl: 'app/templates/student/answer/group/contingent.html',
                controller: 'ContingentAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('multipleAnswer', {
                url: '/student/answer/multiple',
                templateUrl: 'app/templates/student/answer/group/multiple.html',
                controller: 'MultipleAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('slideAnswer', {
                url: '/student/answer/slide',
                templateUrl: 'app/templates/student/answer/group/slide.html',
                controller: 'SlideAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('likertAnswer', {
                url: '/student/answer/likert',
                templateUrl: 'app/templates/student/answer/group/likert.html',
                controller: 'LikertAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })


            // ==========================================
            //              group answer result view
            //============================================

            .state('viewFeedbacks', {
                url: '/student/view/feedback',
                templateUrl: 'app/templates/student/view/group/feedback.html',
                controller: 'ViewFeedbackController',
                data: {
                    pageTitle: 'View Feedback'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })

            .state('viewRating', {
                url: '/student/view/rating',
                templateUrl: 'app/templates/student/view/group/rating.html',
                controller: 'RatingViewController',
                data: {
                    pageTitle: 'See Others Rating'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('viewDigit', {
                url: '/student/view/digit',
                templateUrl: 'app/templates/student/view/group/digit.html',
                controller: 'DigitViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('viewText', {
                url: '/student/view/text',
                templateUrl: 'app/templates/student/view/group/text.html',
                controller: 'TextViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('viewDropdown', {
                url: '/student/view/dropdown',
                templateUrl: 'app/templates/student/view/group/dropdown.html',
                controller: 'DropdownViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('viewMultiple', {
                url: '/student/view/multiple',
                templateUrl: 'app/templates/student/view/group/multiple.html',
                controller: 'MultipleViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('viewContingent', {
                url: '/student/view/contingent',
                templateUrl: 'app/templates/student/view/group/contingent.html',
                controller: 'ContingentViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('viewSlide', {
                url: '/student/view/slide',
                templateUrl: 'app/templates/student/view/group/slide.html',
                controller: 'SlideViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('viewLikert', {
                url: '/student/view/likert',
                templateUrl: 'app/templates/student/view/group/likert.html',
                controller: 'LikertViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('viewExternal', {
                url: '/student/view/external',
                templateUrl: 'app/templates/student/view/group/external.html',
                controller: 'ExternalViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })

            // ==========================================
            //              groupset answer
            //============================================

            .state('groupFeedbackAnswer', {
                url: '/student/answer/group/feedback',
                templateUrl: 'app/templates/student/answer/groupset/feedback.html',
                controller: 'GroupFeedbackAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupFeedbackAnswer1', {
                url: '/student/answer/group/feedback1',
                templateUrl: 'app/templates/student/answer/groupset/feedback1.html',
                controller: 'GroupFeedbackAnswer1Controller',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupFeedbackAnswer2', {
                url: '/student/answer/group/feedback2',
                templateUrl: 'app/templates/student/answer/groupset/feedback2.html',
                controller: 'GroupFeedbackAnswer2Controller',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupRatingAnswer', {
                url: '/student/answer/groupRating',
                templateUrl: 'app/templates/student/answer/groupset/rating.html',
                controller: 'GroupRatingAnswerController',
                data: {
                    pageTitle: 'Group Rating Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupDigitAnswer', {
                url: '/student/answer/groupDigit',
                templateUrl: 'app/templates/student/answer/groupset/digit.html',
                controller: 'GroupDigitAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupTextAnswer', {
                url: '/student/answer/groupText',
                templateUrl: 'app/templates/student/answer/groupset/text.html',
                controller: 'GroupTextAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupDropdownAnswer', {
                url: '/student/answer/groupDropdown',
                templateUrl: 'app/templates/student/answer/groupset/dropdown.html',
                controller: 'GroupDropdownAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupMultipleAnswer', {
                url: '/student/answer/groupMultiple',
                templateUrl: 'app/templates/student/answer/groupset/multiple.html',
                controller: 'GroupMultipleAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupContingentAnswer', {
                url: '/student/answer/groupContingent',
                templateUrl: 'app/templates/student/answer/groupset/contingent.html',
                controller: 'GroupContingentAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupSlideAnswer', {
                url: '/student/answer/groupSlide',
                templateUrl: 'app/templates/student/answer/groupset/slide.html',
                controller: 'GroupSlideAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupLikertAnswer', {
                url: '/student/answer/groupLikert',
                templateUrl: 'app/templates/student/answer/groupset/likert.html',
                controller: 'GroupLikertAnswerController',
                data: {
                    pageTitle: 'Submit Answer'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            // ==========================================
            //              groupset answer result view
            //============================================


            .state('viewGroupFeedbacks', {
                url: '/student/view/groupFeedback',
                templateUrl: 'app/templates/student/view/groupset/feedback.html',
                controller: 'ViewGroupFeedbackController',
                data: {
                    pageTitle: 'View Feedback'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupRatingView', {
                url: '/student/view/groupRating',
                templateUrl: 'app/templates/student/view/groupset/rating.html',
                controller: 'GroupRatingViewController',
                data: {
                    pageTitle: 'View Group Result'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupTeamRatingView', {
                url: '/student/view/groupTeamRating',
                templateUrl: 'app/templates/student/view/groupset/ratingTeam.html',
                controller: 'GroupTeamRatingViewController',
                data: {
                    pageTitle: 'View Team Rating'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupViewDigit', {
                url: '/student/view/groupDigit',
                templateUrl: 'app/templates/student/view/groupset/digit.html',
                controller: 'GroupDigitViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupViewText', {
                url: '/student/view/groupText',
                templateUrl: 'app/templates/student/view/groupset/text.html',
                controller: 'GroupTextViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupViewDropdown', {
                url: '/student/view/groupDropdown',
                templateUrl: 'app/templates/student/view/groupset/dropdown.html',
                controller: 'GroupDropdownViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupViewMultiple', {
                url: '/student/view/groupMultiple',
                templateUrl: 'app/templates/student/view/groupset/multiple.html',
                controller: 'GroupMultipleViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupViewContingent', {
                url: '/student/view/groupContingent',
                templateUrl: 'app/templates/student/view/groupset/contingent.html',
                controller: 'GroupContingentViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupViewSlide', {
                url: '/student/view/slideGroup',
                templateUrl: 'app/templates/student/view/groupset/slide.html',
                controller: 'GroupSlideViewController',
                data: {
                    pageTitle: 'Compare with Others'
                },
                resolve: {
                    authenticate: function ($q, $rootScope) { return checkAuth($q, $rootScope, 'Student') }
                }
            })
            .state('groupViewLikert', {
                url: '/student/view/likertGroup',
                templateUrl: 'app/templates/student/view/groupset/likert.html',
                controller: 'GroupLikertViewController',
                data: {
                    pageTitle: 'Compare with Others'
                }
            })
    });