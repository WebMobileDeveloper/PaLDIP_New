(function () {

    angular
        .module('myApp')
        .controller('TeacherQuestionController', TeacherQuestionController)

    TeacherQuestionController.$inject = ['$state', '$scope', '$rootScope'];

    function TeacherQuestionController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacher");
        $rootScope.setData('selectedMenu', 'question');
        $rootScope.safeApply();
        function merge_array(array1, array2) {
            var result_array = [];
            var arr = array1.concat(array2);
            var len = arr.length;
            var assoc = {};

            while (len--) {
                var item = arr[len];

                if (!assoc[item]) {
                    result_array.unshift(item);
                    assoc[item] = true;
                }
            }

            return result_array;
        }

        $scope.$on('$destroy', function () {
            if ($scope.teachersRef) $scope.teachersRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.setsRef) $scope.setsRef.off('value')
            if ($scope.qstsRef) $scope.qstsRef.off('value')

        })

        $scope.init = function () {
            $rootScope.setData("loadingfinished", false)
            $scope.getTeachers();
            $scope.getUsedSets();
            $scope.getQuesionSets();
            $scope.getQuesions();
        }

        $scope.getTeachers = function () {
            $scope.teachersRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Teacher');
            $scope.teachersRef.on('value', function (snapshot) {
                $scope.Teachers = snapshot.val() || {};
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }

        $scope.getUsedSets = function () {
            $scope.groupRef = firebase.database().ref('Groups').orderByChild('teacherKey').equalTo($rootScope.settings.userId);
            $scope.groupRef.on('value', function (snapshot) {
                var myGroups = snapshot.val() || {};
                $scope.usedSetKeys = []
                for (groupKey in myGroups) {
                    var QuestionSets = myGroups[groupKey].QuestionSets || {}
                    $scope.usedSetKeys = merge_array($scope.usedSetKeys, Object.keys(QuestionSets))
                }
                $scope.ref_2 = true
                $scope.finalCalc()
            })
        }

        $scope.getQuesionSets = function () {
            $scope.setsRef = firebase.database().ref('QuestionSets');
            $scope.setsRef.on('value', function (snapshot) {
                $scope.allSets = snapshot.val() || {};
                $scope.ref_3 = true
                $scope.finalCalc()
            })
        }

        $scope.getQuesions = function () {
            $scope.qstsRef = firebase.database().ref('Questions');
            $scope.qstsRef.on('value', function (snapshot) {
                $scope.allQuestions = snapshot.val() || {};
                $scope.ref_4 = true
                $scope.finalCalc()
            })
        }


        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return

            if (!$scope.setList) $scope.setList = {};
            for (setKey in $scope.allSets) {
                let set = angular.copy($scope.allSets[setKey])
                let createdByMe = ($rootScope.settings.userId == set.creator) ? true : false;
                let usedBefore = ($scope.usedSetKeys.indexOf(setKey) > -1) ? true : false;

                set.sharedTeachers = set.sharedTeachers || {}
                set.shared = (Object.keys(set.sharedTeachers).indexOf($rootScope.settings.userId) > -1) ? true : false
                if (!$scope.setList[setKey]) {
                    if (createdByMe || usedBefore || (!set.isDraft && !set.private || set.shared)) {
                        set.createdByMe = createdByMe;
                        set.usedBefore = usedBefore;
                        set.isShown = false;
                        set.byTag = false;
                        set.byQCode = false;
                        set.bySCode = false;
                        set.bySName = false;
                        set.creatorEmail = $scope.Teachers[set.creator].ID;
                        set.nick_name = $scope.Teachers[set.creator].nick_name;
                        $scope.setList[setKey] = set;
                    }
                } else {
                    set.createdByMe = createdByMe;
                    set.usedBefore = usedBefore;
                    set.isShown = $scope.setList[setKey].isShown;
                    set.byTag = $scope.setList[setKey].byTag;
                    set.byQCode = $scope.setList[setKey].byQCode;
                    set.bySCode = $scope.setList[setKey].bySCode;
                    set.bySName = $scope.setList[setKey].bySName;
                    set.creatorEmail = $scope.Teachers[set.creator].ID;
                    set.nick_name = $scope.Teachers[set.creator].nick_name;
                    $scope.setList[setKey] = set;
                }
            }
            for (setKey in $scope.setList) {
                if (!$scope.allSets[setKey]) {
                    delete $scope.setList[setKey];
                }
            }
            $scope.chipChanged()
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }

        $scope.getShowState = function (setKey) {
            if (!$scope.setList[setKey].isShown) return false

            switch ($rootScope.settings.showSetOption) {
                case 'ByMe':
                    return $scope.setList[setKey].createdByMe;
                case 'Used':
                    return $scope.setList[setKey].usedBefore;
                case 'ByOther':
                    return !$scope.setList[setKey].createdByMe;
            }
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
        $scope.chipChanged = function () {

            for (const setKey in $scope.setList) {
                let set = $scope.setList[setKey];
                if (!set.tags) set.tags = ""
                let setTagArray = set.tags.toLowerCase().split(',');
                let lowsetname = set.setname.toLowerCase();

                if ($rootScope.selectedTags.length == 0) {
                    set.isShown = true;
                    set.byTag = false;
                    set.byQCode = false;
                    set.bySCode = false;
                    set.bySName = false;
                } else {
                    let isShown = false;
                    let byTag = false;
                    let byQCode = false;
                    let bySCode = false;
                    let bySName = false;

                    for (i = 0; i < $rootScope.selectedTags.length; i++) {
                        let tag = $rootScope.selectedTags[i].name
                        let low = tag.toLowerCase()
                        if (!byTag && setTagArray.indexOf(low) != -1) {
                            isShown = true;
                            byTag = true;
                        }

                        if ($scope.allQuestions[tag] && $scope.allQuestions[tag].Set == set.key) {
                            isShown = true;
                            byQCode = true;
                        }
                        if (set.key == tag) {
                            isShown = true;
                            bySCode = true;
                        }
                        if (!bySName && lowsetname.indexOf(low) != -1) {
                            isShown = true;
                            bySName = true;
                        }
                    }
                    set.isShown = isShown;
                    set.byTag = byTag;
                    set.byQCode = byQCode;
                    set.bySCode = bySCode;
                    set.bySName = bySName;
                }
            }
            $rootScope.safeApply();
        }
        $scope.showQuestionsInSet = function (set) {
            $rootScope.setData('setData', set)
            $rootScope.setData('createdByMe', set.createdByMe);
            $rootScope.setData('creatorEmail', set.creatorEmail);
            $rootScope.setData('creatorNickName', set.nick_name);
            $rootScope.setData('questionSetKey', set.key);
            $rootScope.setData('baseBackUrl', "teacherQuestion");
            $rootScope.setData('selectedQuestionTab', 'question');
            $state.go('questionsInSet');
        }
        $scope.choiceExportGroup = function () {
            if ($rootScope.teacherSettings.export_enabled) {
                $rootScope.warning("Sorry, You didn't enabled for export function");
                return;
            } else {
                $state.go('choiceExportGroup');
            }
        }

    }

})();