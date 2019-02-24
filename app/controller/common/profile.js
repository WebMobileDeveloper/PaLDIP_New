(function () {

    angular
        .module('myApp')
        .controller('profileController', profileController)

    profileController.$inject = ['$state', '$scope', '$rootScope'];

    function profileController($state, $scope, $rootScope) {
        $rootScope.setData('showMenubar', true);
        $rootScope.setData('backUrl', "");
        $rootScope.setData('selectedMenu', 'profile');
        $scope.defaultImage = "../../../assets/img/male.png";
        $rootScope.safeApply();

        $scope.$on('$destroy', function () {
            if ($scope.userRef) $scope.userRef.off('value')
            if ($scope.settingsRef) $scope.settingsRef.off('value')
        })

        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.loadProfile();
            $scope.getSettings();
        }
        $scope.loadProfile = function () {
            $scope.userRef = firebase.database().ref('Users/' + $rootScope.settings.userId);
            $scope.userRef.on('value', function (snapshot) {
                $scope.userProfile = snapshot.val();
                $scope.userProfile.showNickname = $scope.userProfile.showNickname ? $scope.userProfile.showNickname : false
                $scope.ref_1 = true;
                $scope.finalCalc();
            });
        }
        $scope.getSettings = function () {
            $scope.settingsRef = firebase.database().ref('Settings/institutions');
            $scope.settingsRef.on('value', function (snapshot) {
                //------  get institutions Settings  ------
                $scope.institutions = snapshot.val() || {}
                $scope.institutions['zzz'] = { name: "Unspecified Institution", domain: "@xxx.xxx" }
                $scope.ref_2 = true;
                $scope.finalCalc();
            })
        }

        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2) return;
            if ($scope.userProfile.Usertype == 'Student') {
                $scope.instList = []
                for (key in $scope.institutions) {
                    let inst = $scope.institutions[key]
                    if (inst.domain == "@xxx.xxx") {
                        $scope.instList.push(inst.name)
                    } else {
                        if (inst.name == $scope.userProfile.institution) {
                            $scope.instList = [inst.name]
                            break;
                        }
                    }
                }
            }

            $rootScope.setData('loadingfinished', true);
            $rootScope.safeApply();
        }
        $scope.fileupload = function () {
            var uploader = document.getElementById('uploader');
            var fileButton = document.getElementById('fileButton');
            var nameText = document.getElementById('nameText');
            fileButton.addEventListener('change', function (e) {
                //Get File
                var file = e.target.files[0];
                nameText.value = file.name;
                //Create storage ref
                var storageRef = firebase.storage().ref('profile/' + $rootScope.settings.userId)
                //Upload file
                var uploadTask = storageRef.put(file);


                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                    function (snapshot) {
                        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                        var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        uploader.value = percentage;
                    }, function (error) {
                        $rootScope.warning('Upload Error!');
                    }, function () {
                        // Upload completed successfully, now we can get the download URL
                        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                            $scope.userProfile.profile_image = downloadURL;
                            $rootScope.safeApply();
                        });
                    });
            })
        }

        $scope.saveProfile = function () {
            var updates = {};
            updates['Users/' + $rootScope.settings.userId] = angular.copy($scope.userProfile);
            firebase.database().ref().update(updates).then(function () {
                $rootScope.success('Save success!');
                $rootScope.safeApply();
            });
        }

        $scope.country_list = ["", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Anguilla", "Antigua &amp; Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia &amp; Herzegovina", "Botswana", "Brazil", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Cape Verde", "Cayman Islands", "Chad", "Chile", "China", "Colombia", "Congo", "Cook Islands", "Costa Rica", "Cote D Ivoire", "Croatia", "Cruise Ship", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Estonia", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Polynesia", "French West Indies", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyz Republic", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Namibia", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russia", "Rwanda", "Saint Pierre &amp; Miquelon", "Samoa", "San Marino", "Satellite", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "St Kitts &amp; Nevis", "St Lucia", "St Vincent", "St. Lucia", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor L'Este", "Togo", "Tonga", "Trinidad &amp; Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks &amp; Caicos", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Virgin Islands (US)", "Yemen", "Zambia", "Zimbabwe"];
        $scope.languages = ["", "Afrikanns", "Albanian", "Arabic", "Armenian", "Basque", "Bengali", "Bulgarian", "Catalan", "Cambodian", "Chinese", "Croation", "Czech", "Danish", "Dutch", "English", "Estonian", "Fiji", "Finnish", "French", "Georgian", "German", "Greek", "Gujarati", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Korean", "Latin", "Latvian", "Lithuanian", "Macedonian", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Nepali", "Norwegian", "Persian", "Polish", "Portuguese", "Punjabi", "Quechua", "Romanian", "Russian", "Samoan", "Serbian", "SK", "Slovak", "Spanish", "Swahili", "Swedish", "Tamil", "Tatar", "Telugu", "Thai", "Tibetan", "Tonga", "Turkish", "Ukranian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "Xhosa"];
        $scope.genders = ["", "Male", "Female", "LGBTQIA", "prefer not to say"];
    }
})();