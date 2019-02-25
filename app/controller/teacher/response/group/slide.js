(function () {

    angular
        .module('myApp')
        .controller('responseOfSlideAnswerController', responseOfSlideAnswerController)

    responseOfSlideAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function responseOfSlideAnswerController($state, $scope, $rootScope, $sce) {
        // **************   router:    responseOfSlideAnswer  *****************

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupRoot");
        $scope.question = $rootScope.settings.question;
        $scope.properties = $scope.question.properties.map(function (pro, idx) {
            return pro.propertyquestion;
        });
        let optionCount = $scope.properties.length;
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')

            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        });


        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getUsers()
            $scope.getStGroups()
            $scope.getAnswers()
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users').orderByChild("Usertype").equalTo('Student');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.users = snapshot.val() || {};
                $scope.ref_1 = true;
                $scope.finalCalc()
            })
        }
        $scope.getStGroups = function () {
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
                $scope.ref_2 = true;
                $scope.finalCalc()
            })
        }
        $scope.getAnswers = function () {
            $scope.answersRef = firebase.database().ref('NewAnswers/' + $scope.question.code+ '/answer');
            $scope.answersRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {}
                $scope.ref_3 = true;
                $scope.finalCalc()
            })
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
            $scope.mainvalues = Array(optionCount).fill(0)
            $scope.othervalues = Array(optionCount).fill(0)
            $scope.totalvalues = Array(optionCount).fill(0)
            $scope.groupChoice = $scope.groupChoice ? $scope.groupChoice : 'main';
            $scope.maincount = 0;
            $scope.othercount = 0;
            $scope.totalcount = 0;
            $scope.numberOfAnswers = 0;
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

                let answer = $scope.allAnswers[userKey];
                let answerval = answer.answerval;

                if ($scope.studentsInGroup.indexOf(userKey) > -1) {
                    $scope.mainvalues = sumArray($scope.mainvalues, answerval);
                    $scope.maincount++;
                } else {
                    $scope.othervalues = sumArray($scope.othervalues, answerval);
                    $scope.othercount++;
                }
                $scope.totalvalues = sumArray($scope.totalvalues, answerval);
                $scope.totalcount++;
            }
            $scope.mainvalues = divArray($scope.mainvalues, $scope.maincount);
            $scope.othervalues = divArray($scope.othervalues, $scope.othercount);
            $scope.totalvalues = divArray($scope.totalvalues, $scope.totalcount);

            $scope.changeGroupChoice()
            $rootScope.setData('loadingfinished', true)
        }

        $scope.changeGroupChoice = function () {
            switch ($scope.groupChoice) {
                case 'main':
                    $scope.chartDescription = "Compared only in your group!";
                    $scope.numberOfAnswers = $scope.maincount;
                    $scope.paintgraph($scope.properties, $scope.mainvalues, "classchart")
                    break;
                case 'other':
                    $scope.chartDescription = "Compared to all groups except your group!";
                    $scope.numberOfAnswers = $scope.othercount;
                    $scope.paintgraph($scope.properties, $scope.othervalues, "classchart")
                    break;
                case 'all':
                    $scope.chartDescription = "Compared to all groups include your group!";
                    $scope.numberOfAnswers = $scope.totalcount;
                    $scope.paintgraph($scope.properties, $scope.totalvalues, "classchart")
                    break;
            }
            $rootScope.safeApply();
        }

        $scope.paintgraph = function (title, value, Dom) {
            if (title.length == 0) {
                $rootScope.error("Sorry,There is not any data!");
            }
            var canvas = document.getElementById(Dom);
            var ctx = canvas.getContext("2d");
            // ==========update chart================
            if ($scope.myChart1) {
                $scope.myChart1.data.labels = title;
                $scope.myChart1.data.datasets[0].data = value;
                $scope.myChart1.update();
                return;
            }

            //=========== create chart=================
            $scope.myChart1 = new Chart(ctx, {
                responsive: true,
                maintainAspectRatio: false,
                type: 'pie',
                data: {
                    labels: title,
                    datasets: [{
                        label: '# of Votes',
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
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
        }

    }
})();