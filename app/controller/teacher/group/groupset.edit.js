(function () {
    angular
        .module('myApp')
        .controller('editGroupSetController', editGroupSetController)
    editGroupSetController.$inject = ['$state', '$scope', '$rootScope', 'dragulaService', '$mdDialog'];
    function editGroupSetController($state, $scope, $rootScope, dragulaService, $mdDialog) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupsets");
        var scroll = autoScroll([
            document.querySelector('.left-box')
        ], {
                margin: 30,
                maxSpeed: 10,
                scrollWhenOutside: true,
                autoScroll: function () {
                    //Only scroll when the pointer is down
                    return this.down
                }
            });

        $scope.groupSetType = $rootScope.settings.groupSetType;
        $scope.GroupSetKey = $rootScope.settings.groupSetKey;
        $scope.GroupSetName = $rootScope.settings.GroupSetName;
        $scope.TitleString = $rootScope.settings.groupName + ' / ' + $scope.GroupSetName;

        if ($scope.groupSetType == 'secondGroupSet') {
            $scope.subSetKey = $rootScope.settings.subSetKey;
            $scope.subGroupSetName = $rootScope.settings.subGroupSetName;
            $scope.TitleString += ' / ' + $scope.subGroupSetName;
        }
        $rootScope.safeApply();


        dragulaService.options($scope, 'drag-div', {
            removeOnSpill: false
        });

        $scope.$on('$destroy', function () {
            if ($scope.teachersRef) $scope.teachersRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.allSetsRef) $scope.allSetsRef.off('value')
            if ($scope.myGroupsRef) $scope.myGroupsRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getTeachers();
            $scope.getGroupData();
            $scope.getAllSets();
            $scope.getAllUsedGroups();
        }
        $scope.getTeachers = function () {
            $scope.teachersRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Teacher');
            $scope.teachersRef.on('value', function (snapshot) {
                $scope.Teachers = snapshot.val() || {};
                $scope.ref_1 = true;
                $scope.finalCalc();
            })
        }
        //get sets in the group and total set lists
        $scope.getGroupData = function () {//
            if ($scope.groupSetType == 'firstGroupSet') {
                $scope.groupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $scope.GroupSetKey + '/QuestionSets');
            } else {
                $scope.groupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $scope.GroupSetKey
                    + '/subgroupsets/' + $scope.subSetKey + '/QuestionSets');
            }
            $scope.groupRef.on('value', function (snapshot) {
                var sets = snapshot.val();
                $scope.dragArray = [];
                $scope.setsInGroup = {};
                if (sets) {
                    $scope.dragArray = sets;
                    for (var i = 0; i < sets.length; i++) {
                        $scope.setsInGroup[sets[i].key] = sets[i];
                    }
                }
                $scope.ref_2 = true;
                $scope.finalCalc();
            });

        }
        $scope.getAllSets = function () {
            $scope.allSetsRef = firebase.database().ref('QuestionSets');
            $scope.allSetsRef.on('value', function (snapshot) {
                $scope.allSets = snapshot.val() || {};
                $scope.ref_3 = true;
                $scope.finalCalc();
            });

        }
        $scope.getAllUsedGroups = function () {
            if ($scope.myGroupsRef) $scope.myGroupsRef.off('value')
            $scope.myGroupsRef = firebase.database().ref('Groups').orderByChild('teacherKey').equalTo($rootScope.settings.userId);
            $scope.myGroupsRef.on('value', function (snapshot) {
                $scope.usedSetKeys = [];
                let groups = snapshot.val() || {}

                for (key in groups) {
                    let group = groups[key];
                    if (group.QuestionSets) {
                        for (setKey in group.QuestionSets) {
                            $scope.usedSetKeys.push(setKey);
                        }
                    }
                }
                $scope.ref_4 = true;
                $scope.finalCalc();

            })
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return;
            $scope.questionSetLists = {};
            for (key in $scope.allSets) {
                let set = $scope.allSets[key]
                var existInGroup = ($scope.setsInGroup[key]) ? true : false;
                var createdByMe = ($rootScope.settings.userId == set.creator) ? true : false;
                var LikertType = set.LikertType;
                set.sharedTeachers = set.sharedTeachers || {}
                set.shared = (Object.keys(set.sharedTeachers).indexOf($rootScope.settings.userId) > -1) ? true : false
                if (!createdByMe && set.private && !existInGroup && !set.shared) continue;
                $scope.questionSetLists[key] = {
                    setname: set.setname,
                    tags: set.tags,
                    key: key,
                    siblingSetKey: set.siblingSetKey || {},
                    LikertType: LikertType,
                    existInGroup: existInGroup,
                    createdByMe: createdByMe,
                    usedBefore: false,
                    visibleBytag: true,
                    private: set.private,
                    shared: set.shared,
                    usedBefore: $scope.usedSetKeys.indexOf(key) > -1 ? true : false,
                    creatorEmail: $scope.Teachers[set.creator].ID,
                    nick_name: $scope.Teachers[set.creator].nick_name,
                }
            }
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }



        $scope.getShowState = function (setKey) {
            let set = $scope.questionSetLists[setKey];
            switch ($rootScope.settings.showSetOption) {
                case 'ByMe':
                    return set.createdByMe && set.visibleBytag;
                case 'Used':
                    return set.usedBefore && set.visibleBytag;
                case 'ByOther':
                    return !set.createdByMe && set.visibleBytag && (!set.private || set.shared);
            }
        }
        $scope.chipChanged = function () {
            let set = $scope.questionSetLists[setKey];
            if ($rootScope.selectedTags.length == 0) {
                for (const setKey in $scope.questionSetLists) {
                    set.visibleBytag = true;
                }
            } else {
                for (const setKey in $scope.questionSetLists) {
                    set.visibleBytag = false;
                    //search by name
                    var low_name = set.setname.toLowerCase();
                    for (const tagIndex in $rootScope.selectedTags) {
                        var low = $rootScope.selectedTags[tagIndex].name.toLowerCase();
                        if (low_name.indexOf(low) != -1) {
                            set.visibleBytag = true;
                            break;
                        }
                    }
                    if (set.visibleBytag) continue;

                    //search by tags
                    if (set.tags == undefined) continue;
                    var setTagArray = set.tags.toLowerCase().split(',');
                    for (const tagIndex in $rootScope.selectedTags) {
                        var low = $rootScope.selectedTags[tagIndex].name.toLowerCase();
                        if (setTagArray.indexOf(low) != -1) {
                            set.visibleBytag = true;
                            break;
                        }
                    }
                }
            }
            $rootScope.safeApply();
        }
        $scope.showInactive = function (type) {
            if ($rootScope.settings.showSetOption != type) {
                return 'inactive';
            }
        }

        $scope.changeShow = function (value) {
            $rootScope.setData('showSetOption', value);
            $rootScope.safeApply();
        }

        //add set to group
        $scope.addtogroup = function (set) {
            if ($scope.setsInGroup[set.key]) return;
            var lastIndex = $scope.dragArray.length;
            var newSet = {
                key: set.key, setname: set.setname
            }
            if (set.LikertType) {
                newSet.LikertType = true;
            }
            $scope.setsInGroup[set.key] = newSet;
            $scope.dragArray[lastIndex] = angular.copy(newSet);
            $scope.questionSetLists[set.key].existInGroup = true;
            $rootScope.safeApply();
        }

        $scope.hideSet = function (set) {
            set.hidden = !set.hidden;
            $rootScope.safeApply();
        }
        //remove set from group
        $scope.showQuestionsInSet = function (gSet) {
            let set = $scope.questionSetLists[gSet.key];
            $rootScope.setData('setData', set)
            $rootScope.setData('createdByMe', set.createdByMe);
            $rootScope.setData('creatorEmail', set.creatorEmail);
            $rootScope.setData('creatorNickName', set.nick_name);
            $rootScope.setData('questionSetKey', set.key);
            $rootScope.setData('baseBackUrl', "editQuestionsetsInGroupSet");
            $rootScope.setData('selectedQuestionTab', 'question');
            $state.go('questionsInSet');
        }
        $scope.removefromgroup = function (ev, set) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm(
                {
                    onComplete: function afterShowAnimation() {
                        var $dialog = angular.element(document.querySelector('md-dialog'));
                        var $actionsSection = $dialog.find('md-dialog-actions');
                        var $cancelButton = $actionsSection.children()[0];
                        var $confirmButton = $actionsSection.children()[1];
                        angular.element($confirmButton).addClass('md-raised md-warn capitalize-button');
                        angular.element($cancelButton).addClass('md-raised capitalize-button');
                    }
                })
                .title('Please confirm this before remove this question set!')
                // .textContent()
                .htmlContent(`
                <p>You will be lost data if you remove question set.</p> 
                <p>Please avoid to lost data before remove it.</p>`
                )
                .ariaLabel('Confirm Modal')
                .targetEvent(ev)
                .ok('Remove Set')
                .cancel('Export data');

            $mdDialog.show(confirm).then(function () {
                $scope.questionSetLists[set.key].existInGroup = false;
                delete $scope.setsInGroup[set.key];
                $scope.dragArray.splice($scope.dragArray.indexOf(set), 1);
                $rootScope.safeApply();
            }, function () {
                if ($scope.groupSetType == 'firstGroupSet') {
                    $state.go('export');
                } else {
                    $state.go('exportSecond');
                }
            });
        }
        //Function to save Question sets in the group
        $scope.saveGroupSet = function () {
            var rootRef = firebase.database().ref();
            var updates = {};
            var Sets = angular.copy($scope.dragArray);
            var updateStr = '/Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $scope.GroupSetKey;
            if ($scope.groupSetType == 'secondGroupSet') {
                updateStr += '/subgroupsets/' + $scope.subSetKey;
            }

            updates[updateStr + '/QuestionSets'] = Sets;
            rootRef.update(updates).then(function () {
                $rootScope.success('Question Sets are imported successfully!')
                $rootScope.safeApply();
            });
        }
    }

})();