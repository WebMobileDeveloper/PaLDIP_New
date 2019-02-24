(function () {

    angular
        .module('myApp')
        .controller('createGroupController', createGroupController)

    createGroupController.$inject = ['$state', '$scope', '$rootScope'];

    function createGroupController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'teacherGroup');
        $rootScope.safeApply();

        $scope.getGroups = function () {
            $rootScope.setData('loadingfinished', false);
            var groupdata = firebase.database().ref('Groups');
            groupdata.on('value', function (snapshot) {
                $scope.groupNames = [];
                $scope.groupCodes = [];
                for (groupKey in snapshot.val()) {
                    let group = snapshot.val()[groupKey]
                    $scope.groupNames.push(group.groupname);
                    $scope.groupCodes.push(group.code);
                }
                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.initCode = function () {
            for (var key in $scope.updates) {
                var code = $scope.getCode();
                while ($scope.groupCodes.indexOf(code) > -1) {
                    code = $scope.getCode();
                }
                $scope.updates[key] = code;
            }
            firebase.database().ref().update($scope.updates).then(function () {
                $rootScope.success('Code init successfully!');
            });
        }
        $scope.getCode = function () {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZ'.split('');
            var new_id = '';
            for (var i = 0; i < 4; i++) {
                new_id += chars[Math.floor(Math.random() * chars.length)];
            }
            return new_id;
        }
        $scope.creatgroup = function () {
            if (!$scope.groupName) {
                $rootScope.warning('Please input new group name!');
                return;
            }
            if ($scope.groupNames.indexOf($scope.groupName) > -1) {
                $rootScope.warning('This group name is exist already!');
                return;
            }
            if (!confirm('Are you sure want to create this new group?')) {
                return;
            }
            var code = $scope.getCode();
            while ($scope.groupCodes.indexOf(code) > -1) {
                code = $scope.getCode();
            }

            var groupdetails = {
                groupname: $scope.groupName,
                code: code,
                teacherKey: $rootScope.settings.userId
            };
            firebase.database().ref('Groups').push(groupdetails).then(function () {
                $rootScope.success('Group is created successfully!')
                $rootScope.safeApply();
                setTimeout(function () {
                    $state.reload();
                }, 500);
            });
        }
    }
})();