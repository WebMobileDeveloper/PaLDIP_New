(function () {

    angular
        .module('myApp')
        .controller('teacherLinkQuestionsController', teacherLinkQuestionsController)

    teacherLinkQuestionsController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherLinkQuestionsController($state, $scope, $rootScope, $filter) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "teacherLinkGroupDetail");
        // $scope.questionSet = $rootScope.settings.questionSet;
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.linkRef) $scope.linkRef.off('value')
            if ($scope.setRef) $scope.setRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
            if ($scope.hideRef) $scope.hideRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getLinks();
            $scope.getSetData();
            $scope.getAllQuestions();
            $scope.getHideState();
        }
        $scope.getLinks = function () {
            $scope.linkRef = firebase.database().ref('Links');
            $scope.linkRef.on('value', function (snapshot) {
                $scope.links = {};
                $scope.allLinks = snapshot.val() || {}
                for (key in $scope.allLinks) {
                    let link = $scope.allLinks[key];
                    if (link.groupKey == $rootScope.settings.groupKey &&
                        link.linkType == 'question' &&
                        link.setKey == $rootScope.settings.questionSetKey &&
                        link.groupType == undefined) {
                        $scope.links[link.questionKey] = link;
                    }
                }
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }

        $scope.getSetData = function () {
            $scope.setRef = firebase.database().ref('QuestionSets/' + $rootScope.settings.questionSetKey);
            $scope.setRef.on('value', function (snapshot) {
                $scope.setData = snapshot.val() || {};
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }
        $scope.getAllQuestions = function () {
            $scope.qstRef = firebase.database().ref('Questions/').orderByChild('Set').equalTo($rootScope.settings.questionSetKey)
            $scope.qstRef.on('value', function (snapshot) {
                $scope.questions = [];
                snapshot.forEach(function (childSnapshot) {
                    var question = childSnapshot.val();
                    if (question.teamRate) return;
                    if (!question.hideBy || question.hideBy == $rootScope.settings.teacherId || question.teamRate) {
                        question.key = childSnapshot.key;
                        $scope.questions.push(question);
                    }
                });
                $scope.questions = $filter('orderBy')($scope.questions, 'order');
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }
        $scope.getHideState = function () {
            $scope.hideRef = firebase.database().ref('HiddenQuestions/' + $rootScope.settings.groupKey + '/' + $rootScope.settings.questionSetKey);
            $scope.hideRef.on('value', function (snapshot) {
                $scope.hides = snapshot.val() || {};
                $scope.ref_4 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return
            var length = $scope.questions.length;
            if (length == 0) {
                $rootScope.warning("There isn't any question data.");
            } else {
                $scope.questions.map(function (question) {
                    if ($scope.hides[question.key]) {
                        question.hide = true;
                    } else {
                        question.hide = false;
                    }
                });
            }
            $rootScope.setData('loadingfinished', true);
        }
        $scope.setHideState = function (qst) {
            var newState = qst.hide ? {} : true;
            var hideRef = firebase.database().ref('HiddenQuestions/' + $rootScope.settings.groupKey + '/' + $rootScope.settings.questionSetKey + '/' + qst.key);
            hideRef.set(newState);
        }

        $scope.setScore = function (obj) {
            $rootScope.setData("questionObj", obj)
            switch (obj.questionType) {
                case 'Feedback Type':
                    $state.go('teacherGiveFeedback');
                    break;
                case 'Rating Type':
                    $state.go('teacherRating');
                    break;
                case 'Text Type':
                    $state.go('teacherGiveScore');
                    break;
                case 'External Activity':
                    $state.go('teacherUploadExternal');
                    break;
            }
        }

        //  ==================link functions ===================
        $scope.addLink = function (qst) {
            var link = {
                teacherId: $rootScope.settings.teacherId,
                groupKey: $rootScope.settings.groupKey,
                setKey: $rootScope.settings.questionSetKey,
                questionKey: qst.key,
                questionType: qst.questionType,
                linkType: 'question',
                key: $scope.getCode(),
            };
            firebase.database().ref('Links/' + link.key).set(link);
        }
        
        $scope.copyToClipboard = function (qstKey) {
            var str = $scope.links[qstKey].key;
            str = window.location.origin + '/directLink/' + str;
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(str).select();
            document.execCommand("copy");
            $temp.remove();
        }

        $scope.deletelink = function (qstKey) {
            var key = $scope.links[qstKey].key;
            firebase.database().ref('Links/' + key).set({});
        }
        $scope.getCode = function () {
            var chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
            var new_id = '';
            do {
                new_id = '';
                for (var i = 0; i < 5; i++) {
                    new_id += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (Object.keys($scope.allLinks).indexOf(new_id) > -1);
            return new_id;
        }
    }
})();