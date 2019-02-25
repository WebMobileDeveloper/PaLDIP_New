(function () {
    angular
        .module('myApp')
        .controller('groupSecondRootController', groupSecondRootController)

    groupSecondRootController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function groupSecondRootController($state, $scope, $rootScope, $filter) {
        // **************   router:    groupSecondRoot  *****************


        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'groupSubRoot');
        $rootScope.setData('selectedMenu', 'group');
        $rootScope.setData('groupType', 'second');

        $scope.groupKey = $rootScope.settings.groupKey;
        $scope.groupSetKey = $rootScope.settings.groupSetKey;
        $scope.subIndex = $rootScope.settings.subIndex;
        $scope.subSetKey = $rootScope.settings.subSetKey;
        $scope.secondIndex = $rootScope.settings.secondIndex;
        $scope.pageSetting = $rootScope.settings.secondPageSetting;

        $scope.$on('$destroy', function () {
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
            if ($scope.linkRef) $scope.linkRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.setRef) $scope.setRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
            if ($scope.hideRef) $scope.hideRef.off('value')

            $rootScope.setData('subPageSetting', $scope.pageSetting);
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getGroup();
            $scope.getLinks();
            $scope.getQuestionSets();
            $scope.getQuestions();
            // $scope.getHideState();
        }
        $scope.getGroup = function () {
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey
                + '/groupsets/' + $scope.groupSetKey);
            $scope.subGroupRef.on('value', function (snapshot) {
                $scope.groupset = snapshot.val();
                $scope.subSet = $scope.groupset.subgroupsets[$scope.subSetKey];
                $scope.groupData = $scope.groupset.data.groups[$scope.subIndex].subgroupsets[$scope.subSetKey].groups[$scope.secondIndex];
                $scope.groupData.name = $scope.groupData.name || $scope.subSet.name + " " + ($scope.secondIndex + 1);
                $rootScope.setData('secondGroupName', $scope.groupData.name);
                $scope.ref_1 = true;
                $scope.finalCalc();
            });
        }
        $scope.getLinks = function () {
            $scope.linkRef = firebase.database().ref('Links');
            $scope.linkRef.on('value', function (snapshot) {
                $scope.links = {};
                $scope.allLinks = snapshot.val() || {}
                for (key in $scope.allLinks) {
                    let link = $scope.allLinks[key];
                    if (link.groupKey == $scope.groupKey && link.groupType == 'second' && link.groupSetKey == $scope.groupSetKey && link.subSetKey == $scope.subSetKey) {
                        if (link.linkType == 'set') {
                            $scope.links[link.setKey] = link;
                        } else {         //    link.linkType == 'question'
                            $scope.links[link.questionKey] = link;
                        }
                    }
                }
                $scope.ref_2 = true;
                $scope.finalCalc();
            });
        }
        $scope.getQuestionSets = function () {
            $scope.setRef = firebase.database().ref('QuestionSets');
            $scope.setRef.on('value', function (snapshot) {
                $scope.allQuestionSets = snapshot.val() || {}
                $scope.ref_3 = true;
                $scope.finalCalc();
            });
        };
        $scope.getQuestions = function () {
            $scope.qstRef = firebase.database().ref('Questions');
            $scope.qstRef.on('value', function (snapshot) {
                $scope.allQuestions = {}
                if (snapshot.val()) {
                    for (key in snapshot.val()) {
                        let question = snapshot.val()[key];
                        if (['Slide Type', 'Answer Type', 'External Activity'].indexOf(question.questionType) > -1) continue;
                        if (question.hideBy && question.hideBy != $rootScope.settings.teacherId) continue;
                        $scope.allQuestions[question.Set] = $scope.allQuestions[question.Set] || {}
                        $scope.allQuestions[question.Set][key] = question;
                    }
                }
                $scope.ref_4 = true;
                $scope.finalCalc();
            });
        };
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return;
            $scope.QuestionSets = [];
            $scope.QuestionsByType = [];
            QUESTION_TYPES.forEach(type => {
                let item = {
                    key: type.replace(/ /g, '_'),
                    setname: type,
                    questions: [],
                    isExportAll: (type == 'Answer Type' || type == 'External Activity' || type == 'Likert Type') ? false : true,
                }
                $scope.QuestionsByType.push(item);
                $scope.pageSetting.expand[item.key] = $scope.pageSetting.expand[item.key] || false;
            });
            $scope.subSet.QuestionSets = $scope.subSet.QuestionSets || []
            $scope.subSet.QuestionSets.forEach((set, setIndex) => {
                set.setname = $scope.allQuestionSets[set.key].setname;
                // =====  item data========
                set.questions = [];
                $scope.pageSetting.expand[set.key] = $scope.pageSetting.expand[set.key] || false;
                // set.hideQuestions = $scope.allHideQuestions[set.key] || {}


                // ------------------------
                let setKey = set.siblingSetKey ? set.siblingSetKey : set.key
                let setQuestions = $filter('orderBy')(Object.values($scope.allQuestions[setKey] || {}), 'order');

                if (set.LikertType) {
                    set.code = setQuestions.length > 0 ? setQuestions[0].code : '';
                    var childData = {
                        code: set.code,
                        setname: set.setname,
                        Set: set.key,
                        question: '*************** likert QuestionSet ***************',
                        questionType: 'Likert Type',
                        siblingSetKey: set.siblingSetKey,
                        disabled: set.DisabledQuestions,
                        setIndex: setIndex,
                    }
                    set.questions.push(childData);
                    $scope.QuestionsByType[QUESTION_TYPES.indexOf('Likert Type')].questions.push(childData);
                } else {
                    set.DisabledQuestions = set.DisabledQuestions || {}
                    setQuestions.forEach(question => {
                        // if (question.questionType == 'Text Type' || question.questionType == 'Feedback Type') {
                        //     $scope.allQstForFinal[question.code] = angular.copy(question)
                        // }
                        question.setname = set.setname;
                        question.disabled = Object.keys(set.DisabledQuestions).indexOf(question.code) > -1 ? true : false;
                        question.setIndex = setIndex;
                        // question.hide = set.hideQuestions[question.code] ? true : false
                        $scope.QuestionsByType[QUESTION_TYPES.indexOf(question.questionType)].questions.push(question);
                    });
                    set.questions = setQuestions;
                }
                $scope.QuestionSets.push(set);
            });
            $scope.sortChanged();
            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }
        // ---------------------------------------------------------

        //  =========== expand all function =======================
        $scope.expandAll = function () {

            for (key in $scope.pageSetting.expand) {
                $scope.pageSetting.expand[key] = $scope.pageSetting.expandAll;
            }
            $scope.pageSetting.expandAll = !$scope.pageSetting.expandAll;
            $rootScope.safeApply();
        }
        // ===========sort change function=========================
        $scope.sortChanged = function () {
            $scope.items = $scope.pageSetting.sort ? $scope.QuestionSets : $scope.QuestionsByType;
            $rootScope.safeApply();
        }

        $scope.toggleQuestions = function (item_key) {
            $scope.pageSetting.expand[item_key] = !$scope.pageSetting.expand[item_key];
            $scope.selectItem(item_key);
            $rootScope.safeApply();
        }
        $scope.selectItem = function (item_key) {
            if ($scope.pageSetting.sort) {
                if ($scope.pageSetting.setKey != item_key) {
                    $scope.pageSetting.setKey = item_key;
                    $scope.pageSetting.questionKey = undefined;
                }
            } else {
                if ($scope.pageSetting.itemKey != item_key) {
                    $scope.pageSetting.itemKey = item_key;
                    $scope.pageSetting.questionKey = undefined;
                }
            }
            $rootScope.safeApply();
        }
        $scope.selectQuestion = function (question) {
            let key = question.questionType == 'Likert Type' ? question.Set : question.code;
            $scope.pageSetting.questionKey = key;
            $scope.pageSetting.setKey = question.Set;
            $scope.pageSetting.itemKey = question.questionType.replace(/ /g, '_');
            $rootScope.safeApply();
        }
        $scope.getQstActive = function (item, question) {
            let key = question.questionType == 'Likert Type' ? question.Set : question.code;
            if ((item.key == $scope.pageSetting.setKey || item.key == $scope.pageSetting.itemKey) && key == $scope.pageSetting.questionKey) return 'active';
            return '';
        }
        // --------------------------------------------------------



        // ================== questionset Hidden state  function=================================
        $scope.changeHideState = function (set, index) {
            $scope.selectItem(set.key);
            var hidden = set.hidden ? {} : true
            firebase.database().ref('/Groups/' + $scope.groupKey + '/groupsets/' + $scope.groupSetKey +
                '/subgroupsets/' + $scope.subSetKey + '/QuestionSets/' + index + '/hidden')
                .set(hidden).then(function () {
                    $rootScope.success("Questionset hide state changed successfully!")
                });
        }
        // -------------------------------------------------------------

        // ===============  export functions =============================
        $scope.exportQuestionDatas = function (obj, type) {
            $rootScope.setData('question', obj);
            $scope.selectQuestion(obj);
            if (type == 'Likert Type') {
                $state.go('exportLikertToExcel');
            } else if (type == 'Rating Type') {
                $state.go('exportRatingToExcel');
            } else {
                $state.go('exportToExcel');
            }
        }
        $scope.exportAllQuestionDatas = function (item) {
            $rootScope.setData('exportItem', item);
            switch (item.key) {
                case 'Rating_Type':
                    $state.go('ratingToExcelAll');
                    break;
                case 'Contingent_Type':
                    $state.go('contingentToExcelAll');
                    break;
                default:
                    $state.go('exportToExcelAll');
                    break;
            }
        }
        // ---------------------------------


        // ==========   response functions  ==============
        $scope.showResponse = function (question) {
            $rootScope.setData('question', question);
            $scope.selectQuestion(question);
            switch (question.questionType) {
                case 'Likert Type':
                    $state.go('groupResponseOfLikertAnswer');
                    break;
                case "Dropdown Type":
                    $state.go('groupResponseOfDropdownAnswer');
                    break;
                case "Multiple Type":
                    $state.go('groupResponseOfMultipleAnswer');
                    break;
                case "Contingent Type":
                    $state.go('groupResponseOfContingentAnswer');
                    break;
                case "Feedback Type":
                    $state.go('groupResponseOfFeedbackAnswer');
                    break;
                case "Rating Type":
                    $state.go('groupResponseOfRatingAnswer');
                    break;
                default:
                    $state.go('groupResponseOfAnswer');
                    break;
            }
        }
        // ---------------------------------------------------------------------


        //=================  disable/enable show result =================
        $scope.disableView = function (question) {
            $scope.selectQuestion(question);
            var disabled = question.disabled ? {} : true
            var disableRef = firebase.database().ref('Groups/' + $scope.groupKey + '/groupsets/' +
                $scope.groupSetKey + '/subgroupsets/' + $scope.subSetKey + '/QuestionSets/' + question.setIndex + '/DisabledQuestions/')
            if (question.questionType == 'Likert Type') {
                disableRef.set(disabled);
            } else {
                disableRef.child(question.code).set(disabled);
            }
        }
        // -----------------------------------------------------------


        // ============link functions==================
        $scope.addLink = function (question) {
            $scope.selectQuestion(question);
            var link = {
                teacherId: $rootScope.settings.teacherId,
                groupKey: $scope.groupKey,
                setKey: question.Set,
                questionType: question.questionType,
                linkType: question.questionType == 'Likert Type' ? 'set' : 'question',
                questionKey: question.questionType == 'Likert Type' ? {} : question.code,
                groupType: 'second',
                groupSetKey: $scope.groupSetKey,
                subSetKey: $scope.subSetKey,
                key: $scope.getLinkCode(),
            };
            firebase.database().ref('Links/' + link.key).set(link);
        }
        $scope.copyToClipboard = function (question) {
            $scope.selectQuestion(question);
            let key = question.questionType == 'Likert Type' ? question.Set : question.code;
            let linkKey = $scope.links[key].key;
            linkKey = window.location.origin + '/directLink/' + linkKey;
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(linkKey).select();
            document.execCommand("copy");
            $temp.remove();
        }
        $scope.deletelink = function (question) {
            $scope.selectQuestion(question);
            let key = question.questionType == 'Likert Type' ? question.Set : question.code;
            let linkKey = $scope.links[key].key;
            firebase.database().ref('Links/' + linkKey).set({});
        }
        $scope.getLinkCode = function () {
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
        // --------------------------------------------------------------------------
    }
})();