
define('views/subscriptions/BillingInfoView', function(require) {
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


	var view = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('subscriptions/BillingInfo'),

		events: {
			'click .buttons-section button[type="submit"]': 'submitForm',
			'click .billing_info_yes_update_submit': 'switchToBillingForm',
			'click .billing_info_no_update_submit': 'completePurchaseButton',
			'click .to-annual': 'changeToAnnual',
			'click .change-plan': 'changePlan',
			'click .accept': 'acceptCheckbox',
			'click .accept-tos': 'getRecurlyToken',
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
			var data = {};
			data.lang = lang;
			data.plan = self.subs.getPlan(UserPrefs.get('CHOOSING_PLAN'));

			data.has_same_annual = false;

			// If user is already subscribed to the annual version of the plan
			// don't prompt them to upgrade to annual.
			var plan = self.subs.getCurrentPlan();
			var activeplan = plan.active_plan;

			if(activeplan) {

				if(activeplan.plan_id.indexOf('-yearly',0) > -1) {

					var none_annual = activeplan.plan_id.replace('-yearly','');

					console.log(none_annual);
					console.log(activeplan.plan_id);

					if(data.plan.plan_id === none_annual) {
						data.has_same_annual = true;
					}
				}
			}

			data.yearly_plan = self.subs.getPlan(data.plan.name + '-yearly');
			data.user_has_plan = self.subs.userHasPlan();
      data.annual_savings = { price: {} };
			data.annual_savings.price.actual = self.annualSavings(
        data.plan.price.actual,
        data.yearly_plan.price.actual
      );
			data.annual_savings.price.local = self.annualSavings(
        data.plan.price.local,
        data.yearly_plan.price.local
      );

			data.annual_savings_message = lang.t('billing_info_annual_savings', {
				annual_savings: data.annual_savings.price.actual,
        currency_symbol: data.plan.currency.symbol.actual
			});

			self.$el.html(_.template(self.template, data));

			// Test Valid inputs
			// self.injectValidInput();

			if (data.user_has_plan) {
				$('.form-container').hide();
			} else {
				$('.update-container').hide();
			}

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_myaccount'), '#myaccount');
			breadcrumbs.add(lang.t('crumb_subscriptions'), '#subscriptions');
			//breadcrumbs.add(lang.t('crumb_devsub'), '#devicesubscriptions');
			breadcrumbs.add(lang.t('crumb_billinginfo'), '#billing');
			breadcrumbs.render();

			// Enable popover for CVV
			$('[data-toggle="popover"]').popover();

			// Adjust #header-wrapper and #footer_container z-index to avoid weird overlapping with modal window.
			$('#ToS-Modal').on('show.bs.modal', function() {
				$('#header-wrapper, #footer_container').css('z-index', '1');
			});

			$('#ToS-Modal').on('hide.bs.modal', function() {
				$('#header-wrapper, #footer_container').css('z-index', '100');
			});


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
			self.launchToS();
			//self.testInjectValidationErrors();
		},

		switchToBillingForm: function(event) {
			event.preventDefault();
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

		completePurchaseButton: function(event) {
			event.preventDefault();
			var self = this;

			console.log('Has Plan? ' + self.subs.userHasPlan());

			if(self.subs.userHasPlan() === 'has_plan') {
				self.subs.activatePlan(
					UserPrefs.get('CHOOSING_PLAN'),
					UserPrefs.get('CHOOSING_DEVICES'),
					self.planActivateSuccess,
					self.planActivateFail
				);
			} else {
				console.log('User Plan',UserPrefs.get('CHOOSING_PLAN'));
				self.subs.expiredPlanCreate(
					UserPrefs.get('CHOOSING_PLAN'),
					self.planActivateSuccess,
					self.planActivateFail

				);
			}

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);
		},

		changePlan: function(event) {
			event.preventDefault();
			var self = this;

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			window.location.replace('/#subscriptions');
		},

		changeToAnnual: function(event) {
			event.preventDefault();

			annualSubBtnClass = event.currentTarget.className;

			if(annualSubBtnClass.indexOf('processing',0) === -1) {

				var self = this;
				var selPlan = {};

				// Get selected plan
				selPlan = UserPrefs.get('CHOOSING_PLAN');
				console.log(selPlan);

				selPlan= selPlan.concat('-yearly');

				console.log(selPlan);
				UserPrefs.set('CHOOSING_PLAN', selPlan);

				$('.to-annual').addClass('processing').text(lang.t('billing_info_processing'));
				$('.apply-yearly-message').removeClass('hidden');
			}

		},

		// Helpers

		getRecurlyToken: function() {
			var self = this;

			var formfields = {};
			var fields = ['cc_first_name', 'cc_last_name', 'cc_number',
				'cvv_number', 'cc_xp_month', 'cc_xp_year', 'addr_line1',
				'addr_line2', 'addr_city', 'addr_state', 'addr_country',
				'addr_zip'];

			_.each(fields, function(field) {
				formfields[field] = $('input[name="{0}"]'.format(field)).val();
			});

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

				if (self.subs.userHasPlan()) {
					var params = {};
					params.api_key = self.api_key;
					params.recurly_secret = token.id;
					HubbleAPI.call('UPDATE_USER_BILLING_INFO', params,
						function(response) {
							self.subs.activatePlan(
								UserPrefs.get('CHOOSING_PLAN'),
								'',
								self.planActivateSuccess,
								self.planActivateFail
							);
						},
						function(xhr, error, exception) {
							$('.api-error').addClass('alert alert-danger');
							$('.api-error').html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>' + lang.t('billing_info_error'));
							return false;
						}
					);

				} else {
					console.log(UserPrefs.get('CHOOSING_PLAN'));

					self.subs.initialPlanCreate(
						UserPrefs.get('CHOOSING_PLAN'),
						token.id,
						self.planActivateSuccess,
						self.planActivateFail
					);
				}
				return true;
			});

			$('#ToS-Modal').modal('hide');

			if(cont) {
				// Trigger Page Transition animation
				Backbone.trigger('page-transition', this.$el);
			}
		},

		planActivateSuccess: function(response) {
			console.log(response);
			console.log('success handler');
			window.location.replace('/#purchasecomplete');
		},

		planActivateFail: function(xhr, error, exception) {
			window.location.replace('/#purchasecomplete?error');
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
			$('input[name="addr_city"]').val('1');
			$('input[name="addr_state"]').val('1');
			$('input[name="addr_country"]').val('1');
			$('input[name="addr_zip"]').val('1');

		},

		// Populate the erors so I can see that it works right
		testInjectValidationErrors: function() {
			var fields = ['cc_name', 'cc_number', 'cvv_number', 'cc_xp_month',
				'cc_xp_year', 'addr_line1', 'addr_city',
				'addr_state', 'addr_country', 'addr_zip'];
			_.each(fields, function(field) {
				$('.{0}-errors'.format(field)).html(field);
			});
		},

		// Calculate amount saved on annual subscriptions
		annualSavings: function(planPrice, annualPrice) {
			monthlyAnnualPrice = planPrice * 12;
			return Math.floor(monthlyAnnualPrice - annualPrice);
		},

		launchToS: function() {
			$('#ToS-Modal').modal('show');
		},

		acceptCheckbox: function() {
			if(document.querySelector('.accept').checked) {
				document.querySelector('.accept-tos').disabled = false;
			} else {
				document.querySelector('.accept-tos').disabled = true;
			}
		}


	});

	return view;

});


