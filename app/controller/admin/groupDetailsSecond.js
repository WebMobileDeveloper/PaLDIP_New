(function () {

    angular
        .module('myApp')
        .controller('adminSecondGroupDetailsController', adminSecondGroupDetailsController)

        adminSecondGroupDetailsController.$inject = ['$state', '$scope', '$rootScope'];

    function adminSecondGroupDetailsController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "adminGroupDetails");
        // $rootScope.setData('selectedMenu', 'groupDetails');

       
        $scope.teacherKey = $rootScope.settings.selectedTeacherKey;   
        $scope.subGroupSet = $rootScope.settings.subGroupSet;  
        $scope.secondGroupSet = $rootScope.settings.secondGroupSet;
        
        
        if (!$scope.teacherKey) {
            $rootScope.warning('You need to select teacher at first');
            $state.go('admin');
        }

        if ($rootScope.settings.groupKey == undefined) {
            $rootScope.warning('You need to select group at first');
            $state.go('adminGroup');
        }
        if ($rootScope.settings.questionSets.length == 0) {
            $rootScope.warning("There isn't any question set in this group");
        }

        

        $rootScope.safeApply();
        // ========================== Functions ========================= 


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
    }

})();