// The module contains code for a dashboard view. This view is deprecated as
// of version 1.1, and will always be bypassed. On initial dashboard load, the
// first device served by the API has it's details loaded. Any time device 
// details are loaded, the ID is saved and that device is loaded instead of
// the dashboard. This code is effectively deprecated for now and may return
// to use in the future or be removed entirely.
define('views/device/DeviceListView', function(require) {
	var $                  = require('jquery');
	var _                  = require('underscore');
	var bootstrap          = require('jquery_bootstrap');
	var Backbone           = require('backbone');
	var HubbleAPI          = require('hubble_api');
	var lang               = require('hubble_lang');
	var breadcrumbs        = require('views/layout/BreadcrumbsView');
	var TemplateLoader     = require('template_loader');
	var cfg                = require('hubble_config');
	var DeviceCollection   = require('collections/device/DeviceCollection');
	var GenericDevice      = require('models/device/GenericDeviceModel');
	
	var Camera             = require('models/device/CameraModel');
	var Cooker             = require('models/device/CookerModel');
	
	var VideoPlayer        = require('video_player');
	var UserPrefs          = require('user_prefs');
	
	// gridster dependencies
	//var jquery_collision   = require('lib/gridster/jquery.collision');
	//var jquery_coords      = require('lib/gridster/jquery.coords');
	//var jquery_draggable   = require('lib/gridster/jquery.draggable');
	//var jquery_gridster    = require('lib/gridster/jquery.gridster');
	// not sure if these ones are needed
	//var gridster_extras    = require('lib/gridster/jquery.gridster.extras');
	//var gridster_utils     = require('lib/gridster/utils');

	var DeviceListView = Backbone.View.extend({
		user_devices: [],
		active_devices: [],
		inactive_devices: [],

		el: $('#page_view'),
		
		template: TemplateLoader.get('device/deviceListTemplate'),
		
		events: {
			'click .expand_device': 'expandDevice'
		},
		
		initialize: function() {
			var self = this;

			// Check if flash is supported
			if (!self.flashSupported()) {
				return self.renderNoFlash();
			}

			self.setActiveNavButton('dashboard');

			var last_device = UserPrefs.get('LAST_DEVICE_LOADED');
			if (last_device !== undefined) {
				console.log("Dashboard, redirecting to last viewed device");
				window.location.replace('/#device/{0}'.format(last_device));
				return;
			}

			//self.miniControls = TemplateLoader.get('device/camera/miniControls');
			
			self.user_devices = new DeviceCollection();
			self.active_devices = new DeviceCollection();
			self.inactive_devices = new DeviceCollection();
			
			self.lockScreenForLoading();
			
			self.loadDevices();
		},
		
		render: function() {
			var self = this;
			
			var data = {};

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_dashboard'));
			breadcrumbs.render();


			data._ = _;
			data.active_devices = self.active_devices.models;
			data.inactive_devices = self.inactive_devices.models;
			data.DEVICES_PER_ROW = cfg.get('DEVICELIST_DEVICES_PER_ROW');
			
			self.$el.html(_.template(self.template, data));
			
			//self.bindControlEvents();
			
			//var gridster = $('.deviceList > ul').gridster({
			//	widget_margins: [5, 5],
			//	widget_base_dimensions: [246, 218]
			//}).data('gridster');
			
			self.unlockScreenForLoading();
			
			return this;
		},

		renderNoDevices: function() {
			var self = this;
			var data = {};
			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_nodevices'));
			breadcrumbs.render();
			data.lang = lang;
			var template = TemplateLoader.get('device/DashboardNoDevices');
			self.$el.html(_.template(template, data));
			self.unlockScreenForLoading();
		},

		renderNoFlash: function() {
			var self = this;
			var data = {};
			data.lang = lang;

			console.log(self.isMobileBrowser());

			if(!self.isMobileBrowser()) {
				var template = TemplateLoader.get('device/DashboardNoFlash');
				self.$el.html(_.template(template, data));
			} else {
				window.location.replace('/#myaccount');
			}

		},

		// Event Handlers

		expandDevice: function(event) {
			event.preventDefault();
			// Using the surrogate key, since we don't want to make the 
			// registration id any more discoverable than it has to be.
			var registration_id = $(event.target).attr('data-reg-id');

			window.location.replace('#device/' + registration_id);
		},

		// Helpers

		loadDevices: function() {
			var self = this;
			var store_device_info = {};
			var first_device_id = undefined;

			HubbleAPI.call('GET_USER_DEVICES', {}, function(response) {
				// Decide which type of model this device is... at the moment
				// they are all cameras
				console.log("device list, iterating results");
				response['data'].forEach(function(device) {
					// TODO: Check device type when we have an actual cooker
					var name = device.name.toLowerCase();
					if (name.indexOf('cooker') !== -1) {
						var device_model = new Cooker(device);
					} else {
						var device_model = new Camera(device);
					
					}

					// save first ID to automatically load it.
					if (first_device_id === undefined) {
						first_device_id = device_model.get('id');
					}
					self.active_devices.add(device_model);
					
					//self.addMiniControls(device_model);

					device['snaps_url'] = self.
						normalizeLinkProtocol(device['snaps_url']);

					store_device_info[device.id] = {
						registration_id: device['registration_id'],
						id:              device['id'],
						name:            device['name'],
						snapshot:        device['snaps_url'],
					};
				});

				console.log(self.active_devices);

				// If no devices are present, show a template for that.
				if (self.active_devices.length == 0) {
					return self.renderNoDevices();
				}

				UserPrefs.set('USER_DEVICES', store_device_info);

				// Go to first loaded devices details.
				// Note that this code path only ever happens on initial load
				// of the dashboard. When details are opened, the device ID
				// is saved and it is opened automatically on subsequent 
				// dashboard loads.0
				if (first_device_id !== undefined) {
					console.log("Redirecting to first device");
					window.location.replace('#device/' + first_device_id);
					return;
				}

				self.render();				
			});
		},

		flashSupported: function() {
			var self = this;
			
			try {
				var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
				if (fo) {
					return true;
				}
			} catch (e) {
				if (navigator.mimeTypes
					&& navigator.mimeTypes['application/x-shockwave-flash'] != undefined
					&& navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
					return true;
				}
			}

			return false;
		},

		addMiniControls: function(device) {
			var self = this;
			
			var mini_controls = _.template(self.miniControls, {
				device: device
			});
			
			device.mini_controls = mini_controls;			
		},

		// This method has been disabled for cost reasons.		
		bindControlEvents: function() {
			var self = this;
		
			// Bind ui elements
			_.each(self.active_devices.models, function(device) {
				console.log("Checking device type: {0}".format(device.getType()));

				if (device.getType() == 'CAMERA') {
					if (device.get('is_available')) {
						console.log("Activating feed {0}".
							format(device.get('registration_id')));
						var options = {
							target: 'camera_feed_' + device.get('registration_id'),
							isFullView: false,
							cameraModel: device
						};
						var player = new VideoPlayer(options);
						player.initLiveStream();
						
						//self.addCameraMiniControls(device);
					}
				}
			});		
		},
		
		addCameraMiniControls: function(device) {
			$('#cam_brightness_' + device.get('id')).slider({
				range: 'min',
				value: device.getBrightness(),
				max: 9,
				slide: function(event, ui) {
					device.setBrightness(ui.value);
				}
			});
			
			$('#cam_melody_' + device.get('id') + ' input[type="radio"]').
				change(function() {
					device.setMelody($(this).val());
				}
			);

			$('#cam_contrast_' + device.get('id')).slider({
				range: 'min',
				value: device.getContrast(),
				max: 9,
				slide: function(event, ui) {
					device.setContrast(ui.value);
				}
			});
			
			$('#cam_zoom_' + device.get('id')).slider({
				range: 'min',
				value: device.getZoom(),
				max: 9
			});
		
		},

	});
	
	return DeviceListView;
});
 
