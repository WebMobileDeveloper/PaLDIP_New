(function () {
	angular
		.module('myApp')
		.controller('groupResponseOfDropdownAnswerController', groupResponseOfDropdownAnswerController)
	groupResponseOfDropdownAnswerController.$inject = ['$state', '$scope', '$rootScope'];
	function groupResponseOfDropdownAnswerController($state, $scope, $rootScope) {
		// **************   router:    groupResponseOfDropdownAnswer  *****************

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

		var max_length = 60;
		let optionCount = $scope.question.options.length
		$scope.Lables = $scope.question.options;
		for (var i = 0; i < optionCount; i++) {
			if ($scope.Lables[i].length > max_length) {
				$scope.Lables[i] = $scope.Lables[i].substring(0, max_length) + "...";
			}
		}
		$rootScope.safeApply();

		$scope.$on("$destroy", function () {
			if ($scope.usersRef) $scope.usersRef.off('value')
			if ($scope.answersRef) $scope.answersRef.off('value')
		});

		$scope.init = function () {
			$rootScope.setData('loadingfinished', false)
			$scope.getUsers()
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
		$scope.getAnswers = function () {
			$scope.answersRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($scope.question.code);
			$scope.answersRef.on('value', function (snapshot) {
				$scope.allAnswers = {}
				for (var key in snapshot.val()) {
					var ansSnapshot = snapshot.val()[key];
					var checkSubGroup = true;
					if (groupType == 'second') {
						if (ansSnapshot.subIndex != $scope.subIndex || ansSnapshot.subSetKey != $scope.subSetKey) {
							checkSubGroup = false;
						}
					}
					if (ansSnapshot.groupType == groupType && ansSnapshot.studentgroupkey == $scope.groupKey
						&& ansSnapshot.groupSetKey == $scope.groupSetKey && checkSubGroup) {
						$scope.allAnswers[key] = ansSnapshot
					}
				}
				$scope.ref_2 = true;
				$scope.finalCalc()
			})
		}
		$scope.finalCalc = function () {
			if (!$scope.ref_1 || !$scope.ref_2) return

			switch ($scope.question.enableGroup) {
				case 'email':
					$scope.filterList = ['All Users']
					for (key in $scope.allAnswers) {
						let userKey = $scope.allAnswers[key].uid
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

			$scope.maincount = 0;
			$scope.othercount = 0;
			$scope.totalcount = 0;

			for (anskey in $scope.allAnswers) {
				let answer = $scope.allAnswers[anskey]
				let isMatched = true
				switch ($scope.question.enableGroup) {
					case 'email':
						if ($scope.selectedFilter != 'All Users' && $scope.users[answer.uid].institution != $scope.selectedFilter) isMatched = false
						break;
					default:
						break;
				}
				if (!isMatched) continue
				var checkSameSubGroup = true;
				if (groupType == 'sub') {
					if (answer.subIndex != $scope.subIndex) {
						checkSameSubGroup = false;
					}
				} else {
					if (answer.secondIndex != $scope.secondIndex) {
						checkSameSubGroup = false;
					}
				}

				let key = answer.answerkey;
				if (checkSameSubGroup) {
					$scope.mainvalues[key]++
					$scope.maincount++;
				} else {
					$scope.othervalues[key]++
					$scope.othercount++;
				}
				$scope.totalvalues[key]++
				$scope.totalcount++;
			}

			$rootScope.setData('loadingfinished', true)
			$rootScope.safeApply();
			$scope.changeGroupChoice();
		}

		$scope.changeGroupChoice = function () {
			switch ($scope.groupChoice) {
				case 'main':
					$scope.chartDescription = "Compared only in your group!";
					$scope.numberOfAnswers = $scope.maincount;
					$scope.paintgraph($scope.mainvalues, "pieChart");
					break;
				case 'other':
					$scope.chartDescription = "Compared to all groups except your group!";
					$scope.numberOfAnswers = $scope.othercount;
					$scope.paintgraph($scope.othervalues, "pieChart");
					break;
				case 'all':
					$scope.chartDescription = "Compared to all groups include your group!";
					$scope.numberOfAnswers = $scope.totalcount;
					$scope.paintgraph($scope.totalvalues, "pieChart");
					break;
			}
			$rootScope.safeApply();
		}


		$scope.paintgraph = function (value, Dom) {
			if ($scope.numberOfAnswers == 0) {
				$rootScope.error("Sorry,There is not any data!");
			}
			var canvas = document.getElementById(Dom);
			var ctx = canvas.getContext("2d");
			// ==========update chart================
			if ($scope.myChart) {
				$scope.myChart.data.labels = $scope.Lables;
				$scope.myChart.data.datasets[0].data = value;
				$scope.myChart.update();
				return;
			}

			//=========== create chart=================
			$scope.myChart = new Chart(ctx, {
				type: 'pie',
				data: {
					labels: $scope.Lables,
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