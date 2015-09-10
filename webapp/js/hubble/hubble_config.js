
/**
 * I had planned to make hubble_config a special module which tornado processes
 * by injecting values which are ultimately defined in a python config file.
 * This is nice because it means absolutely all application config can be stored
 * in one file. It's so annoying to have a bunch of config files in different
 * directories.
 *
 * For now, 99.9% of the application is in JS so processing this file in python
 * may happen later, if it at all.
 */
define('hubble_config', function(require) {


	var HubbleConfig = function() {
		var pub = this;

		pub.config = {
			// TODO: Automatically switch this to false in production
			// environments with python processing of this file
			DEBUG_MODE: false,

			DEFAULT_LANG: 'en',

			// If true, user will automatically be redirected to https version
			// of any url
			FORCE_HTTPS: true,

      // RECURLY_TOKEN: 'sjc-mqdJhdkWKgnENDKW78RNup', // Production
      RECURLY_TOKEN: 'sjc-EpKK378xY3xuRCeJDAQEtn', // Staging & development
			//API_BASE: 'http://' + document.location.hostname + ':3000/',
			//API_BASE: 'https://api.hubble.in/',
			API_BASE: 'https://ct-api.hubble.in/',
			//API_BASE: 'https://dev-api.hubble.in/',
			//API_BASE: 'https://tatung-api.hubble.in/',
			//API_BASE: 'https://subscription-api.hubble.in/',
			//API_BASE: 'https://staging-api.hubble.in/',
			API_VERSION: 'v1',


			// main.js's baseUrl does not prefix this
			TEMPLATE_PATH: 'js/templates',

			// On device details, the default amount of time to use
			// when loading events.
			DEFAULT_EVENTS_DAYS: '900',

			// Date format used for moment js library, in the format
			// accepted by the API.
			MOMENT_FORMAT_FOR_API: 'YYYY-MM-DD hh:mm:ss',

			MOMENT_FORMAT_FOR_USER: 'MMMM Do YYYY, h:mm:ss a',

			// Only jwplayer is supported right now. Planning to add support for
			// flowplayer.
			DEFAULT_VIDEO_PLAYER: 'jwplayer',

			// Not fully supported yet
			API_CACHE_MINS: 3,
			API_DEVICE_LIST_CACHE_MINS: 15,

			// Pixel width of the streaming video viewport, and the static
			// thumbnail when video is not available. Height is calculated
			// automatically to achieve a 16x9 aspect ratio.
			VIDEO_FULL_WIDTH: 1266,

			// Size when in 'LARGE' mode, which is used when the viewport
			// leaves room on the left for the device list.
			VIDEO_LARGE_WIDTH: 960,

			// Number of consecutive player failures to tolerate before
			// throwing in the towel.
			PLAYER_MAX_RETRIES: 3,

			// Stream times out after 15 minutes
			STREAM_TIMEOUT_SECONDS: 900,

			// Number of ms to wait before sending a command to the api. To be
			// used when user input widgets could potentially send commands to
			// devices very rapidly, such as sliders. This will enforce a
			// maximum number of calls in a specific amount of time. The last
			// call in the given time frame is the one which will be sent to
			// the device.
			API_SAVE_WAIT_MS: 300,

			DEVICE_DETAILS_EVENTS_PER_PAGE: 7,

			GLOBAL_TIMELINE_EVENTS_PER_PAGE: 20,

			//JWPLAYER_LICENSE_KEY: 'X8xFTv1IwY8dzNJlRyqcawa3WFpEvWUYlLqmLw==',
			JWPLAYER_LICENSE_KEY: '5ZR4yuygx2wbHfD6U1E+PLnn/skaxKS6mUQYKl7F5V8=',

			MAX_PAGELINKS: 5,

			// Number of minutes video stream will play until it automatically
			// stops.
			VIDEO_STREAM_MINS_UNTIL_STOP: 15,

			// There is a delay after a snapshot is taken, until the API can
			// serve the updated snapshot URL. This delay affects the time until
			// the "Download Snapshot" link shows up.
			SNAPSHOT_DOWNLOAD_WAIT_SECONDS: 5,


			VOLUME_MIN_VALUE: 0,
			VOLUME_MAX_VALUE: 100,

			BRIGHTNESS_MIN_VALUE: 1,
			BRIGHTNESS_MAX_VALUE: 8,

			//---- Device model IDs ----//
			// This section is our hard coded, lame way of handling device
			// capabilities. The key names here are taken from the device
			// capability matrix prepared by Neil (I think).
			// The IDs come from the API's device_model endpoint. They
			// don't line up completely so these values are a bit guessey
			// and not very reliable.

			// Focus 66 I'm sure of
			FOCUS66_DEVICE_MODEL_ID: 3,

			// I know we have a camera connected which identifies itself as
			// device model id 7, so this exists
			BLINK85_DEVICE_MODEL_ID: 7,
			FOCUS85_DEVICE_MODEL_ID: 7,
			SCOUT85_DEVICE_MODEL_ID: 7,

			// MBP83 and Blink83 probably the same thing
			MBP83_DEVICE_MODEL_ID: 5,

			// Don't know what these are
			VC921_DEVICE_MODEL_ID: 8,
			VC931_DEVICE_MODEL_ID: 9,
			FOCUS73_DEVICE_MODEL_ID: 10,
			SCOUT73_DEVICE_MODEL_ID: 10,

			// There is a device called "FOCUS96" which MIGHT be this
			BLINK96_DEVICE_MODEL_ID: 4,

			// Match for device  "MBP854"
			MBP854HD_DEVICE_MODEL_ID: 6,



			// These others were present in the device model info, but don't
			// seem to match anything from the capability matrix

			MBP33HD_DEVICE_MODEL_ID: 0,
			MBP36HD_DEVICE_MODEL_ID: 0,
			SCOUT36HD_DEVICE_MODEL_ID: 0,

			BLINK83_DEVICE_MODEL_ID: 0,
			FOCUS83_DEVICE_MODEL_ID: 0,
			SCOUT83_DEVICE_MODEL_ID: 0,

			BLINK57_DEVICE_MODEL_ID: 0,

			MBP877HD_DEVICE_MODEL_ID: 0,


			//DEVICE_EVENTS_PAGE_SIZE: 25,
			// testing
			DEVICE_EVENTS_PAGE_SIZE: 3,

			DEVICELIST_DEVICES_PER_ROW: 4,

			// Time (in microseconds) until user feedback messages on user
			// settings form to disappear
			USERSETTINGS_MESSAGE_HIDE_TIME: 7000,


			// Actual range is 200-800. I was surprised to see they were never
			// configured to deliver their maximum bitrate.
			CAMERA_BITRATE_HIGH_QUALITY: 600,
			CAMERA_BITRATE_LOW_QUALITY: 200,

			// These magic numbers come from the confluence doc on camera
			// parameter settings:
			// https://monitoreverywhere.atlassian.net/wiki/pages/viewpage.action?spaceKey=MAS&title=Camera+Parameter+Settings
			// If they do not "feel" right for the buttons, use other other
			// values for the buttons or switch to sliders.
			CAM_MOTION_SENSITIVITY_LOW: 10,
			CAM_MOTION_SENSITIVITY_MEDIUM: 50,
			CAM_MOTION_SENSITIVITY_HIGH: 90,

			CAM_SOUND_SENSITIVITY_LOW: 80,
			CAM_SOUND_SENSITIVITY_MEDIUM: 70,
			CAM_SOUND_SENSITIVITY_HIGH: 25,

		};

		pub.get = function(key) {
			return pub.config[key];
		};
	};

	return new HubbleConfig();
});

