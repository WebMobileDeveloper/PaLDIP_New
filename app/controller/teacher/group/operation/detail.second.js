(function () {

    angular
        .module('myApp')
        .controller('teacherLinkSecondGroupDetailController', teacherLinkSecondGroupDetailController)

    teacherLinkSecondGroupDetailController.$inject = ['$state', '$scope', '$rootScope', '$filter'];

    function teacherLinkSecondGroupDetailController($state, $scope, $rootScope, $filter) {

        var uid = $rootScope.settings.userId;
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', 'teacherLinkSubGroupDetail');
        $scope.$on('$destroy', function () {
            if ($scope.linkRef) $scope.linkRef.off('value')
            if ($scope.subGroupRef) $scope.subGroupRef.off('value')
            if ($scope.qsetNameRefArr) {
                $scope.qsetNameRefArr.forEach(ref => {
                    ref.off('value')
                });
            }
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getLinks();
            $scope.subGroupRef = firebase.database().ref('Groups/' + $rootScope.settings.groupKey
                + '/groupsets/' + $rootScope.settings.groupSetKey + '/subgroupsets/' + $rootScope.settings.subSetKey);
            $scope.subGroupRef.on('value', function (snapshot) {
                var groupData = snapshot.val();
                $scope.subGroupName = $rootScope.settings.subGroupName;
                $scope.QuestionSets = groupData.QuestionSets || [];
                if ($scope.qsetNameRefArr) {
                    $scope.qsetNameRefArr.forEach(ref => {
                        ref.off('value')
                    });
                }
                $scope.qsetNameRefArr = []
                $scope.QuestionSets.forEach(set => {
                    set.setname = ""
                    let qsetNameRef = firebase.database().ref("QuestionSets/" + set.key + '/setname')
                    $scope.qsetNameRefArr.push(qsetNameRef)
                    qsetNameRef.on('value', snapshot => {
                        set.setname = snapshot.val()
                        $rootScope.safeApply()
                    })
                });
                $rootScope.setData('loadingfinished', true);
            });
        }
        $scope.getLinks = function () {
            $scope.linkRef = firebase.database().ref('Links');
            $scope.linkRef.on('value', function (snapshot) {
                $scope.links = {};
                $scope.allLinks = snapshot.val() || {}
                for (key in $scope.allLinks) {
                    let link = $scope.allLinks[key];
                    if (link.groupKey == $rootScope.settings.groupKey &&
                        link.linkType == 'set' &&
                        link.groupType == 'second' &&
                        link.groupSetKey == $rootScope.settings.groupSetKey &&
                        link.subSetKey == $rootScope.settings.subSetKey) {
                        $scope.links[link.setKey] = link;
                    }
                }
            });
        }
        $scope.questions = function (set) {
            if (set.isSection) return;
            $rootScope.setData('questionSetKey2', set.key);
            $rootScope.setData('questionSetName', set.setname);
            $rootScope.setData('questionSet', set);
            $rootScope.setData('groupType', 'second');
            if (!set.LikertType) {
                $state.go('teacherLinkGroupQuestions');
            }

        }
        $scope.getQstClass = function (obj) {
            if (obj.isSection) {
                return 'section';
            } else if ($rootScope.settings.questionSetKey2 == obj.key) {
                return 'active';
            }
        }
        $scope.changeHideState = function (set, index) {
            var hidden = set.hidden ? {} : true
            firebase.database().ref('/Groups/' + $rootScope.settings.groupKey + '/groupsets/' + $rootScope.settings.groupSetKey +
                '/subgroupsets/' + $rootScope.settings.subSetKey + '/QuestionSets/' + index + '/hidden')
                .set(hidden).then(function () {
                    $rootScope.success("Questionset hide state changed successfully!")
                });
        }

        // ============link functions==================
        $scope.addLink = function (set) {
            var link = {
                teacherId: $rootScope.settings.teacherId,
                groupKey: $rootScope.settings.groupKey,
                setKey: set.key,
                questionType: 'Likert Type',
                linkType: 'set',
                groupType: 'second',
                groupSetKey: $rootScope.settings.groupSetKey,
                subSetKey: $rootScope.settings.subSetKey,
                key: $scope.getCode(),
            };
            firebase.database().ref('Links/' + link.key).set(link);
        }

        $scope.copyToClipboard = function (setKey) {
            var str = $scope.links[setKey].key;
            str = window.location.origin + '/directLink/' + str;
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(str).select();
            document.execCommand("copy");
            $temp.remove();
        }
        $scope.deletelink = function (setKey) {
            var key = $scope.links[setKey].key;
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