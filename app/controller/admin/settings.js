(function () {

    angular
        .module('myApp')
        .controller('AdminSettingsController', AdminSettingsController)

    AdminSettingsController.$inject = ['$state', '$scope', '$rootScope'];

    function AdminSettingsController($state, $scope, $rootScope) {

        $rootScope.setData('showMenubar', true);
        $rootScope.setData('selectedMenu', 'settings');
        $rootScope.setData('backUrl', "");
        $scope.note = "<Student> tag will be replace with student name or string 'Student' if name is exist or not."

        $scope.registerFields = ["Country", "Age", "Gender", "Profession", "Mother Tongue", "Group Code for Institution Users"]
        var types = ['Feedback Type', 'Rating Type', 'Digit Type', 'Text Type', 'Dropdown Type', 'Slide Type', 'Multiple Type', 'Contingent Type', 'Answer Type', 'External Activity']
        var min = 80; //height limit

        $('textarea').each(function () {
            $(this).on('input', function () {
                let newHeight = Math.max($(this).prop('scrollHeight'), min)
                $(this).innerHeight(newHeight);
            });
        })

        $scope.$on('$destroy', function () {
            if ($scope.settingsRef) $scope.settingsRef.off('value')
            if ($scope.studentsRef) $scope.studentsRef.off('value')
            $('#addInstitutionModal').modal('hide');
        })

        $scope.init = function () {
            $scope.getSettings()
            $scope.getStudents()
        }

        $scope.getSettings = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.settingsRef = firebase.database().ref('Settings');
            $scope.settingsRef.on('value', function (snapshot) {
                let settings = snapshot.val()
                //------  get register settings  ------
                $scope.registerSettings = []
                for (i = 0; i < $scope.registerFields.length; i++) {
                    field = $scope.registerFields[i]
                    $scope.registerSettings[i] = {
                        field: field,
                        value: settings.RegisterFields[field]
                    }
                }

                //------  get create Question settings  ------
                let createQuestionSettings = settings.createQuestionSettings
                delete createQuestionSettings['Likert Type']
                $scope.createQuestionSettings = []
                for (type in createQuestionSettings) {
                    $scope.createQuestionSettings[types.indexOf(type)] = {
                        type: type,
                        value: createQuestionSettings[type]
                    }
                }
                //------  get institutions Settings  ------
                $scope.institutions = settings.institutions || {}
                $scope.institutions['zzz'] = { name: "Unspecified Institution", domain: "@xxx.xxx" }
                //------  get reminder Settings  ------
                $scope.reminderSettings = settings.reminderSettings
                setTimeout(() => {
                    $('textarea').each(function () {
                        let newHeight = Math.max($(this).prop('scrollHeight'), min)
                        $(this).innerHeight(newHeight);
                    })
                }, 1)


                $rootScope.setData('loadingfinished', true);
                $rootScope.safeApply();

            })
        }
        $scope.getStudents = function () {
            $scope.studentsRef = firebase.database().ref('Users').orderByChild('Usertype').equalTo('Student');
            $scope.studentsRef.on('value', function (snapshot) {
                $scope.students = snapshot.val() || {};
                $rootScope.safeApply();
            });
        }
        //------  register setting functions ------
        $scope.getFieldOrder = function (field) {
            return $scope.registerFields.indexOf(field)
        };
        $scope.changeRegisterSettings = function (item) {
            var updates = {};
            updates['Settings/RegisterFields/' + item.field] = item.value;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }

        //------  create Question setting functions ------
        $scope.changeCreateQuestionSettings = function (item) {
            var updates = {};
            updates['Settings/createQuestionSettings/' + item.type] = item.value;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }

        //------  institutions setting functions ------
        function validateDomain(domain) {
            var re = /@[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/;
            return re.test(domain);
        }
        $scope.showInstModal = function (instKey = undefined) {
            $scope.editInstKey = instKey
            if ($scope.editInstKey) {
                $scope.instItem = angular.copy($scope.institutions[$scope.editInstKey])
                $scope.instItem.type = ($scope.instItem.domain == "@xxx.xxx") ? "Unspecified" : "Specified";
            } else {
                $scope.instItem = { name: '', domain: '', type: "Specified" }
            }
            $rootScope.safeApply();
            $('#addInstitutionModal').modal({ backdrop: 'static', keyboard: false });
        }

        $scope.addInstitution = function () {
            if ($scope.instItem.name == "") {
                $rootScope.error("Please input institution name!")
                // Unspecified Institution
                return
            }

            for (key in $scope.institutions) {
                if ($scope.instItem.name == $scope.institutions[key].name) {
                    $rootScope.error("Error: Already registered institution name!")
                    return
                }
            }

            if ($scope.instItem.type == 'Specified') {
                if ($scope.instItem.domain == "") {
                    $rootScope.error("Please input institution domain for specified type!")
                    return
                }
                if (!validateDomain($scope.instItem.domain)) {
                    $rootScope.error("Invalid domain!")
                    return
                }
                for (key in $scope.institutions) {
                    if ($scope.instItem.domain == $scope.institutions[key].domain) {
                        $rootScope.error("Error: Already registered institution domain!")
                        return
                    }
                }
            }

            if (!confirm("Are you sure want to register new institution?")) return
            let updates = {}
            if ($scope.instItem.type == 'Specified') {
                for (userKey in $scope.students) {
                    let email = $scope.students[userKey].ID
                    if (email.endsWith($scope.instItem.domain)) {
                        updates['Users/' + userKey + '/institution'] = $scope.instItem.name
                    }
                }
                let newInstKey = firebase.database().ref('Settings/institutions').push().key;
                updates['Settings/institutions/' + newInstKey] = { name: $scope.instItem.name, domain: $scope.instItem.domain }
            } else {
                let newInstKey = firebase.database().ref('Settings/institutions').push().key;
                updates['Settings/institutions/' + newInstKey] = { name: $scope.instItem.name, domain: "@xxx.xxx" }
            }

            firebase.database().ref().update(updates).then(() => {
                $rootScope.success("New institution registered successfully!")
                $('#addInstitutionModal').modal('hide');
            })
        }


        $scope.updateInstitution = function () {
            if ($scope.instItem.name == "") {
                $rootScope.error("Please input institution name!")
                // Unspecified Institution
                return
            }

            for (key in $scope.institutions) {
                if (key == $scope.editInstKey) continue;
                if ($scope.instItem.name == $scope.institutions[key].name) {
                    $rootScope.error("Error: Already registered institution name!")
                    return
                }
            }

            if ($scope.instItem.type == 'Specified') {
                if ($scope.instItem.domain == "") {
                    $rootScope.error("Please input institution domain for specified type!")
                    return
                }
                if (!validateDomain($scope.instItem.domain)) {
                    $rootScope.error("Invalid domain!")
                    return
                }
                for (key in $scope.institutions) {
                    if (key == $scope.editInstKey) continue;
                    if ($scope.instItem.domain == $scope.institutions[key].domain) {
                        $rootScope.error("Error: Already registered institution domain!")
                        return
                    }
                }
            }

            if (!confirm("Are you sure want to update this change?")) return
            let updates = {}


            for (userKey in $scope.students) {
                let email = $scope.students[userKey].ID
                let institution = "Unspecified Institution"
                if ($scope.students[userKey].institution == $scope.institutions[$scope.editInstKey].name) {
                    if ($scope.instItem.type == 'Specified') {
                        if (email.endsWith($scope.instItem.domain)) {
                            if ($scope.students[userKey].institution != $scope.instItem.name) {
                                updates['Users/' + userKey + '/institution'] = $scope.instItem.name
                            }
                        } else {
                            updates['Users/' + userKey + '/institution'] = "Unspecified Institution"
                        }
                    } else {
                        if ($scope.students[userKey].institution != $scope.instItem.name) {
                            updates['Users/' + userKey + '/institution'] = $scope.instItem.name
                        }
                    }
                } else {
                    if ($scope.instItem.type == 'Specified') {
                        if (email.endsWith($scope.instItem.domain)) {
                            updates['Users/' + userKey + '/institution'] = $scope.instItem.name
                        }
                    }
                }
            }

            if ($scope.instItem.type == 'Specified') {
                updates['Settings/institutions/' + $scope.editInstKey] = { name: $scope.instItem.name, domain: $scope.instItem.domain }
            } else {
                updates['Settings/institutions/' + $scope.editInstKey] = { name: $scope.instItem.name, domain: "@xxx.xxx" }
            }

            firebase.database().ref().update(updates).then(() => {
                $rootScope.success("Updated successfully!")
                $('#addInstitutionModal').modal('hide');
            })
        }

        $scope.removeInstitution = function (instKey) {
            let institution = $scope.institutions[instKey];
            if (!confirm("Are you sure want to delete this institution?")) return
            let updates = {}
            for (userKey in $scope.students) {
                if ($scope.students[userKey].institution == institution.name) {
                    updates['Users/' + userKey + '/institution'] = "Unspecified Institution"
                }
            }
            updates['Settings/institutions/' + instKey] = {}
            firebase.database().ref().update(updates).then(() => {
                $rootScope.success("Institution deleted successfully!")
            })
        }
        $scope.changeInstName = function (key, name) {
            var updates = {};
            updates['Settings/institutions/' + key + '/name'] = name
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        $scope.changeInstDomain = function (key, domain) {
            var updates = {};
            updates['Settings/institutions/' + key + '/domain'] = domain
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }
        //------  reminder setting functions ------
        $scope.changedReminder = function () {
            var updates = {};
            updates['Settings/reminderSettings'] = $scope.reminderSettings;
            firebase.database().ref().update(updates).then(function () {
                $rootScope.safeApply();
            });
        }

    }

})();