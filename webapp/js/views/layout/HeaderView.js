
define('views/layout/HeaderView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');	
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var SessionManager = require('session_manager');
	var LogoutView     = require('views/user/LogoutView');

	var UserPrefs      = require('user_prefs');

	var jquerydotdotdot = require('lib/jquery.dotdotdot');

	var HeaderView = Backbone.View.extend({
		el: '#header',
		
		template: TemplateLoader.get('layout/header'),

		events: {
			'click #logout-button': 'logoutButton',
			'click #add-login-button': 'addLoginButton',
			'click .activate-login': 'activateToken',
			'click #header-logo': 'logoClick',
		},

		initialize: function(options) {
			var self = this;
			self.requireOptions('HeaderView', ['router', 'navbar']);
			self.navbar = options.navbar;
			self.router = options.router;
			self.logoutView = new LogoutView(self);
		},


		render: function() {
			var self = this;
			
			var data = {};
			data.is_logged_in  = SessionManager.aSessionExists();
			data.session_count = SessionManager.getSessionCount();
			data.sessions      = SessionManager.getSessions();
			data.active_login  = SessionManager.getActiveSession();
			data.is_mobile 	   = self.isMobileBrowser();
			data.lang          = lang;
			
			self.$el.html(_.template(self.template, data));

			$('.active-login').dotdotdot({
				ellipsis: '... ',
				wrap: 'letter',
			});
			
			$('.login-name').dotdotdot({
				ellipsis: '... ',
				wrap: 'letter',
				tolerance: 0,
				watch: true,
			});

			self.navbar.render();			
			$('#api-loading').hide();
			return this;
		},

		// Event Handlers
		logoutButton: function(event) {
			var self = this;
			event.preventDefault();
			self.logoutView.setElement("#logout_overlay").render();

			var logoutDialog = $("#logout_overlay");
			logoutDialog.modal({show:true, backdrop:"static"});

			$("#logout_confirmed").on("click", function (evt) {
				self.logoutView.onLogoutConfirmed(evt);
			});

			// $("#logout_confirmed").on("click", function (evt) {
			// 	self.logoutView.onLogoutAllConfirmed(evt);
			// });
		},

		onLogoutConfirmed: function(event) {
			console.log("headerview reached onLogoutConfirmed");
			var self = this;
			event.preventDefault();
			SessionManager.logoutActiveSession();
			window.location.replace('/');

			// Make sure to clear out any localy stored info so user can't 
			// navigate back to logged in views.
			localStorage.clear();
		},

		logoClick: function(event) {
			event.preventDefault();
			var self = this;

			if(self.isMobileBrowser()) {
				window.location.replace('#myaccount');
			} else {
				window.location.replace('/');
			}
		},

		addLoginButton: function(event) {
			event.preventDefault();
			window.location.href = '#login';
		},

		activateToken: function(event) {
			var self = this;
			event.preventDefault();
			var username = $(event.target).attr('data-login-name');

			UserPrefs.remove('LAST_DEVICE_LOADED');
			UserPrefs.remove('USER_DEVICES');
			UserPrefs.remove('TEMP_FORMAT_CELSIUS');

			SessionManager.setActiveSession(username);

			// A number between 1 and 100 is put into the dashboard url so that
			// the view will be re-rendered in the case the a new login is added
			// while the user is already on that page (if the url did not change
			// then nothing would happen). Kind of hacky.
			window.location.replace('/?{0}#devices'.
				format(Math.round(Math.random()*100)));
		},
		
		// Helpers


	});
	
	return HeaderView;
	
});
