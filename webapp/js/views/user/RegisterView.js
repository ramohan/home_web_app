
define('views/user/RegisterView', function(require) {
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
	
		template: TemplateLoader.get('user/Register'),
		
		events: {
			'click .submit_reg': 'regSubmit'
		},
		
		initialize: function(options) {
			var self = this;
			
			// Not using requireOptions here because creating user accounts with
			// no invitation key is allowed, they just won't have any devices.
			//self.requireOptions(options, 'RegisterView', ['invitation_key']);
			self.invitation_key = null;
			if (options !== undefined) {
				self.invitation_key = options.invitation_key;
			}
			if (cfg.get('DEBUG_MODE')) {
				console.log("Invitation key: {0}".format(self.invitation_key));			
			}
			
			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_register'));
			breadcrumbs.render();

			self.render();
		},
		
		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;

			$('#navbar-col').hide();

			self.$el.html(_.template(self.template, data));
		},

		// Event Handlers

		regSubmit: function(event) {
			var self = this;
			event.preventDefault();

			var params = {};
			params['name'] = $('input[name="name"]').val();
			params['email'] = $('input[name="email"]').val();
			params['password'] = $('input[name="password"]').val();
			params['password_confirmation'] = $('input[name="password_confirmation"]').val();

			// Perform some validations here. API also performs validations.
			
			result = self.validateForm(params);
			
			_.each(params, function(val, name) {
				$('.{0}-errors'.format(name)).html('');
			});
			
			if (params['password'] != params['password_confirm']) {
				result['errors']['password_confirm'] = lang.t('regform_error_different_passwords');
			}
			
			_.each(result['errors'], function(error, idx) {
				$('.{0}-errors'.format(idx)).html(error);
			});
			
			if (result['errorcount'] == 0) {
				self.createAccount(params);
			}
		},

		// Helpers
		
		createAccount: function(params) {
			var self = this;
			
			var info_pane = $('#registration_info');
			var info_p = $('#registration_info > p');
			var form = $('#registration_form');

			var register_success = function(response) {
				info_pane.show();

				if (self.invitation_key !== null) {
					info_p.html(lang.t('registration_completewithinvitation'));

					var accept_success = function(response) {
						form.hide();
						info_p.html(lang.t('device_share_successful'))
					};
					var accept_error = function(xhr, error, exception) {
						info_p.html(lang.t('device_share_failed', {
							message: xhr['responseJSON']['message']
						}));					
					};

					HubbleAPI.call('ACCEPT_SHARING_INVITATION', {
							invitation_key: self.invitation_key
						}, {
							success: accept_success, 
							failure: accept_error
						}
					);
				} else {
					info_p.html(lang.t('registration_complete'));
					$('.form-body').addClass('hidden');
				}
			};
			var register_error = function(xhr, error, exception) {
				info_pane.show();
				info_p.html(xhr['responseJSON']['message']);
			};
			
			HubbleAPI.call('CREATE_USER', params, {
				success: register_success, 
				failure: register_error
			});		
		},
		
		validateForm: function(params) {
			var errors = {};
			var errorcount = 0;
		
			_.each(params, function(val, idx) {
				if (val.trim() == '') {
					errorcount++;
					errors[idx] = lang.t('validation_required_field_empty', {
						name: lang.t('regform_{0}'.format(idx))
					});
				}
				
				if (val.indexOf(' ') > 0) {
					errorcount++;
					errors[idx] = lang.t('validation_name_no_spaces', {
						name: lang.t('regform_{0}'.format(idx))
					});
				
				}
			});
			return {
				errors: errors,
				errorcount: errorcount
			};
		
		}
	});
	
	return view;
	
});


