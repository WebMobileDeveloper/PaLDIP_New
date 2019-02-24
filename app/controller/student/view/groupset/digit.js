(function () {

    angular
        .module('myApp')
        .controller('GroupDigitViewController', GroupDigitViewController)

    GroupDigitViewController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function GroupDigitViewController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "groupDigitAnswer");
        $scope.question = $rootScope.settings.questionObj;
        if ($scope.question.result_videoID) {
            $scope.question.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.result_videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        $rootScope.safeApply();

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.questionResultImageRef) $rootScope.questionResultImageRef.off('value')
            if ($scope.answerRef) $scope.answerRef.off('value')
        });

        //Get Class Average Answer
        $scope.getclassAverage = function () {
            var sumval = 0;
            var i = 0;
            $scope.averageanswer = " ";
            $scope.answerRef = firebase.database().ref('GroupAnswers').orderByChild('questionKey').equalTo($rootScope.settings.questionKey);
            $scope.answerRef.on('value', function (snapshot) {
                for (var key in snapshot.val()) {
                    var ansSnapshot = snapshot.val()[key];
                    var checkSecond = true;
                    if ($rootScope.settings.groupType == 'second') {
                        if (ansSnapshot.subSetKey != $rootScope.settings.subSetKey || ansSnapshot.secondIndex != $rootScope.settings.secondIndex) {
                            checkSecond = false;
                        }
                    }

                    if (ansSnapshot.groupType == $rootScope.settings.groupType && ansSnapshot.studentgroupkey == $rootScope.settings.groupKey
                        && ansSnapshot.groupSetKey == $rootScope.settings.groupSetKey && ansSnapshot.subIndex == $rootScope.settings.subIndex && checkSecond) {
                        sumval += ansSnapshot['answer'];
                        i++;
                    }
                }
                if (sumval && i) {
                    $scope.averageanswer = (sumval / i).toFixed(1);
                } else {
                    $scope.averageanswer = 0;
                }
                $rootScope.safeApply()
            });
        }
    }
})();