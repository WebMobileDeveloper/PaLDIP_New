//  ===================  Global Consts =====================
let DevServer = false;

let config = DevServer ?
    {
        //=========================for test ===============================
        apiKey: "AIzaSyB8Pdd1Y64uGuN-RzBVl25Qmdv0Q1E2-9c",
        authDomain: "temp-548d0.firebaseapp.com",
        databaseURL: "https://temp-548d0.firebaseio.com",
        projectId: "temp-548d0",
        storageBucket: "temp-548d0.appspot.com",
        messagingSenderId: "508079222796"
    } : {
        // ===================for server==========================
        apiKey: "AIzaSyCWpvANnV5CrGOBbGTfTkFS0b-qJCbw3MQ",
        authDomain: "paldip-a467e.firebaseapp.com",
        databaseURL: "https://paldip-a467e.firebaseio.com",
        projectId: "paldip-a467e",
        storageBucket: "paldip-a467e.appspot.com",
        messagingSenderId: "989537263955",
    };
const QUESTION_TYPES = ['Feedback Type', 'Rating Type', 'Digit Type', 'Text Type', 'Dropdown Type', 'Multiple Type', 'Slide Type', 'Contingent Type', 'Likert Type', 'Answer Type', 'External Activity'];
const DEFAULT_PAGE_SETTING = {
    sort: true,            //sort : {true: 'Set' || false: 'Type'}
    expand: {},
    selectedTab: 'QuestionSet', // selectedTab: {'QuestionSet' || 'GroupSet'}
    setKey: undefined,
    itemKey: undefined,
    questionKey: undefined,
    expandAll : true,
};
// ------------------------------------------------
firebase.initializeApp(config);

