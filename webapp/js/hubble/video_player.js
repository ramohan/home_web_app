/**
 * This class provides an interface to the video player which is used by other
 * modules and allows the specific video player (jwplayer or flowplayer) to be
 * swapped out without changing any of the calling code.
 */
 
define('video_player', function(require) {
	var _             = require('underscore');
	var HubbleAPI     = require('hubble_api');
	var cfg           = require('hubble_config');
	var VideoPlayerJw = require('video_player_jw');
	var jwplayer_inc  = require('jwplayer');
	var ErrorHandler  = require('error_handler');
	
	var VideoPlayer = function(options) {
		var pub = this;

		pub.options = getVideoPlayerConfig(options);
		pub.target_selector = options.target;

		if (pub.options.player == 'jwplayer') {
			jwplayer.key = cfg.get('JWPLAYER_LICENSE_KEY');
		}

		// Begin playing the video
		pub.init = function() {
			try {
				if (pub.options.player == 'jwplayer') {
					pub.loadJwplayer();
				} else {
					ErrorHandler.exception("Web App configuration error. No " +
						"video player was given.");
				}
			} catch (err) {
				// TODO show message to user indicating playback error
				console.log("Failed to initialize video player. {0}".format(err));
			}

		};

		pub.initLiveStream = function() {
			var player = new VideoPlayerJw();
			player.initCameraFeed(pub.target_selector, pub.options.cameraModel,
				pub.options.isFullView);
			pub.player = player;
		};

		pub.loadJwplayer = function() {
			try {
				jwplayer(pub.target_selector).setup(pub.options);
			} catch (err) {
				ErrorHandler.exception(err);
			}
		};
		
		pub.preventTimeout = function() {
			pub.player.preventStreamTimeout();
		};

		pub.setSize = function(size) {
			return pub.player.setSize(size);
		};

		function getVideoPlayerConfig(options) {
			if (options.player === undefined) {
				options.player = cfg.get('DEFAULT_VIDEO_PLAYER');
			}

			if (options.player == 'jwplayer') {
				options = _.defaults(options, {
					autostart: 'false',
					stretching: 'exactfit',
					logo: {
						hide: true
					}
				});
			}

			return options;
		};
	};

	// Returns the constructor. Calling code must instantiate the object
	// so that there can be multiple players on a page.
	return VideoPlayer;
});


