(function () {

    angular
        .module('myApp')
        .controller('teacherLinkSubGroupDetailController', teacherLinkSubGroupDetailController)

    teacherLinkSubGroupDetailController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherLinkSubGroupDetailController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'teacherLinkGroupDetail');
        $scope.$on('$destroy', function () {
            if ($scope.linkRef) $scope.linkRef.off('value')
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
            if ($scope.qsetNameRefArr) {
                $scope.qsetNameRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getLinks();
            $scope.getGroupData();
        }
        $scope.getLinks = function () {
            $scope.linkRef = firebase.database().ref('Links');
            $scope.linkRef.on('value', function (snapshot) {
                $scope.links = {};
                $scope.allLinks = snapshot.val() || {}
                for (key in $scope.allLinks) {
                    let link = $scope.allLinks[key];
                    if (link.groupKey == $rootScope.settings.groupKey && 
                        link.linkType == 'set' && 
                        link.groupType == 'sub' && 
                        link.groupSetKey == $rootScope.settings.groupSetKey) {
                        $scope.links[link.setKey] = link;
                    }
                }
            });
        }
        $scope.getGroupData = function () {
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey
                + '/groupsets/' + $rootScope.settings.groupSetKey);
            $scope.subGroupRef.on('value', function (snapshot) {
                $scope.groupData = snapshot.val();
                $scope.subGroupName = $scope.groupData.data.groups[$rootScope.settings.subIndex].name;
                if (!$scope.subGroupName) {
                    $scope.subGroupName = $scope.groupData.name + " " + ($rootScope.settings.subIndex + 1);
                }
                $scope.groupData.QuestionSets = $scope.groupData.QuestionSets || []
                if ($scope.qsetNameRefArr) {
                    $scope.qsetNameRefArr.forEach(ref => {
                        ref.off('value')
                    });
                }
                $scope.qsetNameRefArr = []
                $scope.groupData.QuestionSets.forEach(set => {
                    set.setname = ""
                    let qsetNameRef = firebase.database().ref("QuestionSets/" + set.key + '/setname')
                    $scope.qsetNameRefArr.push(qsetNameRef)
                    qsetNameRef.on('value', snapshot => {
                        set.setname = snapshot.val()
                        $rootScope.safeApply()
                    })
                });
                if ($scope.groupData.subgroupsets) {
                    for (var key in $scope.groupData.subgroupsets) {
                        var groupset = $scope.groupData.subgroupsets[key];
                        var data = $scope.groupData.data.groups[$rootScope.settings.subIndex].subgroupsets[key];
                        if (!data.members) data.members = [];

                        groupset.key = key;
                        for (var i = 0; i < groupset.count; i++) {
                            var group = data.groups[i];
                            if (!group.members) group.members = [];
                        }
                        groupset.data = data;
                    }
                    $scope.subgroupsets = $scope.groupData.subgroupsets;
                }
                if (!$scope.selectedTab) $scope.selectedTab = $rootScope.settings.selectedTab1;
                if (!$scope.groupSetKey) $scope.groupSetKey = $rootScope.settings.subSetKey;
                if (!$scope.secondIndex) $scope.secondIndex = $rootScope.settings.secondIndex;
                if ($scope.subgroupsets) {
                    if (!$scope.groupSetKey) {
                        $scope.groupSetKey = Object.keys($scope.subgroupsets)[0];
                        $scope.secondIndex = 0;
                    }
                    $scope.selectedGroup = $scope.subgroupsets[$scope.groupSetKey];
                }
                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.questions = function (set) {
            let subGroups = [];
            $scope.groupData.data.groups.forEach((group, index) => {
                let name = group.name ? group.name : $scope.groupData.name + " " + (index + 1);
                subGroups.push(name);
            });
            if (set.isSection) return;
            $rootScope.setData('questionSetKey1', set.key);
            $rootScope.setData('questionSetName', set.setname);
            $rootScope.setData('questionSet', set);
            $rootScope.setData('groupType', 'sub');
            $rootScope.setData('subGroups', subGroups);
            if (!set.LikertType) {
                $state.go('teacherLinkGroupQuestions');
            }
        }
        $scope.getQstClass = function (obj) {
            if (obj.isSection) {
                return 'section';
            } else if ($rootScope.settings.questionSetKey1 == obj.key) {
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
            $rootScope.setData('selectedTab1', selectedTab);
        }
        $scope.selectGroup = function (groupSetKey) {
            if ($scope.groupSetKey != groupSetKey) {
                $scope.groupSetKey = groupSetKey;
                $scope.selectedGroup = $scope.groupData.subgroupsets[groupSetKey];
                $scope.secondIndex = 0;
            }
        }
        $scope.getGroupClass = function (obj) {
            if ($scope.groupSetKey == obj.key) {
                return 'active';
            }
        }
        $scope.getSubGroupClass = function (index) {
            if ($scope.secondIndex == index) {
                return 'active';
            }
        }

        $scope.secondGroup = function (obj, index) {
            let subGroups = [];
            $scope.selectedGroup.data.groups.forEach((group, index) => {
                let name = group.name ? group.name : $scope.selectedGroup.name + " " + (index + 1);
                subGroups.push(name);
            });
            $scope.secondIndex = index;
            var teamName = obj.name;
            if (!teamName) {
                teamName = $scope.selectedGroup.name + ' ' + (index + 1);
            }
            $rootScope.setData('secondIndex', index);
            $rootScope.setData('subSetKey', $scope.groupSetKey);
            $rootScope.setData('subGroupName', $scope.subGroupName + ' / ' + teamName);
            $rootScope.setData('questionSetKey2', undefined);
            $rootScope.setData('subGroups', subGroups);
            $state.go('teacherLinkSecondGroupDetail');
        }
        $scope.changeHideState = function (set, index) {
            var hidden = set.hidden ? {} : true
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $rootScope.settings.groupSetKey +
                '/QuestionSets/' + index + '/hidden')
                .set(hidden).then(function () {
                    $rootScope.success("Questionset hide state changed successfully!")
                });
        }

        // ============link functions==================
        $scope.addLink = function (set) {
            var link = {
                teacherId: $rootScope.settings.teacherId,
                groupKey: $rootScope.settings.groupKey,
                setKey: set.key,
                questionType: 'Likert Type',
                linkType: 'set',
                groupType: 'sub',
                groupSetKey: $rootScope.settings.groupSetKey,
                key: $scope.getCode(),
            };
            firebase.database().ref('Links/' + link.key).set(link);
        }

        $scope.copyToClipboard = function (setKey) {
            var str = $scope.links[setKey].key;
            str = window.location.origin + '/directLink/' + str;
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(str).select();
            document.execCommand("copy");
            $temp.remove();
        }
        $scope.deletelink = function (setKey) {
            var key = $scope.links[setKey].key;
            firebase.database().ref('Links/' + key).set({});
        }
        $scope.getCode = function () {
            var chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
            var new_id = '';
            do {
                new_id = '';
                for (var i = 0; i < 5; i++) {
                    new_id += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (Object.keys($scope.allLinks).indexOf(new_id) > -1);
            return new_id;
        }
    }
})();