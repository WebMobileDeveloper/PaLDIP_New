(function () {

    angular
        .module('myApp')
        .controller('LikertViewController', LikertViewController)

    LikertViewController.$inject = ['$state', '$scope', '$rootScope', '$sce', '$filter'];

    function LikertViewController($state, $scope, $rootScope, $sce, $filter) {
        $rootScope.setData('showMenubar', true);
        if ($rootScope.setData.showResponse) {
            $rootScope.setData('backUrl', "likertAnswer");
        } else {
            $rootScope.setData('backUrl', "studentGroupDetail");
        }

        $scope.setKey = $rootScope.settings.questionSetKey;
        $scope.origin_groupKey = $rootScope.settings.origin_groupKey ? $rootScope.settings.origin_groupKey : '';
        $scope.versionIndex = 0;
        var colors = ['#0000FF', '#FF0000', '#00FF00', '#FFFF00', '#FF00FF', '#FF8080', '#808080', '#C2B280', '#800000', '#FF8000', '#803E75', '#A6BDD7', '#817066', '#007D34',
            '#00538A', '#53377A', '#B32851', '#593315', '#232C16', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26', '#0000FF', '#FF0000', '#00FF00', '#FF00FF', '#000000'];
        // $scope.newColors = colors
        // $scope.newcolors = ['#0000FF', '#FF0000', '#00FF00', '#FFFF00', '#FF00FF', '#FF8080', '#808080', '#C2B280', '#800000', '#FF8000', '#803E75', '#A6BDD7', '#817066', '#007D34',
        //     '#00538A', '#53377A', '#B32851', '#593315', '#232C16', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26', '#000000'];
        // $scope.kelly_colors = ['#F2F3F4', '#222222', '#F3C300', '#875692', '#F38400', '#A1CAF1', '#BE0032', '#C2B280', '#848482', '#008856', '#E68FAC', '#0067A5', '#F99379',
        //     '#604E97', '#F6A600', '#B3446C', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26']

        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($scope.infoRef) $scope.infoRef.off('value')
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.groupDataRef) $scope.groupDataRef.off('value')
            if ($scope.allSetsRef) $scope.allSetsRef.off('value')

            if ($scope.qstRef) $scope.qstRef.off('value')
            if ($scope.siblingQstRefs) {
                for (var i = 0; i < $scope.siblingQstRefs.length; i++)
                    $scope.siblingQstRefs[i].off('value')
            }
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.groupChoice = $scope.groupChoice ? $scope.groupChoice : 'all';
            $scope.getAllUser();
            $scope.getstGroups();
            $scope.getGroupData()
            $scope.getVersionGroups()
        }

        $scope.getAllUser = function () {
            $scope.userRef = firebase.database().ref('Users');
            $scope.userRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val()
                $scope.ref_1 = true
                $scope.finalFunc()
            })
        }
        $scope.getstGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (snapshot) {
                $scope.allStGroups = snapshot.val() || {}
                $scope.ref_2 = true
                $scope.finalFunc()
            })
        }
        $scope.getGroupData = function () {
            $scope.groupDataRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey)
            $scope.groupDataRef.on('value', function (snapshot) {
                $scope.groupData = snapshot.val()
                var QuestionSets = [];
                if ($scope.groupData.QuestionSets) {
                    for (var key in $scope.groupData.QuestionSets) {
                        if (!$scope.groupData.QuestionSets[key].hidden) {
                            QuestionSets.push($scope.groupData.QuestionSets[key]);
                        }
                    }
                }
                QuestionSets = $filter('orderBy')(QuestionSets, 'order');

                $scope.groupData.QuestionSetArr = QuestionSets;

                var set = $scope.groupData.QuestionSets[$scope.setKey]
                $scope.groupSiblingSetKeys = []
                if (set.siblingSetKey) {
                    $scope.groupData.QuestionSetArr.forEach(obj => {
                        if (obj.siblingSetKey == set.siblingSetKey && set.key != obj.key) {
                            $scope.groupSiblingSetKeys.push(obj.key)
                        }
                    });
                }

                $scope.groupLikertSettings = {
                    showVersion: false,
                    showOther: true,
                    showScore: true,
                    showUniqueId: false,
                }
                if ($scope.groupData.groupLikertSettings && $scope.groupData.groupLikertSettings.group && $scope.groupData.groupLikertSettings.group[$scope.setKey]) {
                    let setSetting = $scope.groupData.groupLikertSettings.group[$scope.setKey]
                    if (setSetting.hideOthers) $scope.groupLikertSettings.showOther = false
                    if (setSetting.showUniqueId) $scope.groupLikertSettings.showUniqueId = true
                    if (setSetting.hideScore) $scope.groupLikertSettings.showScore = false
                    if (setSetting.showVersion) $scope.groupLikertSettings.showVersion = true;
                }
                $scope.getSetData()
            })
        }

        $scope.getSetData = function () {
            // $rootScope.settings.siblingSetKey = undefined
            var set = $scope.groupData.QuestionSets[$scope.setKey]
            if (set.siblingSetKey) {
                $scope.allSetsRef = firebase.database().ref('QuestionSets/').orderByChild('siblingSetKey').equalTo(set.siblingSetKey)
            } else {
                $scope.allSetsRef = firebase.database().ref('QuestionSets/').orderByKey().equalTo($scope.setKey)
            }
            if ($scope.allSetsRef) $scope.allSetsRef.off('value')
            $scope.allSetsRef.on('value', function (snapshot) {
                var allSets = snapshot.val() || {}

                $scope.currSet = allSets[$scope.setKey]

                if ($scope.currSet.result_videoID) {
                    $scope.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.currSet.result_videoID + "?rel=0&enablejsapi=1");
                    $rootScope.removeRecommnedVideo()
                }

                $scope.siblingSetKey = $scope.currSet.siblingSetKey

                $scope.firstSiblingKey = $scope.currSet.siblingSetKey ? $scope.currSet.siblingSetKey : $scope.setKey
                $scope.firstSet = allSets[$scope.firstSiblingKey]

                //===========================get siblingSetKeys by (exist in group) and (show state) and order
                $scope.siblingSets = []
                $scope.siblingKeys = []

                $scope.currSet.siblingSetOrders = $scope.currSet.siblingSetOrders || {}

                var tempKeys = []
                $scope.groupSiblingSetKeys.forEach((key, index) => {
                    if ($scope.currSet.siblingSetOrders[key] && $scope.currSet.siblingSetOrders[key].show) {
                        tempKeys.push({ key: key, order: $scope.currSet.siblingSetOrders[key].order })
                    }
                });
                tempKeys = $filter('orderBy')(tempKeys, 'order');

                tempKeys.forEach(item => { $scope.siblingKeys.push(item.key) });
                //---------------------------end of  get siblingSetKeys by (exist in group) and (show state) and order


                //===========================get siblingSets by siblingSetKeys

                $scope.siblingKeys.forEach(key => {
                    var setData = allSets[key]
                    if (setData.yScaleType == undefined) {
                        setData.yScaleType = 'Fixed';
                    }
                    $scope.siblingSets.push(setData)
                });

                // global set data(first sibling set's data)
                $scope.labels = $scope.firstSet.labels || {}
                $scope.options = $scope.firstSet.options || []
                $scope.optionScores = $scope.firstSet.optionScores
                if (!$scope.optionScores) {
                    $scope.optionScores = [];
                    for (var i = 0; i < $scope.options.length; i++) {
                        $scope.optionScores.push(i + 1);
                    }
                }
                $scope.method = $scope.firstSet.method ? $scope.firstSet.method : 'Sum'
                $scope.optionCount = $scope.firstSet.optionCount || 0
                $scope.yLabel = $scope.firstSet.yLabel ? $scope.firstSet.yLabel : 'Score'
                $scope.subscales = $scope.firstSet.subscales
                $scope.superscales = $scope.firstSet.superscales
                $scope.ref_3 = true
                $scope.finalFunc()
            });
        }

        $scope.getVersionGroups = function () {
            $scope.versionGroupsRef = firebase.database().ref('Groups').orderByChild('origin_groupKey').equalTo($scope.origin_groupKey)
            $scope.versionGroupsRef.on('value', (snapshot) => {
                $scope.allVersionGroups = snapshot.val() || {}

                $scope.ref_4 = true
                $scope.finalFunc()
            })
        }
        $scope.finalFunc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return

            if ($scope.subscales == undefined) {
                $scope.title = [];
                $scope.graphData = [];
                $scope.paintgraph();
            } else {
                if ($scope.superscales) {
                    $scope.subscales = Object.assign({}, $scope.subscales, $scope.superscales);
                }
            }
            $scope.versionGroups = [{
                groups: [],
                students: [],
                answers: [undefined],
                counts: [0],
                name: "All Version Classes",
            }]
            for (groupKey in $scope.allVersionGroups) {
                if (groupKey == $rootScope.settings.groupKey) continue
                let group = $scope.allVersionGroups[groupKey]
                let QuestionSets = group.QuestionSets || {}
                if (QuestionSets[$scope.setKey]) {
                    $scope.versionGroups[0].groups.push(groupKey)
                    $scope.versionGroups.push({
                        groups: [groupKey],
                        students: [],
                        name: group.groupname,
                    });
                }
            }

            $scope.studentsInGroup = [];
            for (var studentKey in $scope.allStGroups) {
                var stGroups = Object.values($scope.allStGroups[studentKey]);

                if (stGroups.indexOf($rootScope.settings.groupKey) > -1) {
                    $scope.studentsInGroup.push(studentKey);
                } else {
                    $scope.versionGroups.forEach(vg => {
                        vg.groups.forEach(VGK => {
                            if (stGroups.indexOf(VGK) > -1) {
                                vg.students.push(studentKey);
                            }
                        });
                    });
                }
            }

            $scope.subscaleKeys = Object.keys($scope.subscales).sort(function (a, b) {
                return $scope.subscales[a].order - $scope.subscales[b].order;
            })
            $scope.subscaleKeys.unshift("");
            $scope.subscaleKeys.push("");
            $scope.scaleQKeys = [];   //subscaleQuestionKeys[scale index][questions]
            $scope.reversedScaleQKeys = [];   //subscaleQuestionKeys[scale index][questions]
            $scope.title = [""];

            $scope.subscaleKeys.forEach(function (key) {
                if (key) {
                    var scale = $scope.subscales[key];
                    $scope.title.push((scale.title).split(' '));
                    if (scale.questions) {              //if subscale
                        $scope.scaleQKeys.push(scale.questions);
                    } else {
                        $scope.scaleQKeys.push([]);
                    }

                    if (scale.reversed) {
                        $scope.reversedScaleQKeys.push(scale.reversed);
                    } else {
                        $scope.reversedScaleQKeys.push([]);
                    }
                }
            });
            $scope.title.push("");
            $scope.calcValues = [];
            $scope.userKeys = [];
            $scope.labels = [];
            $scope.colors = [];
            $scope.pointStyles = [];
            $scope.radiuses = [];
            $scope.setNames = []

            var xLength = $scope.subscaleKeys.length + 2
            var qstNum = 1

            $scope.siblingQstRefs = []
            for (var i = 0; i < $scope.siblingSets.length; i++) {
                $scope.setNames.push("QS" + qstNum + " : " + $scope.siblingSets[i].setname)
                $scope.calcValues.push(Array(xLength).fill(undefined))
                $scope.calcValues.push(Array(xLength).fill(undefined))
                $scope.userKeys.push(Array(xLength).fill("Your Score"));
                $scope.userKeys.push(Array(xLength).fill("Class Average"));
                $scope.labels.push("QS" + qstNum + " : ▲ Your Score");
                $scope.labels.push("QS" + qstNum + " : ◼ Class Average");
                $scope.colors.push(colors[i], colors[i]);
                $scope.pointStyles.push('triangle', 'rect');
                $scope.radiuses.push(7, 7);
                qstNum++

                $scope.callGetSiblingAnswer(i)
            }
            // init data for current group 
            $scope.setNames.push("QS" + qstNum + " : " + $scope.currSet.setname)


            if ($scope.qstRef) $scope.qstRef.off('value')
            $scope.qstRef = firebase.database().ref('LikertAnswer/' + $scope.setKey);
            $scope.qstRef.on('value', function (snapshot) {
                $scope.currQSTAnswers = {};
                //++++++++++++++ end of init data  +++++++++++++++++++++++++++++++++
                snapshot.forEach(userAns => {
                    $scope.currQSTAnswers[userAns.key] = userAns.val().answer
                });
                $scope.getAnswers()
            });

        }
        $scope.callGetSiblingAnswer = function (siblingSetIndex) {
            if ($scope.siblingQstRefs[siblingSetIndex]) $scope.siblingQstRefs[siblingSetIndex].off('value')
            $scope.siblingQstRefs[siblingSetIndex] = firebase.database().ref('LikertAnswer/' + $scope.siblingKeys[siblingSetIndex]);

            $scope.siblingQstRefs[siblingSetIndex].on('value', function (snapshot) {
                currQSTAnswers = {};
                //++++++++++++++ end of init data  +++++++++++++++++++++++++++++++++
                snapshot.forEach(userAns => {
                    currQSTAnswers[userAns.key] = userAns.val().answer
                });
                $scope.getSiblingAnswers(siblingSetIndex, currQSTAnswers)
            });
        }
        $scope.getSiblingAnswers = function (siblingSetIndex, currQSTAnswers) {
            //===== init Data  ============
            let classAnswers = [undefined];
            let classCounts = [0];

            $scope.subscaleKeys.forEach(function (key) {
                if (key) {
                    classCounts.push(0);
                    classAnswers.push(0);
                }
            });

            let myAnswers = [];
            var optionCount = $scope.options.length;
            for (var userId in currQSTAnswers) {
                if ($scope.studentsInGroup.indexOf(userId) < 0) {     // if user is not in mygroup 
                    continue;
                }
                var userScaleAnswers = [undefined];
                var tempUserAnswers = currQSTAnswers[userId];
                for (var scaleIndex = 0; scaleIndex < $scope.scaleQKeys.length; scaleIndex++) {
                    var qstArr = $scope.scaleQKeys[scaleIndex];
                    var reversedArr = $scope.reversedScaleQKeys[scaleIndex];
                    var allAnswered = true;
                    var sum = 0;

                    for (var qstIndex = 0; qstIndex < qstArr.length; qstIndex++) {
                        var qstKey = qstArr[qstIndex];
                        if (tempUserAnswers[qstKey] != undefined) {
                            if (reversedArr.indexOf(qstKey) > -1) {
                                if (!isNaN($scope.optionScores[optionCount - 1 - tempUserAnswers[qstKey]])) {
                                    sum += $scope.optionScores[optionCount - 1 - tempUserAnswers[qstKey]];
                                }
                            } else {
                                if (!isNaN($scope.optionScores[tempUserAnswers[qstKey]])) {
                                    sum += $scope.optionScores[tempUserAnswers[qstKey]];
                                }
                            }
                        } else {
                            allAnswered = false;
                        }
                    }

                    var calcValue = 0;

                    if (allAnswered) {                              // if answered for all subscale questions
                        if (qstArr.length > 0) {
                            if ($scope.subscales[$scope.subscaleKeys[scaleIndex + 1]].method == "Sum") {
                                calcValue = sum;
                            } else {
                                calcValue = Math.round(sum / qstArr.length * 100) / 100;
                            }
                        }
                        if ($scope.studentsInGroup.indexOf(userId) > -1) {     // if user in mygroup
                            classAnswers[scaleIndex + 1] += calcValue;
                            classCounts[scaleIndex + 1]++;
                        }
                    } else {
                        calcValue = undefined;
                    }
                    userScaleAnswers.push(calcValue);
                }
                userScaleAnswers.push(undefined);
                if (userId == $rootScope.settings.userId) {
                    myAnswers = angular.copy(userScaleAnswers);
                }
            }

            for (var i = 0; i < $scope.scaleQKeys.length; i++) {
                if (classAnswers[i + 1] > 0) {
                    classAnswers[i + 1] = Math.round(classAnswers[i + 1] / classCounts[i + 1] * 100) / 100;
                } else {
                    classAnswers[i + 1] = undefined;
                }
            }
            classAnswers.push(undefined);
            $scope.calcValues[siblingSetIndex * 2] = angular.copy(myAnswers);
            $scope.calcValues[siblingSetIndex * 2 + 1] = angular.copy(classAnswers)
            calcValues();
        }
        $scope.getAnswers = function () {

            //===== init Data  ============
            let classAnswers = [undefined];
            $scope.classCounts = [0];

            let allAnswers = [undefined];
            $scope.allCounts = [0];
            $scope.versionGroups.forEach(vg => {
                vg.answers = [undefined]
                vg.counts = [0]
            });
            $scope.subscaleKeys.forEach(function (key) {
                if (key) {
                    $scope.classCounts.push(0);
                    classAnswers.push(0);

                    allAnswers.push(0);
                    $scope.allCounts.push(0);

                    $scope.versionGroups.forEach(vg => {
                        vg.answers.push(0);
                        vg.counts.push(0);
                    });
                }
            });

            let myAnswers = [];
            let userAnswers = [];
            $scope.showIds = []
            var optionCount = $scope.options.length;
            for (var userId in $scope.currQSTAnswers) {
                var userScaleAnswers = [undefined];
                var tempUserAnswers = $scope.currQSTAnswers[userId];
                for (var scaleIndex = 0; scaleIndex < $scope.scaleQKeys.length; scaleIndex++) {
                    var qstArr = $scope.scaleQKeys[scaleIndex];
                    var reversedArr = $scope.reversedScaleQKeys[scaleIndex];
                    var allAnswered = true;
                    var sum = 0;

                    for (var qstIndex = 0; qstIndex < qstArr.length; qstIndex++) {
                        var qstKey = qstArr[qstIndex];
                        if (tempUserAnswers[qstKey] != undefined) {
                            if (reversedArr.indexOf(qstKey) > -1) {
                                if (!isNaN($scope.optionScores[optionCount - 1 - tempUserAnswers[qstKey]])) {
                                    sum += $scope.optionScores[optionCount - 1 - tempUserAnswers[qstKey]];
                                }
                            } else {
                                if (!isNaN($scope.optionScores[tempUserAnswers[qstKey]])) {
                                    sum += $scope.optionScores[tempUserAnswers[qstKey]];
                                }
                            }
                        } else {
                            allAnswered = false;
                        }
                    }

                    var calcValue = 0;

                    if (allAnswered) {                              // if answered for all subscale questions
                        if (qstArr.length > 0) {
                            if ($scope.subscales[$scope.subscaleKeys[scaleIndex + 1]].method == "Sum") {
                                calcValue = sum;
                            } else {
                                calcValue = Math.round(sum / qstArr.length * 100) / 100;
                            }
                        }
                        if ($scope.studentsInGroup.indexOf(userId) > -1) {     // if user in mygroup
                            classAnswers[scaleIndex + 1] += calcValue;
                            $scope.classCounts[scaleIndex + 1]++;
                        } else {
                            $scope.versionGroups.forEach(vg => {
                                if (vg.students.indexOf(userId) > -1) {
                                    vg.answers[scaleIndex + 1] += calcValue;
                                    vg.counts[scaleIndex + 1]++;
                                }
                            });
                        }

                        // ====== sum for all users  ===========
                        allAnswers[scaleIndex + 1] += calcValue;
                        $scope.allCounts[scaleIndex + 1]++;
                    } else {
                        calcValue = undefined;
                    }
                    userScaleAnswers.push(calcValue);
                }
                userScaleAnswers.push(undefined);
                if (userId == $rootScope.settings.userId) {
                    myAnswers = angular.copy(userScaleAnswers);
                }
                if ($scope.studentsInGroup.indexOf(userId) > -1) {     // if user is in mygroup 
                    userAnswers.push(angular.copy(userScaleAnswers));
                    $scope.showIds.push($scope.allUsers[userId].show_id)
                }
            }

            for (var i = 0; i < $scope.scaleQKeys.length; i++) {
                if (classAnswers[i + 1] > 0) {
                    classAnswers[i + 1] = Math.round(classAnswers[i + 1] / $scope.classCounts[i + 1] * 100) / 100;
                } else {
                    classAnswers[i + 1] = undefined;
                }

                if (allAnswers[i + 1] > 0) {
                    allAnswers[i + 1] = Math.round(allAnswers[i + 1] / $scope.allCounts[i + 1] * 100) / 100;
                } else {
                    allAnswers[i + 1] = undefined;
                }

                $scope.versionGroups.forEach(vg => {
                    if (vg.answers[i + 1] > 0) {
                        vg.answers[i + 1] = Math.round(vg.answers[i + 1] / vg.counts[i + 1] * 100) / 100;
                    } else {
                        vg.answers[i + 1] = undefined;
                    }
                });
            }
            classAnswers.push(undefined);
            allAnswers.push(undefined);
            $scope.versionGroups.forEach(vg => {
                vg.answers.push(undefined);
            });

            // update current set answer graph data
            var siblingCount = $scope.siblingSets.length
            var colorCount = siblingCount
            var labelCount = siblingCount * 2
            var xLength = $scope.subscaleKeys.length + 2


            $scope.calcValues[labelCount] = angular.copy(myAnswers);
            $scope.userKeys[labelCount] = Array(xLength).fill("Your Score");
            $scope.labels[labelCount] = "QS" + (siblingCount + 1) + " : ▲ Your Score";
            $scope.colors[labelCount] = colors[colorCount];
            $scope.pointStyles[labelCount] = 'triangle';
            $scope.radiuses[labelCount++] = 7;

            if (!$rootScope.settings.disabledQuestion) {
                $scope.calcValues[labelCount] = angular.copy(classAnswers)
                $scope.userKeys[labelCount] = Array(xLength).fill("Class Average");
                $scope.labels[labelCount] = "QS" + (siblingCount + 1) + " : ◼ Class Average";
                $scope.colors[labelCount] = colors[colorCount++];
                $scope.pointStyles[labelCount] = 'rect';
                $scope.radiuses[labelCount++] = 7;


                if ($scope.groupLikertSettings.showOther && $scope.groupChoice == 'all') {
                    $scope.calcValues[labelCount] = angular.copy(allAnswers);
                    $scope.userKeys[labelCount] = Array(allAnswers.length).fill("All Class Average");
                    $scope.labels[labelCount] = '◆ All collected data average score';
                    $scope.colors[labelCount] = colors[colorCount];
                    $scope.pointStyles[labelCount] = 'rectRot';
                    $scope.radiuses[labelCount++] = 7;
                }
                if ($scope.origin_groupKey && $scope.groupLikertSettings.showVersion) {
                    $scope.calcValues[labelCount] = angular.copy($scope.versionGroups[$scope.versionIndex].answers);
                    $scope.userKeys[labelCount] = Array(xLength).fill("Version Average");
                    $scope.labels[labelCount] = "⏺ Average of " + $scope.versionGroups[$scope.versionIndex].name;
                    $scope.colors[labelCount] = '#00FF00';
                    $scope.pointStyles[labelCount] = 'circle';
                    $scope.radiuses[labelCount++] = 6;
                }

                $scope.userStartNum = labelCount
                for (var i = 0; i < userAnswers.length; i++) {
                    var tempUserAnswer = angular.copy(userAnswers[i])
                    $scope.calcValues[labelCount] = tempUserAnswer;
                    $scope.userKeys[labelCount] = Array(tempUserAnswer.length).fill($scope.showIds[i]);

                    $scope.labels[labelCount] = 'range of scores in this class';
                    $scope.colors[labelCount] = colors[(colors.length - 1 - i) % colors.length];
                    $scope.pointStyles[labelCount] = 'circle';
                    $scope.radiuses[labelCount++] = 4
                }

            }
            calcValues();
        }


        calcValues = function () {

            //range of scores in cohort

            //============= get subscale answers  =============


            // calc superscale          

            for (var rowIndex = 0; rowIndex < $scope.calcValues.length; rowIndex++) {
                var rowData = $scope.calcValues[rowIndex]
                for (var colIndex = 0; colIndex < $scope.subscaleKeys.length; colIndex++) {
                    var scaleKey = $scope.subscaleKeys[colIndex];
                    if (!scaleKey) continue
                    var superscale = $scope.subscales[scaleKey]
                    if (!superscale.subscales) continue
                    var sum = 0;
                    for (var scaleIndex = 0; scaleIndex < superscale.subscales.length; scaleIndex++) {
                        var subscale = superscale.subscales[scaleIndex];
                        var subIndex = $scope.subscaleKeys.indexOf(subscale.subscaleKey);
                        if (subscale.operator == '+') {
                            sum += rowData[subIndex];
                        } else {
                            sum -= rowData[subIndex];
                        }
                    }
                    if (superscale.average) {
                        sum /= superscale.subscales.length;
                    }
                    rowData[colIndex] = Math.round(sum * 100) / 100
                }
            }

            //merge user keys
            var itemCount = $scope.calcValues[0].length;
            var start = $scope.userStartNum + 1
            for (var i = start; i < $scope.calcValues.length; i++) {
                for (var j = 1; j < itemCount - 1; j++) {
                    for (var k = start - 1; k < i; k++) {
                        if ($scope.calcValues[i][j] != undefined && $scope.calcValues[k][j] == $scope.calcValues[i][j]) {
                            $scope.calcValues[i][j] = undefined
                            $scope.userKeys[k][j] = $scope.userKeys[k][j] + ', ' + $scope.userKeys[i][j]
                        }
                    }
                }
            }

            //calc labels
            $scope.scoreLabels = [];
            var myScoreIndex = $scope.siblingSets.length
            for (key in $scope.labels) {
                label = $scope.labels[key];
                if (!label.subscales) continue;
                var result = true;
                for (var i = 0; i < label.subscales.length; i++) {
                    var subscale = label.subscales[i];
                    var subIndex = $scope.subscaleKeys.indexOf(subscale.subscaleKey);
                    switch (subscale.operator) {
                        case ">":
                            result = result && ($scope.calcValues[myScoreIndex][subIndex] > subscale.num);
                            break;
                        case ">=":
                            result = result && ($scope.calcValues[myScoreIndex][subIndex] >= subscale.num);
                            break;
                        case "<":
                            result = result && ($scope.calcValues[myScoreIndex][subIndex] < subscale.num);
                            break;
                        case "<=":
                            result = result && ($scope.calcValues[myScoreIndex][subIndex] <= subscale.num);
                            break;
                    }
                }
                if (result) {
                    $scope.scoreLabels.push(label.title);
                }
            }
            $scope.draw();
        }
        $scope.draw = function () {
            var data = [];
            for (i = 0; i < $scope.calcValues.length; i++) {
                data[i] = {
                    label: $scope.labels[i],
                    data: $scope.calcValues[i],
                    backgroundColor: $scope.colors[i],
                    borderColor: 'rgba(0, 0, 0, 0)',
                    fill: false,
                    borderWidth: 0,
                    pointRadius: $scope.radiuses[i],
                    pointHoverRadius: $scope.radiuses[i],
                    pointStyle: $scope.pointStyles[i],
                    pointBackgroundColor: $scope.colors[i],
                    pointBorderColor: '#00000005',
                    pointBorderWidth: 1,
                    showLine: false,
                }
            }
            $scope.graphData = data;
            if ($scope.myChart) {
                $scope.paintgraph();
            } else {
                $rootScope.setData('loadingfinished', true);
            }
            $rootScope.safeApply();
        }
        $scope.paintgraph = function () {
            $rootScope.setData('loadingfinished', true);
            var data = $scope.graphData;
            if (!$scope.currSet.graph) return;
            $rootScope.safeApply();
            if ($scope.title.length < 3) {
                $rootScope.error("Sorry,There is not any subscales!");
            }

            var canvas = document.getElementById('mychart');
            var ctx = canvas.getContext("2d");

            var planetData = {
                labels: $scope.title,
                datasets: data
            };

            $scope.max = undefined;
            $scope.min = undefined;
            if ($scope.currSet.yScaleType == 'Fixed') {
                var maxQScore = $scope.optionScores[0]
                var minQScore = $scope.optionScores[0]
                $scope.optionScores.forEach(score => {
                    if (score > maxQScore) maxQScore = score
                    if (score < minQScore) minQScore = score
                });
                for (scaleKey in $scope.subscales) {
                    var scale = $scope.subscales[scaleKey]
                    if (scale.questions) {
                        if (scale.method == 'Sum') {
                            scale.maxScore = maxQScore * scale.questions.length
                            scale.minScore = minQScore * scale.questions.length
                        } else {
                            scale.maxScore = maxQScore
                            scale.minScore = minQScore
                        }
                    }
                }
                for (scaleKey in $scope.subscales) {
                    var scale = $scope.subscales[scaleKey]
                    if (scale.subscales) {
                        scale.maxScore = 0
                        scale.minScore = 0
                        scale.subscales.forEach(subScale => {
                            if (subScale.operator == "+") {
                                scale.maxScore += $scope.subscales[subScale.subscaleKey].maxScore
                                scale.minScore += $scope.subscales[subScale.subscaleKey].minScore
                            } else {
                                scale.maxScore -= $scope.subscales[subScale.subscaleKey].minScore
                                scale.minScore -= $scope.subscales[subScale.subscaleKey].maxScore
                            }
                        });
                        if (scale.average) {
                            scale.maxScore = Math.ceil(scale.maxScore / scale.subscales.length)
                            scale.minScore = Math.floor(scale.minScore / scale.subscales.length)
                        }
                    }
                }
                for (scaleKey in $scope.subscales) {
                    var scale = $scope.subscales[scaleKey]
                    if ($scope.max == undefined || scale.maxScore > $scope.max) $scope.max = scale.maxScore
                    if ($scope.min == undefined || scale.minScore < $scope.min) $scope.min = scale.minScore
                }
            }
            var chartOptions = {
                responsive: true,
                legend: {
                    position: 'right',
                    onClick: function (e, legendItem) {

                        var index = legendItem.datasetIndex;
                        var ci = this.chart;

                        if (index < $scope.userStartNum) {
                            meta = ci.getDatasetMeta(index);
                            meta.hidden = meta.hidden === null ? !meta.hidden : null;
                        } else {
                            for (var i = $scope.userStartNum; i < $scope.calcValues.length; i++) {
                                meta = ci.getDatasetMeta(i);
                                meta.hidden = meta.hidden === null ? !meta.hidden : null;
                            }
                        }
                        ci.update();
                    },
                    labels: {
                        filter: function (item, chart) {
                            return item.datasetIndex <= $scope.userStartNum;
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 20,
                        bottom: 20
                    }
                },

                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: ($scope.yLabel) ? $scope.yLabel : 'Score',
                        },
                        ticks: {
                            max: $scope.max,
                            min: $scope.min
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            autoSkip: false
                        }
                    }]
                },
                showLine: false,
                tooltips: {
                    callbacks: {
                        // label: function (tooltipItem, data) {
                        //     var label = data.datasets[tooltipItem.datasetIndex].label || '';

                        //     label += Math.round(tooltipItem.yLabel * 100) / 100;
                        //     return label;
                        // },
                        title: function (tooltipItem, data) {
                            var title = tooltipItem[0].xLabel.join(" ")
                            if ($scope.userKeys[tooltipItem[0].datasetIndex][tooltipItem[0].index] != undefined) {
                                if ($scope.groupLikertSettings.showUniqueId) {
                                    title = title + " : " + $scope.userKeys[tooltipItem[0].datasetIndex][tooltipItem[0].index]
                                }
                            }
                            return title
                        }
                    }
                }
            };


            // ==========update chart================
            if ($scope.myChart) {
                $scope.myChart.type = 'line';
                $scope.myChart.data = planetData;
                $scope.myChart.options = chartOptions;
                $scope.myChart.plugins = [{
                    beforeInit: function (chart) {
                        chart.data.labels.forEach(function (e, i, a) {
                            if (/\n/.test(e)) {
                                a[i] = e.split(/\n/)
                            }
                        })
                    }
                }];
                $scope.myChart.update();
                $rootScope.setData('loadingfinished', true);
                return;
            }
            //=========== create chart=================
            $scope.myChart = new Chart(ctx, {
                type: 'line',
                data: planetData,
                options: chartOptions,
                plugins: [{
                    beforeInit: function (chart) {
                        chart.data.labels.forEach(function (e, i, a) {
                            if (/\n/.test(e)) {
                                a[i] = e.split(/\n/)
                            }
                        })
                    }
                }]
            });

        }

        // get addtional information
        $scope.getAddInfo = function () {
            $scope.additional_info = undefined;
            $scope.infoRef = firebase.database().ref('QuestionSets/' + $scope.setKey + '/additional_info');
            $scope.infoRef.on('value', function (snapshot) {
                var info_div = document.getElementById('additional_info');
                if (!info_div) {
                    $scope.additional_info = undefined;
                    $scope.infoRef.off('value');
                } else {
                    $scope.additional_info = snapshot.val();
                    if ($scope.additional_info == "<br>" || $scope.additional_info == "&nbsp;") $scope.additional_info = undefined;
                    if ($scope.additional_info) {
                        document.getElementById('additional_info').innerHTML = $scope.additional_info;
                    }
                }
                $rootScope.safeApply();
            });
        }
        $scope.changeGroupChoice = function () {
            $scope.getAnswers();
            $rootScope.safeApply();
        }
        $scope.getFeedback = function (score, index) {
            key = $scope.subscaleKeys[index];
            var feedbacks = $scope.subscales[key].Feedback;
            var text = "[ score: " + Math.round(score * 100) / 100 + " ]";
            if (feedbacks) {
                feedbacks.forEach(function (feedback) {
                    if (feedback.start < score && score <= feedback.end) {
                        text = text + ", " + feedback.text;
                    }
                })
            }
            return text;
        }
        $scope.changeVersionIndex = function (versionIndex) {
            $scope.versionIndex = versionIndex;
            $scope.getAnswers();
            $rootScope.safeApply();
        }
    }
})();