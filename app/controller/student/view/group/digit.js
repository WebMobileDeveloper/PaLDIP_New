(function () {

    angular
        .module('myApp')
        .controller('DigitViewController', DigitViewController)

    DigitViewController.$inject = ['$state', '$scope', '$rootScope', '$sce'];

    function DigitViewController($state, $scope, $rootScope, $sce) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "digitAnswer");
        $rootScope.safeApply();
        $scope.question = $rootScope.settings.questionObj;
        if ($scope.question.result_videoID) {
            $scope.question.result_videoURL = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + $scope.question.result_videoID + "?rel=0&enablejsapi=1");
            $rootScope.removeRecommnedVideo()
        }
        //Get Class Average Answer

        $scope.$on("$destroy", function () {
            if ($rootScope.instFeedRef) $rootScope.instFeedRef.off('value');
            if ($rootScope.questionResultImageRef) $rootScope.questionResultImageRef.off('value')
            if ($rootScope.privateNoteRef) $rootScope.privateNoteRef.off('value')
            if ($rootScope.publicNoteRef) $rootScope.publicNoteRef.off('value')
            if ($rootScope.teacherNoteRef) $rootScope.teacherNoteRef.off('value')
            if ($scope.classAnswerRef) $scope.classAnswerRef.off('value')
        });
        $scope.getclassAverage = function () {
            var sumval = 0;
            var i = 0;
            $scope.averageanswer = " ";
            $scope.classAnswerRef = firebase.database().ref('NewAnswers/' + $rootScope.settings.questionKey + '/answer');
            $scope.classAnswerRef.on('value', function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    sumval += childSnapshot.val()['answer'];
                    i++;
                });
                if (sumval && i) {
                    $scope.averageanswer = (sumval / i).toFixed(1);
                } else {
                    $scope.averageanswer = 0;
                }
                $rootScope.safeApply();
            })
        }

    }
})();