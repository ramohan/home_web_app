
define('collections/device/DeviceCollection', function(require) {
	var Backbone           = require('backbone');
	var GenericDeviceModel = require('models/device/GenericDeviceModel');
	var CameraModel        = require('models/device/CameraModel');
	
	var DeviceCollection = Backbone.Collection.extend({
		model: GenericDeviceModel
	});
	
	return DeviceCollection;
	
});

