/**
 * UserPrefs
 * This class provides an interface to accessing temporary storage in the Web
 * App. Currently the API does not support server side storage of user 
 * preference data (support for arbitrary json storage is planned) so this 
 * class will store using localStorage.
 */ 
define('user_prefs', function(require) {
	var _         = require('underscore');
	var Backbone  = require('backbone');

	// Session data is saved to localStorage until the API has a means of saving
	// user preferences. TODO: expiring saved tokens
	var amplify   = require('lib/amplify.store.min');
	
	var UserPrefs = function() {
		var pub = this;
		
		pub.data = {};
	
		pub.get = function(key) {
			// In the future: load user prefs from api
			// For now: It's just a shim over amplify's localStorage()

			var value = amplify.store.localStorage(key);

			if (key != 'USER_DEVICES') {
				return value;
			}

			// HACK
			// Earlier version of the webapp stored USER_DEVICES as an array,
			// which caused some problems. Now some clients will still have
			// them cached as such in localStorage. This bit of code will
			// return 'undefined' instead of the array, which will cause the 
			// calling code to think devices were not cached and will reqcquire
			// them from the API. Note: AFAIK localStorage is supposed to return
			// null for missing data but amplify returns undefined so that's 
			// what the calling code expects. 
			if (Object.prototype.toString.call(value) === '[object Array]') {
				//return undefined;
			}
			// not an array, return it like normal
			return value;
		};
	
		pub.set = function(key, value) {
			amplify.store.localStorage(key, value);
		};
		
		pub.remove = function(key) {
			amplify.store.localStorage(key, null);
		};
	};
	
	return new UserPrefs();
});
