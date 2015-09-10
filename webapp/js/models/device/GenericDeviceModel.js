
/**
 * GenericDeviceModel
 * Base class, all types of devices (Camera, Slow-Cooker, Diaper) should have
 * subclasses to handle their individual features.
 */

define('models/device/GenericDeviceModel', function(require) {
	var Backbone  = require('backbone');
	var HubbleAPI = require('hubble_api');
	
	var DeviceModel = Backbone.Model.extend({
		defaults: {
			api_device: {},
			id: '',
			registrationId: '', // seems to be empty
			registration_id: '', // has actual registration_id
			is_available: false,
			created_at: '',
			deactivate: false,
			device_location: {},
			device_model_id: 0,
			device_settings: {},
			firmware_version: '',
			high_relay_usage: false,
			is_available: false,
			last_accessed_date: '',
			mac_address: '',
			mode: '',
			name: '',
			plan_changed_at: '',
			plan_id: '',
			relay_count: 0,
			relay_usage: 0,
			relay_usage_reset_date: null,
			stun_count: 0,
			stun_usage: 0,
			target_deactivate_date: null,
			time_zone: 0,
			updated_at: '',
			upnp_count: 0,
			upnp_usage: 0,
			user_id: 0,
		},
		
		api_obj: HubbleAPI,

		// Allow the normal backbone accessor method (ie. model.get('attr')) 
		// to be used to call methods instead of simply model properties. 
		// Essentially just syntactic sugar for calculated attributes that 
		// are not part of the model. I use it so I can leave all device
		// data in the big array returned by the API, and only lazily extract
		// fields from it as necessary.
		/*
		get: function(attr) {
			if (typeof(attr) == 'function') {
				return this[attr]();
			}
			return Backbone.Model.Prototype.get.call(this, attr);
		}*/

		getType: function() {
			return 'GENERIC';
		}
	});
	
	return DeviceModel;

}); 
 

