(function () {

    angular
        .module('myApp')
        .controller('GroupLikertViewController', GroupLikertViewController)

    GroupLikertViewController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function GroupLikertViewController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        if ($rootScope.setData.showResponse) {
            $rootScope.setData('backUrl', "groupLikertAnswer");
        } else {
            if ($rootScope.settings.groupType == 'sub') {
                $rootScope.setData('backUrl', "studentSubGroupDetail");
            } else {
                $rootScope.setData('backUrl', "studentSecondGroupDetail");
            }
        }

        var settingRefStr = 'Groups/' + $rootScope.settings.groupKey + '/groupLikertSettings/'
        if ($rootScope.settings.groupType == 'sub') {
            $scope.questionSetKey = $rootScope.settings.questionSetKey1
            settingRefStr = settingRefStr + '/groupsets/' + $rootScope.settings.groupSetKey + '/' + $scope.questionSetKey;
        } else {
            $scope.questionSetKey = $rootScope.settings.questionSetKey2;
            settingRefStr = settingRefStr + '/subgroupsets/' + $rootScope.settings.groupSetKey + '/' + $rootScope.settings.subSetKey + '/' + $scope.questionSetKey;
        }
        $scope.legendItems = ['average in all group',
            'average in group',
            'average in tutorial set',
            'average in your tutorial',
            'score of tutorial members',
            'average in team set',
            'average in your team',
            'score of team members',
            'your score'];
        $rootScope.safeApply();


        $scope.$on('$destroy', function () {
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.qsetdataRef) $scope.qsetdataRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
            if ($scope.groupLikertSettingsRef) $scope.groupLikertSettingsRef.off('value')
            if ($scope.ansRef) $scope.ansRef.off('value')
            if ($scope.infoRef) $scope.infoRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getAllUser();
            $scope.getSetData();
            $scope.getAllQuestions();
            $scope.getGroupLikertSettings();
        }


        $scope.getAllUser = function () {
            $scope.userRef = firebase.database().ref('Users');
            $scope.userRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val()
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }
        $scope.getSetData = function () {
            //============================================================           
            $scope.qsetdataRef = firebase.database().ref('QuestionSets/' + $scope.questionSetKey);
            $scope.qsetdataRef.on('value', function (snapshot) {
                $scope.setData = snapshot.val();
                if (!$scope.setData.optionScores) {
                    $scope.setData.optionScores = [];
                    for (var i = 0; i < $scope.setData.options.length; i++) {
                        $scope.setData.optionScores.push(i + 1);
                    }
                }
                if ($scope.setData.yScaleType == undefined) {
                    $scope.setData.yScaleType = 'Fixed';
                }
                if ($scope.setData.result_videoID) {
                    $scope.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.setData.result_videoID + "?rel=0&enablejsapi=1");
                    $rootScope.removeRecommnedVideo()
                }
                $scope.ref_2 = true;
                $scope.finalCalc()
            });
        }
        $scope.getAllQuestions = function () {
            $scope.qstRef = firebase.database().ref('Questions/').orderByChild("Set").equalTo($scope.questionSetKey);
            $scope.qstRef.on('value', function (snapshot) {
                $scope.questionKeys = Object.keys(snapshot.val()) || [];
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }
        $scope.getGroupLikertSettings = function () {
            $scope.groupLikertSettingsRef = firebase.database().ref(settingRefStr);
            $scope.groupLikertSettingsRef.on('value', function (snapshot) {
                $scope.groupLikertSettings = {
                    showScore: true,
                    showUniqueId: false,
                }
                let setSetting = snapshot.val() || {}
                if (setSetting.showUniqueId) $scope.groupLikertSettings.showUniqueId = true
                if (setSetting.hideScore) $scope.groupLikertSettings.showScore = false
                if (setSetting.legendOptions) {
                    $scope.groupLikertSettings.legendOptions = angular.copy(setSetting.legendOptions)
                } else {
                    $scope.groupLikertSettings.legendOptions = {}
                    $scope.legendItems.forEach(function (legend) {
                        $scope.groupLikertSettings.legendOptions[legend] = {
                            label: legend,
                            visible: true,
                        }
                    });
                }
                $scope.ref_4 = true
                $scope.finalCalc()
            })
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return
            if ($scope.setData.subscales == undefined) {
                $scope.title = [];
                $scope.graphData = [];
                $scope.paintgraph();
            } else {
                if ($scope.setData.superscales) {
                    $scope.setData.subscales = Object.assign({}, $scope.setData.subscales, $scope.setData.superscales);
                }
                $scope.getAnswers()
            }
        }
        $scope.getFeedback = function (score, index) {
            key = $scope.subscaleKeys[index];
            var feedbacks = $scope.setData.subscales[key].Feedback;
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
        $scope.getAnswers = function () {
            $scope.ansRef = firebase.database().ref('GroupLikertAnswer/' + $scope.questionSetKey);
            $scope.ansRef.on('value', function (snapshot) {
                $scope.answers = {};
                $scope.calcValues = [];
                //===== init Data  ============
                var optionCount = $scope.setData.options.length;
                $scope.subscaleKeys = Object.keys($scope.setData.subscales).sort(function (a, b) {
                    return $scope.setData.subscales[a].order - $scope.setData.subscales[b].order;
                })
                $scope.subscaleKeys.unshift("");
                $scope.subscaleKeys.push("");

                $scope.scaleQKeys = [];   //subscaleQuestionKeys[scale index][questions]
                $scope.reversedScaleQKeys = [];   //subscaleQuestionKeys[scale index][questions]
                $scope.title = [""];

                $scope.subscaleKeys.forEach(function (key) {
                    if (key) {
                        var scale = $scope.setData.subscales[key];
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

                for (groupKey in snapshot.val()) {
                    var groupAns = snapshot.val()[groupKey];
                    var answerExist = false;

                    for (setKey in groupAns) {
                        var setAns = groupAns[setKey];
                        var setAnsExist = false;

                        for (subIndex in setAns) {
                            var childGroupAnsExist = false;

                            if ($rootScope.settings.groupType == 'sub') {
                                var subGroupAns = setAns[subIndex].answers || {};

                                for (userKey in subGroupAns) {
                                    var userAns = subGroupAns[userKey].answer;
                                    var allQAnswered = true;
                                    $scope.questionKeys.forEach(questionKey => {
                                        if (userAns[questionKey] == undefined) allQAnswered = false;
                                    });

                                    if (allQAnswered) {
                                        answerExist = true;
                                        setAnsExist = true;
                                        childGroupAnsExist = true;
                                        $scope.answers[groupKey] = $scope.answers[groupKey] || {};
                                        $scope.answers[groupKey][setKey] = $scope.answers[groupKey][setKey] || [];
                                        $scope.answers[groupKey][setKey][subIndex] = $scope.answers[groupKey][setKey][subIndex] || {};

                                        $scope.answers[groupKey][setKey][subIndex][userKey] = [undefined];
                                        var tempans = $scope.answers[groupKey][setKey][subIndex][userKey];


                                        for (var scaleIndex = 0; scaleIndex < $scope.scaleQKeys.length; scaleIndex++) {
                                            var qstArr = $scope.scaleQKeys[scaleIndex];
                                            if (qstArr.length == 0) {
                                                tempans.push(undefined);
                                                continue;
                                            }
                                            var reversedArr = $scope.reversedScaleQKeys[scaleIndex];
                                            var allAnswered = true;
                                            var sum = 0;
                                            for (var qstIndex = 0; qstIndex < qstArr.length; qstIndex++) {
                                                var qstKey = qstArr[qstIndex];
                                                if (userAns[qstKey] != undefined) {
                                                    if (reversedArr.indexOf(qstKey) > -1) {
                                                        if (!isNaN($scope.setData.optionScores[optionCount - 1 - userAns[qstKey]])) {
                                                            sum += $scope.setData.optionScores[optionCount - 1 - userAns[qstKey]];
                                                        }
                                                    } else {
                                                        if (!isNaN($scope.setData.optionScores[userAns[qstKey]])) {
                                                            sum += $scope.setData.optionScores[userAns[qstKey]];
                                                        }
                                                    }
                                                } else {
                                                    allAnswered = false;
                                                }
                                            }

                                            var calcValue = 0;

                                            if (allAnswered) {                              // if answered for all subscale questions
                                                if ($scope.setData.subscales[$scope.subscaleKeys[scaleIndex + 1]].method == "Sum") {
                                                    calcValue = sum;
                                                } else {
                                                    calcValue = Math.round(sum / qstArr.length * 100) / 100;
                                                }
                                            } else {
                                                calcValue = undefined;
                                            }
                                            tempans.push(calcValue);
                                        }
                                        tempans.push(undefined);

                                        for (var i = 0; i < $scope.subscaleKeys.length; i++) {
                                            var key = $scope.subscaleKeys[i];
                                            if (!key) continue;
                                            if (!$scope.setData.subscales[key].subscales) continue;
                                            var superscale = $scope.setData.subscales[key];
                                            for (var k = 0; k < superscale.subscales.length; k++) {
                                                var subscale = superscale.subscales[k];
                                                var subScaleIndex = $scope.subscaleKeys.indexOf(subscale.subscaleKey);

                                                if (tempans[i] == undefined) tempans[i] = 0;
                                                if (subscale.operator == '+') {
                                                    tempans[i] += tempans[subScaleIndex];
                                                } else {
                                                    tempans[i] -= tempans[subScaleIndex];
                                                }
                                            }

                                            if (superscale.average) {
                                                tempans[i] /= superscale.subscales.length;
                                            }
                                            tempans[i] = Math.round(tempans[i] * 100) / 100;
                                        }
                                    }
                                }
                                // calc average of child group
                                if (childGroupAnsExist) {
                                    $scope.answers[groupKey][setKey][subIndex] = $scope.calcAverage($scope.answers[groupKey][setKey][subIndex], true);
                                }
                            } else {
                                var subGroupAns = setAns[subIndex].groupset || {};
                                for (subSetKey in subGroupAns) {
                                    var subSetAns = subGroupAns[subSetKey];
                                    var subSetAnsExist = false;

                                    for (secondIndex in subSetAns) {
                                        var secondGroupAns = subSetAns[secondIndex];
                                        var secondGroupAnsExist = false;

                                        for (userKey in secondGroupAns) {
                                            var userAns = secondGroupAns[userKey].answer;
                                            var allQAnswered = true;
                                            $scope.questionKeys.forEach(questionKey => {
                                                if (userAns[questionKey] == undefined) allQAnswered = false;
                                            });

                                            if (allQAnswered) {
                                                answerExist = true;
                                                setAnsExist = true;
                                                childGroupAnsExist = true
                                                subSetAnsExist = true
                                                secondGroupAnsExist = true

                                                $scope.answers[groupKey] = $scope.answers[groupKey] || {};
                                                $scope.answers[groupKey][setKey] = $scope.answers[groupKey][setKey] || [];
                                                $scope.answers[groupKey][setKey][subIndex] = $scope.answers[groupKey][setKey][subIndex] || {};
                                                $scope.answers[groupKey][setKey][subIndex][subSetKey] = $scope.answers[groupKey][setKey][subIndex][subSetKey] || [];
                                                $scope.answers[groupKey][setKey][subIndex][subSetKey][secondIndex] = $scope.answers[groupKey][setKey][subIndex][subSetKey][secondIndex] || {};
                                                $scope.answers[groupKey][setKey][subIndex][subSetKey][secondIndex][userKey] = [undefined];
                                                var tempans = $scope.answers[groupKey][setKey][subIndex][subSetKey][secondIndex][userKey];


                                                for (var scaleIndex = 0; scaleIndex < $scope.scaleQKeys.length; scaleIndex++) {
                                                    var qstArr = $scope.scaleQKeys[scaleIndex];
                                                    if (qstArr.length == 0) {
                                                        tempans.push(undefined);
                                                        continue;
                                                    }
                                                    var reversedArr = $scope.reversedScaleQKeys[scaleIndex];
                                                    var allAnswered = true;
                                                    var sum = 0;

                                                    for (var qstIndex = 0; qstIndex < qstArr.length; qstIndex++) {
                                                        var qstKey = qstArr[qstIndex];
                                                        if (userAns[qstKey] != undefined) {
                                                            if (reversedArr.indexOf(qstKey) > -1) {
                                                                if (!isNaN($scope.setData.optionScores[optionCount - 1 - userAns[qstKey]])) {
                                                                    sum += $scope.setData.optionScores[optionCount - 1 - userAns[qstKey]];
                                                                }
                                                            } else {
                                                                if (!isNaN($scope.setData.optionScores[userAns[qstKey]])) {
                                                                    sum += $scope.setData.optionScores[userAns[qstKey]];
                                                                }
                                                            }
                                                        } else {
                                                            allAnswered = false;
                                                        }
                                                    }

                                                    var calcValue = 0;

                                                    if (allAnswered) {                              // if answered for all subscale questions
                                                        if ($scope.setData.subscales[$scope.subscaleKeys[scaleIndex + 1]].method == "Sum") {
                                                            calcValue = sum;
                                                        } else {
                                                            calcValue = Math.round(sum / qstArr.length * 100) / 100;
                                                        }
                                                    } else {
                                                        calcValue = undefined;
                                                    }
                                                    tempans.push(calcValue);
                                                }
                                                tempans.push(undefined);

                                                for (var i = 0; i < $scope.subscaleKeys.length; i++) {
                                                    var key = $scope.subscaleKeys[i];
                                                    if (!key) continue;
                                                    if (!$scope.setData.subscales[key].subscales) continue;
                                                    var superscale = $scope.setData.subscales[key];
                                                    for (var k = 0; k < superscale.subscales.length; k++) {
                                                        var subscale = superscale.subscales[k];
                                                        var subScaleIndex = $scope.subscaleKeys.indexOf(subscale.subscaleKey);

                                                        if (tempans[i] == undefined) tempans[i] = 0;
                                                        if (subscale.operator == '+') {
                                                            tempans[i] += tempans[subScaleIndex];
                                                        } else {
                                                            tempans[i] -= tempans[subScaleIndex];
                                                        }
                                                    }

                                                    if (superscale.average) {
                                                        tempans[i] /= superscale.subscales.length;
                                                    }
                                                    tempans[i] = Math.round(tempans[i] * 100) / 100;
                                                }
                                            }
                                        }
                                        if (secondGroupAnsExist) {
                                            $scope.answers[groupKey][setKey][subIndex][subSetKey][secondIndex] = $scope.calcAverage($scope.answers[groupKey][setKey][subIndex][subSetKey][secondIndex], 2);
                                        }
                                    }
                                    if (subSetAnsExist) {
                                        $scope.answers[groupKey][setKey][subIndex][subSetKey] = $scope.calcAverage($scope.answers[groupKey][setKey][subIndex][subSetKey]);
                                    }
                                }
                                if (childGroupAnsExist) {
                                    $scope.answers[groupKey][setKey][subIndex] = $scope.calcAverage($scope.answers[groupKey][setKey][subIndex]);
                                }
                            }
                        }
                        if (setAnsExist) {
                            $scope.answers[groupKey][setKey] = $scope.calcAverage($scope.answers[groupKey][setKey]);
                        }
                    }
                    if (answerExist) {
                        $scope.answers[groupKey] = $scope.calcAverage($scope.answers[groupKey]);
                    }
                }
                $scope.answers = $scope.calcAverage($scope.answers);
                calcValues();
            });
        }

        $scope.calcAverage = function (tempans, isChildGroup = false) {
            if (tempans) {
                var averAns = [];
                for (var i = 0; i < $scope.subscaleKeys.length; i++) {
                    if (!$scope.subscaleKeys[i]) {
                        averAns.push(undefined);
                        continue;
                    }
                    var sum = 0;
                    var count = 0;
                    for (var tempKey in tempans) {
                        var tempVal = undefined;
                        if (isChildGroup) {
                            tempVal = tempans[tempKey][i];
                        } else {
                            tempVal = tempans[tempKey].average[i];
                        }
                        if (tempVal != undefined) {
                            sum += tempVal;
                            count++;
                        }
                    }
                    if (count > 0) {
                        sum = Math.round(sum * 100 / count) / 100;
                    } else {
                        sum = undefined;
                    }

                    averAns.push(sum)
                }
                tempans.average = averAns;
            }
            return tempans;
        }

        $scope.addValue = function (data, label, color, pointStyle, radius, show_id = undefined) {
            $scope.calcValues.push(angular.copy(data));
            $scope.labels.push(label);
            $scope.colors.push(color);
            $scope.pointStyles.push(pointStyle);
            $scope.radiuses.push(radius);
            if (show_id) {
                $scope.userKeys.push(Array(data.length).fill(show_id))
            } else {
                $scope.userKeys.push(Array(data.length).fill(undefined))
            }
            $rootScope.safeApply();
        }
        calcValues = function () {
            var colors = ['#0000FF', '#FF0000', '#00FF00', '#FFFF00', '#FF00FF', '#FF8080', '#808080', '#C2B280', '#800000', '#FF8000', '#803E75', '#A6BDD7', '#817066', '#007D34',
                '#00538A', '#53377A', '#B32851', '#593315', '#232C16', '#DCD300', '#882D17', '#8DB600', '#654522', '#E25822', '#2B3D26', '#0000FF', '#FF0000', '#00FF00', '#FF00FF', '#000000'];
            var R = $rootScope.settings;
            $scope.calcValues = [];
            $scope.labels = [];
            $scope.colors = [];
            $scope.pointStyles = [];
            $scope.radiuses = [];
            $scope.userKeys = [];

            //============= get subscale answers  =============
            var options = $scope.groupLikertSettings.legendOptions;
            // average in all group
            if (options[$scope.legendItems[0]].visible) {
                $scope.addValue($scope.answers.average, options[$scope.legendItems[0]].label, '#FFC000', 'rectRounded', 10);
            }
            // average in group
            if (options[$scope.legendItems[1]].visible) {
                $scope.addValue($scope.answers[R.groupKey].average, options[$scope.legendItems[1]].label, '#00B050', 'rectRounded', 10);
            }


            // average in tutorial set
            var setans = $scope.answers[R.groupKey][R.groupSetKey];
            if (Object.keys(setans).length > 2 && options[$scope.legendItems[2]].visible) {
                $scope.addValue(setans.average, options[$scope.legendItems[2]].label, '#7A049C', 'rectRounded', 10);
            }

            if (R.groupType == 'sub') {
                // average in your tutorial
                var tutoAns = setans[R.subIndex];
                if (options[$scope.legendItems[3]].visible) {
                    $scope.addValue(tutoAns.average, options[$scope.legendItems[3]].label, '#0432FF', 'triangle', 10);
                }
                // your score
                if (options[$scope.legendItems[8]].visible) {
                    $scope.addValue(tutoAns[R.userId], options[$scope.legendItems[8]].label, '#FF0000', 'circle', 8);
                }

                $scope.mainValues = $scope.calcValues.length;
                // score of tutorial members
                var index = 0;
                for (tutoUserID in tutoAns) {
                    if (tutoUserID != 'average' && options[$scope.legendItems[4]].visible) {
                        // && tutoUserID != R.userId
                        $scope.addValue(tutoAns[tutoUserID], 'score of tutorial members', colors[(colors.length - 1 - index) % colors.length], 'circle', 6, $scope.allUsers[tutoUserID].show_id);
                        index++;
                    }
                }
            } else {
                // average in your tutorial
                var tutoAns = setans[R.subIndex];
                if (options[$scope.legendItems[3]].visible) {
                    $scope.addValue(tutoAns.average, options[$scope.legendItems[3]].label, '#0432FF', 'rect', 10);
                }
                // average in team set
                var teamSetAns = tutoAns[R.subSetKey];
                if (Object.keys(teamSetAns).length > 2 && options[$scope.legendItems[5]].visible) {
                    $scope.addValue(teamSetAns.average, options[$scope.legendItems[5]].label, '#FF00FF', 'rect', 8);
                }

                // average in team
                var teamAns = teamSetAns[R.secondIndex];
                if (options[$scope.legendItems[6]].visible) {
                    $scope.addValue(teamAns.average, options[$scope.legendItems[6]].label, '#FF8080', 'triangle', 8);
                }
                // your score
                if (options[$scope.legendItems[8]].visible) {
                    $scope.addValue(teamAns[R.userId], options[$scope.legendItems[8]].label, '#FF0000', 'circle', 6);
                }

                $scope.mainValues = $scope.calcValues.length;
                // score of team members
                var index = 0;
                for (teamUserID in teamAns) {
                    if (teamUserID != 'average' && options[$scope.legendItems[7]].visible) {
                        // && teamUserID != R.userId
                        $scope.addValue(teamAns[teamUserID], options[$scope.legendItems[7]].label, colors[(colors.length - 1 - index) % colors.length], 'circle', 4, $scope.allUsers[teamUserID].show_id);
                        index++;
                    }
                }
            }
            var dataLength = $scope.calcValues[0].length
            for (var i = 1; i < $scope.calcValues.length; i++) {
                for (var j = 0; j < i; j++) {
                    for (var k = 0; k < dataLength; k++) {
                        if ($scope.calcValues[i][k] != undefined && $scope.calcValues[i][k] == $scope.calcValues[j][k] && $scope.userKeys[i][k] != undefined && $scope.userKeys[j][k] != undefined) {
                            $scope.userKeys[j][k] = $scope.userKeys[j][k] + ', ' + $scope.userKeys[i][k]
                            $scope.userKeys[i][k] = undefined
                            $scope.calcValues[i][k] = undefined
                        }
                    }
                }
            }

            // calc labels
            $scope.scoreLabels = [];
            for (key in $scope.setData.labels) {
                label = $scope.setData.labels[key];
                if (!label.subscales) continue;
                var result = true;
                for (var i = 0; i < label.subscales.length; i++) {
                    var subscale = label.subscales[i];
                    var subIndex = $scope.subscaleKeys.indexOf(subscale.subscaleKey);
                    switch (subscale.operator) {
                        case ">":
                            result = result && ($scope.calcValues[0][subIndex] > subscale.num);
                            break;
                        case ">=":
                            result = result && ($scope.calcValues[0][subIndex] >= subscale.num);
                            break;
                        case "<":
                            result = result && ($scope.calcValues[0][subIndex] < subscale.num);
                            break;
                        case "<=":
                            result = result && ($scope.calcValues[0][subIndex] <= subscale.num);
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
                    pointBorderColor: 'rgb(0, 0, 0)',
                    pointBorderWidth: 0.5,
                    showLine: false,
                }
            }
            $scope.graphData = data;
            if ($scope.myChart) {
                $scope.paintgraph();
            }
            $rootScope.safeApply();
        }
        $scope.paintgraph = function () {
            var data = $scope.graphData;
            if (!$scope.setData.graph) return;
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
            if ($scope.setData.yScaleType == 'Fixed') {
                var maxQScore = $scope.setData.optionScores[0]
                var minQScore = $scope.setData.optionScores[0]
                $scope.setData.optionScores.forEach(score => {
                    if (score > maxQScore) maxQScore = score
                    if (score < minQScore) minQScore = score
                });
                for (scaleKey in $scope.setData.subscales) {
                    var scale = $scope.setData.subscales[scaleKey]
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
                for (scaleKey in $scope.setData.subscales) {
                    var scale = $scope.setData.subscales[scaleKey]
                    if (scale.subscales) {
                        scale.maxScore = 0
                        scale.minScore = 0
                        scale.subscales.forEach(subScale => {
                            if (subScale.operator == "+") {
                                scale.maxScore += $scope.setData.subscales[subScale.subscaleKey].maxScore
                                scale.minScore += $scope.setData.subscales[subScale.subscaleKey].minScore
                            } else {
                                scale.maxScore -= $scope.setData.subscales[subScale.subscaleKey].minScore
                                scale.minScore -= $scope.setData.subscales[subScale.subscaleKey].maxScore
                            }
                        });
                        if (scale.average) {
                            scale.maxScore = Math.ceil(scale.maxScore / scale.subscales.length)
                            scale.minScore = Math.floor(scale.minScore / scale.subscales.length)
                        }
                    }
                }
                for (scaleKey in $scope.setData.subscales) {
                    var scale = $scope.setData.subscales[scaleKey]
                    if ($scope.max == undefined || scale.maxScore > $scope.max) $scope.max = scale.maxScore
                    if ($scope.min == undefined || scale.minScore < $scope.min) $scope.min = scale.minScore
                }
            }

            var chartOptions = {
                responsive: true,
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
                },
                legend: {
                    position: 'right',
                    onClick: function (e, legendItem) {

                        var index = legendItem.datasetIndex;
                        var ci = this.chart;

                        if (index < $scope.mainValues) {
                            meta = ci.getDatasetMeta(index);
                            meta.hidden = meta.hidden === null ? !meta.hidden : null;
                        } else {
                            for (var i = $scope.mainValues; i < $scope.calcValues.length; i++) {
                                meta = ci.getDatasetMeta(i);
                                meta.hidden = meta.hidden === null ? !meta.hidden : null;
                            }
                        }
                        ci.update();
                    },
                    labels: {
                        filter: function (item, chart) {
                            return item.datasetIndex < $scope.mainValues + 1;
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
                            labelString: ($scope.setData.yLabel) ? $scope.setData.yLabel : 'Score',
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
            $rootScope.setData('loadingfinished', true);
        }
        // get addtional information
        $scope.getAddInfo = function () {
            $scope.additional_info = undefined;
            $scope.infoRef = firebase.database().ref('QuestionSets/' + $scope.questionSetKey + '/additional_info');
            $scope.infoRef.on('value', function (snapshot) {
                var info_div = document.getElementById('additional_info');
                if (!info_div) {
                    $scope.additional_info = undefined;
                    infoRef.off('value');
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
    }
})();