
define('views/user/ResetPasswordView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var SessionManager = require('session_manager');
	var ErrorHandler   = require('error_handler');

	var view = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('user/ResetPasswordForm'),

		active_email: null,
		active_login: null,

		events: {
			'click button[name="resetpassword_submit"]': 'resetPasswordSubmit',
		},

		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'ResetPasswordView', [
				'resetpassword_key'
			]);
			self.reset_password_token = options.resetpassword_key;

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_resetpassword'));
			breadcrumbs.render();

			self.render();
		},

		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;
			self.$el.html(_.template(self.template, data));
			$('.user-message').show();
			self.checkIfTokenIsValid();
		},

		// Event handlers

		resetPasswordSubmit: function(event) {
			event.preventDefault();
			var self = this;

			var err_div = $('.user-message p');
			var password = $('input[name="password"]');
			var passconfirm = $('input[name="password_confirmation"]');

			if (! /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/.test(password.val())) {
				err_div.html(lang.t('usersettings_err_password_rules'));
				return;
			}

			if (password.val() != passconfirm.val()) {
				err_div.html(lang.t('usersettings_err_passwords_dont_match'));
				return;
			}

			var params = {
				password:              password.val(),
				password_confirmation: passconfirm.val(),
				reset_password_token:  self.reset_password_token
			};

			HubbleAPI.call('RESET_PASSWORD', params, function(response) {
				if (response['status'] != 200) {
					var error = "Server response: {0}".format(response['status']);
					$('.user-message > p').
						html(lang.t('resetpassword_error', {error: error}));
					ErrorHandler.exception("Reset password failure " + error);
				}

				// If you reset your password while you are logged in,
				// your token will change and HubbleAPI will delete that session.

				// Assuming the user is not logged in, what needs to happen here
				// is to acquire a new session token and set it as the active
				// session. Actually this should work even if the user is logged
				// in, but the specific session should be removed from the
				// session list if it is present.

				// What happens if one accounts email address is used as
				// another accounts username? This is why I don't like this
				// system.
				SessionManager.logoutSession(self.active_email);
				SessionManager.logoutSession(self.active_login);

				params2 = {
					login: self.active_login,
					password: password.val(),
				};

				HubbleAPI.call('GET_AUTH_TOKEN', params2, function(response) {
					var token = response['data']['authentication_token'];
					SessionManager.saveSessionToken(self.active_login, token);
					$('.form-group').hide();
					$('.user-message').show();
					$('.user-message > p').html(lang.t('resetpassword_complete'));

				}, function(xhr, error, exception) {
					console.log(JSON.stringify(xhr));
					var error = xhr['responseJSON']['message'];
					ErrorHandler.exception("Reset password failure at GET_AUTH_TOKEN " + error);
					$('.user-message').show();
					$('.user-message > p').
						html(lang.t('resetpassword_error', {error: error}));
				});
			}, function(xhr, error, exception) {
				var error = xhr.responseText.message;
				ErrorHandler.exception("Reset password failure at RESET_PASSWORD");
				$('.user-message').show();
				$('.user-message > p').
					html(lang.t('resetpassword_error', { error: error }));

			});
		},

		// Helpers

		checkIfTokenIsValid: function() {
			var self = this;

			var params = {
				reset_password_token: self.reset_password_token
			};
			var success = function(response) {
				$('.form-group').hide();
				$('.user-message').show();
				$('.user-message > p').
					html(lang.t('resetpassword_recovery_complete'));

			};
			var success = function(response) {
				// Save email so it can be used to clear old auth token from
				// SessionManager

				if (response['data']['email'] === undefined ||
					response['data']['name'] === undefined) {
					$('.user-message > p').
						html(lang.t('resetpassword_error_broken'));
					var e = "find_by_password respnse is missing email or name";
					ErrorHandler.exception(e, {}, 7);
				}

				self.active_email = response['data']['email'];
				self.active_login = response['data']['name'];
			};
			var fail = function(xhr, error, exception) {
				$('.form-group').hide();
				$('.user-message').show();
				$('.user-message > p').html(lang.t('resetpassword_bad_token'));
			};
			HubbleAPI.call('FIND_USER_BY_PASSWORD', params, success, fail);
		}
	});

	return view;

});


