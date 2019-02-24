(function () {

    angular
        .module('myApp')
        .controller('JoinGroupController', JoinGroupController)

    JoinGroupController.$inject = ['$state', '$scope', '$rootScope'];

    function JoinGroupController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('selectedMenu', 'joingroup');
        $rootScope.safeApply();

        //Discriminate
        $scope.$on("$destroy", function () {
            if ($scope.groupsRef) $scope.groupsRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
        });

        $scope.getGroups = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.groupsRef = firebase.database().ref('Groups');
            $scope.groupsRef.on('value', function (snapshot) {
                $scope.groupCodes = [];
                $scope.groups = {};
                for (groupKey in snapshot.val()) {
                    let group = snapshot.val()[groupKey]
                    let teacherKey = group.teacherKey
                    $scope.groups[group.code] = {
                        teacherKey: teacherKey,
                        groupKey: groupKey,
                    }
                    $scope.groupCodes.push(group.code);
                }
                $scope.getJoinedGroupKeys();
            });
        }
        $scope.getJoinedGroupKeys = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups/' + $rootScope.settings.userId);
            $scope.stGroupRef.on('value', function (groups) {
                $scope.joinedKeys = [];
                groups.forEach(function (group) {
                    $scope.joinedKeys.push(group.val());
                });
                $rootScope.setData('loadingfinished', true);
            });
        }




        //add group to the student
        $scope.JoinGroup = function () {
            if (!$scope.groupcode) {
                $rootScope.error("Please input group code!");
                return;
            }
            if ($scope.groupCodes.indexOf($scope.groupcode) == -1) {
                $rootScope.error('Invalid GroupCode!');
                return;
            }

            var groupKey = $scope.groups[$scope.groupcode].groupKey;  //Questions

            if ($scope.joinedKeys.indexOf(groupKey) > -1) {
                $rootScope.error("You are alread joined this group.\n please select other group.");
                return;
            }

            firebase.database().ref('StudentGroups/' + $rootScope.settings.userId).push(groupKey).then(function () {
                $rootScope.setData('loadingfinished', true);
                $rootScope.success('You are joined to new group successfully!');
                $state.go('myGroups');
            });
        }
    }
})();