
define('views/device/camera/CameraSettingsView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var jquery_ui      = require('jquery_ui');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');	
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var VideoPlayer    = require('video_player');
	var UserPrefs      = require('user_prefs');
	

	var view = Backbone.View.extend({
		el: '#page_view',

		// In order to allow display of fahrenheit or celsius, the celsius
		// values are stored in memory
		celsius_low_temp_setting: 0,
		celsius_high_temp_setting: 0,
		celsius_cur_temp: 0,

		// This value is set when settings are read from api on initial load,
		// and each time the user plays a melody by clicking on a song title
		playing_melody: 0,

		// This refers to the state of the controls drawer below the viewport,
		// not the slidey drawer below the main nav
		controls_slideout_open: false,
	
		//template: TemplateLoader.get('device/camera/CameraSettings'),
		
		events: {
			'click .play-melody':         'playMelody',
			'click .cam-pan':             'pan',
			'click .toggle-high-quality': 'toggleVideoBitrate',
			'click .prevent-timeout':     'preventStreamTimeout',
			'click #low-temp-increase':   'tempChange',
			'click #low-temp-decrease':   'tempChange',
			'click #high-temp-increase':  'tempChange',
			'click #high-temp-decrease':  'tempChange',
			'click .slider-frame':        'toggleCameraSetting',
			'click .set-temp-format':     'setTempFormat',
			'click .set-motion-sens':     'setMotionSensitivity',
			'click .set-sound-sens':      'setSoundSensitivity',
			'click .volume-low-icon':     'bumpVolume',
			'click .volume-high-icon':    'bumpVolume',
			'click #bright_low_icon':     'bumpBrightness',
			'click #bright_high_icon':    'bumpBrightness',
			'click #controls-toggle-button': 'toggleControlsDrawer',
		},


		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'CameraSettingsView', [
				'registration_id', 'deviceModel']);

			self.id = options.registration_id;
			self.device = options.deviceModel;
			self.miniDeviceList = options.miniDeviceList;
		},


		// Event Handlers

		toggleControlsDrawer: function(event) {
			var self = this;
			$('#camcontrols').animate({width: 'toggle'}, 500);
		},

		/**
		 * This method increments or decrements the volume when the icons
		 * to the left or right of the slider are clicked.
		 */
		bumpVolume: function(event) {
			var self = this;
			var target = $(event.target);
			var volume = $('#cam_volume').slider('option', 'value');

			// Note that the volume slider values go from 1-10, so the
			// value actually saved gets 10 added or subtracted instead of 1
			
			if (target.hasClass('volume-low-icon')) {
				if (volume <= cfg.get('VOLUME_MIN_VALUE')) {
					return;
				}
				self.device.setVolume((volume - 1) * 10);
				$('#cam_volume').slider('value', volume - 1);
			}

			if (target.hasClass('volume-high-icon')) {
				if (volume >= cfg.get('VOLUME_MAX_VALUE')) {
					return;
				}
				self.device.setVolume((volume + 1) * 10);
				$('#cam_volume').slider('value', volume + 1);
			}
		},

		bumpBrightness: function(event) {
			var self = this;
			var target = $(event.target);
			var bright = $('#cam_brightness').slider('option', 'value');

			// Note that the volume slider values go from 1-10, so the
			// value actually saved gets 10 added or subtracted instead of 1
			
			if (target.attr('id') == 'bright_low_icon') {
				if (bright <= cfg.get('BRIGHTNESS_MIN_VALUE')) {
					return;
				}
				self.device.setBrightness(bright - 1);
				$('#cam_brightness').slider('value', bright - 1);
			}

			if (target.attr('id') == 'bright_high_icon') {
				if (bright >= cfg.get('BRIGHTNESS_MAX_VALUE')) {
					return;
				}
				self.device.setBrightness(bright + 1);
				$('#cam_brightness').slider('value', bright + 1);
			}
		},

		setMotionSensitivity: function(event) {
			var self = this;
			var value = 1;
			var setting = $(event.target).attr('data-value');
			if (setting == 'low') {
				value = cfg.get('CAM_MOTION_SENSITIVITY_LOW');
			} else if (setting == 'medium') {
				value = cfg.get('CAM_MOTION_SENSITIVITY_MEDIUM');
			} else if (setting == 'high') {
				value = cfg.get('CAM_MOTION_SENSITIVITY_HIGH');
			}
			$('.set-motion-sens').removeClass('active');
			$(event.target).addClass('active');			
			self.device.setMotionSensitivity(value);
		},

		setSoundSensitivity: function(event) {
			var self = this;
			var value = 1;
			var setting = $(event.target).attr('data-value');
			if (setting == 'low') {
				value = cfg.get('CAM_SOUND_SENSITIVITY_LOW');
			} else if (setting == 'medium') {
				value = cfg.get('CAM_SOUND_SENSITIVITY_MEDIUM');
			} else if (setting == 'high') {
				value = cfg.get('CAM_SOUND_SENSITIVITY_HIGH');
			}
			$('.set-sound-sens').removeClass('active');
			$(event.target).addClass('active');
			self.device.setSoundSensitivity(value);			
		},

		setTempFormat: function(event) {
			var self = this;
			var set_to = $(event.target).attr('data-format');
			if (!self.device.get('is_available')) {
				return;
			}

			if (set_to == 'celsius') {
				UserPrefs.set('TEMP_FORMAT_CELSIUS', true);
				$('.temp-format-celsius').addClass('active');
				$('.temp-format-fahrenheit').removeClass('active');

			} else {
				UserPrefs.set('TEMP_FORMAT_CELSIUS', false);
				$('.temp-format-celsius').removeClass('active');
				$('.temp-format-fahrenheit').addClass('active');
			}
			self.updateTemperatureFormat();
		},

		toggleCameraSetting: function(event) {
			var self = this;
			if (!self.device.get('is_available')) {
				return;
			}
			var target = $(event.target);
			if (target.hasClass('slider-frame')) {
				var slider_frame = $(event.target)
				var slider = $(event.target).find('.slider-button');
			} else {
				var slider_frame = $(event.target).parent();
				var slider = $(event.target);
			}
			var delay = 300;
			if (slider_frame.hasClass('on')) {
				slider.removeClass('on').addClass('off');

				if (slider_frame.hasClass('motion-toggle')) {
					self.device.setMotionDetectionStatus(false);
					self.disableToggles('motion');
				} else if (slider_frame.hasClass('sound-toggle')) {
					self.device.setSoundDetectionStatus(false);
					self.disableToggles('sound');
				} else if (slider_frame.hasClass('high-temp-toggle')) {
					self.device.setHighTemperatureEventStatus(false);
				} else if (slider_frame.hasClass('low-temp-toggle')) {
					self.device.setLowTemperatureEventStatus(false);
				} 

				// The timeouts are here because it looks weird if the
				// bg color changes before the dot finishes moving
				setTimeout(function() {
					slider_frame.removeClass('on').addClass('off');
				}, delay);

			} else {
				slider.removeClass('off').addClass('on');

				if (slider_frame.hasClass('motion-toggle')) {
					self.device.setMotionDetectionStatus(true);
					self.enableToggles('motion');
				} else if (slider_frame.hasClass('sound-toggle')) {
					self.device.setSoundDetectionStatus(true);
					self.enableToggles('sound');
				} else if (slider_frame.hasClass('high-temp-toggle')) {
					self.device.setHighTemperatureEventStatus(true);
				} else if (slider_frame.hasClass('low-temp-toggle')) {
					self.device.setLowTemperatureEventStatus(true);
				} 
				setTimeout(function() {
					slider_frame.removeClass('off').addClass('on');
				}, delay);
			}
		},

		preventStreamTimeout: function(event) {
			event.preventDefault();
			var self = this;
			self.videoplayer.preventTimeout();
			$('#player-stopped-container').hide();
		},

		toggleVideoBitrate: function(event) {
			var self = this;
			var button = $(event.target);
			if (button.hasClass('active')) {
				self.device.setBitrate(cfg.get('CAMERA_BITRATE_HIGH_QUALITY'));
				button.removeClass('active btn-primary');
				$('.toggle-high-quality').
					text(lang.t('camdetails_lowerqualitybutton'));
			} else {
				self.device.setBitrate(cfg.get('CAMERA_BITRATE_LOW_QUALITY'));
				button.addClass('active btn-primary');
				$('.toggle-high-quality').
					text(lang.t('camdetails_lowerqualitybutton_off'));
			}
		},

		tempChange: function(event) {
			var self = this;
			var elemID = $(event.target).attr('id');

			var cur_low_value = self.celsius_low_temp_setting;
			var cur_high_value = self.celsius_high_temp_setting;
			var updater = null;
			var display_elem = '';

			try {
				if (elemID == 'low-temp-increase') {
					value = cur_low_value + 1;
					self.celsius_low_temp_setting = value;
					updater = self.device.setLowTemperatureSensitivity(value);
					display_elem = 'low-temp-display';

				} else if (elemID == 'low-temp-decrease') {
					value = cur_low_value - 1;
					self.celsius_low_temp_setting = value;
					updater = self.device.setLowTemperatureSensitivity(value);
					display_elem = 'low-temp-display';

				} else if (elemID == 'high-temp-increase') {
					value = cur_high_value + 1;
					self.celsius_high_temp_setting = value;
					updater = self.device.setHighTemperatureSensitivity(value);
					display_elem = 'high-temp-display';

				} else if (elemID == 'high-temp-decrease') {
					value = cur_high_value - 1;
					self.celsius_high_temp_setting = value;
					updater = self.device.setHighTemperatureSensitivity(value);
					display_elem = 'high-temp-display';

				}

				$('#{0}'.format(display_elem)).
					html(self.getTempDisplayValue(value));

			} catch(err) {
				self.celsius_low_temp_setting = cur_low_value;
				self.celsius_high_temp_setting = cur_high_value;
				console.log("Error {0}".format(err));
			}

		},

		pan: function(event) {
			var self = this;
			var direction = $(event.target).attr('data-pan-dir');
			console.log("Hit button to pan {0}".format(direction));
			self.device.pan(direction);
		},

		playMelody: function(event) {
			var self = this;
			var song = $(event.target).attr('data-song');
			$('.play-melody').removeClass('active');
			$('.tune-icon').removeClass('active');

			if (self.playing_melody == song) {
				self.device.stopMelody();
				self.playing_melody = null;
				return;
			}

			self.device.setMelody(song);
			$('.play-melody[data-song="{0}"]'.format(song)).addClass('active');
			$('.tune-icon-{0}'.format(song)).addClass('active');
			self.playing_melody = song;
		},

		panCamera: function(event) {
			var self = this;
			var dir = $(event.target).attr('data-pan-dir');
			console.log("Panning " + dir);
			self.device.pan(dir);
		},

		// Helpers


		disableToggles: function(whichtoggles) {
			$('.set-{0}-sens'.format(whichtoggles)).addClass('toggle-is-off');
		},

		enableToggles: function(whichtoggles) {
			$('.set-{0}-sens'.format(whichtoggles)).removeClass('toggle-is-off');
		},
		
		updateTemperatureFormat: function(celsius) {
			var self = this;
			$('#current-temperature').
				html(self.getTempDisplayValue(self.celsius_cur_temp));
			$('#low-temp-display').
				html(self.getTempDisplayValue(self.celsius_low_temp_setting));
			$('#high-temp-display').
				html(self.getTempDisplayValue(self.celsius_high_temp_setting));

			if (UserPrefs.get('TEMP_FORMAT_CELSIUS')) {
				$('.degree-char').html('C');
			} else {
				$('.degree-char').html('F');
			}
		},

		buildControls: function() {
			var self = this;
			var device = self.device;

			self.hideUnsupportedControls(device);

			if (device.hasFeature('volume')) {
				self.device.getVolume(function(volume) {
					$('#cam_volume').slider({
						range: 'min',
						value: volume / 10,
						max: (cfg.get('VOLUME_MAX_VALUE') / 10),
						slide: function(event, ui) {
							device.setVolume(ui.value * 10);
						}
					});
				});
			}

			if (device.hasFeature('zoom')) {
				$('#cam_zoom').slider({
					range: 'min',
					value: device.getZoom(),
					max: 8
				});
			}

			if (device.get('is_available')) {
				self.lockScreenForLoading();
				console.log("Attempting to start live stream.");
				var options = {
					target: 'viewport',
					cameraModel: self.device,
					isFullView: true
				};

				var player = new VideoPlayer(options);

				// Allow the MiniDeviceList to resize the video player
				self.miniDeviceList.setVideoPlayer(player);

				player.initLiveStream();
				// Add as a member so that event handler can access it
				self.videoplayer = player;
			} else {
				// Unhide the viewport so that the snapshot is displayed when
				// the feed is unavailable
				$('#viewport').removeClass('viewport-hidden');

				$('.temperature-display').hide();
				return;
			}

			$('.toggle-high-quality').attr('disabled', false);

			self.device.getCurrentTemperature(function(curtemp) {
				self.celsius_cur_temp = curtemp;
				$('#current-temperature').
					html(self.getTempDisplayValue(curtemp));
			});

			self.device.getCurrentMelody(function(current_melody) {
				self.playing_melody = current_melody;
				$('.tune-icon-{0}'.format(current_melody)).
					addClass('active');				
				$('.play-melody[data-song="{0}"]'.format(current_melody)).
					addClass('active');				
			});

			if (device.hasFeature('brightness')) {
				self.device.getBrightness(function(brightness) {
					$('#cam_brightness').slider({
						range: 'min',
						value: brightness,
						min: cfg.get('BRIGHTNESS_MIN_VALUE'),
						max: cfg.get('BRIGHTNESS_MAX_VALUE'),
						slide: function(event, ui) {
							device.setBrightness(ui.value);
						}
					});
				});
			}
		},

		/**
		 * Query the device for the status of each device setting and activate
		 * the buttons as queries return.
		 */
		buildSettings: function() {
			var self = this;
			if (!self.device.get('is_available')) {
				return;
			}

			self.device.getSettings(function(settings) {
				var motion_active = settings['ms'];
				var motion_sensitivity = settings['me'];

				if (motion_active) {
					$('.motion-toggle').addClass('on');
					$('.motion-toggle .slider-button').addClass('on');
				} else {
					self.disableToggles('motion');
					$('.motion-toggle').addClass('off');
					$('.motion-toggle .slider-button').addClass('off');
				}

				var sound_active = settings['vs'];
				var sound_sensitivity = settings['vt'];
				if (sound_active) {
					$('.sound-toggle').addClass('on');
					$('.sound-toggle .slider-button').addClass('on');
				} else {
					self.disableToggles('sound');
					$('.sound-toggle').addClass('off');
					$('.sound-toggle .slider-button').addClass('off');
				}

				var motion_low = cfg.get('CAM_MOTION_SENSITIVITY_LOW');
				var motion_med = cfg.get('CAM_MOTION_SENSITIVITY_MEDIUM');
				var motion_hi = cfg.get('CAM_MOTION_SENSITIVITY_HIGH');
				if (motion_sensitivity == motion_low) {
					$('.set-motion-sens[data-value="low"]').addClass('active');
				} else if (motion_sensitivity == motion_med) {
					$('.set-motion-sens[data-value="medium"]').addClass('active');
				} else if (motion_sensitivity == motion_hi) {
					$('.set-motion-sens[data-value="high"]').addClass('active');
				}

				var sound_low = cfg.get('CAM_SOUND_SENSITIVITY_LOW');
				var sound_med = cfg.get('CAM_SOUND_SENSITIVITY_MEDIUM');
				var sound_high = cfg.get('CAM_SOUND_SENSITIVITY_HIGH');

				if (sound_sensitivity == sound_low) {
					$('#sound_sens_low').addClass('active');
				} else if (sound_sensitivity == sound_med) {
					$('#sound_sens_medium').addClass('active');
				} else if (sound_sensitivity == sound_high) {
					$('#sound_sens_high').addClass('active');
				}

				var high_temp_active = settings['hs'];
				var low_temp_active = settings['ls'];
				var high_temp_value = settings['ht'];
				var low_temp_value = settings['lt'];

				if (UserPrefs.get('TEMP_FORMAT_CELSIUS')) {
					$('.temp-format-celsius').addClass('active');
					$('.degree-char').html('C');
				} else {
					$('.temp-format-fahrenheit').addClass('active');
					$('.degree-char').html('F');
				}

				if (high_temp_active) {
					$('.high-temp-toggle').addClass('on');
					$('.high-temp-toggle .slider-button').addClass('on');
				} else {
					$('.high-temp-toggle').addClass('off');
					$('.high-temp-toggle .slider-button').addClass('off');
				}

				if (low_temp_active) {
					$('.low-temp-toggle').addClass('on');
					$('.low-temp-toggle .slider-button').addClass('on');
				} else {
					$('.low-temp-toggle').addClass('off');
					$('.low-temp-toggle .slider-button').addClass('off');
				}

				self.celsius_low_temp_setting = low_temp_value;
				self.celsius_high_temp_setting = high_temp_value;

				$('#low-temp-display').
					html(self.getTempDisplayValue(low_temp_value));
				$('#high-temp-display').
					html(self.getTempDisplayValue(high_temp_value));
			});


			// Activate pan controls if they are supported
			if (self.device.hasFeature('pan')) {
				$('.cam_pan').attr('disabled', false);
			}

			self.unlockScreenForLoading();
			// Hacky solution to the issue of the modal backdrop sometimes not 
			// disappearing when the submit button is clicked.
			$('body').removeClass('modal-open');
			$('.modal-backdrop').remove();

		},

		hideUnsupportedControls: function(device) {
			var self = this;

			// We don't want to show the little gear icon if the current 
			// camera does not support any of the controls it displays
			var show_controls_toggle = false;

			if (!device.get('is_available')) {
				$('#controls-toggle-container').hide();
			}

			if (!device.hasFeature('volume')) {
				$('.volume-row').hide();
			}

			if (!device.hasFeature('brightness')) {
				$('.camctrl.brightness').hide();
			} else {
				show_controls_toggle = true;
			}

			if (!device.hasFeature('zoom')) {
				$('#cam_zoom').hide();
				$('.zoom').hide();
			}

			if (!device.hasFeature('pan')) {
				$('#pan-controls').hide();
			} else {
				show_controls_toggle = true;
			}

			if (!device.hasFeature('tilt')) {
				$('#tilt-controls').hide();
			} else {
				show_controls_toggle = true;
			}

			if (!device.hasFeature('melody')) {
				$('.camcontrols-sounds-col').hide();
			}

			if (!show_controls_toggle) {
				$('#controls-toggle-button').hide();
			}
		},
	});
	
	return view;
	
});


