(function () {

    angular
        .module('myApp')
        .controller('teacherLinkGroupQuestionsController', teacherLinkGroupQuestionsController)

    teacherLinkGroupQuestionsController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherLinkGroupQuestionsController($state, $scope, $rootScope, $filter) {

        $rootScope.setData('showMenubar', true);
        var groupType = $rootScope.settings.groupType;

        $rootScope.setData('showMenubar', true);
        if (groupType == 'sub') {
            $rootScope.setData('backUrl', "teacherLinkSubGroupDetail");
            $scope.questionSetKey = $rootScope.settings.questionSetKey1;
        } else {
            $rootScope.setData('backUrl', "teacherLinkSecondGroupDetail");
            $scope.questionSetKey = $rootScope.settings.questionSetKey2;
        }
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.linkRef) $scope.linkRef.off('value')
            if ($scope.setRef) $scope.setRef.off('value')
            if ($scope.qstRef) $scope.qstRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getLinks();
            $scope.getSetData();
            $scope.getAllQuestions();
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
                        link.setKey == $scope.questionSetKey &&
                        link.groupType == groupType &&
                        link.groupSetKey == $rootScope.settings.groupSetKey) {
                        if (groupType == 'second' && link.subSetKey != $rootScope.settings.subSetKey) continue;
                        $scope.links[link.questionKey] = link;
                    }
                }
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        }
        $scope.getSetData = function () {
            //============================================================            
            // $scope.loopCount++;
            $scope.setRef = firebase.database().ref('QuestionSets/' + $scope.questionSetKey);
            $scope.setRef.on('value', function (snapshot) {
                $scope.setData = snapshot.val();
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }

        $scope.getAllQuestions = function () {
            var qtdata = firebase.database().ref('Questions/').orderByChild('Set').equalTo($scope.questionSetKey);
            qtdata.on('value', function (snapshot) {
                $scope.questions = [];
                snapshot.forEach(function (childSnapshot) {
                    var question = childSnapshot.val();
                    if (question.questionType == 'Answer Type') return;
                    if (!question.hideBy || question.hideBy == $rootScope.settings.teacherId) {
                        question.key = childSnapshot.key;
                        $scope.questions.push(question);
                    }
                });
                if ($scope.questions.length == 0) {
                    $rootScope.warning("There isn't any question data.");
                }
                $scope.questions = $filter('orderBy')($scope.questions, 'order');
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return;
            $rootScope.setData('loadingfinished', true);
        }
        $scope.setScore = function (obj) {
            if (obj.questionType == 'Feedback Type') {
                $rootScope.setData("questionObj", obj)
                $state.go('teacherGiveGroupFeedback');
            } else if (obj.questionType == 'Rating Type') {
                $rootScope.setData("questionObj", obj)
                $state.go('teacherGroupRating');
            }
        }
        //  ==================link functions ===================
        $scope.addLink = function (qst) {
            var link = {
                teacherId: $rootScope.settings.teacherId,
                groupKey: $rootScope.settings.groupKey,
                setKey: $scope.questionSetKey,
                questionKey: qst.key,
                questionType: qst.questionType,
                linkType: 'question',
                groupType: groupType,
                groupSetKey: $rootScope.settings.groupSetKey,
                key: $scope.getCode(),
            };
            if (groupType == 'second') {
                link.subSetKey = $rootScope.settings.subSetKey;
            }
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