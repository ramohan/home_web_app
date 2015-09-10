
define('views/device/camera/CameraDetailsView', function(require) {
	var $				   = require('jquery');
	var underscore		   = require('underscore');
	var cfg				   = require('hubble_config');
	var lang               = require('hubble_lang');
	var global			   = require('global');
	var Backbone		   = require('backbone');
	var HubbleAPI		   = require('hubble_api');
	var TemplateLoader	   = require('template_loader');
	var breadcrumbs		   = require('views/layout/BreadcrumbsView');

	var DeviceCollection   = require('collections/device/DeviceCollection');
	var DeviceEventsView   = require('views/device/DeviceEventsView');
	var CameraModel		   = require('models/device/CameraModel');
	var CameraSettingsView = require('views/device/camera/CameraSettingsView');
	
	var moment             = require('moment');

	//var jqtimeline         = require('jquery_jqtimeline');
	
	//var GenericDeviceModel = require('models/device/GenericDeviceModel');
	var VideoPlayer	       = require('video_player_jw');

	var CameraDetailsView = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('device/camera/CameraDetails'),
		
		// Device ID, passed from URL splat and used to load device details
		id: null,

		// Device details, loaded from API or cache built on device list		
		device: null,

		// Flag to prevent sharing invitations from being loaded twice
		sharing_loaded: false,
		
		events: {
			'click #take-snapshot': 'takeSnapshot',
		},

		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'CameraDetailsView', [
				'registration_id', 'deviceModel', 'eventsView']);

			self.id = options.registration_id;
			self.device = options.deviceModel;
			self.deviceEventsView = options.eventsView;
			self.miniDeviceList = options.miniDeviceList;

			self.settingsView = new CameraSettingsView({
				registration_id: self.id,
				deviceModel: self.device,
				miniDeviceList: options.miniDeviceList
			});
		},

		render: function() {
			var self = this;
			var data = {};
			data.device = self.device;
			data.lang = lang;
			data.cfg = cfg;

			self.setActiveNavButton('dashboard');

			// Notably this is happening when details first loads. This lengthens
			// the initial time it takes to show camera feed but makes it so the
			// sharing tab loads instantly. Depending on user experience, this
			// might not be a desirable tradeoff.
			self.$el.html(_.template(self.template, data));

			self.enableDetailTabs();
			self.settingsView.buildControls();
			self.settingsView.buildSettings();
			self.deviceEventsView.render();

			if (self.device.get('snaps_url').indexOf('hubble.png') > 0) { 
				$('#download-snapshot').hide();
			}

			$('.toggle-high-quality').tooltip();

			// Renders mini device list when ready, ie, when device list is 
			// loaded.
			self.miniDeviceList.run();

			return this;
		},
		
		// Event Handlers
		
		takeSnapshot: function(event) {
			event.preventDefault();
			var self = this;
			self.device.takeSnapshot();
			$('#take-snapshot').attr('disabled', 'disabled');
			$('#download-snapshot').css('visibility', 'hidden');
			// Using visibility:hidden so that the text does not lose it's
			// presence in the layout
			//$('#download-snapshot').hide();
			self.showDownloadLink();

		},

		showDownloadLink: function(tries) {
			var self = this;
			if (tries === undefined) {
				tries = 1;
			}
			if (tries > 5) {
				return;
			}
			tries++;

			var snaps_url = null;
			var params = {
				'registration_id': self.device.get('registration_id')
			};

			// Wait 5 seconds to get the URL to download the snapshot
			setTimeout(function() {
				HubbleAPI.call('GET_DEVICE_INFO', params, function(response) {
					console.log(response);
					var url = response['data']['snaps_url'];
					// Funny bug. When the first snapshot is taken, the API still
					// returns the default logo url, we'll rerun the query a few
					// times.
					if (url.indexOf('hubble.png') > 0) {
						return self.showDownloadLink(tries);
					} else {
						$('#download-snapshot > a').attr('href', url);
					}
					$('#take-snapshot').removeAttr('disabled');
					$('#download-snapshot').css('visibility', 'visible');
					//$('#download-snapshot').show();
				});
			}, parseInt(cfg.get('SNAPSHOT_DOWNLOAD_WAIT_SECONDS')) * 1000);
		},


		// Helpers

		enableDetailTabs: function() {
			var self = this;

			$('.nav-tabs').tab();

			var open_tab = '';
			var drawer_open = false;

			$('.tab-content').hide();
			var toggleSlideyDrawer = function() {
				if (drawer_open) {
					//$('.tab-content').hide();
					$('.tab-content').slideUp();
					$('#camera_details_tabs').slideUp();
					$('#slidey_drawer_transparency').slideUp({
						complete: function() {
							$('.nav-tabs').find('li').removeClass('highlight');
							$('li.nav_dashboard').addClass('highlight');
						}
					});
					drawer_open = false;
					// Unhighlight the drawer button when the drawer closes
				} else {
					$('.tab-content').slideDown();
					$('#camera_details_tabs').slideDown();
					$('#slidey_drawer_transparency').slideDown({
						complete: function() {
							$('.nav-tabs').find('li.nav_dashboard').
								removeClass('highlight');
							$('.play-button').css('margin-top', '38px');
						}
					});
					/*
					$('#slidey_drawer_transparency').slideDown({
						complete: function() {
							$('.tab-content').show();
							$('#camera_details_tabs').show();
						}
					});
					*/
					drawer_open = true;
				}
			};

			var openTab = function(tab_obj, tab_name) {
				$(tab_obj).tab('show');
				// All this futzy logic is to ensure that the drawer opens any 
				// time any button is clicked, and closes any time the same 
				// button is clicked.
				if (open_tab == tab_name || open_tab == '') {
					toggleSlideyDrawer();
				}
				open_tab = tab_name;
				$('#camera_details_tabs_container').removeClass().
					addClass(tab_name);
				$('#slidey_drawer_transparency').removeClass().
					addClass('slidey_{0}'.format(tab_name));
				$('#slidey_drawer_transparency_container').removeClass().
					addClass('slideyc_{0}'.format(tab_name));

				$('li.{0}-tab'.format(tab_name)).addClass('highlight');
			};

			$('.nav-tabs a[href="#device_minilist_tab"]').click(function(e) {
				e.preventDefault();
				openTab(this, 'deviceminilist');
			});
			$('.nav-tabs a[href="#controls"]').click(function(e) {
				e.preventDefault();
				openTab(this, 'controls');
			});
			$('.nav-tabs a[href="#devicetimeline"]').click(function(e) {
				e.preventDefault();
				openTab(this, 'timeline');

			});
			$('.nav-tabs a[href="#savedclips"]').click(function(e) {
				e.preventDefault();
				openTab(this, 'savedclips');

			});
			$('.nav-tabs a[href="#sharing"]').click(function(e) {
				e.preventDefault();
				openTab(this, 'sharing');
			});

			$('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
				var new_tab = $(e.target).attr('href');
				var old_tab = $(e.relatedTarget).attr('href');
				$(old_tab).hide();
				$(new_tab).show();
				console.log("Firing show.bs.tab event");

				$('.nav-tabs').find('li').removeClass('highlight');
				if (drawer_open) {
					// Rehilight the dashboard button when no drawers are open
					$('li.nav-tabs[href="#{0}"]'.format(new_tab)).
						addClass('highlight');	
				}

				// This bit here is to cover the case where the drawer has
				// been manually closed, and then another drawer button has
				// been clicked. Without this, the drawer contents change but
				// the drawer remains closed.
				if (!drawer_open && new_tab != old_tab && 
					 old_tab !== undefined && old_tab != '#') {
					toggleSlideyDrawer();
				}
			});
		},
	});
	
	return CameraDetailsView;
});


