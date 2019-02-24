(function () {
	angular
		.module('myApp')
		.controller('groupResponseOfDropdownAnswerController', groupResponseOfDropdownAnswerController)
	groupResponseOfDropdownAnswerController.$inject = ['$state', '$scope', '$rootScope'];
	function groupResponseOfDropdownAnswerController($state, $scope, $rootScope) {

		$rootScope.setData('showMenubar', true);
		$rootScope.setData('backUrl', "groupRoot");
		$scope.question = $rootScope.settings.question;
		$scope.groupSetKey = $rootScope.settings.groupSetKey;
		$scope.subSetKey = $rootScope.settings.subSetKey;
		$scope.groupsets = $rootScope.settings.groupsets;
		$scope.subNames = ["All Sub Groups"];
		$scope.secondNames = ["All 2nd Sub Groups"];
		var max_length = 60;
		let optionCount = $scope.question.options.length
		$scope.Lables = $scope.question.options;
		for (var i = 0; i < optionCount; i++) {
			if ($scope.Lables[i].length > max_length) {
				$scope.Lables[i] = $scope.Lables[i].substring(0, max_length) + "...";
			}
		}
		for (var i = 0; i < $scope.groupsets.count; i++) {
            let name = $scope.groupsets.data.groups[i].name || $scope.groupsets.name + ' ' + (i + 1);
            $scope.subNames.push(name);
        }


        if ($rootScope.settings.groupType == 'second') {
            for (var i = 0; i < $scope.groupsets.subgroupsets[$scope.subSetKey].count; i++) {
                let name = $scope.groupsets.data.groups[0].subgroupsets[$scope.subSetKey].groups[i].name || $scope.groupsets.subgroupsets[$scope.subSetKey].name + ' ' + (i + 1);
                $scope.secondNames.push(name);
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
					if ($rootScope.settings.groupType == 'second') {
						if (ansSnapshot.subSetKey != $scope.subSetKey) {
							checkSubGroup = false;
						}
					}

					if (ansSnapshot.groupType == $rootScope.settings.groupType && ansSnapshot.studentgroupkey == $rootScope.settings.groupKey
						&& ansSnapshot.groupSetKey == $rootScope.settings.groupSetKey && checkSubGroup) {
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
			
			$scope.answers = [];
			for (var i = 0; i < $scope.subNames.length; i++) {
				for (var j = 0; j < $scope.secondNames.length; j++) {
					$scope.answers.push({
						values: Array(optionCount).fill(0),
						total: 0,
					});
				}
			}

			for (anskey in $scope.allAnswers) {
				var answer = $scope.allAnswers[anskey];
				var answerkey = answer.answerkey;

				let isMatched = true
				switch ($scope.question.enableGroup) {
					case 'email':
						if ($scope.selectedFilter != 'All Users' && $scope.users[answer.uid].institution != $scope.selectedFilter) isMatched = false
						break;
					default:
						break;
				}
				if (!isMatched) continue

				$scope.answers[0].values[answerkey]++
				$scope.answers[0].total++;

				var index = answer.subIndex + 1;
				$scope.answers[index].values[answerkey]++
				$scope.answers[index].total++;


				if ($rootScope.settings.groupType == 'second') {
					index = (answer.subIndex + 1) * $scope.secondNames.length;
					$scope.answers[index].values[answerkey]++
					$scope.answers[index].total++;

					index = (answer.subIndex + 1) * $scope.secondNames.length + answer.secondIndex + 1;
					$scope.answers[index].values[answerkey]++
					$scope.answers[index].total++;
				}
			}
			$scope.GroupIndex = $scope.GroupIndex == undefined ? 0 : $scope.GroupIndex;
			$scope.SubGroupIndex = $scope.SubGroupIndex == undefined ? 0 : $scope.SubGroupIndex;
			$scope.changeGroup();
			$rootScope.setData('loadingfinished', true)
			$rootScope.safeApply();
		}

		$scope.changeGroup = function () {
			$scope.selectedIndex = $scope.GroupIndex * $scope.secondNames.length + $scope.SubGroupIndex;
			$scope.chartDescription = ""
			$scope.drawDropdownAnswerChart();
			$rootScope.safeApply();
		}

		$scope.drawDropdownAnswerChart = function () {
			var data = $scope.answers[$scope.selectedIndex];
			$scope.numberOfAnswers = data.total;
			$scope.paintgraph(data.values, "pieChart");
			$rootScope.safeApply();
		}
		$scope.paintgraph = function (value, Dom) {
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