
define('views/device/MiniDeviceListView', function(require) {
	var $				   = require('jquery');
	var underscore		   = require('underscore');
	var cfg				   = require('hubble_config');
	var lang               = require('hubble_lang');
	var global			   = require('global');
	var Backbone		   = require('backbone');
	var HubbleAPI		   = require('hubble_api');
	var TemplateLoader	   = require('template_loader');
	var ErrorHandler       = require('error_handler');
	var UserPrefs          = require('user_prefs');

	var view = Backbone.View.extend({
		el: '#mini_device_list',

		template: TemplateLoader.get('device/MiniDeviceList'),

		videoplayer: undefined,

		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'MiniDeviceListView',
				['current_device_id']);
			self.current_device_id = options.current_device_id;
		},

		run: function() {
			var self = this;
			// Tell the video to shrink to give the list some room
			self.shrinkViewport();

			self.el = '#mini_device_list';
			self.$el = $(self.el);

			self.getDevices();
		},

		render: function(devices, device_count) {
			var self = this;
			var data = {};
			data.lang = lang;
			data.devices = devices;
			data.device_count = device_count;
			// Ugly hack alert!
			// We want a horizontal scrollbar to accommodate as many devices
			// as there are in the device switcher, so we are setting a width
			// of the length of each device (with a little padding) multiplied
			// by the number of devices.

			// Change the .mini-device-list-item width when you change this
			// value
			var width_of_device = 330;
			data.width = device_count * width_of_device;

			data.current_device_id = self.current_device_id;
			self.$el.html(_.template(self.template, data));
		},

		// Helpers

		getDevices: function() {
			var self = this;

			// Mini device list needs to show whether devices are currently
			// online, so it can never read from the cache in localStorage
			// 
			// First try to load device list from localStorage.
			//var devices = UserPrefs.get('USER_DEVICES');
			//if (devices !== undefined) {
			//	return self.render(devices);
			//}

			var store_device_info = {};
			var device_count = 0;

			// Get them from API, make sure to cache
			HubbleAPI.call('GET_USER_DEVICES', {}, function(response) {
				_.each(response['data'], function(device) {
					device.snaps_url = self.
						normalizeLinkProtocol(device.snaps_url);

					device_count++;

					store_device_info[device.id] = {
						registration_id: device.registration_id,
						id:              device.id,
						name:            device.name,
						snapshot:        device.snaps_url,
						is_available:    device.is_available
					};
				});
				UserPrefs.set('USER_DEVICES', store_device_info);
				self.render(store_device_info, device_count);
			});
		},

		setVideoPlayer: function(videoplayer_obj) {
			var self = this;
			self.videoplayer = videoplayer_obj;
		},

		shrinkViewport: function() {
			var self = this;
			if (self.videoplayer === undefined) {
				return;
			}
			self.videoplayer.setSize('LARGE');

		},

		expandViewport: function() {
			var self = this;
			if (self.videoplayer === undefined) {
				return;
			}
			self.videoplayer.setSize('FULL');
		},

	});

	return view;
});

