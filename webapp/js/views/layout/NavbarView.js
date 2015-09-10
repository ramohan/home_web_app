
define('views/layout/NavbarView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var Backbone       = require('backbone');	
	var TemplateLoader = require('template_loader');
	var SessionManager = require('session_manager');
	var lang           = require('hubble_lang');

	var NavbarView = Backbone.View.extend({
		el: '#navbar',		
		template: TemplateLoader.get('layout/navbar_horz'),
		
		events: {
			'click .navbarlink': 'navLinkHandler'
		},

		// Disable links if user is not logged in		
		navLinkHandler: function(event) {
			if (!SessionManager.aSessionExists()) {
				event.preventDefault();
			}
		},
		
		setActive: function(item) {
			var self = this;
			$('.nav-tabs').find('li').removeClass('active');
			$('.nav-tabs').find('li.nav_{0}'.format(item)).addClass('active');
		},
		
	
		initialize: function() {
		},
		
		render: function() {
			var self = this;
			
			var data = {};
			data.active_tab = 'devices';
			data.lang = lang;
			data.is_mobile = self.isMobileBrowser();

			self.setElement(self.el);
			
			//self.$el.html(_.template(self.template, data));
			$('#navbar').html(_.template(self.template, data));
			return this;
		}
	});
	
	return NavbarView;
	
});
