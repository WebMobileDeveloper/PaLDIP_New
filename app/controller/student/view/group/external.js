(function () {

    angular
        .module('myApp')
        .controller('ExternalViewController', ExternalViewController)

    ExternalViewController.$inject = ['$state', '$scope', '$rootScope', '$sce', '$filter'];

    function ExternalViewController($state, $scope, $rootScope, $sce, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questions");
        $rootScope.safeApply();
        $scope.$on('$destroy', function () {
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.answersRef) $scope.answersRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getStudentsInGroup()
            $scope.getAllUser();
            $scope.getAnswers();
        }

        $scope.getStudentsInGroup = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (studentGroups) {
                $scope.studentsInGroup = [];
                var studentGroup = studentGroups.val();
                for (var studentKey in studentGroup) {
                    var obj = studentGroup[studentKey];
                    if (Object.values(obj).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                $scope.ref_1 = true
                $scope.finalCalc()
            })
        }
        $scope.getAllUser = function () {
            $scope.userRef = firebase.database().ref('Users');
            $scope.userRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val()
                $scope.ref_2 = true
                $scope.finalCalc()
            })
        }
        $scope.getAnswers = function () {
            $scope.answersRef = firebase.database().ref('NewAnswers/' + $rootScope.settings.questionKey + '/answer');
            $scope.answersRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {}
                $scope.ref_3 = true;
                $scope.finalCalc()
            })
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return

            userValues = [undefined, undefined, undefined, undefined]
            $scope.title = ["", "My", "Group", "Others"]
            let groupSum = 0;
            let groupCount = 0;
            let allSum = 0;
            let allCount = 0;
            let myAnswer = undefined
            for (userKey in $scope.allAnswers) {
                let answer = $scope.allAnswers[userKey]
                if ($scope.studentsInGroup.indexOf(userKey) > -1) {
                    groupSum += answer
                    groupCount++
                    if (userKey == $rootScope.settings.userId) {
                        myAnswer = answer
                    } else {
                        userValues.push(answer)
                        $scope.title.push($scope.allUsers[userKey].show_id)
                    }
                } else {
                    allSum += answer
                    allCount++
                }
            }
            if (groupCount > 0) {
                groupSum = Math.round(groupSum / groupCount * 100) / 100
            }
            if (allCount > 0) {
                allSum = Math.round(allSum / allCount * 100) / 100
            }
            userValues.push(undefined)
            $scope.title.push("")


            let xLength = userValues.length;
            $scope.calcValues = [];
            $scope.labels = [];
            $scope.colors = [];
            $scope.pointStyles = [];
            $scope.radiuses = [];

            $scope.calcValues[0] = Array(xLength).fill(undefined)
            $scope.calcValues[0][1] = myAnswer
            $scope.labels.push("▲  Your result");
            $scope.colors.push("#FF0000");
            $scope.pointStyles.push('triangle');
            $scope.radiuses.push(7);

            $scope.calcValues[1] = Array(xLength).fill(undefined)
            $scope.calcValues[1][2] = groupSum
            $scope.labels.push("◼  Average of this group");
            $scope.colors.push("#0000FF");
            $scope.pointStyles.push('rect');
            $scope.radiuses.push(7);

            $scope.calcValues[2] = Array(xLength).fill(undefined)
            $scope.calcValues[2][3] = allSum
            $scope.labels.push("◆  Average of all other groups");
            $scope.colors.push("#00FF00");
            $scope.pointStyles.push('rectRot');
            $scope.radiuses.push(10);

            $scope.calcValues[3] = userValues
            $scope.labels.push("⏺  other results in this group");
            $scope.colors.push("#000000");
            $scope.pointStyles.push('circle');
            $scope.radiuses.push(4);


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
            var canvas = document.getElementById('mychart');
            var ctx = canvas.getContext("2d");

            var planetData = {
                labels: $scope.title,
                datasets: data
            };
            $scope.max = undefined;
            $scope.min = undefined;
            $scope.calcValues.forEach(values => {
                values.forEach(value => {
                    if ($scope.max == undefined || value > $scope.max) $scope.max = value
                    if ($scope.min == undefined || value < $scope.min) $scope.min = value
                });
            });


            var chartOptions = {
                responsive: true,
                legend: {
                    position: 'right',
                    onClick: function (e, legendItem) {
                        var index = legendItem.datasetIndex;
                        var ci = this.chart;
                        if (index < 3) {
                            meta = ci.getDatasetMeta(index);
                            meta.hidden = meta.hidden === null ? !meta.hidden : null;
                        } else {
                            for (var i = 3; i < $scope.calcValues.length; i++) {
                                meta = ci.getDatasetMeta(i);
                                meta.hidden = meta.hidden === null ? !meta.hidden : null;
                            }
                        }
                        ci.update();
                    },
                    labels: {
                        filter: function (item, chart) {
                            return item.datasetIndex <= 3;
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
                            labelString: 'Result',
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

        }

    }
})();