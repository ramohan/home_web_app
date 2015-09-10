
/**
 * HubbleMain module. If the code for the Hubble WebApp were to support
 * being run outside of a browser environment, I believe this module is
 * the point at which the code would check for the presence of the window
 * object and call an alternate router to handle CLI or other methods of 
 * interaction. 
 *
 * Leaving it in because 1) it's not hurting anything and 2) it's not outside
 * the realm of possibility that we move to nodejs in the future and use the
 * common code for additional server side processing. It does have a certain
 * unified appeal.
 */
define('hubble_main', [
	'hubble_router'
], function(Router) {
	var initialize = function() {	
		Router.initialize();
	};

	return {
		initialize: initialize
	};
});

