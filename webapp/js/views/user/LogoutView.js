
define('views/user/LogoutView', function(require) {
	var $              = require('jquery');
	var _              = require('underscore');
	var Backbone       = require('backbone');
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var SessionManager = require('session_manager');
	var lang           = require('hubble_lang');

	var LogoutView = Backbone.View.extend({
		el: '#logout_overlay',
		
		template: TemplateLoader.get('user/logoutConfirm'),
		
		events: {
			'click #logout_confirmed': 'onLogoutConfirmed',
			'click #logout_all_confirmed': 'onLogoutAllConfirmed',
		},
		
		initialize: function(options) {
			var self = this;
			self.requireOptions('LogoutView', ['header']);
			self.header = options;

			self.render();
		},
		
		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;
			data.session_count = SessionManager.getSessionCount();
			data.username = SessionManager.getActiveSession();
			$('#logout_container').hide();
			self.$el.html(_.template(self.template, data));
			return this;
		},
		
		// Event Handlers
		
		// Delete an auth token from the client. If this is the last auth token
		// return to the login page, otherwise pick a new active session and
		// return the device list.
		// 
		onLogoutConfirmed: function(event) {
			console.log("reached onLogoutConfirmed");
			var self = this;
			event.preventDefault();
			SessionManager.logoutActiveSession();
			//self.header.render(); //re-render for multiple active logins
			console.log("logout overlay has been hidden");
			if (SessionManager.getSessionCount() == 0) {
				// Redirect to hubbleconnected.com
				//window.location.replace('http://hubbleconnected.com');

				// Redirect back to login page
				window.location.replace('/');
			} else {
			 	window.location.replace('#devices');
			}

			// Make sure to clear out any localy stored info so user can't 
			// navigate back to logged in views.
			localStorage.clear();
		},
		
		onLogoutAllConfirmed: function(event) {
			event.preventDefault();
			window.location.replace('/');
			SessionManager.clearAll();					

			// Make sure to clear out any localy stored info so user can't 
			// navigate back to logged in views.
			localStorage.clear();
		},
		
		// Helpers
	});
	
	return LogoutView;
});

