(function () {
    angular
        .module('myApp')
        .controller('editGroupController', editGroupController)
    editGroupController.$inject = ['$state', '$scope', '$rootScope', 'dragulaService', '$mdDialog', '$filter'];
    function editGroupController($state, $scope, $rootScope, dragulaService, $mdDialog, $filter) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        var scroll = autoScroll([document.querySelector('.left-box')], {
            margin: 30,
            maxSpeed: 10,
            scrollWhenOutside: true,
            autoScroll: function () {
                //Only scroll when the pointer is down
                return this.down
            }
        });

        dragulaService.options($scope, 'drag-div', {
            removeOnSpill: false
        });

        $rootScope.safeApply();

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
            $scope.groupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey);
            $scope.groupRef.on('value', function (snapshot) {
                var groupData = snapshot.val() || {};
                $scope.dragArray = [];
                $scope.enableFirstQuestion = groupData.enableFirstQuestion;
                $scope.setsInGroup = groupData.QuestionSets || {};
                groupData.sections = groupData.sections || {};
                for (var key in $scope.setsInGroup) {
                    $scope.dragArray.push(angular.copy($scope.setsInGroup[key]));
                }
                for (var key in groupData.sections) {
                    $scope.dragArray.push(angular.copy(groupData.sections[key]));
                }
                $scope.dragArray = $filter('orderBy')($scope.dragArray, 'order');
                $scope.groupData = groupData
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

        $scope.showInactive = function (type) {
            if ($rootScope.settings.showSetOption != type) {
                return 'inactive';
            }
        }

        $scope.setInactive = function (enabled) {
            if (!enabled) {
                return 'inactive';
            }
        }
        $scope.changeEnable = function () {
            $scope.enableFirstQuestion = !$scope.enableFirstQuestion;
            $rootScope.safeApply();
        }
        $scope.changeShow = function (value) {
            $rootScope.setData('showSetOption', value);
            $rootScope.safeApply();
        }

        $scope.chipChanged = function () {
            if ($rootScope.selectedTags.length == 0) {
                for (const setKey in $scope.questionSetLists) {
                    $scope.questionSetLists[setKey].visibleBytag = true;
                }
            } else {
                for (const setKey in $scope.questionSetLists) {
                    $scope.questionSetLists[setKey].visibleBytag = false;
                    //search by name
                    var low_name = $scope.questionSetLists[setKey].setname.toLowerCase();
                    for (const tagIndex in $rootScope.selectedTags) {
                        var low = $rootScope.selectedTags[tagIndex].name.toLowerCase();
                        if (low_name.indexOf(low) != -1) {
                            $scope.questionSetLists[setKey].visibleBytag = true;
                            break;
                        }
                    }
                    if ($scope.questionSetLists[setKey].visibleBytag) continue;

                    //search by tags
                    if ($scope.questionSetLists[setKey].tags == undefined) continue;
                    var setTagArray = $scope.questionSetLists[setKey].tags.toLowerCase().split(',');
                    for (const tagIndex in $rootScope.selectedTags) {
                        var low = $rootScope.selectedTags[tagIndex].name.toLowerCase();
                        if (setTagArray.indexOf(low) != -1) {
                            $scope.questionSetLists[setKey].visibleBytag = true;
                            break;
                        }
                    }
                }
            }
            $rootScope.safeApply();
        }
        //add set to group
        $scope.addtogroup = function (set) {
            if ($scope.setsInGroup[set.key]) return;
            var lastIndex = $scope.dragArray.length;
            $scope.setsInGroup[set.key] = { key: set.key, setname: set.setname };
            $scope.dragArray[lastIndex] = { key: set.key, setname: set.setname };
            if (set.LikertType) {
                $scope.setsInGroup[set.key].LikertType = true;
                $scope.setsInGroup[set.key].siblingSetKey = set.siblingSetKey || {};
                $scope.dragArray[lastIndex].LikertType = true;
                $scope.dragArray[lastIndex].siblingSetKey = set.siblingSetKey || {};
            }
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
            $rootScope.setData('baseBackUrl', "editGroup");
            $rootScope.setData('selectedQuestionTab', 'question');
            $state.go('questionsInSet');
        }
        $scope.removefromgroup = function (ev, set) {
            if (!confirm("Are you sure want to remove this questionset from group?")) {
                return;
            }
            // Appending dialog to document.body to cover sidenav in docs app
            var confirmDialog = $mdDialog.confirm(
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

            $mdDialog.show(confirmDialog).then(function () {
                $scope.questionSetLists[set.key].existInGroup = false;
                delete $scope.setsInGroup[set.key];
                $scope.dragArray.splice($scope.dragArray.indexOf(set), 1);
                $rootScope.safeApply();
            }, function () {
                $rootScope.setData('groupSetKey', undefined);
                $rootScope.safeApply();
                $state.go('export');
            });



        }

        // =============================  section functions ======================================
        $scope.showSectionModal = function () {
            $scope.sectionTitle = "";
            $scope.sectionDetails = "";
            $scope.isEditSection = false;
            $('#creteSectionModal').modal({ backdrop: 'static', keyboard: false });
        }
        $scope.editSection = function (section) {
            $scope.sectionTitle = section.setname;
            $scope.sectionDetails = section.details || '';
            $scope.selectedSectionKey = section.key;
            $scope.isEditSection = true;
            $('#creteSectionModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.createSection = function () {
            if (!$scope.sectionTitle) {
                $rootScope.warning("Please input section title.");
                return;
            }
            if (!confirm("Are you sure want to create this section?")) return;

            var sectionRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/sections').push();
            var section = {
                key: sectionRef.key,
                setname: $scope.sectionTitle,
                details: $scope.sectionDetails ? $scope.sectionDetails : {},
                isSection: true,
            }

            sectionRef.set(section).then(function () {
                $rootScope.success("New Section created successfully!");
                $('#creteSectionModal').modal('hide');
            });

        }
        $scope.updateSection = function () {
            if (!$scope.sectionTitle) {
                $rootScope.warning("Please input section title.");
                return;
            }
            if (!confirm("Are you sure want to update section data?")) return;

            var sectionRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/sections/' + $scope.selectedSectionKey);
            var section = {
                key: $scope.selectedSectionKey,
                setname: $scope.sectionTitle,
                details: $scope.sectionDetails ? $scope.sectionDetails : {},
                isSection: true,
            }

            sectionRef.update(section).then(function () {
                $rootScope.success("Section data updated successfully!");
                $('#creteSectionModal').modal('hide');
            });
        }
        $scope.deleteSection = function (section) {
            if (!confirm("Are you sure want to delete this section?")) return;

            var sectionRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey + '/sections/' + section.key);
            sectionRef.set({}).then(function () {
                $rootScope.success("Section deleted successfully!");
                $('#creteSectionModal').modal('hide');
            });
        }
        //------------------------------------------------------------------------------------------

        //Function to save Question sets in the group
        $scope.saveGroupSet = function () {
            var groupRef = firebase.database().ref('/Groups/' + $rootScope.settings.groupKey);
            var sets = {}
            var sections = {}
            $scope.dragArray.forEach((Obj, index) => {
                var set = angular.copy(Obj)
                set.order = index
                set.hidden = set.hidden ? set.hidden : {}
                if (set.isSection) {
                    sections[set.key] = set
                } else {
                    sets[set.key] = set
                }
            });

            var updates = {};
            updates['/QuestionSets'] = sets
            updates['/sections'] = sections
            updates['/enableFirstQuestion'] = $scope.enableFirstQuestion ? $scope.enableFirstQuestion : {}

            groupRef.update(updates).then(function () {
                $rootScope.success('Group Data saved successfully!');
            });
        }
    }
})();