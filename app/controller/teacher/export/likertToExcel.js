(function () {

    angular
        .module('myApp')
        .controller('exportLikertToExcelController', exportLikertToExcelController)

    exportLikertToExcelController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function exportLikertToExcelController($state, $scope, $rootScope, $filter) {
        // **************   router:    exportLikertToExcel  *****************

        $rootScope.setData('showMenubar', true);
        var groupType = $rootScope.settings.groupType;
        switch (groupType) {
            case 'group':
                $rootScope.setData('backUrl', "groupRoot");
                // $scope.groupName = $rootScope.settings.groupName;
                break;
            case 'sub':
                $rootScope.setData('backUrl', "exportSub");
                $scope.title = $rootScope.settings.subGroupName;
                // $scope.groupName = $rootScope.settings.subGroupName;
                break;
            case 'second':
                $rootScope.setData('backUrl', "exportSecond");
                // $scope.groupName = $rootScope.settings.secondGroupName;
                break;
            default:
                break;
        }
        $scope.exportSetKey = $rootScope.settings.question.setKey;
        $scope.siblingSetKey = $rootScope.settings.question.siblingSetKey;
        
        $scope.$on('$destroy', function () {
            if ($scope.allSetsRef) $scope.allSetsRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.groupRef) $scope.groupRef.off('value')
            if ($scope.ansRef) $scope.ansRef.off('value')
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
        })

        $scope.initExport = function () {
            $rootScope.setData('loadingfinished', false);

            $scope.refCount = 0;
            $scope.getSetData();
            $scope.getUsers();
            $scope.getGroups()
            $scope.getAnswers();
        }

        $scope.getSetData = function () {
            //============================================================ 
            if ($scope.siblingSetKey) {
                $scope.allSetsRef = firebase.database().ref('QuestionSets/').orderByChild('siblingSetKey').equalTo($scope.siblingSetKey)
            } else {
                $scope.allSetsRef = firebase.database().ref('QuestionSets/').orderByKey().equalTo($scope.exportSetKey)
            }
            $scope.allSetsRef.on('value', function (snapshot) {
                var allSets = snapshot.val() || {}
                $scope.setData = allSets[$scope.exportSetKey]
                if ($scope.siblingSetKey) {
                    $scope.setData.options = allSets[$scope.siblingSetKey].options || []
                    $scope.setData.optionScores = allSets[$scope.siblingSetKey].optionScores
                    $scope.setData.subscales = allSets[$scope.siblingSetKey].subscales || {}
                    $scope.setData.superscales = allSets[$scope.siblingSetKey].superscales || {}
                }

                if (!$scope.setData.optionScores) {
                    $scope.setData.optionScores = [];
                    for (var i = 0; i < $scope.setData.options.length; i++) {
                        $scope.setData.optionScores.push(i + 1);
                    }
                }
                if ($scope.setData.subscales == undefined) {
                    $scope.noAnswerMessage = 'There isn\'t any subscales in ths questionset.';
                    $rootScope.setData('loadingfinished', true);
                } else {
                    $scope.subscales = [];
                    $scope.reversedScaleQKeys = [];   //subscaleQuestionKeys[scale index][questions]
                    for (var key in $scope.setData.subscales) {
                        var scale = $scope.setData.subscales[key];
                        scale.key = key;
                        $scope.subscales.push(scale);
                        $scope.reversedScaleQKeys.push(scale.reversed || []);
                    }
                    for (var key in $scope.setData.superscales) {
                        var scale = $scope.setData.superscales[key];
                        scale.key = key;
                        $scope.subscales.push(scale);
                        $scope.reversedScaleQKeys.push([]);
                    }
                    for (var i = 0; i < $scope.subscales.length; i++) {
                        if ($scope.subscales[i].order == undefined) $scope.subscales[i].order = 65535;
                    }
                    $scope.subscales = $filter('orderBy')($scope.subscales, 'order');
                    $scope.subscaleKeys = [];
                    $scope.subscales.forEach(element => {
                        $scope.subscaleKeys.push(element.key);
                    });
                }
                if ($scope.refCount == 3) {
                    $scope.calcData()
                } else {
                    $scope.refCount++
                }
            });
        }
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.users = {};
                if (snapshot.val()) {
                    snapshot.forEach(function (childsnapshot) {
                        $scope.users[childsnapshot.key] = childsnapshot.val();
                        if (childsnapshot.key == $rootScope.settings.teacherId) {
                            $scope.anonym_enabled = childsnapshot.val().anonym_enabled;
                            $rootScope.safeApply();
                        }
                    });
                }
                if ($scope.refCount == 3) {
                    $scope.calcData()
                } else {
                    $scope.refCount++
                }
            });
        }
        $scope.getGroups = function () {
            $scope.groupRef = firebase.database().ref('StudentGroups');
            $scope.groupRef.once('value', function (studentGroups) {
                $scope.studentsInGroup = [];
                var studentGroup = studentGroups.val();
                for (var studentKey in studentGroup) {
                    var obj = studentGroup[studentKey];
                    if (Object.values(obj).indexOf($rootScope.settings.groupKey) > -1) {
                        $scope.studentsInGroup.push(studentKey);
                    }
                }
                if ($scope.refCount == 3) {
                    $scope.calcData()
                } else {
                    $scope.refCount++
                }
            })
        }

        $scope.getAnswers = function () {
            switch ($rootScope.settings.groupType) {
                case 'group':
                    $scope.ansRef = firebase.database().ref('LikertAnswer/' + $scope.exportSetKey)
                    break;
                case 'sub':
                    $scope.ansRef = firebase.database().ref('GroupLikertAnswer/' + $scope.exportSetKey + '/' + $rootScope.settings.groupKey + '/' + $rootScope.settings.groupSetKey + '/' +
                        $rootScope.settings.subIndex + '/answers/')
                    break;
                case 'second':
                    $scope.ansRef = firebase.database().ref('/GroupLikertAnswer/' + $scope.exportSetKey + '/' + $rootScope.settings.groupKey + '/' + $rootScope.settings.groupSetKey + '/' +
                        $rootScope.settings.subIndex + '/groupset/' + $rootScope.settings.subSetKey + '/' + $rootScope.settings.secondIndex)
                    break;
                default:
                    break;
            }

            $scope.ansRef.on('value', function (snapshot) {
                $scope.tempAnswers = snapshot.val() || {};
                if ($scope.refCount == 3) {
                    $scope.calcData()
                } else {
                    $scope.refCount++
                }
            });
        }

        $scope.calcData = function () {
            var tempAnswers = {}
            $scope.answers = [];

            for (var userKey in $scope.tempAnswers) {
                if ($scope.studentsInGroup.indexOf(userKey) > -1) {
                    tempAnswers[userKey] = angular.copy($scope.tempAnswers[userKey].answer)
                }
            }
            var optionCount = $scope.setData.options.length;
            for (var userId in tempAnswers) {
                var userScaleAnswers = [];
                var userAnswers = tempAnswers[userId];

                for (var scaleIndex = 0; scaleIndex < $scope.subscales.length; scaleIndex++) {
                    var scaleData = $scope.subscales[scaleIndex];
                    var qstArr = scaleData.questions || [];
                    var reversedArr = $scope.reversedScaleQKeys[scaleIndex];
                    var allAnswered = true;
                    var sum = 0;

                    for (var qstIndex = 0; qstIndex < qstArr.length; qstIndex++) {
                        var qstKey = qstArr[qstIndex];
                        if (userAnswers[qstKey] != undefined) {
                            if (reversedArr.indexOf(qstKey) > -1) {
                                sum += $scope.setData.optionScores[optionCount - 1 - userAnswers[qstKey]];
                            } else {
                                sum += $scope.setData.optionScores[userAnswers[qstKey]];
                            }
                        } else {
                            allAnswered = false;
                        }
                    }

                    var calcValue = '';
                    if (allAnswered) {                              // if answered for all subscale questions
                        if (scaleData.questions) {
                            if (scaleData.method == "Sum") {
                                calcValue = sum;
                            } else {
                                calcValue = Math.round(sum / qstArr.length * 100) / 100;
                            }
                        }
                    }
                    userScaleAnswers.push(calcValue);
                }
                // calc superscale result
                for (var i = 0; i < userScaleAnswers.length; i++) {
                    if ($scope.subscales[i].subscales) {
                        sum = 0
                        $scope.subscales[i].subscales.forEach(function (subscale) {
                            var scaleIndex = $scope.subscaleKeys.indexOf(subscale.subscaleKey);
                            if (subscale.operator == '+') {
                                sum += userScaleAnswers[scaleIndex];
                            } else {
                                sum -= userScaleAnswers[scaleIndex];
                            }
                        })
                        userScaleAnswers[i] = sum
                        if ($scope.subscales[i].average) {
                            userScaleAnswers[i] = userScaleAnswers[i] / $scope.subscales[i].subscales.length;
                        }
                        userScaleAnswers[i] = Math.round(userScaleAnswers[i] * 100) / 100
                    }
                }

                var rowData = {};
                rowData['Userkey'] = $scope.users[userId].Userkey;
                rowData['mail'] = $scope.users[userId].ID;
                rowData['show_id'] = ($scope.anonymous) ? "Anonymous" : $scope.users[userId].show_id;
                rowData['answer'] = userScaleAnswers;
                rowData['Age'] = $scope.users[userId].age;
                rowData['Country'] = $scope.users[userId].country;
                rowData['Gender'] = $scope.users[userId].gender;
                rowData['Profession'] = $scope.users[userId].profession;
                rowData['Mothertongue'] = $scope.users[userId].countrylanguage;
                rowData['datetime'] = $scope.tempAnswers[userId].datetime;
                $scope.answers.push(rowData);
            }
            if ($scope.answers.length == 0) {
                $scope.noAnswerMessage = 'There isn\'t any answer in ths questionset.';
            }
            $rootScope.setData('loadingfinished', true);
        }
        $scope.change_show_user = function () {
            $scope.show_email = !$scope.show_email;
        }
    }
})();