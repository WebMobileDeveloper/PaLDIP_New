(function () {

    angular
        .module('myApp')
        .controller('AdminStatusController', AdminStatusController)

    AdminStatusController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminStatusController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('selectedMenu', 'status');
        $rootScope.setData('backUrl', "");


        $scope.$on('$destroy', function () {
            if ($scope.studentsRef) $scope.studentsRef.off('value')
            if ($scope.teacherRef) $scope.teacherRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getStudents()
            $scope.getTeachers()

        }

        $scope.getStudents = function () {
            $scope.studentsRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            $scope.studentsRef.on('value', function (snapshot) {
                $scope.studentsCount = snapshot.numChildren()
                $scope.ref_1 = true
                $scope.finalCalc();
            });
        }

        $scope.getTeachers = function () {
            $scope.teacherRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Teacher');
            $scope.teacherRef.on('value', function (snapshot) {
                $scope.teachersCount = snapshot.numChildren()
                $scope.ref_2 = true
                $scope.finalCalc()
            })
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $rootScope.setData('loadingfinished', true);
        }
    }

})();