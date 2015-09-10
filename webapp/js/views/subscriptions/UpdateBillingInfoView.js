
define('views/subscriptions/UpdateBillingInfoView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var recurly        = require('recurly');
	var Subscriptions  = require('hubble/subscriptions');
	var UserPrefs      = require('user_prefs');
	var SessionManager = require('session_manager');
	//var ErrorHandler   = require('error_handler');

	// Allow user to upgrade to annual plan
	var update_yearly = false;
	var annual_plan_id;

	var view = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('subscriptions/UpdateBillingInfo'),

		events: {
			'click .buttons-section button[type="submit"]': 'submitForm',
			'click .to-annual': 'changeToAnnual',
			'click .change-plan': 'changePlan',
			'click .reactivate-plan': 'reactivatePlan',
		},

		initialize: function(options) {
			var self = this;
			self.setActiveNavButton('settings');
			self.api_key = UserPrefs.get('API_KEY');

			self.subs = new Subscriptions({
				load: ['user_plans', 'all_plans', 'devices'],
				callback: function(mah_datas) {
					self.render();
				}
			});
		},

		render: function() {
			var self = this;
			var cur_plans = self.subs.getCurrentPlan();
			var data = {};
			data.lang = lang;
			data.has_plan = false;

			data.plan = cur_plans.active_plan;

			data.plan_details = self.subs.getPlan(data.plan.plan_id);

			data.annual_plan_available = false;

			if(data.plan) {
				data.has_plan = 'active';

				if(data.plan.plan_id.indexOf('-yearly',0) === -1) {
          data.annual_plan_available = true;
          annual_plan_id = data.plan.plan_id + '-yearly';
          data.yearly_plan = self.subs.getPlan(data.plan.plan_id + '-yearly');
          data.annual_savings = { price: {} };
          data.annual_savings.price.actual = self.annualSavings(
            data.plan_details.price.actual,
            data.yearly_plan.price.actual
          );
          data.annual_savings.price.local = self.annualSavings(
            data.plan_details.price.local,
            data.yearly_plan.price.local
          );
          data.annual_savings_message = lang.t('billing_info_annual_savings', {
            annual_savings: data.annual_savings.price.actual,
            currency_symbol: data.plan_details.currency.symbol.actual
          });
        }
			} else {
				if(cur_plans.canceled_plan) {
					data.has_plan = 'canceled';

				} else if(cur_plans.pending_plan) {

				}
			}

			self.displayBillingForm();

			self.$el.html(_.template(self.template, data));

			// Test Valid inputs
			// self.injectValidInput();

			// if (data.user_has_plan) {
			// 	$('.form-container').hide();
			// } else {
			// 	$('.update-container').hide();
			// }

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_myaccount'), '#myaccount');
			breadcrumbs.add(lang.t('crumb_updatebillinginfo'), '#billingUpdate');
			breadcrumbs.render();

			// Enable popover for CVV
			$('[data-toggle="popover"]').popover();

			// Fade in the View after done rendering
			self.$el.fadeIn('fast');
		},


		// Event Handlers

		submitForm: function(event) {
			event.preventDefault();
			var self = this;

			var formfields = {};
			var fields = ['cc_first_name', 'cc_last_name', 'cc_number',
				'cvv_number', 'cc_xp_month', 'cc_xp_year', 'addr_line1',
				'addr_line2', 'addr_city', 'addr_state', 'addr_country',
				'addr_zip'];
			_.each(fields, function(field) {
				formfields[field] = $('input[name="{0}"]'.format(field)).val();
			});

			var result = self.validateForm(formfields);

			// Clear out all error fields
			$('.validation-error > div').html('');
			$('input').removeClass('error');

			if (result['errorcount'] > 0) {
				_.each(result['errors'], function(error, idx) {

					//$('.{0}-errors'.format(idx)).html(error);
					if(idx === 'cc_name') {
						$('input[name="cc_first_name"] , input[name="cc_last_name"]').addClass('error');
					} else if(idx === 'cc_xp') {
						$('input[name="cc_xp_month"] , input[name="cc_xp_year"]').addClass('error');
					} else {
						$('input[name="{0}"]'.format(idx)).addClass('error');
					}

				});
				console.log("Form validation errors");
				console.log(result);
				return;
			}

			UserPrefs.set('coupon_code', ('' + $('input[name="voucher"]').val()).trim());
			self.getRecurlyToken(formfields);
			//self.testInjectValidationErrors();
		},

		displayBillingForm: function() {
			var self = this;

			var params = {};
			params.api_key = self.api_key;
			HubbleAPI.call('GET_USER_BILLING_INFO', params,
				function(response) {
					var f = response.data;
					var first_six = [f.first_six.slice(0, 4) + '-' + f.first_six.slice(4)].join('');
					$('input[name="cc_first_name"]').val(f.first_name);
					$('input[name="cc_last_name"]').val(f.last_name);
					$('input[name="cc_xp_month"]').val(f.month);
					$('input[name="cc_xp_year"]').val(f.year % 100);
					$('input[name="cc_number"]').val('{0}xx-xxxx-{1}'.format(first_six, f.last_four));
					$('input[name="cvv_number"]').val('');
					$('input[name="addr_line1"]').val(f.address1);
					$('input[name="addr_line2"]').val(f.address2);
					$('input[name="addr_city"]').val(f.city);
					$('input[name="addr_state"]').val(f.state);
					$('input[name="addr_country"]').val(f.country);
					$('input[name="addr_zip"]').val(f.zip);

					$('.update-container').hide();
					$('.form-container').show();
					$('.plan-details-container').removeClass('hasplan');
				},
				function(xhr, error, exception) {

				}
			);

			$('.update-container').fadeOut('fast');
			$('.form-container').delay(500).fadeIn('fast');

		},

		changePlan: function(event) {
			event.preventDefault();
			var self = this;

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			window.location.replace('/#subscriptions');
		},

		changeToAnnual: function() {
			event.preventDefault();

			annualSubBtnClass = event.currentTarget.className;

			if(annualSubBtnClass.indexOf('processing',0) === -1) {
				var self = this;

				update_yearly = true;

				$('.to-annual').addClass('processing').text(lang.t('billing_info_processing'));
				$('.apply-yearly-message').removeClass('hidden');
			}
		},

		reactivatePlan: function(event) {
			event.preventDefault();
			var self = this;

			$('.reactivate-plan').addClass('processing').text(lang.t('billing_info_processing'));

			// Get First Canceled Plan
			_.each(self.subs.user_plans, function(user_plan) {
				if(user_plan.state === 'canceled') {
					canceled_plan = user_plan;
					return;
				}
			});

			HubbleAPI.call('USER_SUBSCRIPTION_REACTIVATE', canceled_plan,
				function(response) {
					console.log('Subscription Reactivated');
					self.initialize();
				},
				function(xhr, error, exception) {
					console.log('Error');
					console.log(error);
				}
			);
		},

		// Helpers

		getRecurlyToken: function(formfields) {
			var self = this;
			var billing_info = self.formatFieldsForRecurly(formfields);

			// We first get a recurly token and then send this to API to
			// create a subscription
			var cont = recurly.token(billing_info, function (err, token) {
				if (err) {
					$('.api-error').addClass('alert alert-danger');
					$('.api-error').html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>' + err.message);
					return false;
				}
				console.log("got new recurly token, do I update billing info?");


				var params = {};
				params.api_key = self.api_key;
				params.recurly_secret = token.id;
				HubbleAPI.call('UPDATE_USER_BILLING_INFO', params,
					function(response) {
						console.log('Billing Info Updated');

						if(!update_yearly) {
							self.billingUpdateSuccess();
						} else {
							self.subs.activatePlan(
								annual_plan_id,
								'',
								self.billingUpdateSuccess,
								self.billingUpdateFail
							);
						}
					},
					function(xhr, error, exception) {
						console.log(error);
						self.billingUpdateFail();
						$('.api-error').addClass('alert alert-danger');
						$('.api-error').html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>' + lang.t('billing_info_error'));
						return false;
					}
				);
				return true;
			});

			if(cont) {
				// Trigger Page Transition animation
				Backbone.trigger('page-transition', this.$el);
			}
		},

		billingUpdateSuccess: function(response) {
			//console.log(response);
			console.log('success handler');
			window.location.replace('/#myaccount');
		},

		billingUpdateFail: function(xhr, error, exception) {
			//window.location.replace('/#purchasecomplete?error');
			console.log("Failed to create recurly subscription");
			console.log("xhr, error, exception");
			console.log(xhr);
			console.log(error);
			console.log(exception);
			//ErrorHandler.exception();
		},

		formatFieldsForRecurly: function(formfields) {
			return {
				// required attributes
				number: formfields['cc_number'],
				month: formfields['cc_xp_month'],
				year: formfields['cc_xp_year'],
				first_name: formfields['cc_first_name'],
				last_name: formfields['cc_last_name'],

				// optional attributes
				cvv: formfields['cvv_number'],
				address1: formfields['addr_line1'],
				address2: formfields['addr_line2'],
				city: formfields['addr_city'],
				state: formfields['addr_state'],
				postal_code: formfields['addr_zip'],
				country: formfields['addr_country']
			};
		},

		// We should be using a comprehensive third party validation library,
		// but on the other hand, we can just sort of wing it because the API
		// ultimately has to do the most thorough validations anyway.
		validateForm: function(params) {
			var errors = {};
			var errorcount = 0;
			_.each(params, function(val, idx) {
        val = val.trim();
				if (! /addr_line2/.test(idx) && val == '') {
					errorcount++;
					errors[idx] = lang.t('validation_required_field_empty', {
						name: lang.t('credit_{0}'.format(idx))
					});
				}
			});
			if (recurly.validate.cardNumber(params['cc_number']) != true) {
				errors['cc_number'] = lang.t('subform_error_card_number');
			}

			// I'm a bit of a stickler about those 80 char lines
			var xpcheck = recurly.validate.expiry;
			if (xpcheck(params['card_month'], params['card_year']) != true) {
				errors['cc_xp'] = lang.t('subform_error_card_expiry');
			}

			if (recurly.validate.cvv(params['cvv_number']) != true) {
				errors['cvv_number'] = lang.t('subform_error_card_cvv');
			}
			return {
				errors: errors,
				errorcount: errorcount
			};
		},

		// Tests

		injectValidInput: function() {
			$('input[name="cc_first_name"]').val('miffy');
			$('input[name="cc_last_name"]').val('blumpkin');
			$('input[name="cc_xp_month"]').val('01');
			$('input[name="cc_xp_year"]').val('16');
			$('input[name="cc_number"]').val('4111-1111-1111-1111');
			$('input[name="cvv_number"]').val('123');
			$('input[name="addr_line1"]').val('1');
			$('input[name="addr_line2"]').val('1');
			$('input[name="addr_city"]').val('1');
			$('input[name="addr_state"]').val('1');
			$('input[name="addr_country"]').val('1');
			$('input[name="addr_zip"]').val('1');

		},

		// Populate the erors so I can see that it works right
		testInjectValidationErrors: function() {
			var fields = ['cc_name', 'cc_number', 'cvv_number', 'cc_xp_month',
				'cc_xp_year', 'addr_line1', 'addr_line2', 'addr_city',
				'addr_state', 'addr_country', 'addr_zip'];
			_.each(fields, function(field) {
				$('.{0}-errors'.format(field)).html(field);
			});
		},

		// Calculate amount saved on annual subscriptions
		annualSavings: function(planPrice, annualPrice) {
			monthlyAnnualPrice = planPrice * 12;
			return Math.floor(monthlyAnnualPrice - annualPrice);
		}
	});

	return view;

});


