(function () {

    angular
        .module('myApp')
        .controller('teacherUploadExternalController', teacherUploadExternalController)

    teacherUploadExternalController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherUploadExternalController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacherLinkQuestions");
        $scope.question = $rootScope.settings.questionObj;
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.stGroupRef) $scope.stGroupRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false)
            $scope.getStudentsInGroup()
            $scope.getUsers()
            $scope.getAnswers()
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
        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val() || {};
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }
        $scope.getAnswers = function () {
            $scope.answerRef = firebase.database().ref('NewAnswers/' + $scope.question.code + '/answer');
            $scope.answerRef.on('value', function (snapshot) {
                $scope.allAnswers = snapshot.val() || {};
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            $scope.users = {}
            for (userKey in $scope.allUsers) {
                if ($scope.studentsInGroup.indexOf(userKey) > -1) {
                    $scope.users[$scope.allUsers[userKey].show_id] = $scope.allUsers[userKey]
                }
            }
            $scope.answers = []
            for (userKey in $scope.allAnswers) {
                if ($scope.studentsInGroup.indexOf(userKey) > -1) {
                    $scope.answers.push({
                        'Show ID': $scope.allUsers[userKey].show_id,
                        email: $scope.allUsers[userKey].ID,
                        id: $scope.allUsers[userKey].Userkey,
                        Result: $scope.allAnswers[userKey]
                    })
                }
            }
            $rootScope.setData("loadingfinished", true)
        }
        $scope.file_changed = function (element) {
            $scope.uploadData = {};
            var file = element.files[0];

            $scope.filename = file.name;
            var uploader = document.getElementById('uploader');
            uploader.value = 10;
            var reader = new FileReader();
            reader.readAsBinaryString(file);
            uploader.value = 20;
            reader.onload = function (evt) {
                $scope.$apply(function () {
                    uploader.value = 50;
                    var data = evt.target.result;
                    var workbook = XLSX.read(data, { type: 'binary' });
                    $scope.results = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    $scope.results.forEach(data => {
                        let show_id = data['Show ID']
                        if ($scope.users[show_id]) {
                            data.email = $scope.users[show_id].ID
                            data.id = $scope.users[show_id].Userkey
                            data.Result = Number(data.Result)
                            if (isNaN(data.Result)) {
                                data.Result = ""
                                data.checkValid = false
                            } else {
                                data.checkValid = true
                            }
                        } else {
                            data.checkValid = false
                        }
                    });
                    uploader.value = 100;
                    $rootScope.safeApply()
                });
            };
        }

        $scope.uploadResult = function () {
            if (!confirm("Are you sure want to add this results?")) return
            let updates = {}
            $scope.results = $scope.results || []
            $scope.results.forEach(data => {
                if (data.checkValid) {
                    updates[data.id] = data.Result
                }
            });
            firebase.database().ref('NewAnswers/' + $scope.question.code + '/answer').update(updates).then(function () {
                $rootScope.success('New data is added successfully!')
                $rootScope.safeApply();
            })
        }
        $scope.clearResult = function () {
            if (!confirm("Are you sure want to remove all group results?")) return
            let updates = {}
            $scope.answers.forEach(data => {
                updates[data.id] = {}
            });
            firebase.database().ref('NewAnswers/' + $scope.question.code + '/answer').update(updates).then(function () {
                $rootScope.success('All results are removed successfully!')
                $rootScope.safeApply();
            })
        }
    }
})();