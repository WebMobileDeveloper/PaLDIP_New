(function () {

    angular
        .module('myApp')
        .controller('AdminSetUseController', AdminSetUseController)

    AdminSetUseController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminSetUseController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminAllQuestionSet");
        $scope.choice = 'used';
        
        $scope.questions = $rootScope.settings.globalQuestions;
        if (!$scope.questions) {
            $scope.questions = [];
        }
        $rootScope.safeApply();



        $scope.$on('$destroy', function () {
            if ($scope.teacherRef) $scope.teacherRef.off('value')
            if ($scope.questionSetRef) $scope.questionSetRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getTeachers();
            $scope.getAllQuestionSets();
            $scope.getAllGroups();
        }

        $scope.getTeachers = function () {
            $scope.teacherRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Teacher');
            $scope.teacherRef.on('value', function (snapshot) {
                $scope.teachers = {};
                snapshot.forEach(function (childsnapshot) {
                    var teacherKey = childsnapshot.key;
                    $scope.teachers[teacherKey] = {
                        teacherEmail: childsnapshot.val()['ID']
                    };
                });
                $scope.ref_1 = true
                $scope.finalCalc();
            })
        }
        $scope.getAllQuestionSets = function () {
            $scope.questionSetRef = firebase.database().ref('QuestionSets').orderByChild('creator');
            $scope.questionSetRef.on('value', function (snapshot) {
                $scope.questionSets = [];
                snapshot.forEach(function (questionSet) {
                    $scope.questionSets[questionSet.key] = {
                        questionSetKey: questionSet.key,
                        setName: questionSet.val()['setname'],
                    };
                });
                $scope.ref_2 = true
                $scope.finalCalc();
            });
        }

        $scope.getAllGroups = function () {
            $scope.groupRef = firebase.database().ref('Groups');
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groups = {};
                snapshot.forEach(function (group) {
                    $scope.groups[group.teacherKey] = $scope.groups[group.val().teacherKey] || {}
                    $scope.groups[group.teacherKey][group.key] = group.val()
                });
                $scope.ref_3 = true
                $scope.finalCalc();
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            $scope.result = [];
            for (teacherKey in $scope.teachers) {
                var teacherEmail = $scope.teachers[teacherKey]['teacherEmail'];
                var groups = $scope.groups[teacherKey] || {};
                for (groupKey in groups) {
                    var groupName = groups[groupKey]['groupname'];
                    var questionSets = groups[groupKey]['QuestionSets'] || {};
                    for (questionSetKey in questionSets) {
                        if (questionSetKey == $rootScope.settings.globalQuestionSetKey) {
                            var temp = {
                                teacher: teacherEmail,
                                groupName: groupName
                            };
                            $scope.result.push(temp);
                            break;
                        }
                    }
                }
            }
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();

        }
        $scope.deleteQuestionSet = function () {
            // if (confirm("Collected data will be lost if question set is deleted.\n Please export data before deleting the question set.")) {
            $state.go('adminExportQuestionSet');
            // }
        }
        $scope.deleteQuestion = function (obj, index) {
            $rootScope.setData('qustionData', angular.copy(obj));
            $rootScope.setData('qustionIndex', index);

            // if (confirm("Collected data will be lost if question is deleted.\n Please export data before deleting the question.")) {
            $state.go('adminExportQuestion');
            // }
        }

    }

})();