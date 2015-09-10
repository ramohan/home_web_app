// This module is using the mixpanel library as a global from outside the AMD
// system. This is theoretically vulnerable to race conditions, but in practice
// they probably won't ever happen because the mixpanel library is first in the
// the code and this shouldn't ever run before dozens of objects from other 
// modules are first loaded.

// This abstraction exists so that calling code should need to suffer little
// or no modification when the analytics service is changed.

define('hubble/event_logger', function(require) {
	var SessionManager = require('session_manager');

	var EventLogger = function() {
		var pub = this;
		pub.user_is_set = false;

		pub.setEndUser = function(username) {
			mixpanel.people.set({
				'$name':    username,
				'$product': 'Hubble WebApp'
			});
			pub.user_is_set = true;
		};


		pub.logEvent = function(eventname, data) {
			if (!pub.user_is_set) {
				pub.setEndUser(SessionManager.getActiveSession());
			}
			mixpanel.track(eventname, data);
		};
	};

	return new EventLogger();
});


