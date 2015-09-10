// Certain third party libraries return anonymous modules, if they define
// AMD modules at all, instead of using requirejs' define() function. 
// Consequently requirejs is unable to ascertain that they have loaded and
// unnecessary downloads them. 

// The purpose of this file is to define modules which return the global 
// objects created by third party libraries, so that these do not generate
// additional HTTP requests.

// This file is automatically pulled in by the python minify-concatenation 
// code.

/*
$(document).ready(function() {
	define('backbone', function(require) {
		return window.Backbone;
	})

	define('jwplayer', function(require) {
		return jwplayer;
	});

	define('amplify', function(require) {
		return amplify;
	});
});
*/


