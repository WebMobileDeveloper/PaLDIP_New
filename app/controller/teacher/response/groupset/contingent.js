(function () {
	angular
		.module('myApp')
		.controller('groupResponseOfContingentAnswerController', groupResponseOfContingentAnswerController)
	groupResponseOfContingentAnswerController.$inject = ['$state', '$scope', '$rootScope'];
	function groupResponseOfContingentAnswerController($state, $scope, $rootScope) {
		// **************   router:    groupResponseOfContingentAnswer  *****************

		$rootScope.setData('showMenubar', true);
		var groupType = $rootScope.settings.groupType;
		$rootScope.setData('backUrl', groupType == 'sub' ? "groupSubRoot" : "groupSecondRoot");

		$scope.question = $rootScope.settings.question;
		$scope.groupKey = $rootScope.settings.groupKey;
		$scope.groupSetKey = $rootScope.settings.groupSetKey;
		$scope.subIndex = $rootScope.settings.subIndex;
		$scope.subSetKey = $rootScope.settings.subSetKey;
		$scope.secondIndex = $rootScope.settings.secondIndex;
		$scope.groupChoice = $scope.groupChoice ? $scope.groupChoice : 'main';
		
		$scope.options = [];
		$scope.length = $scope.question.subQuestions.length;
		for (i = 0; i < Math.pow(2, $scope.length); i++) {
			$scope.options[i] = String("00000000000000" + i.toString(2)).slice(-1 * $scope.length);
			$scope.options[i] = $scope.options[i].replace(/0/g, "A");
			$scope.options[i] = $scope.options[i].replace(/1/g, "B");
		}
		$rootScope.safeApply();

		$scope.$on("$destroy", function () {
			if ($scope.answerRef) $scope.answerRef.off('value')
		});


		$scope.init = function () {
			$rootScope.setData('loadingfinished', false);
			$scope.answerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($scope.question.code);
			$scope.answerRef.on('value', function (snapshot) {
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
				for (var key in snapshot.val()) {
					var ansSnapshot = snapshot.val()[key];
					if (ansSnapshot.groupType == groupType
						&& ansSnapshot.studentgroupkey == $scope.groupKey
						&& ansSnapshot.groupSetKey == $scope.groupSetKey) {

						var answerArr = ansSnapshot['answer'];
						var ansIndex = $scope.getIndex(answerArr);

						var checkSameSubGroup = true;
						if (groupType == 'sub') {
							if (ansSnapshot.subIndex != $scope.subIndex) {
								checkSameSubGroup = false;
							}
						} else {
							if (ansSnapshot.secondIndex != $scope.secondIndex) {
								checkSameSubGroup = false;
							}
						}

						if (checkSameSubGroup) {
							$scope.mainvalues[ansIndex]++;
							$scope.maincount++;
						} else {
							$scope.othervalues[ansIndex]++;
							$scope.othercount++;
						}
						$scope.totalvalues[ansIndex]++;
						$scope.totalcount++;
					}
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
				$scope.changeGroupChoice();
				$rootScope.setData('loadingfinished', true);
				$rootScope.safeApply();
			});
		}
		$scope.getIndex = function (arr) {
			var ansIndex = 0;
			for (var i = 0; i < arr.length; i++) {
				ansIndex += arr[i] * Math.pow(2, arr.length - i - 1);
			}
			return ansIndex;
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
				type: 'horizontalBar',
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
					legend: {
						display: false
					},
					scales: {
						yAxes: [{
							ticks: {
								beginAtZero: true,
							},
							barPercentage: 0.5
						}],
						xAxes: [{
							// Change here
							gridLines: {
								display: false,
							},
							ticks: {
								beginAtZero: true,
								stepSize: 1
							}
						}]
					},
					elements: {
						rectangle: {
							borderSkipped: 'left'
						}
					}
				}
			});
		}
	}

})();