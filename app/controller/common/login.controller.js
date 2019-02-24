(function () {

    angular
        .module('myApp')
        .controller('LoginController', LoginController)

    LoginController.$inject = ['$state', '$scope', '$rootScope'];

    function LoginController($state, $scope, $rootScope) {
        $scope.linkKey = $rootScope.settings.linkKey
        firebase.auth().signOut();
        localStorage.clear();
        $rootScope.getData();
        $rootScope.setData('showMenubar', false);
        // $scope.categories = ['Teacher', 'Student'];
        //************************************************************************************************************** */
        // ************************  Login  *****************************************************************************
        $scope.login = function () {
            if ($scope.loginmail && $scope.pwd) {

                $rootScope.setData('loadingfinished', false);

                firebase.auth().signInWithEmailAndPassword($scope.loginmail, $scope.pwd).then(function (user) {
                    var userid = user.user.uid;
                    var userRef = firebase.database().ref('Users/' + userid);
                    userRef.once('value', function (snapshot) {

                        $rootScope.setData('loadingfinished', true);
                        var currUserType = snapshot.val().Usertype;
                        $rootScope.setData('userId', userid);
                        $rootScope.setData('userType', currUserType);
                        $rootScope.setData('userEmail', $scope.loginmail);
                        switch (currUserType) {
                            case 'Teacher':
                                if (snapshot.val().approval == 1) {
                                    $rootScope.getTeacherSettings()
                                    $state.go('teacherGroup');
                                } else {
                                    $rootScope.error('You are not approved yet!');
                                    firebase.auth().signOut();
                                }
                                break;
                            case 'Student':
                                if ($scope.linkKey) {
                                    $state.go('directLink', { linkKey: $scope.linkKey }, {
                                        reload: true, inherit: false, notify: true
                                    });
                                } else {
                                    $rootScope.go('myGroups');
                                }
                                break;
                            case 'Admin':
                                $state.go('admin');
                        }
                    });
                }).catch(function (error) {
                    $rootScope.error(error.message);
                    $state.reload();
                });
            } else {
                $rootScope.warning('Input your information!')
            }
        }
    }
})();