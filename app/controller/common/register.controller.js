(function () {

    angular
        .module('myApp')
        .controller('RegisterController', RegisterController)

    RegisterController.$inject = ['$state', '$scope', '$rootScope'];

    function RegisterController($state, $scope, $rootScope) {
        localStorage.clear();
        $rootScope.setData('showMenubar', false);
        $rootScope.getData();

        $scope.categories = ['Teacher', 'Student'];
        // $scope.registerSettings = {
        //     Country: [false, false],
        //     Age: [false, false],
        //     Gender: [false, false],
        //     Profession: [false, false],
        //     "Mother Tongue": [false, false],
        // }
        //************************************************************************************************************** */
        // ************************  Login  *****************************************************************************
        $scope.$on('$destroy', function () {
            if ($scope.settingRef) $scope.settingRef.off('value')
            if ($scope.groupsRef) $scope.groupsRef.off('value')
            if ($scope.usersRef) $scope.usersRef.off('value')
        })
        $scope.init = function () {
            $rootScope.setData('loadingfinished', false);
            $scope.getSettings()
            $scope.getGroups()
            $scope.get_users_show_id()
        }

        $scope.getSettings = function () {
            $scope.settingRef = firebase.database().ref('Settings');
            $scope.settingRef.on('value', function (snapshot) {
                var settings = snapshot.val() || {}

                //------  get register settings  ------
                $scope.registerSettings = settings.RegisterFields

                //------  get institutions Settings  ------
                $scope.institutions = settings.institutions || {}
                $scope.institutions["zzz"] = { name: "Unspecified Institution", domain: "@xxx.xxx" }
                $scope.instKey = "zzz"
                $scope.ref_1 = true
                $scope.finalCalc();
            })
        }
        $scope.getGroups = function () {
            $scope.groupsRef = firebase.database().ref('Groups');
            $scope.groupsRef.on('value', function (snapshot) {
                $scope.groupCodes = [];
                $scope.groups = {};
                for (groupKey in snapshot.val()) {
                    let group = snapshot.val()[groupKey]
                    let teacherKey = group.teacherKey
                    $scope.groups[group.code] = {
                        teacherKey: teacherKey,
                        groupKey: groupKey,
                    }
                    $scope.groupCodes.push(group.code);
                }
                $scope.ref_2 = true
                $scope.finalCalc();
            });
        }

        $scope.get_users_show_id = function () {
            $scope.usersRef = firebase.database().ref('Users');
            $scope.usersRef.on('value', function (snapshot) {
                $scope.userIDs = [];
                snapshot.forEach(function (user) {
                    $scope.userIDs.push(user.val().show_id);
                })
                $scope.ref_3 = true
                $scope.finalCalc();

            })
        }
        $scope.finalCalc = function () {
            if (!$scope.ref_1 || !$scope.ref_2 || !$scope.ref_3) return
            $rootScope.safeApply();
            $rootScope.setData('loadingfinished', true);
        }
        $scope.showGroupCode = function () {
            if (!$scope.registerSettings) return false
            if ($scope.authtype == 'Teacher') return false
            if ($scope.instKey == "zzz") return true
            return $scope.registerSettings['Group Code for Institution Users'][0]
        }
        function validateEmail(email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        $scope.register = function () {
            if ($scope.authtype == undefined) {
                $rootScope.error('Please select user type!');
                return;
            }

            if ($scope.authtype == 'Student') {
                if (!$scope.instKey) {
                    $rootScope.error('Please select institution!');
                    return;
                }
                if ($scope.username == undefined) {
                    $rootScope.error('Please input user Email!');
                    return;
                }
                if ($scope.institutions[$scope.instKey].domain != "@xxx.xxx" && !$scope.username.endsWith($scope.institutions[$scope.instKey].domain)) {
                    $rootScope.error("Domain doesn't matched!");
                    return;
                }
            } else {
                if ($scope.username == undefined) {
                    $rootScope.error('Please input user Email!');
                    return;
                }
            }
            if (!validateEmail($scope.username)) {
                $rootScope.error('Invalid Email!');
                return;
            }
            if ($scope.basicpassword == undefined) {
                $rootScope.error('Please input password!')
                return;
            } else if ($scope.basicpassword.length < 8) {
                $rootScope.warning('Weak Password!');
                return;
            }

            if ($scope.confpassword == undefined) {
                $rootScope.error('Please input confirm password!');
                return;
            } else if ($scope.basicpassword != $scope.confpassword) {
                $rootScope.error('Password and confirm password doesn\'t matched!');
                return;
            }

            if ($scope.authtype == 'Student') {
                if ($scope.registerSettings.Country[0]) {   //view
                    if ($scope.registerSettings.Country[1] && $scope.country == undefined) {
                        $rootScope.error('Please select country field!');
                        return;
                    } else if ($scope.country == undefined) {
                        $scope.country = "";
                    }
                } else {
                    $scope.country = "";
                }

                if ($scope.registerSettings.Age[0]) {   //view
                    if ($scope.registerSettings.Age[1] && $scope.age == undefined) {
                        $rootScope.error('Please input age field!');
                        return;
                    } else if ($scope.age == undefined) {
                        $scope.age = "";
                    }
                } else {
                    $scope.age = "";
                }


                if ($scope.registerSettings.Gender[0]) {   //view
                    if ($scope.registerSettings.Gender[1] && $scope.gender == undefined) {
                        $rootScope.error('Please select gender field!');
                        return;
                    } else if ($scope.gender == undefined) {
                        $scope.gender = "";
                    }
                } else {
                    $scope.gender = "";
                }


                if ($scope.registerSettings.Profession[0]) {   //view
                    if ($scope.registerSettings.Profession[1] && $scope.profession == undefined) {
                        $rootScope.error('Please input profession field!');
                        return;
                    } else if ($scope.profession == undefined) {
                        $scope.profession = "";
                    }
                } else {
                    $scope.profession = "";
                }

                if ($scope.registerSettings["Mother Tongue"][0]) {   //view
                    if ($scope.registerSettings["Mother Tongue"][1] && $scope.countrylanguage == undefined) {
                        $rootScope.error('Please select Mother Tongue field!');
                        return;
                    } else if ($scope.countrylanguage == undefined) {
                        $scope.countrylanguage = "";
                    }
                } else {
                    $scope.countrylanguage = "";
                }

                if ($scope.showGroupCode) {
                    if ($scope.instKey == 'zzz' || ($scope.instKey != 'zzz' && $scope.registerSettings['Group Code for Institution Users'][1])) {
                        if ($scope.groupcode == undefined || $scope.groupcode == '') {
                            $rootScope.error('Input GroupCode!')
                            return;
                        }
                        if ($scope.groupCodes.indexOf($scope.groupcode) == -1) {
                            $rootScope.error('Invalid GroupCode!')
                            $rootScope.safeApply()
                            return;
                        }
                    } else {
                        if ($scope.groupcode == undefined || $scope.groupcode == '') {
                            $scope.groupcode == undefined
                        } else {
                            if ($scope.groupCodes.indexOf($scope.groupcode) == -1) {
                                $rootScope.error('Invalid GroupCode!')
                                $rootScope.safeApply()
                                return;
                            }
                        }
                    }
                } else {
                    $scope.groupcode = undefined
                }
            }

            var show_id = $scope.get_show_id();
            while ($scope.userIDs.indexOf(show_id) > -1) {
                show_id = $scope.get_show_id();
            }
            $scope.saveuser(show_id);
        }


        $scope.get_show_id = function () {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXTZ'.split('');
            var new_id = '';
            for (var i = 0; i < 5; i++) {
                new_id += chars[Math.floor(Math.random() * chars.length)];
            }
            return new_id;
        }

        $scope.saveuser = function (show_id) {
            firebase.auth().createUserWithEmailAndPassword($scope.username, $scope.basicpassword).then(function (user) {
                var uid = user.user.uid;
                var teacherEmail = user.user.email;
                var creatTime = formatDate(new Date(user.user.metadata.creationTime));

                if ($scope.authtype == 'Student') {
                    var data = {
                        Userkey: uid,
                        ID: $scope.username,
                        Usertype: $scope.authtype,
                        password: $scope.basicpassword,
                        country: $scope.country,
                        age: $scope.age,
                        gender: $scope.gender,
                        profession: $scope.profession,
                        countrylanguage: $scope.countrylanguage,
                        show_id: show_id,
                        institution: $scope.institutions[$scope.instKey].name,
                        creationTime: user.user.metadata.creationTime,
                    }
                } else {
                    var data = {
                        Userkey: uid,
                        ID: $scope.username,
                        Usertype: $scope.authtype,
                        password: $scope.basicpassword,
                        approval: 0,
                        show_id: show_id,
                        creationTime: user.user.metadata.creationTime,
                    }
                }
                var updates = {};
                updates['/Users/' + uid] = data;

                firebase.database().ref().update(updates).then(function () {
                    if ($scope.authtype == 'Student') {
                        // add student group
                        if ($scope.groupcode) {
                            var groupKey = $scope.groups[$scope.groupcode].groupKey;
                            firebase.database().ref('StudentGroups/' + uid).push(groupKey).then(function () {
                                $rootScope.success('Account Created Successfuly!');
                                $rootScope.safeApply();
                                $state.go('login');
                            })
                        } else {
                            $rootScope.success('Account Created Successfuly!');
                            $rootScope.safeApply();
                            $state.go('login');
                        }
                    } else {
                        $scope.sendRequestEmail(teacherEmail, creatTime);
                        $rootScope.success('Account Created Successfuly!');
                        $rootScope.safeApply();
                        $state.go('login');
                    }
                })
            }).catch(function (error) {
                $rootScope.error(error.message);
                $rootScope.safeApply();
            });

        }

        $scope.sendRequestEmail = function (teacherEmail, createTime) {
            var sendEmail = firebase.functions().httpsCallable('sendEmail');
            sendEmail({ adminEmail: $rootScope.adminEmail, teacherEmail: teacherEmail, createTime: createTime }).then(function (result) {
            })
        }

        function formatDate(date) {
            var monthNames = [
                "January", "February", "March",
                "April", "May", "June", "July",
                "August", "September", "October",
                "November", "December"
            ];

            var day = date.getDate();
            var monthIndex = date.getMonth();
            var year = date.getFullYear();
            var h = date.getHours();
            var m = date.getMinutes();
            var s = date.getSeconds();
            var time = ("0" + h).slice(-2) + ":" +
                ("0" + m).slice(-2);
            return monthNames[monthIndex] + ',' + day + ' ' + year + '&emsp;' + time;
        }

        $scope.countries = [
            { name: 'Afghanistan', code: 'AF' },
            { name: 'Åland Islands', code: 'AX' },
            { name: 'Albania', code: 'AL' },
            { name: 'Algeria', code: 'DZ' },
            { name: 'American Samoa', code: 'AS' },
            { name: 'Andorra', code: 'AD' },
            { name: 'Angola', code: 'AO' },
            { name: 'Anguilla', code: 'AI' },
            { name: 'Antarctica', code: 'AQ' },
            { name: 'Antigua and Barbuda', code: 'AG' },
            { name: 'Argentina', code: 'AR' },
            { name: 'Armenia', code: 'AM' },
            { name: 'Aruba', code: 'AW' },
            { name: 'Australia', code: 'AU' },
            { name: 'Austria', code: 'AT' },
            { name: 'Azerbaijan', code: 'AZ' },
            { name: 'Bahamas', code: 'BS' },
            { name: 'Bahrain', code: 'BH' },
            { name: 'Bangladesh', code: 'BD' },
            { name: 'Barbados', code: 'BB' },
            { name: 'Belarus', code: 'BY' },
            { name: 'Belgium', code: 'BE' },
            { name: 'Belize', code: 'BZ' },
            { name: 'Benin', code: 'BJ' },
            { name: 'Bermuda', code: 'BM' },
            { name: 'Bhutan', code: 'BT' },
            { name: 'Bolivia', code: 'BO' },
            { name: 'Bosnia and Herzegovina', code: 'BA' },
            { name: 'Botswana', code: 'BW' },
            { name: 'Bouvet Island', code: 'BV' },
            { name: 'Brazil', code: 'BR' },
            { name: 'British Indian Ocean Territory', code: 'IO' },
            { name: 'Brunei Darussalam', code: 'BN' },
            { name: 'Bulgaria', code: 'BG' },
            { name: 'Burkina Faso', code: 'BF' },
            { name: 'Burundi', code: 'BI' },
            { name: 'Cambodia', code: 'KH' },
            { name: 'Cameroon', code: 'CM' },
            { name: 'Canada', code: 'CA' },
            { name: 'Cape Verde', code: 'CV' },
            { name: 'Cayman Islands', code: 'KY' },
            { name: 'Central African Republic', code: 'CF' },
            { name: 'Chad', code: 'TD' },
            { name: 'Chile', code: 'CL' },
            { name: 'China', code: 'CN' },
            { name: 'Christmas Island', code: 'CX' },
            { name: 'Cocos (Keeling) Islands', code: 'CC' },
            { name: 'Colombia', code: 'CO' },
            { name: 'Comoros', code: 'KM' },
            { name: 'Congo', code: 'CG' },
            { name: 'Congo, The Democratic Republic of the', code: 'CD' },
            { name: 'Cook Islands', code: 'CK' },
            { name: 'Costa Rica', code: 'CR' },
            { name: 'Cote D\'Ivoire', code: 'CI' },
            { name: 'Croatia', code: 'HR' },
            { name: 'Cuba', code: 'CU' },
            { name: 'Cyprus', code: 'CY' },
            { name: 'Czech Republic', code: 'CZ' },
            { name: 'Denmark', code: 'DK' },
            { name: 'Djibouti', code: 'DJ' },
            { name: 'Dominica', code: 'DM' },
            { name: 'Dominican Republic', code: 'DO' },
            { name: 'Ecuador', code: 'EC' },
            { name: 'Egypt', code: 'EG' },
            { name: 'El Salvador', code: 'SV' },
            { name: 'Equatorial Guinea', code: 'GQ' },
            { name: 'Eritrea', code: 'ER' },
            { name: 'Estonia', code: 'EE' },
            { name: 'Ethiopia', code: 'ET' },
            { name: 'Falkland Islands (Malvinas)', code: 'FK' },
            { name: 'Faroe Islands', code: 'FO' },
            { name: 'Fiji', code: 'FJ' },
            { name: 'Finland', code: 'FI' },
            { name: 'France', code: 'FR' },
            { name: 'French Guiana', code: 'GF' },
            { name: 'French Polynesia', code: 'PF' },
            { name: 'French Southern Territories', code: 'TF' },
            { name: 'Gabon', code: 'GA' },
            { name: 'Gambia', code: 'GM' },
            { name: 'Georgia', code: 'GE' },
            { name: 'Germany', code: 'DE' },
            { name: 'Ghana', code: 'GH' },
            { name: 'Gibraltar', code: 'GI' },
            { name: 'Greece', code: 'GR' },
            { name: 'Greenland', code: 'GL' },
            { name: 'Grenada', code: 'GD' },
            { name: 'Guadeloupe', code: 'GP' },
            { name: 'Guam', code: 'GU' },
            { name: 'Guatemala', code: 'GT' },
            { name: 'Guernsey', code: 'GG' },
            { name: 'Guinea', code: 'GN' },
            { name: 'Guinea-Bissau', code: 'GW' },
            { name: 'Guyana', code: 'GY' },
            { name: 'Haiti', code: 'HT' },
            { name: 'Heard Island and Mcdonald Islands', code: 'HM' },
            { name: 'Holy See (Vatican City State)', code: 'VA' },
            { name: 'Honduras', code: 'HN' },
            { name: 'Hong Kong', code: 'HK' },
            { name: 'Hungary', code: 'HU' },
            { name: 'Iceland', code: 'IS' },
            { name: 'India', code: 'IN' },
            { name: 'Indonesia', code: 'ID' },
            { name: 'Iran, Islamic Republic Of', code: 'IR' },
            { name: 'Iraq', code: 'IQ' },
            { name: 'Ireland', code: 'IE' },
            { name: 'Isle of Man', code: 'IM' },
            { name: 'Israel', code: 'IL' },
            { name: 'Italy', code: 'IT' },
            { name: 'Jamaica', code: 'JM' },
            { name: 'Japan', code: 'JP' },
            { name: 'Jersey', code: 'JE' },
            { name: 'Jordan', code: 'JO' },
            { name: 'Kazakhstan', code: 'KZ' },
            { name: 'Kenya', code: 'KE' },
            { name: 'Kiribati', code: 'KI' },
            { name: 'Korea, Democratic People\'s Republic of', code: 'KP' },
            { name: 'Korea, Republic of', code: 'KR' },
            { name: 'Kuwait', code: 'KW' },
            { name: 'Kyrgyzstan', code: 'KG' },
            { name: 'Lao People\'s Democratic Republic', code: 'LA' },
            { name: 'Latvia', code: 'LV' },
            { name: 'Lebanon', code: 'LB' },
            { name: 'Lesotho', code: 'LS' },
            { name: 'Liberia', code: 'LR' },
            { name: 'Libyan Arab Jamahiriya', code: 'LY' },
            { name: 'Liechtenstein', code: 'LI' },
            { name: 'Lithuania', code: 'LT' },
            { name: 'Luxembourg', code: 'LU' },
            { name: 'Macao', code: 'MO' },
            { name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK' },
            { name: 'Madagascar', code: 'MG' },
            { name: 'Malawi', code: 'MW' },
            { name: 'Malaysia', code: 'MY' },
            { name: 'Maldives', code: 'MV' },
            { name: 'Mali', code: 'ML' },
            { name: 'Malta', code: 'MT' },
            { name: 'Marshall Islands', code: 'MH' },
            { name: 'Martinique', code: 'MQ' },
            { name: 'Mauritania', code: 'MR' },
            { name: 'Mauritius', code: 'MU' },
            { name: 'Mayotte', code: 'YT' },
            { name: 'Mexico', code: 'MX' },
            { name: 'Micronesia, Federated States of', code: 'FM' },
            { name: 'Moldova, Republic of', code: 'MD' },
            { name: 'Monaco', code: 'MC' },
            { name: 'Mongolia', code: 'MN' },
            { name: 'Montserrat', code: 'MS' },
            { name: 'Morocco', code: 'MA' },
            { name: 'Mozambique', code: 'MZ' },
            { name: 'Myanmar', code: 'MM' },
            { name: 'Namibia', code: 'NA' },
            { name: 'Nauru', code: 'NR' },
            { name: 'Nepal', code: 'NP' },
            { name: 'Netherlands', code: 'NL' },
            { name: 'Netherlands Antilles', code: 'AN' },
            { name: 'New Caledonia', code: 'NC' },
            { name: 'New Zealand', code: 'NZ' },
            { name: 'Nicaragua', code: 'NI' },
            { name: 'Niger', code: 'NE' },
            { name: 'Nigeria', code: 'NG' },
            { name: 'Niue', code: 'NU' },
            { name: 'Norfolk Island', code: 'NF' },
            { name: 'Northern Mariana Islands', code: 'MP' },
            { name: 'Norway', code: 'NO' },
            { name: 'Oman', code: 'OM' },
            { name: 'Pakistan', code: 'PK' },
            { name: 'Palau', code: 'PW' },
            { name: 'Palestinian Territory, Occupied', code: 'PS' },
            { name: 'Panama', code: 'PA' },
            { name: 'Papua New Guinea', code: 'PG' },
            { name: 'Paraguay', code: 'PY' },
            { name: 'Peru', code: 'PE' },
            { name: 'Philippines', code: 'PH' },
            { name: 'Pitcairn', code: 'PN' },
            { name: 'Poland', code: 'PL' },
            { name: 'Portugal', code: 'PT' },
            { name: 'Puerto Rico', code: 'PR' },
            { name: 'Qatar', code: 'QA' },
            { name: 'Reunion', code: 'RE' },
            { name: 'Romania', code: 'RO' },
            { name: 'Russian Federation', code: 'RU' },
            { name: 'Rwanda', code: 'RW' },
            { name: 'Saint Helena', code: 'SH' },
            { name: 'Saint Kitts and Nevis', code: 'KN' },
            { name: 'Saint Lucia', code: 'LC' },
            { name: 'Saint Pierre and Miquelon', code: 'PM' },
            { name: 'Saint Vincent and the Grenadines', code: 'VC' },
            { name: 'Samoa', code: 'WS' },
            { name: 'San Marino', code: 'SM' },
            { name: 'Sao Tome and Principe', code: 'ST' },
            { name: 'Saudi Arabia', code: 'SA' },
            { name: 'Senegal', code: 'SN' },
            { name: 'Serbia and Montenegro', code: 'CS' },
            { name: 'Seychelles', code: 'SC' },
            { name: 'Sierra Leone', code: 'SL' },
            { name: 'Singapore', code: 'SG' },
            { name: 'Slovakia', code: 'SK' },
            { name: 'Slovenia', code: 'SI' },
            { name: 'Solomon Islands', code: 'SB' },
            { name: 'Somalia', code: 'SO' },
            { name: 'South Africa', code: 'ZA' },
            { name: 'South Georgia and the South Sandwich Islands', code: 'GS' },
            { name: 'Spain', code: 'ES' },
            { name: 'Sri Lanka', code: 'LK' },
            { name: 'Sudan', code: 'SD' },
            { name: 'Suriname', code: 'SR' },
            { name: 'Svalbard and Jan Mayen', code: 'SJ' },
            { name: 'Swaziland', code: 'SZ' },
            { name: 'Sweden', code: 'SE' },
            { name: 'Switzerland', code: 'CH' },
            { name: 'Syrian Arab Republic', code: 'SY' },
            { name: 'Taiwan, Province of China', code: 'TW' },
            { name: 'Tajikistan', code: 'TJ' },
            { name: 'Tanzania, United Republic of', code: 'TZ' },
            { name: 'Thailand', code: 'TH' },
            { name: 'Timor-Leste', code: 'TL' },
            { name: 'Togo', code: 'TG' },
            { name: 'Tokelau', code: 'TK' },
            { name: 'Tonga', code: 'TO' },
            { name: 'Trinidad and Tobago', code: 'TT' },
            { name: 'Tunisia', code: 'TN' },
            { name: 'Turkey', code: 'TR' },
            { name: 'Turkmenistan', code: 'TM' },
            { name: 'Turks and Caicos Islands', code: 'TC' },
            { name: 'Tuvalu', code: 'TV' },
            { name: 'Uganda', code: 'UG' },
            { name: 'Ukraine', code: 'UA' },
            { name: 'United Arab Emirates', code: 'AE' },
            { name: 'United Kingdom', code: 'GB' },
            { name: 'United States', code: 'US' },
            { name: 'United States Minor Outlying Islands', code: 'UM' },
            { name: 'Uruguay', code: 'UY' },
            { name: 'Uzbekistan', code: 'UZ' },
            { name: 'Vanuatu', code: 'VU' },
            { name: 'Venezuela', code: 'VE' },
            { name: 'Vietnam', code: 'VN' },
            { name: 'Virgin Islands, British', code: 'VG' },
            { name: 'Virgin Islands, U.S.', code: 'VI' },
            { name: 'Wallis and Futuna', code: 'WF' },
            { name: 'Western Sahara', code: 'EH' },
            { name: 'Yemen', code: 'YE' },
            { name: 'Zambia', code: 'ZM' },
            { name: 'Zimbabwe', code: 'ZW' }
        ];

        $scope.countrylanguages = [
            "Afrikanns",
            "Albanian",
            "Arabic",
            "Armenian",
            "Basque",
            "Bengali",
            "Bulgarian",
            "Catalan",
            "Cambodian",
            "Chinese",
            "Croation",
            "Czech",
            "Danish",
            "Dutch",
            "English",
            "Estonian",
            "Fiji",
            "Finnish",
            "French",
            "Georgian",
            "German",
            "Greek",
            "Gujarati",
            "Hebrew",
            "Hindi",
            "Hungarian",
            "Icelandic",
            "Indonesian",
            "Irish",
            "Italian",
            "Japanese",
            "Javanese",
            "Korean",
            "Latin",
            "Latvian",
            "Lithuanian",
            "Macedonian",
            "Malay",
            "Malayalam",
            "Maltese",
            "Maori",
            "Marathi",
            "Mongolian",
            "Nepali",
            "Norwegian",
            "Persian",
            "Polish",
            "Portuguese",
            "Punjabi",
            "Quechua",
            "Romanian",
            "Russian",
            "Samoan",
            "Serbian",
            "Slovak",
            "Spanish",
            "Swahili",
            "Swedish",
            "Tamil",
            "Tatar",
            "Telugu",
            "Thai",
            "Tibetan",
            "Tonga",
            "Turkish",
            "Ukranian",
            "Urdu",
            "Uzbek",
            "Vietnamese",
            "Welsh",
            "Xhosa"
        ]

    }

})();