
/**
 * Device model holds an object of the device data as loaded from the API. When
 * accessor methods are used, the data is lazily loaded from the device object.
 */

define('models/device/CookerModel', function(require) {
	var _                  = require('underscore');
	var Backbone           = require('backbone');
	var GenericDeviceModel = require('models/device/GenericDeviceModel');
	
	var CookerModel = GenericDeviceModel.extend({
		defaults: {
			snaps_url: '',		
		},
		
		getType: function() {
			return 'COOKER';
		},

		// This gets called after the data is loaded into attributes
		initialize: function() {
			var self = this;

			console.log('CookerModel::initialize()');
			console.log(self.attributes);

			var recipes = {};
			_.each(self.attributes.recipes, function(obj) {
				recipes[obj['program_code']] = obj;
			});
			self.attributes.keyed_recipes = recipes;

		},

		// Return the number of seconds in a recipe's default_duration
		getRecipeDuration: function(program_code) {
			var self = this;
			var dur = self.attributes.keyed_recipes[program_code]['default_duration'];

			var total = 0;

			dur = dur.split(' ');
			_.each(dur, function(value, idx) {
				var len = value.length;
				if (value.substring(len - 2) == 'hr') {
					var hours = value.substr(0, len - 2);
					total = total + (hours * 3600);

				} else if (value.substring(len - 3) == 'min') {
					var minutes = value.substr(0, len - 3);
					total = total + (minutes * 60); 

				}
			});

			return total;
		},
		
		getUserpograms: function() {
			return self.throttleApiCommand('');
		},
		
		runProgram: function(program_code, enable_keep_warm, cook_hour, 
			cook_min) {
		
		},
		
		
		stopCooking: function() {
		
		},
		
		getStatus: function() {
		
		},
		
		setClock: function(date_time) {
		
		},
		
		scheduleProgram: function(program_code, delay_hour, delay_min, 
			cook_hour, cook_min, enable_keep_warm) {
			
		},
		
		changeProgram: function(program_code, enable_keep_warm, cook_hour, 
			cook_min) {
		
		},
		
		getProgram: function() {
		
		}
	});
	
	return CookerModel;
}); 
 

