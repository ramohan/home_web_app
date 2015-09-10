
define('views/user/LostPasswordView', function(require) {
	var $              = require('jquery');
	var global            = require('global');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');

	var view = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('user/LostPasswordForm'),

		events: {
			'click button[name="lostpassword_submit"]': 'submitLogin'
		},

		initialize: function(options) {
			var self = this;
			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_lostpassword'));
			breadcrumbs.render();

			self.render();
		},

		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;

			$('#navbar-col').hide();


			self.$el.html(_.template(self.template, data));
			$('.form-errors').hide();
			$('.submission_feedback').hide();
		},

		// Event handlers

		submitLogin: function(event) {
			event.preventDefault();
			var self = this;

			var login = $('input[name="login"]');
			if (login.val() == '') {
				$('.form-errors').html(lang.t('lostpassword_email_empty'));
				$('.form-errors').show();
				return;
			}
			if (!self.emailValid(login.val())) {
				$('.form-errors').html(lang.t('lostpassword_email_invalid'));
				$('.form-errors').show();
				return;
			}

			var params = {
				login: login.val()
			};

      console.log('logging', self.lockScreenForLoading());
			self.lockScreenForLoading();

			// Here we use the same handler for failure and success, because
			// we don't want to tell the user if they have correctly guessed
			// someone's login.
			var handler = function(response) {
				$('.form-group').hide();
				$('.submission_feedback').show();
				self.unlockScreenForLoading();
			};
			HubbleAPI.call('FORGOT_PASSWORD', params, handler, handler);
		},

		// Helpers

		emailValid: function(email) {
			var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
			return pattern.test(email);
		},

	});

	return view;
});


