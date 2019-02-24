(function () {

    angular
        .module('myApp')
        .controller('adminGroupDetailsController', adminGroupDetailsController)

    adminGroupDetailsController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function adminGroupDetailsController($state, $scope, $rootScope, $filter) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminGroup");
        // $rootScope.setData('selectedMenu', 'groupDetails');
       
        $scope.teacherKey = $rootScope.settings.selectedTeacherKey;
        if (!$scope.teacherKey) {
            $rootScope.warning('You need to select teacher at first');
            $state.go('admin');
        }

        if ($rootScope.settings.groupKey == undefined) {
            $rootScope.warning('You need to select group at first');
            $state.go('adminGroup');
        }

        $rootScope.safeApply();
        // ========================== Functions ========================= 



        $scope.$on('$destroy', function () {
            if ($scope.groupRef) $scope.groupRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getGroupSets();
        }

        $scope.getGroupSets = function () {
            $scope.groupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey);
            $scope.groupRef.on('value', function (snapshot) {
                $scope.groupData = snapshot.val();
                $scope.groupData.QuestionSets = $scope.groupData.QuestionSets || {}

                var QuestionSets = [];
                for (var key in $scope.groupData.QuestionSets) {
                    QuestionSets.push($scope.groupData.QuestionSets[key]);
                }
                QuestionSets = $filter('orderBy')(QuestionSets, 'order');
                $scope.groupData.QuestionSets = QuestionSets;

                if ($scope.groupData.groupsets) {
                    for (var key in $scope.groupData.groupsets) {
                        var groupset = $scope.groupData.groupsets[key];
                        var data = groupset.data;
                        if (!data.members) data.members = [];
                        groupset.key = key;
                    }
                    $scope.groupsets = $scope.groupData.groupsets;
                }
                if (!$scope.selectedTab) $scope.selectedTab = $rootScope.settings.selectedTab;
                if (!$scope.groupSetKey) $scope.groupSetKey = $rootScope.settings.groupSetKey;

                if (!$scope.subIndex) $scope.subIndex = $rootScope.settings.subIndex;
                if ($scope.groupsets) {
                    if (!$scope.groupSetKey) {
                        $scope.groupSetKey = Object.keys($scope.groupsets)[0];
                        $scope.subIndex = 0;
                    }
                    $scope.selectedGroup = $scope.groupsets[$scope.groupSetKey];
                }

                $rootScope.setData('loadingfinished', true);
            });
        }

        $scope.showQuestions = function (obj) {
            $rootScope.setData('questionSetKey', obj.key);
            $rootScope.setData('questionSetName', obj.setname);
            $state.go('adminQuestions');
        }
        $scope.getQstClass = function (obj) {
            if ($rootScope.settings.questionSetKey == obj.key) {
                return 'active';
            }
        }

        $scope.getClass = function (selectedTab) {
            if ($scope.selectedTab == selectedTab) {
                return 'active';
            }
        }

        $scope.setActive = function (selectedTab) {
            $scope.selectedTab = selectedTab;
            $rootScope.setData('selectedTab', selectedTab);
        }

        $scope.selectGroup = function (groupSetKey) {
            if ($scope.groupSetKey != groupSetKey) {
                $scope.groupSetKey = groupSetKey;
                $scope.selectedGroup = $scope.groupData.groupsets[groupSetKey];
                $scope.subIndex = 0;
            }
        }

        $scope.getGroupClass = function (obj) {
            if ($scope.groupSetKey == obj.key) {
                return 'active';
            }
        }

        $scope.getSubGroupClass = function (index) {
            if ($scope.subIndex == index) {
                return 'active';
            }
        }

        $scope.secondDetails = function (selectedGroup, obj) {
            $rootScope.setData('subGroupSet', selectedGroup);
            $rootScope.setData('secondGroupSet', obj);
            $state.go('adminSecondGroupDetails')
        }

    }

})();