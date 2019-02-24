(function () {

    angular
        .module('myApp')
        .controller('SlideAnswerController', SlideAnswerController)

    SlideAnswerController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function SlideAnswerController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "questions");
        $scope.question = $rootScope.settings.questionObj;
        let fieldCount = $scope.question.properties.length;
        if ($scope.question.videoID) {
            $scope.videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.propertiesRef) $scope.propertiesRef.off('value')
            if ($rootScope.questionImageRef) $rootScope.questionImageRef.off('value')
        });
        $scope.getSlides = function () {
            if ($rootScope.settings.prevAnswer) {
                $scope.paintgraph($rootScope.settings.prevAnswer, $rootScope.settings.prevAnswerVal, "pieChartforSlide2");
            } else {
                $scope.slidetitles = [];
                $scope.slidegraph = [];
                let total = 0;
                $scope.question.properties.forEach((field, index) => {
                    $scope.slidetitles[index] = field.propertyquestion;
                    if ($scope.question.isContingent) {
                        if (index < fieldCount - 1) {
                            $scope.slidegraph[index] = Math.round(100 / fieldCount);
                            total += $scope.slidegraph[index];
                        } else {
                            $scope.slidegraph[index] = 100 - total;
                        }
                    } else {
                        $scope.slidegraph[index] = 0;
                    }
                });
                $rootScope.safeApply();
                $scope.paintgraph($scope.slidetitles, $scope.slidegraph, "pieChartforSlide1");
            }
        }

        $scope.implementgraph = function (index) {
            if ($scope.question.isContingent) {
                if ($scope.timeoutRef) {
                    clearTimeout($scope.timeoutRef);
                }
                $scope.timeoutRef = setTimeout(function () {
                    updateSlide(index);
                }, 500);
            } else {
                $rootScope.safeApply();
                $scope.paintgraph($scope.slidetitles, $scope.slidegraph, "pieChartforSlide1")
            }
        }
        function updateSlide(index) {
            let tempSlide = angular.copy($scope.slidegraph);
            let remained = 0;
            for (i = 0; i < fieldCount; i++) {
                if (i != index) remained += tempSlide[i];
            }
            let total = 0
            for (i = 0; i < fieldCount; i++) {
                if (i != index) {
                    let ratio = remained > 0 ? tempSlide[i] / remained : 1 / (fieldCount - 1);
                    tempSlide[i] = Math.round((100 - tempSlide[index]) * ratio);
                }
                if (i < fieldCount - 1) {
                    total += tempSlide[i];
                } else {
                    tempSlide[i] = 100 - total;
                }
            };
            $scope.slidegraph = angular.copy(tempSlide)
            $rootScope.safeApply();
            $scope.paintgraph($scope.slidetitles, $scope.slidegraph, "pieChartforSlide1")
        }
        $scope.saveslideanswer = function () {
            var updates = {};           
            updates['/NewAnswers/' + $rootScope.settings.questionKey + '/' + 'question'] = $rootScope.settings.questionString;
            updates['/NewAnswers/' + $rootScope.settings.questionKey + '/answer/' + $rootScope.settings.userId + '/answer'] = $scope.slidetitles;
            updates['/NewAnswers/' + $rootScope.settings.questionKey + '/answer/' + $rootScope.settings.userId + '/answerval'] = $scope.slidegraph;
            updates['/NewAnswers/' + $rootScope.settings.questionKey + '/answer/' + $rootScope.settings.userId + '/mail'] = $rootScope.settings.userEmail;
            updates['/NewAnswers/' + $rootScope.settings.questionKey + '/answer/' + $rootScope.settings.userId + '/datetime'] = getDateTime();

            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Your Answer is Saved Successfully!');
                $rootScope.setData('prevAnswer', $scope.slidetitles);
                $rootScope.setData('prevAnswerVal', $scope.slidegraph);
                if ($rootScope.settings.disabledQuestion) {
                    $state.reload();
                    return;
                }
                $state.go('viewSlide');
            }).catch(function (error) {
                $rootScope.error('Submit Error!')
            });

        }
        $scope.goNext = function () {
            if ($rootScope.settings.disabledQuestion) {
                $rootScope.warning('This question is disabled to see answer now.');
            } else {
                $state.go('viewSlide');
            }
        }
        $scope.paintgraph = function (title, value, Dom) {
            if (title.length == 0) {
                $rootScope.error("Sorry,There is not any data!");
            }
            var canvas = document.getElementById(Dom);
            var ctx = canvas.getContext("2d");
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