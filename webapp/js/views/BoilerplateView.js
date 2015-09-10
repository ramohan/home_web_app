
define('views/BoilerplateView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');	
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');

	var view = Backbone.View.extend({
		el: '#page_view',
	
		template: TemplateLoader.get('boilerPlateTemplate'),
		
		initialize: function(options) {
			var self = this;
			//self.requireOptions(options, 'BoilerplateView', ['optn', 'optn2']);
			
			breadcrumbs.reset();
			//breadcrumbs.add(lang.t('crumb_dashboard'), '#devices');
			//breadcrumbs.add(lang.t('crumb_devicedetails', {
			//	name: self.device.get('name')
			//}));
			breadcrumbs.render();

			self.render();
		},
		
		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;
			self.$el.html(_.template(self.template, data));
		},


		// Event Handlers



		// Helpers


		
	});
	
	return view;
	
});


