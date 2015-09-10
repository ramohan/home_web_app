
define('views/user/SettingsView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var SessionManager = require('session_manager');

	var view = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('user/Settings'),

		events: {
			'click button[name="email_submit"]':    'emailSubmit',
			'click button[name="email_reset"]':     'emailReset',
			'click button[name="password_submit"]': 'passwordSubmit',
			'click button[name="password_reset"]':  'passwordReset',
		},

		initialize: function(options) {
			var self = this;

			self.setActiveNavButton('settings');
			self.render();
		},

		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;
			self.$el.html(_.template(self.template, data));

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_myaccount'), '#myaccount');
			breadcrumbs.add(lang.t('crumb_settingspage'), '#settings');
			breadcrumbs.render();

			$('.popinfo').hide();

			// Fade in the View after done rendering
			self.$el.fadeIn('fast');
		},

		// event handlers
		emailSubmit: function(event) {
			var self = this;
			event.preventDefault();

			var err_div = $('.email-errors');

			var cur_password = $('input[name="current_password"]');
			var email = $('input[name="email"]');
			var email_confirm = $('input[name="email_confirm"]');

			if (cur_password.val() == '') {
				err_div.html(lang.t('usersettings_err_cur_password_is_blank'));
				return;
			}
			if (email.val() != email_confirm.val()) {
				err_div.html(lang.t('usersettings_err_emails_dont_match'));
				return;
			}
			if (email.val() == '') {
				err_div.html(lang.t('usersettings_err_email_is_blank'));
				return;
			}

			var params = {
				email: email.val(),
				password: cur_password.val()
			};

			self.lockScreenForLoading();

			HubbleAPI.call('UPDATE_USER', params, function(response) {
				// verify that new email was correctly saved.
				HubbleAPI.call('GET_CURRENT_USER', {}, function(response) {
					cur_password.val('');
					email.val('');
					email_confirm.val('');
					err_div.html('');
					self.popInfo(lang.t('usersettings_email_updated', {
						new_email: response['data']['email']
					}));
					self.unlockScreenForLoading();
				});
			}, function(xhr, error, exception) {
				self.unlockScreenForLoading();
        if (xhr.status === 401)
				  err_div.html(lang.t('usersettings_err_cur_password_is_wrong'));
        if (xhr.status === 422)
				  err_div.html(lang.t('usersettings_err_email_taken'));
			});
		},

		emailReset: function(event) {
			var self = this;
			event.preventDefault();
			$('input[name="email"]').val('');
			$('input[name="email_confirm"]').val('');
		},

		passwordSubmit: function(event) {
			var self = this;
			event.preventDefault();

			var err_div = $('.password-errors');

			var $current_password = $('input[name="current_password"]');
			var $new_password = $('input[name="password"]');
			var $password_confirm = $('input[name="password_confirm"]');
			var cur_password = $current_password.val().trim();
			var new_password = $new_password.val().trim();
			var password_confirm = $password_confirm.val().trim();

			if (! /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/.test(new_password)) {
				err_div.html(lang.t('usersettings_err_password_rules'));
				return;
			}

			if (new_password != password_confirm) {
				err_div.html(lang.t('usersettings_err_passwords_dont_match'));
				return;
			}
			if (cur_password == '') {
				err_div.html(lang.t('usersettings_err_cur_password_is_blank'));
				return;
			}

			self.lockScreenForLoading();

			var current_email = '';

			// If we have to bail, logout the user
			var somethingWentWrongHandler = function(response) {
				SessionManager.logoutActiveSession();
				window.location.replace('/#login');
			}

			// First verify that current password is correct
			// get current email from user/me query, and try to get a token
			// using that and the cur_password
			HubbleAPI.call('GET_CURRENT_USER', {}, function(response) {
				current_email = response['data']['email'];

				var params = {
					login:    current_email,
					password: cur_password
				};
				HubbleAPI.call('GET_AUTH_TOKEN', params, function(response) {
					// Current password checks out. Update the password and get
					// a new token.

					var params = {
						password: new_password,
						password_confirmation: password_confirm,
						current_password: cur_password
					};

					// A little messy here with three nested callbacks, but
					// that's all, I promise!
					HubbleAPI.call('CHANGE_USER_PASSWORD', params,
						function(response) {
							// Password was successfully changed, reacquire auth
							// token. At this point handle things in a helper to
							// keep this clean.
							self.popInfo(lang.t('usersettings_password_updated'));
							self.updateSessionInfo(current_email, new_password);
			        $current_password.val('');
			        $new_password.val('');
			        $password_confirm.val('');
							self.unlockScreenForLoading();
						}, somethingWentWrongHandler
					);
				}, function(response) {
					err_div.html(lang.t('usersettings_err_cur_password_is_wrong'));
					self.unlockScreenForLoading();
				});


			}, somethingWentWrongHandler);
		},

		passwordReset: function(event) {
			var self = this;
			event.preventDefault();
			$('input[name="password"]').val('');
			$('input[name="password_confirm"]').val('');
		},

		// close: function() {
		// 	var self = this;
		// 	self.unbind();
		// 	self.remove();
		// 	$('#content_row').prepend('<div id="page_view"></div>');
		// },

		// helpers

		/**
		 * Pop up an info box letting the user know settings have changed.
		 * Info automatically disappears after 10 seconds.
		 */
		popInfo: function(message) {
			$('.popinfo').show();
			$('.popinfo').html(message);
			setTimeout(function() {
				$('.popinfo').toggle('fade');
			}, cfg.get('USERSETTINGS_MESSAGE_HIDE_TIME'));
		},

		/**
		 * When the password changes, a new authentication token must be
		 * acquired, and SessionManager() must be informed so that it can
		 * correctly allow it to be switched to and from.
		 */
		updateSessionInfo: function(email, new_password) {
			var self = this;
			var params = {
				login:    email,
				password: new_password
			};

			HubbleAPI.call('GET_AUTH_TOKEN', params, function(response) {
				var token = response['data']['authentication_token'];
				SessionManager.logoutActiveSession();
				SessionManager.saveSessionToken(email, token);
				self.unlockScreenForLoading();
			});
		}

	});

	return view;

});


