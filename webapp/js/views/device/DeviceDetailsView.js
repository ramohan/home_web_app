
define('views/device/DeviceDetailsView', function(require) {
	var $                 = require('jquery');
	var jquery_ui         = require('jquery_ui');
	var underscore        = require('underscore');
	var cfg               = require('hubble_config');
	var global            = require('global');
	var Backbone          = require('backbone');
	var HubbleAPI         = require('hubble_api');
	var lang              = require('hubble_lang');
	var breadcrumbs       = require('views/layout/BreadcrumbsView');
	var UserPrefs         = require('user_prefs');

	var DeviceCollection  = require('collections/device/DeviceCollection');
	var DeviceEventsView  = require('views/device/DeviceEventsView');
	var CameraModel       = require('models/device/CameraModel');
	var CookerModel       = require('models/device/CookerModel');
	var CameraDetailsView = require('views/device/camera/CameraDetailsView');
	var CookerDetailsView = require('views/device/cooker/CookerDetailsView');
	
	var AccessLogView     = require('views/device/DeviceAccessLogView');
	var MiniDeviceListView = require('views/device/MiniDeviceListView');
	
	var VideoPlayer       = require('video_player_jw');
	var UserPrefs         = require('user_prefs');
	var SessionManager    = require('session_manager');
	
	var DeviceDetailsView = Backbone.View.extend({
		el: '#page_view',

		template: null,
		
		// Device ID, passed from URL splat and used to load device details
		id: null,

		// Device details, loaded from API or cache built on device list		
		device: null,
		
		events: {
			'click .invite-humans': 'sendSharingInvitation'
		},

		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'DeviceDetailsView', ['id']);

			self.id = options.id;
			self.registration_id = self.lookupRegistrationId(self.id);


			if (self.registration_id === undefined) {
				console.log("Unknown ID in URL, redirecting to dashboard");
				window.location.replace('/#dashboard');
				return;
			}

			self.lockScreenForLoading();

			// getDeviceInfo will call render(), either once the API returns 
			// the device info, or immediately when it is already cached.
			self.getDeviceInfo();
		},
		
		render: function() {
			var self = this;
			var data = {};
			data.device = self.device;

			UserPrefs.set('LAST_DEVICE_LOADED', self.id);

			var minilist = new MiniDeviceListView({
				current_device_id: self.id
			});
			
			var view = null;
			var view_args = {
				registration_id: self.id,
				deviceModel:     self.device,
				eventsView:      self.deviceEventsView,
				detailsView:     self,
				miniDeviceList:  minilist
			};
			
			if (self.device.getType() == 'CAMERA') {
				view = new CameraDetailsView(view_args);
			} else if (self.device.getType() == 'COOKER') {
				view = new CookerDetailsView(view_args);
			} else {
				view = new CameraDetailsView(view_args);
			}
			
			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_dashboard'), '#devices');
			breadcrumbs.add(lang.t('crumb_devicedetails', {
				name: self.device.get('name')
			}));
			breadcrumbs.render();
			
			self.unlockScreenForLoading();

			view.render();
			
			var accesslog = new AccessLogView({
				registration_id: self.registration_id
			});

			return this;
		},

		// Event Handlers
		
		sendSharingInvitation: function(event) {
			var self = this;
			
			var email = $('input[name="send_share_invitation"]').val();
			console.log("sending invite to: " + email);

			HubbleAPI.call('SHARE_DEVICE', {
					registration_id: self.id,
					emails: email
				}, function(response) {
					$('.sharing-feedback').
						html(lang.t('camdetails_sharing_feedback'));
					$('input[name="send_share_invitation"]').val('');
					setTimeout(function() {
						$('.sharing-feedback').html('');
					}, 5000);
			});
		},
		
		// Helpers

		// Gets device info. Either from the memory, cached when the API object
		// queried the device list, or from the API.
		getDeviceInfo: function() {
			var self = this;

			var params = {
				'registration_id': self.registration_id
			};

			console.log("Getting device info");

			HubbleAPI.call('GET_DEVICE_INFO', params, function(response) {
				// TODO: Check device type when we have an actual cooker

				response.data.snaps_url = self.
					normalizeLinkProtocol(response.data.snaps_url);

				var name = response.data['name'].toLowerCase();
				if (name.indexOf('cooker') !== -1) {
					self.device = new CookerModel(response.data);
				} else {			
					self.device = new CameraModel(response.data);
				}

				self.deviceEventsView = new DeviceEventsView({
					registration_id: self.registration_id,
					CameraModel: self.device
				});
			
				self.render();
			}, function(xhr, error, exception) {
				self.unlockScreenForLoading();
				if (xhr.status == 404) {
					// The request device does not exist, was probably removed
					// Delete the cached device info and reload dashboard
					UserPrefs.remove('LAST_DEVICE_LOADED');
					UserPrefs.remove('USER_DEVICES');
					window.location.replace('/#dashboard');
					return;
				}
				// The other likely exception here is access denied
				if (xhr.status == 403) {
					SessionManager.logoutActiveSession();
					window.location.replace('/#login');
					return;
				}


				$('#page_view').html('<div class="container device api-error"><div class="row"><div class="error-wrapper col-md-10 col-md-offset-1"><span class="glyphicon glyphicon-exclamation-sign"></span>' + lang.t('api_unavailable') + '</div></div></div>');
			});
		},

		lookupRegistrationId: function(id) {
			var devices = UserPrefs.get('USER_DEVICES');

			if (devices === undefined) {
				console.log("Devices are not cached, try to cache them");
				window.location.replace('/#dashboard');
				return;
			}
			
			if (devices[id] !== undefined) {
				return devices[id]['registration_id'];
			}
			
			// Devices were not present in local storage, redirect to dashboard
			// as we can't do anything here.
			UserPrefs.remove('LAST_DEVICE_LOADED');
			console.log("Devices were not cached in saved preferences");
			window.location.replace('/#dashboard');
		},
	});
	
	return DeviceDetailsView;
});


