//Custom Hex filter
angular.module('pkPassFilters', []).filter('hex', function(){
	return function(input) {
		return input.replace('#', '');
	};
});

var app = angular.module('pkPassApp', ['color.picker', 'angularMoment', 'datePicker', 'xml-templater', 'pkPassFilters', 'ngclipboard']);
