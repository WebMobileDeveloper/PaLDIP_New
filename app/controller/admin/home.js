(function () {

    angular
        .module('myApp')
        .controller('AdminController', AdminController)

    AdminController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('selectedMenu', 'home');
        $rootScope.setData('backUrl', "");
        $scope.orderField = 'Date';
       
        $scope.$on('$destroy', function () {
            if ($scope.userRef) $scope.userRef.off('value')
        })

        //Get Registered Teachers       
        $scope.getRegisteredTeachers = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.userRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Teacher');
            $scope.userRef.on('value', function (snapshot) {
                $scope.teachers = [];
                for (teacherKey in snapshot.val()) {
                    var teacher = snapshot.val()[teacherKey];
                    if (teacher.approval == 1) {
                        teacher.approved = true;
                    } else {
                        teacher.approved = false;
                    }
                    $scope.teachers.push(teacher);
                }
                $scope.sortBy('Date');
                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();
            })
        }

        $scope.sortBy = function (field) {
            if (field == 'Date') {
                $scope.teachers.sort(function compare(a, b) {
                    var dateA = new Date(a.creationTime);
                    var dateB = new Date(b.creationTime);
                    return dateB - dateA;
                });
            } else {
                $scope.teachers.sort(function compare(a, b) {
                    if (a.ID.toLowerCase() < b.ID.toLowerCase()) return -1;
                    if (a.ID.toLowerCase() > b.ID.toLowerCase()) return 1;
                    return 0;
                });
            }
            $rootScope.safeApply;
        }
        $scope.changeApprove = function (obj) {
            var userkey = obj.Userkey;
            var updates = {};
            updates['/Users/' + userkey + '/approval'] = 1 - obj.approval;
            firebase.database().ref().update(updates).then(function () {
                if (obj.approval == 0) { // disapprove->approve
                    $scope.sendApproveEmail(obj.ID);
                }
                $rootScope.safeApply();
            });
        }
        $scope.sendApproveEmail = function (teacherEmail) {
            var sendAproveEmail = firebase.functions().httpsCallable('sendAproveEmail');
            sendAproveEmail({ adminEmail: $rootScope.adminEmail, teacherEmail: teacherEmail }).then(function (result) {
                $rootScope.success('Approval email sent to approved teacher!');
            })
        }
        $scope.changeAnonym = function (obj) {
            var userkey = obj.Userkey;
            var updates = {};
            updates['/Users/' + userkey + '/anonym_enabled'] = obj.anonym_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.changePrivate = function (obj) {
            var userkey = obj.Userkey;
            var updates = {};
            updates['/Users/' + userkey + '/private_enabled'] = obj.private_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.changeEditQst = function (obj) {
            var userkey = obj.Userkey;
            var updates = {};
            updates['/Users/' + userkey + '/editqst_enabled'] = obj.editqst_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.changeExtraLink = function (obj) {
            var userkey = obj.Userkey;
            var updates = {};
            updates['/Users/' + userkey + '/link_enabled'] = obj.link_enabled;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }

        $scope.showGroups = function (obj) {
            if ($rootScope.settings.selectedTeacherKey != obj.Userkey) {
                $rootScope.setData('selectedTeacherKey', obj.Userkey);
                $rootScope.setData('selectedTeacherEmail', obj.ID);
                $rootScope.setData('groupKey', undefined);
            }
            $state.go('adminGroup');
        }
        $scope.setActive = function (obj) {
            if (obj.Userkey == $rootScope.settings.selectedTeacherKey) {
                return 'active';
            }
            return '';

        }
    }

})();