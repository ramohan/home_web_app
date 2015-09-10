
/**
 * Setup paths for all libraries used. Additional libraries can be pulled
 * in by specific modules by giving their path in their require(). 
 *
 * All other javascript modules will be minified and appended to this file
 * as it is served by tornado.
 */

require.config({
	baseUrl:  'js',
	shim: {
		// Define backbone's dependencies. Should prevent a race condition
		// where backbone library is parsed before required libraries.
		'lib/backbone': {
			deps: ['lib/underscore-min', 'jquery'],
			exports: 'Backbone'
		},
		// Not sure if this is necessary as I've never seen the potential
		// race condition occur.
		'lib/jquery-ui-1.10.4.custom.min': {
			deps: ['jquery']
		},
		'lib/amplify.store.min': {
			deps: ['jquery'],
			exports: 'amplify'
		},
		'lib/jwplayer/jwplayer': {
			exports: 'jwplayer',
		},
		'jquery_bootstrap': {
			deps: ['jquery']
		},
		'lib/jquery.xdomainrequest.min': {
			deps: ['jquery']
		},
		//'jquery_jqtimeline': {
		//	deps: ['jquery']
		//},
		//'lib/gridster/jquery.gridster.extras': {
		//	deps: ['lib/gridster/jquery.gridster']
		//},
	},
	paths: {
		// 3rd party libs
		jquery:               'lib/jquery-1.11.0.min',
		jquery_ui:            'lib/jquery-ui-1.10.4.custom.min',
		jquery_cookie:        'lib/jquery_cookie',
		jquery_bootstrap:     'lib/bootstrap.min',
		amplify:              'lib/amplify.store.min',
		underscore:           'lib/underscore-min',
		backbone:             'lib/backbone',
		moment:               'lib/moment-with-langs',
		timeline:             'lib/timeline.min',
		recurly:              'lib/recurly',
		//jquery_jqtimeline:    'lib/jquery.jqtimeline',
		
		// Application code
		hubble_device:        'hubble/hubble_device',
		hubble_user:          'hubble/hubble_user',	
		hubble_lang:          'hubble/hubble_lang',
		video_player:         'hubble/video_player',
		jwplayer:             'lib/jwplayer/jwplayer',
		video_player_jw:      'hubble/video_player_jw',

		// Common code
		error_handler:        'hubble/error_handler',
		hubble_api_endpoints: 'hubble/hubble_api_endpoints',
		hubble_api:           'hubble/hubble_api',
		hubble_config:        'hubble/hubble_config',
		global:               'global',
		hubble_main:          'hubble/hubble_main',
		hubble_router:        'hubble/hubble_router',				
		template_loader:      'hubble/template_loader',
		session_manager:      'hubble/session_manager',
		user_prefs:           'hubble/user_prefs',
		
		// No longer needed as templates are managed with template_loader module
		//text:                 'lib/text',
	}
});

// Load and run main module
require([
	'hubble_main',
], function(MainApp) {
	MainApp.initialize();
});






