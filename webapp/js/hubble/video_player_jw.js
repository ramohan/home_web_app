/**
 * An instance of this object represents an instance of the video player.
 * This object should be able to size itself correctly when given an instance
 * of a device from the API.
 */
 
define('video_player_jw', function(require) {
	var $            = require('jquery');
	var HubbleAPI    = require('hubble_api');
	var cfg          = require('hubble_config');
	var lang         = require('hubble_lang');
	var ErrorHandler = require('error_handler');
	
	// Note: cannot name this local variable "jwplayer" because this lib
	// is not AMD compatible. Even though it is defined as a dependency here,
	// the code is actually accessing the jwplayer global object to do it's
	// work.
	var jwplayer_inc = require('jwplayer');
	

	var VideoPlayerJw = function() {
		var pub = this;
		
		pub.div_id = null;		
		pub.camera_model = null;
		pub.failures = 0;
		
		pub.num_warnings = 1;

		// In order to resume playback after a pause, the create_session api
		// endpoint must be hit. This flag makes sure that happens only when
		// it is supposed to.
		pub.is_paused = false;

		// If "play" fails to happen three times, the create camera stream
		// endpoint will be reattempted one time. If it again fails three times
		// a message will be shown asking the user to reload.
		pub.has_totally_failed = false;

		// A timer to automatically stop the stream after x minutes.
		pub.auto_stop_timer = null;

	
		pub.initCameraFeed = function(div_id, camera, is_full_view) {
			pub.div_id = div_id;
			pub.camera_model = camera;

			if (is_full_view === undefined) {
				is_full_view = false;
			}
			pub.is_full_view = is_full_view;
		
			console.log("Initializing video player on div {0}".format(div_id));
			
			jwplayer.key = cfg.get('JWPLAYER_LICENSE_KEY');
			
			HubbleAPI.call('CREATE_DEVICE_SESSION', {
				'registration_id': camera.get('registration_id'), 
				'client_type': 'browser',
			}, function(response) {
				var stream_url = response['data']['url'];
				pub.startVideoStream(div_id, camera, stream_url);
			});	
		};

		// Used to make sure the create_session API endpoint is hit, when it must
		// be after a pause in order to resume playback
		pub.recreateStreamSession = function() {
			pub.initCameraFeed(pub.div_id, pub.camera_model, pub.is_full_view);
		};
	
		pub.startVideoStream = function(div_id, camera, stream_url) { 
		
			if (cfg.get('DEBUG_MODE')) {
				console.log("Stream URL:" + stream_url);
				console.log("div id:" + div_id); 
			}

			try {
				// Unfortunate use of a global. jwplayer does not play nice.
				jwplayer(div_id).setup(pub.getConfig(camera, stream_url));
			} catch (err) {
				console.log("Live stream error: {0}".format(err));
			}
		};
	
		pub.getConfig = function(camera, stream_url) {

			// Default dimensions for small view when we don't know which camera
			// model it is.
			var width = 240;
			var height = 180;
			if (cfg.get('DEBUG_MODE')) {
				console.log("Device is the Focus 66");
			}
			if (pub.is_full_view) {
				width = cfg.get('VIDEO_LARGE_WIDTH');
			} 
			height = camera.getHeightFromWidth(width);

	
			// Given in seconds
			var buffer_length = 0.1;

			var config = {
				file: stream_url,
				autostart: 'true',
				width: width,
				type: 'rtmp',
				timeoutInSeconds: '6',
				height:  height,
				stretching: 'exactfit',
				rtmp: {
					bufferlength: buffer_length
				},
				logo: {
					hide: true
				},
				events: {
					onPause: pub.onPause,
					onPlay: pub.onPlay,
					onError: pub.onError,
					onTime: pub.onTime
				}
			};
	
			if (pub.camera_model.get('snaps_url').indexOf('hubble.png') < 0) {
				config.image = pub.camera_model.get('snaps_url');
			}


			return config;	
		};

		pub.enableCamControls = function(event) {
			$('#controls-toggle-container').show();
		};

		pub.disableCamControls = function(event) {
			$('#controls-toggle-container').hide();
		};

		pub.onPause = function(event) {
			//jwplayer(pub.target_div).stop();
			pub.is_paused = true;
			clearTimeout(pub.auto_stop_timer);
			//jwplayer(pub.div_id).remove();
			pub.disableCamControls();
		};

		pub.onIdle = function(event) {
			pub.disableCamControls();
		};
		
		/**
		 * After 4 and a half minutes, show a message telling the user their
		 * stream will time out. Thirty seconds later, shut it off unless they
		 * click the "Continue Streaming" link. 
		 */
		pub.onTime = function(event) {
			var timeout = parseInt(cfg.get('STREAM_TIMEOUT_SECONDS'));
			var warning_time = timeout - 30 * pub.num_warnings;
			var stop_time = (timeout * pub.num_warnings);
			
			//console.log("{0}-{1}-{2}".format(event.position, warning_time, stop_time));
			if (event.position == warning_time) {
				$('#player-stopped-message').
					html(lang.t('camdetails_player_will_stop_message')).
					show();
			};
			
			if (event.position == stop_time) {
				$('#player-stopped-message').
					html(lang.t('camdetails_player_stopped_message')).
					show();
				jwplayer(pub.target_div).stop();			
			}
		};
		
		pub.preventStreamTimeout = function() {
			pub.num_warnings++;
		};
		
		pub.onPlay = function(event){
			// Reset the failure counters, we have a successful stream.
			pub.has_totally_failed = false;
			pub.failures = 0;
			
			pub.num_warnings = 1;

			$('#viewport').removeClass('viewport-hidden');
			$('#player-stopped-container').hide();
			pub.enableCamControls();
		};

		/**
		 * I'm focused on handling two situations here. 1) Stream does not begin
		 * properly on initial load. For that we retry with jwplayer().play()
		 * at the bottom, up to three times. 2) When the player is paused, the
		 * camera stops streaming. When that happens the video player is 
		 * reinitialized and that seems to solve it.
		 *
		 * The other, less frequent, error is when streaming randomly dies off
		 * during playback. For this the play() function is called three times,
		 * then the stream is reinitialized and play() is attempted up to three
		 * more times. If it still won't play, the player is shut down with a 
		 * message to reload the page.
		 *
		 * The last situation that this really does not deal with, is when there
		 * is a network or bandwidth issue and the player cannot stream reliably.
		 */
		pub.onError = function(event){
			pub.failures++;
			if (pub.is_paused) {
				pub.is_paused = false;
				pub.recreateStreamSession();
			}

			if (pub.camera_model.get('snaps_url').indexOf('hubble.png') < 0) {
				jwplayer(pub.div_id).load({
					image: pub.camera_model.get('snaps_url')
				});
			}

			
			console.log("jwplayer player rtmp stream failed.");
			console.log("Failure {0} of {1}.".
				format(pub.failures, cfg.get('PLAYER_MAX_RETRIES')));

			if (pub.failures > cfg.get('PLAYER_MAX_RETRIES')) {			
				console.log("Too many failures, I give up.");
				console.log(pub.div_id);
				if (event.message == "Error loading stream: ID not found on server") {

					if (pub.has_totally_failed) {
						jwplayer(pub.div_id).remove();
						ErrorHandler.exception("Video streaming failed even after reinitializing");
						$('#{0}'.format(pub.div_id)).html(lang.t('cam_stream_error_idnotfound'));
					} else {
						pub.has_totally_failed = true;
						pub.failures = 0;
						pub.recreateStreamSession();
					}
				}
				return;
			}
			
			console.log("Retrying stream init...");
			jwplayer(pub.div_id).play();
		};

		pub.setSize = function(size) {
			var width, height;
			if (size == 'FULL') {
				width = cfg.get('VIDEO_FULL_WIDTH');
			} else if (size == 'LARGE') {
				width = cfg.get('VIDEO_LARGE_WIDTH');
			}

			height = pub.camera_model.getHeightFromWidth16x9(width);

			if (cfg.get('DEBUG_MODE')) {
				console.log("Setting player size to {0},{1} for player {2}".
					format(width,height,pub.div_id));
			}

			jwplayer(pub.div_id).resize(width, height);
		};
	};

	// Returns the constructor. Calling code must instantiate the object
	// so that there can be multiple players on a page.
	return VideoPlayerJw;
});


