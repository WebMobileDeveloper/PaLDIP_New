(function () {

    angular
        .module('myApp')
        .controller('chatHomeController', chatHomeController)

    chatHomeController.$inject = ['$state', '$scope', '$rootScope', '$filter'];



    function chatHomeController($state, $scope, $rootScope, $filter) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "");
        $rootScope.setData('selectedMenu', 'chat');
        $scope.my = {};
        $scope.searchText = "";
        $scope.defaultImage = "../../../../assets/img/male.png";
        var uid = $rootScope.settings.userId;
        $scope.sidebarHide = true;
        $rootScope.safeApply();


        $scope.$on('$destroy', function () {
            if ($scope.stGroupsRef) $scope.stGroupsRef.off('value')
            if ($scope.groupsRef) $scope.groupsRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
            if ($scope.msgRef) $scope.msgRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getStudentGroups();
            $scope.getGroups();
            $scope.getUsers();
            $scope.getMessages();
        }

        $scope.getStudentGroups = function () {
            $scope.stGroupsRef = firebase.database().ref('StudentGroups');
            $scope.stGroupsRef.on('value', function (snapshot) {
                $scope.allStGroups = snapshot.val() || {}
                $scope.ref_1 = true
                $scope.finalCalc()
            });
        };

        $scope.getGroups = function () {
            $scope.groupsRef = firebase.database().ref('Groups');
            $scope.groupsRef.on('value', function (snapshot) {
                $scope.allGroups = snapshot.val() || {}
                $scope.ref_2 = true
                $scope.finalCalc()
            });
        }

        $scope.getUsers = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.allUsers = snapshot.val() || {}
                $scope.ref_3 = true
                $scope.finalCalc()
            });
        }

        $scope.getMessages = function () {
            $scope.msgRef = firebase.database().ref('Messages');
            $scope.msgRef.on('value', function (snapshot) {
                $scope.allMessages = snapshot.val() || {}
                $scope.ref_4 = true
                $scope.finalCalc()
            });
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3 || !$scope.ref_4) return


            $scope.myGroups = {};
            let myGroupArray = Object.values($scope.allStGroups[uid] || {})
            myGroupArray.forEach(groupKey => {
                $scope.myGroups[groupKey] = {
                    group_id: groupKey,
                };
            });


            $scope.userGroups = {};
            for (var studentKey in $scope.allStGroups) {
                let stGroupArray = Object.values($scope.allStGroups[studentKey] || {})
                let interSection = stGroupArray.filter(value => -1 !== myGroupArray.indexOf(value));
                if (interSection.length > 0) {
                    $scope.userGroups[studentKey] = interSection
                }
            }
            for (groupKey in $scope.allGroups) {
                if (myGroupArray.indexOf(groupKey) > -1) {
                    let group = $scope.allGroups[groupKey]
                    var teacherKey = group.teacherKey;
                    $scope.myGroups[groupKey].groupname = group.groupname;
                    $scope.myGroups[groupKey].teacherId = teacherKey;
                    if (!$scope.userGroups[teacherKey]) {
                        $scope.userGroups[teacherKey] = [];
                    }
                    $scope.userGroups[teacherKey].push(groupKey);
                }
            }

            $scope.users = [];
            var i = 0;
            for (userKey in $scope.allUsers) {
                if (userKey != uid && !$scope.userGroups[userKey]) continue

                user = $scope.allUsers[userKey];
                if (userKey == uid) {
                    $scope.my = user;
                } else {
                    user.newMsgs = 0;
                    user.readMsgs = {};
                    user.show = true;
                    user.show_name = user.show_id;
                    if (user.nick_name && user.showNickname) {
                        // user.show_name = user.nick_name + ' ( ' + user.show_name + ' )';
                        user.show_name = user.nick_name;
                    }
                    user.offset = i--;
                    user.lastTime = 0;
                    user.finalTime = user.lastTime + user.offset;
                    $scope.users.push(user);
                }
            }


            $scope.userMsg = {};
            for (msgKey in $scope.allMessages) {
                let msg = $scope.allMessages[msgKey]
                if (msg.from != uid && msg.to != uid) continue;
                if (msg.from == uid && !$scope.userGroups[msg.to]) continue
                if (msg.to == uid && !$scope.userGroups[msg.from]) continue

                msg.key = msgKey;
                msg.date = getFormattedDate(new Date(msg.time))
                if (msg.from == uid) {
                    if (!$scope.userMsg[msg.to]) {
                        $scope.userMsg[msg.to] = [];
                    }
                    msg.fromMe = 'fromMe';
                    $scope.userMsg[msg.to].push(msg);

                    var userIndex = $scope.getUserIndex(msg.to);
                    if (msg.time > $scope.users[userIndex].lastTime) {
                        $scope.users[userIndex].lastTime = msg.time;
                    }
                    $scope.users[userIndex].finalTime = $scope.users[userIndex].lastTime + $scope.users[userIndex].offset;
                }
                if (msg.to == uid) {
                    if (!$scope.userMsg[msg.from]) {
                        $scope.userMsg[msg.from] = [];
                    }
                    msg.fromMe = '';
                    $scope.userMsg[msg.from].push(msg);

                    var userIndex = $scope.getUserIndex(msg.from);
                    if (msg.unread) {
                        $scope.users[userIndex].newMsgs++;
                        $scope.users[userIndex].readMsgs['Messages/' + msgKey + '/unread'] = {};
                    }
                    if (msg.time > $scope.users[userIndex].lastTime) {
                        $scope.users[userIndex].lastTime = msg.time;
                    }
                    $scope.users[userIndex].finalTime = $scope.users[userIndex].lastTime + $scope.users[userIndex].offset;
                }
            }
            $scope.selectUser();
            $rootScope.safeApply()
            $rootScope.setData('loadingfinished', true);
        }





        // ==================operation functions===================
        $scope.getUserIndex = function (userKey) {
            for (var i = 0; i < $scope.users.length; i++) {
                if ($scope.users[i].Userkey == userKey) {
                    return i;
                }
            }
        };

        $scope.selectGroup = function (selectedGroupKey = undefined) {
            $scope.selectedGroupKey = selectedGroupKey;
            var groupKey = $scope.selectedGroupKey;
            if (groupKey) {
                for (var i = 0; i < $scope.users.length; i++) {
                    var userKey = $scope.users[i].Userkey;
                    $scope.users[i].show = false;
                    if ($scope.userGroups[userKey]) {
                        if ($scope.userGroups[userKey].indexOf(groupKey) > -1) {
                            $scope.users[i].show = true;
                        }
                    }
                    if (userKey == $scope.myGroups[groupKey].teacherId) {
                        $scope.teacherIndex = i;
                        $scope.selectUser(userKey);
                    }
                }
            } else {
                for (var i = 0; i < $scope.users.length; i++) {
                    $scope.users[i].show = true;
                }
                $scope.teacherIndex = undefined;
                $scope.ByClick = false;
                $scope.selectUser(undefined);
            }
            $rootScope.safeApply();
        }

        $scope.selectUser = function (key = undefined) {
            $scope.users = $filter('orderBy')($scope.users, '-finalTime');
            if (key) {
                $scope.selectedKey = key;
                $scope.ByClick = true;
            } else if (!$scope.ByClick) {
                $scope.selectedKey = $scope.users[0].Userkey;
            }
            var beforeKey = $scope.selectedKey;
            setTimeout(function () {
                if (beforeKey == $scope.selectedKey) {   //if user delay at same user for 1s
                    var userIndex = $scope.getUserIndex(beforeKey);
                    firebase.database().ref().update($scope.users[userIndex].readMsgs).then(function () {
                        $scope.users[userIndex].newMsgs = 0;
                        $rootScope.safeApply();
                    });
                }
            }, 4000);
            if ($scope.selectedGroupKey) {
                $scope.teacherIndex = $scope.getUserIndex($scope.myGroups[$scope.selectedGroupKey].teacherId);
            }
            $rootScope.safeApply();
        }
        $scope.show = function (user) {
            var searchText = $scope.searchText.toLowerCase();
            if (!user.show) return false;
            var show = false;
            if (user.nick_name) {
                if (user.nick_name.toLowerCase().indexOf(searchText) > -1) {
                    show = true;
                }
            }
            if (user.show_id.toLowerCase().indexOf(searchText) > -1) {
                show = true;
            }
            return show;
        }
        $scope.clear = function () {
            $scope.searchText = "";
            $rootScope.safeApply();
        }


        // =============send message====================
        $scope.send = function () {
            if (!$scope.selectedKey) return;
            if (!$scope.inputMsg) return;
            var msgObj = {
                message: $scope.inputMsg,
                from: uid,
                to: $scope.selectedKey,
                unread: true,
                time: firebase.database.ServerValue.TIMESTAMP,
            }
            firebase.database().ref('Messages').push(msgObj);
            $scope.inputMsg = "";
        }

        // ================== style functions ===================
        $scope.someMethod = function () {
            var d = $('.chat-room');
            d.scrollTop(d.prop("scrollHeight"));
        }
        $scope.setClass = function (user) {
            var classes = (user.Userkey == $scope.selectedKey) ? 'active' : '';
            classes = (user.Usertype == "Teacher") ? classes + ' teacher' : classes;
            return classes;
        }
        $scope.fromMe = function (fromMe) {
            return fromMe;
        }
        $scope.toggleNav = function () {
            if ($scope.sidebarHide) {
                document.getElementById("mySidenav").style.left = "0px";
                document.getElementById("mySidenav").style.width = "300px";
                document.getElementById("closenav").style.left = "295px";
                $scope.sidebarHide = false;
            } else {
                document.getElementById("mySidenav").style.left = "-10px";
                document.getElementById("mySidenav").style.width = "0";
                document.getElementById("closenav").style.left = "-5px";
                $scope.sidebarHide = true;
            }

        }

    }

})();