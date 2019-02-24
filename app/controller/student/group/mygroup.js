(function () {

    angular
        .module('myApp')
        .controller('MyGroupController', MyGroupController)

    MyGroupController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function MyGroupController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "student");
        $rootScope.setData('selectedMenu', 'groups');
        $rootScope.safeApply();


        $scope.$on('$destroy', function () {
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getGroups();
            $scope.getStudentGroups();
        }
        $scope.getGroups = function () {
            $scope.groupRef = firebase.database().ref('Groups');
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groups = {};
                for (groupKey in snapshot.val()) {
                    let group = snapshot.val()[groupKey];
                    group.group_id = groupKey
                    $scope.groups[groupKey] = group
                }
                $scope.ref_1 = true;
                $scope.finalCalc();
            });
        }
        //get student group
        $scope.getStudentGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups/' + $rootScope.settings.userId);
            $scope.stGroupRef.on('value', function (snapshot) {
                $scope.stGroupKeys = Object.values(snapshot.val() || {})
                $scope.ref_2 = true;
                $scope.finalCalc();
            });
        };
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return
            $scope.studentgroups = [];
            $scope.stGroupKeys.forEach(group_key => {
                $scope.studentgroups.push($scope.groups[group_key]);
            });
            $scope.studentgroups = $filter('orderBy')($scope.studentgroups, 'groupname');
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }
        //go to details of student group
        $scope.studentGroupDetails = function (obj) {
            if ($rootScope.settings.groupKey != obj.group_id) {
                $rootScope.setData('teacherId', obj.teacherKey);
                $rootScope.setData('groupKey', obj.group_id);
                $rootScope.setData('groupSetKey', undefined);
                $rootScope.setData('subSetKey', undefined);
                $rootScope.setData('selectedTab', 'QuestionSet');
                $rootScope.setData('groupName', obj.groupname);
                $rootScope.setData('origin_groupKey', obj.origin_groupKey)
            }
            $state.go('studentGroupDetail');
        }
        $scope.getClass = function (obj) {
            if ($rootScope.settings.groupKey == obj.group_id) {
                return 'active';
            } else {
                return '';
            }
        }
    }
})();