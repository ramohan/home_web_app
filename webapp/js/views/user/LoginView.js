
define('views/user/LoginView', function(require) {
	var $                = require('jquery');
	var _                = require('underscore');
	var Backbone         = require('backbone');
	var lang             = require('hubble_lang');
	var HubbleAPI        = require('hubble_api');
	var TemplateLoader   = require('template_loader');
	var SessionManager   = require('session_manager');
	var breadcrumbs      = require('views/layout/BreadcrumbsView');
	var UserPrefs        = require('user_prefs');

	var LoginView = Backbone.View.extend({
		el: $('#page_view'),
		
		template: TemplateLoader.get('user/loginForm'),
		
		events: {
			'click #login_submit': 'onSubmit',
		},
		
		initialize: function() {
			var self = this;
			self.render();
		},
		
		render: function() {
			var self = this;

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_login'));
			breadcrumbs.render();

			var data = {};
			data.lang = lang;

			self.$el.html(_.template(self.template, data));
			if (!SessionManager.aSessionExists()) {
				$('#navbar').hide();
			}
		},
		
		// Event Handlers
		onSubmit: function(event) {
			event.preventDefault();
			var self = this;
			
			var params = {
				login: $('#login_form input[name="username"]').val(),
				password: $('#login_form input[name="password"]').val()
			};
			params.remember = 'on';

			// Leaving in code to check the remember checkbox, because even 
			// though it doesn't do anything now it might in the future
			/*
			if ($('#login_form input[name="remember"]').is(':checked')) {
				params.remember = 'on';
			}
			*/
			
			HubbleAPI.call('GET_AUTH_TOKEN', params, function(response) {
				var token = response['data']['authentication_token'];

				UserPrefs.remove('active_session');
				UserPrefs.remove('LAST_DEVICE_LOADED');
				UserPrefs.remove('USER_DEVICES');
				UserPrefs.remove('TEMP_FORMAT_CELSIUS');

				SessionManager.saveSessionToken(params.login, token);
				if (SessionManager.aSessionExists()) {
					$('#navbar').show();
				}
				window.location.replace('/#devices');
			}, function(xhr, error, exception) {
				$('.login_info').html(lang.t('login_wrongpassword'));
				$('.login_info').addClass('display-msg');

			});
		},
		
		// Helpers
		
	});
	
	return LoginView;
});
