(function () {

    angular
        .module('myApp')
        .controller('MultipleViewController', MultipleViewController)

    MultipleViewController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function MultipleViewController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "multipleAnswer");
        $scope.question = $rootScope.settings.questionObj;
        $scope.options = $scope.question.options || []
        $scope.myAnswer = $rootScope.settings.prevAnswer.replace(/#%%#/g, ", ")
        if ($scope.question.result_videoID) {
            $scope.question.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.result_videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.questionResultImageRef) $rootScope.questionResultImageRef.off('value')
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            // if ($scope.optionRef) $scope.optionRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        });
        $scope.init = function () {
            $rootScope.setData("loadingfinished", false)
            $scope.getUsers()
            $scope.getStudentGroups()
            // $scope.getOptions()
            $scope.getAnswers()
            $scope.getFeedbacks();
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users').orderByChild("Usertype").equalTo('Student');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.users = snapshot.val() || {};
                $scope.ref_1 = true;
                $scope.finalCalc()
            })
        }
        $scope.getStudentGroups = function () {
            $scope.stGroupRef = firebase.database().ref('StudentGroups');
            $scope.stGroupRef.on('value', function (snapshot) {
                $scope.usersInGroup = [];
                let allGserGroups = snapshot.val() || {}
                for (userKey in allGserGroups) {
                    if (Object.values(allGserGroups[userKey]).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.usersInGroup.push(userKey);
                    }
                }
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        };

        // $scope.getOptions = function () {
        //     $scope.optionRef = firebase.database().ref('Questions/' + $rootScope.settings.questionKey + '/options');
        //     $scope.optionRef.on('value', function (snapshot) {
        //         $scope.options = snapshot.val() || [];
        //         $scope.ref_2 = true
        //         $scope.finalCalc()
        //     });
        // }
        $scope.getAnswers = function () {
            if ($scope.answerRef) $scope.answerRef.off('value')
            $scope.answerRef = firebase.database().ref('NewAnswers/' + $rootScope.settings.questionKey + '/answer');
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {}
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            switch ($scope.question.enableGroup) {
                case 'email':
                    $scope.filterList = ['All Users']
                    for (userKey in $scope.allAnswers) {
                        if ($scope.filterList.indexOf($scope.users[userKey].institution) == -1) $scope.filterList.push($scope.users[userKey].institution)
                    }
                    $scope.selectedFilter = ($scope.selectedFilter && $scope.filterList.indexOf($scope.selectedFilter) > -1) ? $scope.selectedFilter : 'All Users'
                    break;
                default:
                    $scope.filterList = undefined
                    break;
            }

            $scope.groupChoice = $scope.groupChoice ? $scope.groupChoice : 'main';

            $scope.mainvalues = [];
            $scope.mainlabels = [];
            $scope.othervalues = [];
            $scope.otherlabels = [];
            $scope.totalvalues = [];
            $scope.totallabels = [];

            $scope.maincount = 0;
            $scope.othercount = 0;
            $scope.totalcount = 0;
            for (var i = 0; i < $scope.options.length; i++) {
                $scope.mainvalues.push(0);
                $scope.othervalues.push(0);
                $scope.totalvalues.push(0);
                $scope.mainlabels.push($scope.options[i]);
                $scope.otherlabels.push($scope.options[i]);
                $scope.totallabels.push($scope.options[i]);
            }
            for (userKey in $scope.allAnswers) {
                let isMatched = true
                switch ($scope.question.enableGroup) {
                    case 'email':
                        if ($scope.selectedFilter != 'All Users' && $scope.users[userKey].institution != $scope.selectedFilter) isMatched = false
                        break;
                    default:
                        break;
                }
                if (!isMatched) continue
                var answerArr = $scope.allAnswers[userKey].answer.split("#%%#");
                for (var i = 0; i < $scope.options.length; i++) {
                    if (answerArr.indexOf($scope.options[i]) > -1) {
                        if ($scope.usersInGroup.indexOf(userKey) > -1) {
                            $scope.mainvalues[i]++;
                        } else {
                            $scope.othervalues[i]++;
                        }
                        $scope.totalvalues[i]++;
                    }
                }

                if ($scope.usersInGroup.indexOf(userKey) > -1) {
                    $scope.maincount++;
                } else {
                    $scope.othercount++;
                }
                $scope.totalcount++;

            }
            var tempValue = 0;
            for (var i = 0; i < $scope.options.length - 1; i++) {
                for (var j = i + 1; j < $scope.options.length; j++) {
                    if ($scope.mainvalues[j] > $scope.mainvalues[i]) {
                        tempValue = $scope.mainvalues[i];
                        $scope.mainvalues[i] = $scope.mainvalues[j];
                        $scope.mainvalues[j] = tempValue;

                        tempValue = $scope.mainlabels[i];
                        $scope.mainlabels[i] = $scope.mainlabels[j];
                        $scope.mainlabels[j] = tempValue;
                    }
                    if ($scope.othervalues[j] > $scope.othervalues[i]) {
                        tempValue = $scope.othervalues[i];
                        $scope.othervalues[i] = $scope.othervalues[j];
                        $scope.othervalues[j] = tempValue;

                        tempValue = $scope.otherlabels[i];
                        $scope.otherlabels[i] = $scope.otherlabels[j];
                        $scope.otherlabels[j] = tempValue;
                    }
                    if ($scope.totalvalues[j] > $scope.totalvalues[i]) {
                        tempValue = $scope.totalvalues[i];
                        $scope.totalvalues[i] = $scope.totalvalues[j];
                        $scope.totalvalues[j] = tempValue;

                        tempValue = $scope.totallabels[i];
                        $scope.totallabels[i] = $scope.totallabels[j];
                        $scope.totallabels[j] = tempValue;
                    }
                }
            }

            $rootScope.safeApply();
            $scope.changeGroupChoice();
            $rootScope.setData("loadingfinished", true)
        }
        $scope.getFeedbacks = function () {
            if ($rootScope.settings.prevAnswer) {
                var prevAnswerArr = $rootScope.settings.prevAnswer.split("#%%#");
                var optionDetails = $scope.question.optionDetails;
                var feedbacks = $scope.question.feedbacks;
                $scope.totalScore = 0;
                $scope.optionFeedbacks = [];

                for (var i = 0; i < prevAnswerArr.length; i++) {
                    var index = $scope.options.indexOf(prevAnswerArr[i]);
                    if (optionDetails) {
                        $scope.optionFeedbacks.push(optionDetails[index]);
                        $scope.totalScore += optionDetails[index].score;
                    }
                }
                if (feedbacks && optionDetails) {
                    for (var i = 0; i < feedbacks.length; i++) {
                        if (feedbacks[i].from < $scope.totalScore && $scope.totalScore <= feedbacks[i].to) {
                            $scope.questionFeedback = feedbacks[i];
                        }
                    }
                }

            }
        }
        $scope.changeGroupChoice = function () {
            switch ($scope.groupChoice) {
                case 'main':
                    $scope.chartDescription = "Compared only in your group!";
                    $scope.numberOfAnswers = $scope.maincount;
                    $scope.paintgraph($scope.mainlabels, $scope.mainvalues, "barChart");
                    break;
                case 'other':
                    $scope.chartDescription = "Compared to all groups except your group!";
                    $scope.numberOfAnswers = $scope.othercount;
                    $scope.paintgraph($scope.otherlabels, $scope.othervalues, "barChart");
                    break;
                case 'all':
                    $scope.chartDescription = "Compared to all groups include your group!";
                    $scope.numberOfAnswers = $scope.totalcount;
                    $scope.paintgraph($scope.totallabels, $scope.totalvalues, "barChart");
                    break;
            }
            $rootScope.safeApply();
        }

        $scope.paintgraph = function (title, value, Dom) {
            if ($scope.options.length == 0) {
                $rootScope.error("Sorry,There is not any data!");
            }
            var canvas = document.getElementById(Dom);
            var ctx = canvas.getContext("2d");
            title = title.map(function (item) {
                return chunkArray(item, 90)
            });
            let chartOptions = {
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: { beginAtZero: true, mirror: true, padding: -10 },
                        barPercentage: 0.5,
                    }],
                    xAxes: [{
                        // Change here
                        gridLines: {
                            display: false,
                        },
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1
                        },
                    }]
                },
                elements: {
                    rectangle: {
                        borderSkipped: 'left'
                    }
                },
            }
            // let chartPlugIns = [{
            //     beforeLayout: function (chart) {
            //         chart.data.labels.forEach(function (e, i, a) {
            //             if (/\n/.test(e)) {
            //                 a[i] = e.split(/\n/);
            //             }
            //         });
            //     }
            // }]
            // ==========update chart================

            if ($scope.myChart) {
                $scope.myChart.data.labels = title;
                $scope.myChart.data.datasets[0].data = value;
                $scope.myChart.update();
                return;
            }

            //=========== create chart=================
            $scope.myChart = new Chart(ctx, {
                responsive: true,
                maintainAspectRatio: false,
                type: 'horizontalBar',
                data: {
                    labels: title,
                    datasets: [{
                        label: '',
                        data: value,
                        backgroundColor: [
                            'rgba(230, 25, 75, 0.3)',
                            'rgba(47, 71, 255, 0.2)',
                            'rgba(255, 225, 25, 0.4)',
                            'rgba(129, 72, 68, 0.2)',
                            'rgba(60, 180, 75, 0.6)',
                            'rgba(245, 130, 48, 0.5)',
                            'rgba(145, 30, 180, 0.4)',
                            'rgba(70, 240, 240, 0.3)',
                            'rgba(0, 128, 128, 0.5)',
                            'rgba(230, 190, 255, 0.3)',
                            'rgba(170, 110, 40, 0.4)',
                            'rgba(170, 255, 195, 0.2)',
                            'rgba(255, 215, 180, 0.6)',
                            'rgba(240, 50, 230, 0.7)',
                            'rgba(210, 245, 60, 0.2)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.3)',
                            'rgba(255, 159, 64, 0.4)',
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.6)'
                        ],
                        borderColor: [
                            'rgba(230, 25, 75, 1)',
                            'rgba(47, 71, 255, 1)',
                            'rgba(255, 225, 25, 1)',
                            'rgba(129, 72, 68, 1)',
                            'rgba(60, 180, 75, 1)',
                            'rgba(245, 130, 48, 1)',
                            'rgba(145, 30, 180, 1)',
                            'rgba(70, 240, 240,1)',
                            'rgba(0, 128, 128, 1)',
                            'rgba(230, 190, 255, 1)',
                            'rgba(170, 110, 40, 1)',
                            'rgba(170, 255, 195, 1)',
                            'rgba(255, 215, 180, 1)',
                            'rgba(240, 50, 230,1)',
                            'rgba(210, 245, 60, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(255,99,132,1)',
                            'rgba(54, 162, 235, 1)'
                        ],
                        borderWidth: 1,
                    }]
                },
                options: chartOptions,
                // plugins: chartPlugIns,
            });
        }


    }
})();