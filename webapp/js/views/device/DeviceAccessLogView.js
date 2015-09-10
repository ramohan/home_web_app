
define('views/device/DeviceAccessLogView', function(require) {
	var $                 = require('jquery');
	var underscore        = require('underscore');
	var cfg               = require('hubble_config');
	var global            = require('global');
	var Backbone          = require('backbone');
	var HubbleAPI         = require('hubble_api');
	var lang              = require('hubble_lang');
	var TemplateLoader    = require('template_loader');

	
	var view = Backbone.View.extend({
		el: '#access_log',

		template: TemplateLoader.get('device/DeviceAccessLog'),
		
		// Device ID, passed from URL splat and used to load device details
		id: null,

		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'DeviceAccessLogView', ['registration_id']);
			self.id = options.registration_id;
			self.getDeviceAccessLog();
		},
		
		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;
			data.access_log = self.actions;
			self.$el = $('#access_log');
			self.$el.html(_.template(self.template, data));			
			return this;
		},

		// Event Handlers
		
		
		// Helpers
		
		getDeviceAccessLog: function() {
			var self = this;
			var params = {
				registration_id: self.id,
				event_name: 'create_session',
			};
			var actions = [];
			HubbleAPI.call('GET_DEVICE_ACTIONS', params, {
				success: function(response) {
					actions = response['data'];
					_.each(actions, function(action, idx) {
						var d = moment(action['time_stamp']);
						actions[idx]['time_stamp'] = d.
							format(cfg.get('MOMENT_FORMAT_FOR_USER'));
					});
					
					self.actions = actions;
					self.render();
				} 
			});
		},
		
	});
	
	return view;
});


