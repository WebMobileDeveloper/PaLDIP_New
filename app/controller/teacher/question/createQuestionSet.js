(function () {

    angular
        .module('myApp')
        .controller('createQuestionSetController', createQuestionSetController)

    createQuestionSetController.$inject = ['$state', '$scope', '$rootScope'];



    function createQuestionSetController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacherQuestion");
        $scope.scaleType = ['Profile Only', 'Profile + Graph'];
        $scope.selectedRadio = 0;
        $scope.setType = "General";
        $scope.optionCount = 2;
        $scope.options = [{ value: 1 }, { value: 2 }];
        $scope.instructions = { text: '' };
        $scope.method = "Average";
        $scope.private_type = false
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($scope.setsRef) $scope.setsRef.off('value');
        });

        $scope.init = function () {
            $scope.getAllSets();
            $scope.getTeacherData();
        }

        $scope.getAllSets = function () {
            $scope.setsRef = firebase.database().ref('QuestionSets');
            $scope.setsRef.on('value', function (snapshot) {
                $scope.allSets = snapshot.val() || {};
                $scope.newSetKey = $scope.getCode();
                $rootScope.safeApply();
            });
        }
        $scope.getCode = function () {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghijklmnopqrstuvwxyz1234567890'.split('');
            var new_id = '';
            do {
                new_id = '';
                for (var i = 0; i < 4; i++) {
                    new_id += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (Object.keys($scope.allSets).indexOf(new_id) > -1);
            return new_id;
        }

        $scope.getTeacherData = function () {
            $rootScope.setData('loadingfinished', false);
            var userRef = firebase.database().ref('Users/' + $rootScope.settings.userId);
            userRef.on('value', function (snapshot) {
                $scope.userData = snapshot.val();
                $rootScope.safeApply();
                $rootScope.loadTags();
                $rootScope.setData('loadingfinished', true);
            });
        }

        //==========================Start of Likert Type questionset functions
        $scope.incCount = function () {
            if ($scope.optionCount < 10) {
                $scope.optionCount++;
                $scope.options.push({ value: $scope.optionCount });
            }
            $rootScope.safeApply();
        }
        $scope.decCount = function () {
            if ($scope.optionCount > 2) {
                $scope.optionCount--;
                $scope.options.pop();
            }
            $rootScope.safeApply();
        }
        $scope.scaleTypeChanged = function (selectedRadio) {
            $scope.selectedRadio = selectedRadio
        }
        //-------------------------End of Likert Type questionset functions


        $scope.creatQuestionSet = function () {
            $scope.setname = $scope.setname || ''
            $scope.setname = $scope.setname.trim()
            if (!$scope.setname) {
                $rootScope.error("Please insert Question Set name.");
                return;
            }

            var uid = $rootScope.settings.userId;
            var tags = "";
            $rootScope.selectedTags.forEach(function (tagObj) {
                if (tags == "") {
                    tags = tagObj.name;
                } else {
                    tags += "," + tagObj.name;
                }
            });

            var Setdetails = { setname: $scope.setname, creator: uid, tags: tags, private: $scope.private_type };		//General Question set
            switch ($scope.setType) {
                case 'Likert':
                    Setdetails.LikertType = true;
                    Setdetails.graph = ($scope.selectedRadio == 1) ? true : false;
                    Setdetails.optionCount = $scope.optionCount;
                    Setdetails.method = $scope.method;
                    Setdetails.options = [];
                    Setdetails.isDraft = true
                    if ($scope.yLabel) {
                        Setdetails.yLabel = $scope.yLabel;
                    } else {
                        Setdetails.yLabel = "";
                    }

                    if ($scope.instructions.text) {
                        Setdetails.instructions = $scope.instructions.text;
                    }
                    for (var i = 0; i < $scope.optionCount; i++)
                        Setdetails.options.push($scope.options[i].value);
                    break;
                case 'Multiple':
                    Setdetails.MultipleType = true;
                    break;
                default:
                    break;
            }
            for (setKey in $scope.allSets) {
                var setname = $scope.allSets[setKey].setname.trim()
                if ($scope.setname == setname) {
                    $rootScope.error("This Question Set name is already exist.");
                    $rootScope.safeApply();
                    return;
                }
            }

            Setdetails.key = $scope.newSetKey
            $scope.questionSetKey = $scope.newSetKey
            firebase.database().ref('QuestionSets/' + $scope.newSetKey).set(Setdetails).then(() => {
                var tagRef = firebase.database().ref('Tags');
                $rootScope.selectedTags.forEach(function (tagObj) {
                    if (tagObj.type == 'new') tagRef.push(tagObj.name);
                });

                $rootScope.setData('questionSetKey', $scope.questionSetKey);
                $rootScope.setData('createdByMe', true);
                $rootScope.setData('creatorEmail', $scope.userData.ID);
                $rootScope.setData('creatorNickName', $scope.userData.nick_name);

                $rootScope.setData('questionSetName', $scope.setname);
                $rootScope.setData('backUrlInChoice', 'createQuestionSet');
                $rootScope.setData('setType', $scope.setType);

                $rootScope.safeApply();
                $rootScope.success('Question Set is created successfully!');

                switch ($scope.setType) {
                    case 'Likert':
                        $state.go('createByLikert');
                        break;
                    case 'Multiple':
                        $rootScope.setData('backUrl', "choiceQuestionType");
                        $state.go('createByMultiple');
                        break;
                    default:
                        $rootScope.setData('backUrl', 'createQuestionSet');
                        $state.go('choiceQuestionType');
                        break;
                }
            })
        }
    }

})();