var app = angular.module('myApp', ['ngMaterial', 'ngSanitize', 'toaster', 'ui.router', angularDragula(angular),]);
app.factory('Excel', function ($window) {
    var uri = 'data:application/vnd.ms-excel;charset=UTF-8;base64,',
        template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"  xmlns="http://www.w3.org/TR/REC-html40">
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <head>
        <!--[if gte mso 9]>
        <xml>
        <x:ExcelWorkbook>
            <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                    <x:Name>{worksheet}</x:Name>
                    <x:WorksheetOptions>
                        <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                </x:ExcelWorksheet>
            </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        </xml>
        <![endif]-->
         </head><body><table>{table}</table></body></html>`,
        base64 = function (s) { return $window.btoa(unescape(encodeURIComponent(s))); },
        format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) };
    return {
        tableToExcel: function (tableId, worksheetName) {
            var table = $(tableId),
                ctx = { worksheet: worksheetName, table: table.html() },
                href = uri + base64(format(template, ctx));
            return href;
        }
    };
});
app.filter('showObject', function () {
    return function (Objects, groupChoice) {
        var filtered = [];
        angular.forEach(Objects, function (qst) {
            var result = false;
            switch (groupChoice) {
                case 'main':
                    result = qst.existInGroup;
                    break;
                case 'other':
                    result = !qst.existInGroup;
                    break;
                case 'all':
                    result = true;
                    break;
            }
            if (result) filtered.push(qst);
        });
        return filtered;
    };
});
app.filter('unHide', function () {
    return function (Objects) {
        var filtered = [];
        angular.forEach(Objects, function (qst) {
            if (!qst.hideBy) filtered.push(qst);
        });
        return filtered;
    };
});

app.filter('orderObjectBy', function () {
    return function (items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function (item) {
            filtered.push(item);
        });
        filtered.sort(function (a, b) {
            return (a[field] > b[field] ? 1 : -1);
        });
        if (reverse) filtered.reverse();
        return filtered;
    };
});
app.filter('range', function () {
    return function (input, total) {
        total = parseInt(total);

        for (var i = 0; i < total; i++) {
            input.push(i);
        }

        return input;
    };
});
app.filter('getLinks', function () {
    return function (Objects, searchKey) {
        var filtered = [];
        if (searchKey == '') {
            return Objects;
        } else {
            angular.forEach(Objects, function (link) {
                if (link.key.indexOf(searchKey) > -1) filtered.push(link);
            });
            return filtered;
        }

    };
});
app.filter('highlight', function ($sce) {
    return function (text, phrase) {
        if (phrase) text = text.replace(new RegExp('(' + phrase + ')', 'gi'),
            '<span class="highlighted">$1</span>')
        return $sce.trustAsHtml(text)
    }
});

// ===================directives=============================================
//
// ============================================================================
app.directive('myclick', function () {
    return function (scope, element, attrs) {
        element.bind('touchstart click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            scope.$apply(attrs['myclick']);
        });
    };
});
app.directive('errSrc', function () {
    return {
        link: function (scope, element, attrs) {
            element.bind('error', function () {
                if (attrs.src != attrs.errSrc) {
                    attrs.$set('src', attrs.errSrc);
                }
            });

            attrs.$observe('ngSrc', function (value) {
                if (!value && attrs.errSrc) {
                    attrs.$set('src', attrs.errSrc);
                }
            });
        }
    }
});
app.directive('pressEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.pressEnter);
                });

                event.preventDefault();
            }
        });
    };
});
app.directive('enterSubmit', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            elem.bind('keydown', function (event) {
                var code = event.keyCode || event.which;
                if (code === 13) {
                    if (!(event.shiftKey || event.ctrlKey)) {
                        event.preventDefault();
                        scope.$apply(attrs.enterSubmit);
                    }
                }
            });
        }
    }
});
app.directive('selectOnClick', ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                if (!$window.getSelection().toString()) {
                    // Required for mobile Safari
                    this.setSelectionRange(0, this.value.length)
                }
            });
        }
    };
}]);
app.directive('elemReady', function ($parse) {
    return {
        restrict: 'A',
        link: function ($scope, elem, attrs) {
            elem.ready(function () {
                $scope.$apply(function () {
                    var func = $parse(attrs.elemReady);
                    func($scope);
                })
            })
        }
    }
});
app.directive("contenteditable", function () {
    return {
        restrict: "A",
        require: "ngModel",
        link: function ($scope, element, attrs, ngModel) {
            function read() {
                ngModel.$setViewValue(element.html());
            }
            ngModel.$render = function () {
                element.html(ngModel.$viewValue || "");
            };
            element.bind("blur keyup change", function () {
                $scope.$apply(read);
            });
        }
    };
});


app.directive('numbersOnly', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, modelCtrl) {
            modelCtrl.$parsers.push(function (inputValue) {
                // this next if is necessary for when using ng-required on your input. 
                // In such cases, when a letter is typed first, this parser will be called
                // again, and the 2nd time, the value will be undefined
                if (inputValue == undefined) inputValue = '';
                // var transformedInput = inputValue.replace(/[^0-9]/g, '');
                inputValue += '';
                var transformedInput = inputValue.replace(/^0*/g, '');
                if (transformedInput == '') transformedInput = 0;
                if (transformedInput != inputValue || transformedInput == 0) {
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }

                return transformedInput;
            });
        }
    };
});
// app.directive('contenteditablediv', ['$sce', function($sce) {
//     return {
//       restrict: 'A', // only activate on element attribute
//       require: '?ngModel', // get a hold of NgModelController
//       link: function(scope, element, attrs, ngModel) {
//         if (!ngModel) return; // do nothing if no ng-model

//         // Specify how UI should be updated
//         ngModel.$render = function() {
//           element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
//         };

//         // Listen for change events to enable binding
//         element.on('blur keyup change', function() {
//           scope.$evalAsync(read);
//         });
//         read(); // initialize

//         // Write data to the model
//         function read() {
//           var html = element.html();
//           // When we clear the content editable the browser leaves a <br> behind
//           // If strip-br attribute is provided then we strip this out
//           if ( attrs.stripBr && html == '<br>' ) {
//             html = '';
//           }
//           ngModel.$setViewValue(html);
//         }
//       }
//     };
//   }]);
