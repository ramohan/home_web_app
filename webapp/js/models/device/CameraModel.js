
/**
 * Device model holds an object of the device data as loaded from the API. When
 * accessor methods are used, the data is lazily loaded from the device object.
 */

define('models/device/CameraModel', function(require) {
	var _                  = require('underscore');
	var Backbone           = require('backbone');
	var GenericDeviceModel = require('models/device/GenericDeviceModel');
	var cfg                = require('hubble_config');
	var HubbleAPI          = require('hubble_api');
	
	var CameraModel = GenericDeviceModel.extend({
		defaults: {
			snaps_url: '',		
		},
		
		getType: function() {
			return 'CAMERA';
		},

		// This gets called after the data is loaded into attributes
		initialize: function() {
			var self = this;
			// Apply keys to device settings. Issue: device_settings is a 
			// numerically indexed array, but each object has a nice key 
			// identifying the setting type (brightness|pan|tilt, etc) so
			// create a new object keyed by the key, in case the order
			// of the numeric index changes.
			var settings = {};
			_.each(self.attributes.device_settings, function(obj) {
				settings[obj['key']] = obj;
			});
			self.attributes.keyed_device_settings = settings;

		},

		// Helpers

		// This command uses a synchronous ajax call to 'return' a value from
		// the API. It is deprecated because it is better to avoid locking the
		// page.
		getCommandResponse: function(command) {
			var self = this;
			return HubbleAPI.getCommandResponse(
				self.get('registration_id'), command
			);
		},

		// Parse out the single value response from send_command 
		getSingleValue: function(response) {
			if (response === null) {
				console.log("Command {0} returned null.".format(command));
				var err = new Error();
				console.log(err.stack);
			}
			try {
				var val = response['data']['device_response']['body'];
			} catch (err) {
				console.log("getSingleValue() failed. Response: {0}".
					format(JSON.stringify(response)));
			}
			val = val.substring(val.indexOf(':')+2);
			if (!isNaN(val)) {
				return Math.round(parseFloat(val));
			} else {
				return val;
			}
		},

		// This alternative to getCommandResponse is asynchronous and places
		// a greater burden on calling code to manage it's execution path in
		// order to make use of the returned result.
		runCommand: function(command, value, callback) {
			var self = this;
			return HubbleAPI.sendCommand(
				self.get('registration_id'), command, value, true, callback
			);
		},

		getValueFromCommand: function(command, callback) {
			var self = this;
			var new_callback = function(response) {
				if (typeof callback != "function") {
					console.log("getValueFromCommand, callback was not a " +
						"function for command: " + command);
				}
				callback(self.getSingleValue(response));
			};
			self.runCommand(command, undefined, new_callback);
		},

		sendCommand: function(command, value, async) {
			var self = this;
			return HubbleAPI.sendCommand(
				self.get('registration_id'), command, value, async
			);
		},

		throttledApiCommand: function(command, value) {
			var self = this;
			return HubbleAPI.throttledApiCommand(
				self.get('registration_id'), command, value
			);
		},

		/**
		 * Get many settings at once. Returns:
		 * ms: motion status (0 or 1)
		 * me: motion sensitivity (1,99)
		 * vs: vox status (0 or 1)
		 * vt: vox threshold (0,100)
		 * hs: high temp detection status (0 or 1)
		 * ls: low temp detection status (0 or 1)
		 * ht: high temp threshold (25-33)
		 * lt: low temp threshold (10-18)
		 */
		getSettings: function(callback) {
			var self = this;
			var new_callback = function(response) {
				// Api unhelpfully returns this information as a string. Split it
				// into an object and cast values as ints
				var setting_str = response['data']['device_response']['body'];
				var settings = setting_str.substring(setting_str.indexOf(':')+2);
				var setting_ar = settings.split(',');
				var settings_obj = {};
				var set_key = '';
				var set_val = '';
				_.each(setting_ar, function(val) {
					set_key = val.substring(0, 2);
					set_val = parseInt(val.substring(3));
					settings_obj[set_key] = set_val;
				});

				// and cast toggles as booleans to calling code can check them
				// a little more semantically. Actually I'm not very keen on these
				// opaque abbrevations either but they'll do for now.
				settings_obj['ms'] = Boolean(settings_obj['ms']);
				settings_obj['vs'] = Boolean(settings_obj['vs']);
				settings_obj['hs'] = Boolean(settings_obj['hs']);
				settings_obj['ls'] = Boolean(settings_obj['ls']);

				callback(settings_obj);
			};

			self.runCommand('device_setting', undefined, new_callback);
		},



		getHeightFromWidth: function(width) {
			var self = this;
			var id = self.get('device_model_id');
			if (id == cfg.get('FOCUS66_DEVICE_MODEL_ID') ||
				id == cfg.get('MBP83_DEVICE_MODEL_ID')) {
				return self.getHeightFromWidth16x9(width);
			}
			console.log("Device is unknown");
			console.log("device_model_id: " + self.get('device_model_id'));
			// Unknown device, treat it as focus 66
			return self.getHeightFromWidth16x9(width);
		},

		getWidthFromHeight: function(height) {
			var self = this;
			var id = self.get('device_model_id');
			if (id == cfg.get('FOCUS66_DEVICE_MODEL_ID') ||
				id == cfg.get('MBP83_DEVICE_MODEL_ID')) {
				return self.getHeightFromWidth16x9(width);
			}
			console.log("Device is unknown");
			console.log("device_model_id: " + self.get('device_model_id'));
			return self.getWidthFromHeight16x9(height);
		},

		getHeightFromWidth16x9: function(width) {
			// basic 16x9 formula: width / height = 1.77
			// width / 1.77 = height
			return Math.round(width / 1.777777777777778);
		},

		getWidthFromHeight16x9: function(height) {
			// width / height = 1.77
			// width = 1.77 * height 
			return Math.round(1.777777777777778 * height);
		},
		
		takeSnapshot: function() {
			var self = this;
			self.sendCommand('get_image_snapshot');
		},

		getBitrate: function(callback) {
			var self = this;
			self.getValueFromCommand('get_value_bitrate', callback);
		},

		setBitrate: function(bitrate) {
			var self = this;
			self.sendCommand('set_video_bitrate', bitrate);
		},

		hasFeature: function(feature) {
			var self = this;
			var features = {
				brightness: true,
				pan: false,
				tilt: false,
				melody: false,
				volume: false
			};
			var modelid = self.get('device_model_id');

			if (modelid == cfg.get('FOCUS66_DEVICE_MODEL_ID')) {
				features['melody'] = false;
				features['pan'] = false;
				features['tilt'] = false;
				features['volume'] = true;
			} else if (modelid == cfg.get('MBP83_DEVICE_MODEL_ID')) {
				features['volume'] = false;
				features['pan'] = true;
				features['tilt'] = true;
				features['melody'] = true;
			} else if (modelid == cfg.get('FOCUS73_DEVICE_MODEL_ID')) {
				features['volume'] = false;
				features['pan'] = true;
				features['tilt'] = true;
				features['melody'] = false;
			} else if (modelid == cfg.get('BLINK85_DEVICE_MODEL_ID')) {
				features['pan'] = true;
				features['tilt'] = true;
				features['melody'] = true;
			}

			features['brightness'] = false;

			return features[feature];
		},

		pan: function(direction) {
			var self = this;
			var dir = direction;
			if (direction == 'up') {
				dir = 'backward';
			}
			if (direction == 'down') {
				dir = 'forward';
			}
			self.throttledApiCommand('move_' + dir, 0.1);
		},

		getCurrentMelody: function(callback) {
			var self = this;
			self.getValueFromCommand('value_melody', callback);
		},


		getMotionSensitivity: function() {
			var self = this;
			self.getValueFromCommand('value_motion_sensitivity', callback);
		},

		/**
		 * @param {int} value Between 1 and 99
		 */
		setMotionSensitivity: function(value) {
			var self = this;
			self.throttledApiCommand('set_motion_sensitivity', value);
		},

		setMotionDetectionStatus: function(value) {
			var self = this;
			self.throttledApiCommand('set_motion_area', value);
		},

		getSoundDetectionStatus: function(callback) {
			var self = this;
			self.getValueFromCommand('vox_get_status', callback);
		},

		/**
		 * @param {bool} enabled
		 */
		setSoundDetectionStatus: function(enabled) {
			var self = this;
			if (enabled) {
				self.throttledApiCommand('vox_enable');
			} else {
				self.throttledApiCommand('vox_disable');
			}
		},

		getSoundSensitivity: function(callback) {
			var self = this;
			self.getValueFromCommand('vox_get_threshold', callback);
		},

		/**
		 * @param {int} value Set the value to 25/70/80 to mean low/medium/high
		 */
		setSoundSensitivity: function(value) {
			var self = this;
			var response = self.sendCommand('vox_set_threshold', value);
		},
		
		getBrightness: function(callback) {
			var self = this;
			self.getValueFromCommand('get_brightness', callback);
		},

		/**
		 * @param {int} value between 1 and 8
		 */
		setBrightness: function(value) {
			var self = this;
			// 8 was given to me as the max brightness value by John Le Quoc
			// Khoi of the firmware team. Noting this because docs in Confluence
			// have conflicting information.
			if (value > 8) {
				value = 8;
			}
			self.throttledApiCommand('set_brightness', value);
		},
		
		getContrast: function(callback) {
			var self = this;
			self.getValueFromCommand('get_contrast', callback);
		},
		setContrast: function(value) {
			var self = this;
			self.throttledApiCommand('set_contrast', value);		
		},
		
		getVolume: function(callback) {
			var self = this;
			self.getValueFromCommand('get_spk_volume', callback);
		},

		// 25 - 33 in celsius
		getHighTemperatureSensitivity: function(callback) {
			var self = this;
			self.getValueFromCommand('get_temp_hi_threshold', callback);
		},

		/**
		 * @param {int} value 25 - 33
		 */
		setHighTemperatureSensitivity: function(value) {
			var self = this;
			if (value < 25 || value > 33) {
				throw "Invalid temperature {0} given. Valid values: 25-33".
					format(value);
			}
			self.throttledApiCommand('set_temp_hi_threshold', value);
		},

		// 10 - 18 in celsius
		getLowTemperatureSensitivity: function(callback) {
			var self = this;
			self.getValueFromCommand('get_temp_lo_threshold', callback);
		},

		/**
 		 * @param {int} value 10 - 18
 		 */
		setLowTemperatureSensitivity: function(value) {
			var self = this;
			if (value < 10 || value > 18) {
				throw "Invalid temperature {0} given. Valid values: 10-18.".
					format(value);
			}
			self.throttledApiCommand('set_temp_lo_threshold', value);
		},
	
		setHighTemperatureEventStatus: function(value) {
			var self = this;
			if (value) {
				value = 1;
			} else {
				value = 0;
			}
			self.throttledApiCommand('set_temp_hi_enable', value);
		},

		getHighTemperatureEventStatus: function(callback) {
			var self = this;
			self.getValueFromCommand('get_temp_hi_stat', callback);
		},

		getLowTemperatureEventStatus: function(callback) {
			var self = this;
			self.getValueFromCommand('get_temp_lo_stat', callback);
		},
	
		setLowTemperatureEventStatus: function(value) {
			var self = this;
			if (value) {
				value = 1;
			} else {
				value = 0;
			}
			self.throttledApiCommand('set_temp_lo_enable', value);
		},

		getCurrentTemperature: function(callback) {
			var self = this;
			self.getValueFromCommand('value_temperature', callback);
		},

		/**
		 * @param {int} value Between 1 and 100 I think
		 */
		setVolume: function(value) {
			var self = this;
			self.throttledApiCommand('set_spk_volume', value);
		},
		
		setMelody: function(value) {
			var self = this;
			return self.throttledApiCommand('melody', value);
		},
		stopMelody: function() {
			var self = this;
			return self.throttledApiCommand('melodystop');
		},
		
		getPan: function() {
			var self = this;
			return self.attributes.keyed_device_settings['pan']['value'];
		},
		setPan: function(value) {
		},
		
		getTilt: function() {
			var self = this;
			return self.attributes.keyed_device_settings['tilt']['value'];
		},
		setTilt: function(value) {
		},

		getZoom: function() {
			var self = this;
			return self.attributes.keyed_device_settings['zoom']['value'];
		},
		setZoom: function(value) {
		},
		
		getScreenX: function() {
			// Look at device_model_id to get screen x/y
		},
	});
	
	return CameraModel;
}); 
 

