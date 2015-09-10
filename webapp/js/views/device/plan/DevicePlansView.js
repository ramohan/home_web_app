
define('views/device/plan/DevicePlansView', function(require) {
	var $				   = require('jquery');
	var jquery_ui		   = require('jquery_ui');
	var underscore		   = require('underscore');
	var cfg				   = require('hubble_config');
	var lang               = require('hubble_lang');
	var Backbone		   = require('backbone');
	var HubbleAPI		   = require('hubble_api');
	var TemplateLoader	   = require('template_loader');
	var lang               = require('hubble_lang');
	var recurly            = require('recurly');
	var api_call_counter   = 0;
	var view = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('device/plan/DevicePlanList'),
		events: {
			'click .plan_radio': 'checkPlan',
			'click .submit_subscn': 'handleSubscription',
			'click #submit_reset': 'reset',
		},

		// We use this to load the page only after we retrieve all plan related
		// info through AJAX calls
		pre_render: function() {
			var self = this;
			api_call_counter++;
			if (api_call_counter == 3) {
				self.render();
			}
		},

		initialize: function(options) {
			var self = this;
			recurly.configure(cfg.get('RECURLY_TOKEN'));

			self.requireOptions(options, 'DevicePlansView', ['api_key']);
			self.api_key = options.api_key;
			var params = { api_key : self.api_key };
			var data = {};
			// We get existing user subscriptions
			self.getUserSubscriptions(params);
			// We also get all available plans
			self.getDevicePlans(params);
		},

		render: function() {
			var self = this;
			var data = {};
			if ($.isEmptyObject(self.device_plans)) {
				alert("No devices found in user account!");
				window.location.href = "https://hubbleconnected.com/hubble-products/";
			} else {
				data.device_plans = self.device_plans;
				data.plans = self.display_plans;
				data.lang = lang;
				self.$el.html(_.template(self.template, data));
				// We don't display credit card form if user already has a subscription
				if (!$.isEmptyObject(self.user_subscriptions)) {
					$('.credit-card-form').hide();
					$('#freemium-plan').show();
					$('.submit_subscn').html(lang.t('apply_subscription_submit'));
					$('.submit_reset').html(lang.t('apply_subscription_reset'));
				}
			}
		},

		// Helpers


		// We get existing user subscriptions
		getUserSubscriptions: function(params) {
			var self = this;
			var user_plans = {};
			var success = function(response) {
				response['data'].forEach(function(subscription) {
					user_plans[subscription.plan_id] = {
						plan_name: subscription.plan_id,
						subscription_uuid: subscription.subscription_uuid,
						state: subscription.state
					};
				});
				self.user_subscriptions = user_plans;
				self.getAvailablePlans(params, user_plans);
				self.pre_render();
			}
			var failure = function(response) {
				alert(response['message']);
			}
			HubbleAPI.call('GET_USER_SUBSCRIPTIONS', params, success, failure);
		},

		getDataRetentionDays: function(plan_parameters) {
			var days = 0;
			plan_parameters.forEach(function(plan_parameter) {
				if (plan_parameter.parameter == "data_retention_days") {
					days = plan_parameter.value;
				}
			});
			return days;
		},

		// Get all available hubble plans and cross reference with user's current
		// subscription. We use this information to display plans in the view layer
		getAvailablePlans: function(params, user_plans) {
			var self = this;
			var system_plans = {};
			var display_plans = {};
			var success = function(response) {
				response['data'].forEach(function(plan) {
					var data_retention = self.getDataRetentionDays(plan.plan_parameters);
					new_plan = [];
					current_flag = false;
					subscription_id = null;
					plan_state = null;
					if (plan.plan_id in user_plans && user_plans[plan.plan_id].state != "expired") {
						current_flag = true;
						subscription_id = user_plans[plan.plan_id].subscription_uuid;
						plan_state = user_plans[plan.plan_id].state;
					}
					if (display_plans[data_retention] != null) {
						new_plan = display_plans[data_retention];
					}
					new_plan.push({
						id: plan.id,
						plan_name: plan.plan_id,
						price_cents: plan.price_cents,
						currency_unit: plan.currency_unit,
						renewal_period_month: plan.renewal_period_month,
						data_retention_days: data_retention,
						current: current_flag,
						subscription_uuid: subscription_id,
						state: plan_state
					});
					plan.days = data_retention;

					display_plans[data_retention] = new_plan;
					system_plans[plan.plan_id] = plan;
				});
				self.system_plans = system_plans;
				self.display_plans = display_plans;
				console.log(display_plans);
				self.pre_render();
			};
			var failure = function(response) {
				alert(response['message']);
			}
			HubbleAPI.call('GET_SUBSCRIPTION_PLANS', params, success, failure);
		},

		// Get all user devices & their plans
		getDevicePlans: function(params) {
			var self = this;
			var plan_list = [];
			var success = function(response) {
				response['data']['devices'].forEach(function(device) {
					plan_list.push({
						registration_id: device.registration_id,
						plan_name: device.plan_id,
						device_name: device.name
					});
				});
				self.device_plans = plan_list;
				self.pre_render();
			};
			var failure = function(response) {
				alert(response['message']);
			};
			HubbleAPI.call('GET_DEVICE_PLANS', params, success, failure);
		},

		// Handle click event for subscription submit button
		// We send cancel request if the user selects the default freemium plan or
		// We update user's subscription if they select a plan different from their existing
		// We also apply the plan to user selected devices
		handleSubscription: function(event) {
			var self = this;
			event.preventDefault();
			var params = {};
			params['api_key'] = self.api_key;
			var selected_plan_name = $('input[name="apply_plan_name"]:checked').val();
			var selected_uuid = $('input[name="current_subscription_id"]').val();

			console.log("Selected plan name and uuid: {0}, {1}".
				format(selected_plan_name, selected_uuid));


			if (selected_plan_name == "freemium") {
				console.log("freemium path");
				self.cancelSubscription(selected_uuid);
			} else if ($.isEmptyObject(self.user_subscriptions)) {
				console.log("new subscription path");
				self.createSubscriptionWorkflow(selected_plan_name);
			} else {
				console.log("change subscription path");
				self.preSubscriptionWorkflow(selected_uuid);
			}
		},

		// Used for creating new subscriptions for users
		createSubscriptionWorkflow: function(plan_name) {
			var self = this;
			var params = {};
			params['card_number'] = $('input[name="number"]').val();
			params['card_month'] = $('select[name="month"]').val();
			params['card_year'] = $('select[name="year"]').val();
			params['card_first_name'] = $('input[name="first_name"]').val();
			params['card_last_name'] = $('input[name="last_name"]').val();
			params['card_cvv'] = $('input[name="cvv"]').val();
			params['card_address1'] = $('input[name="address1"]').val();
			params['card_address2'] = $('input[name="address2"]').val();
			params['card_city'] = $('input[name="city"]').val();
			params['card_state'] = $('input[name="state"]').val();
			params['card_postal'] = $('input[name="postal_code"]').val();
			params['card_country'] = $('input[name="country"]').val();

			result = self.validateBillingInfo(params);
			_.each(result['errors'], function(error, idx) {
				$('.{0}-errors'.format(idx)).html(error);
			});

			console.log("form error count {0}".format(result['errorcount']));
			if (result['errorcount'] == 0) {
				var billingInfo = {
	  				// required attributes
	  				number: params['card_number'],
	  				month: params['card_month'],
	  				year: params['card_year'],
	  				first_name: params['card_first_name'],
	  				last_name: params['card_last_name'],

	  				// optional attributes
	  				cvv: params['card_cvv'],
	  				address1: params['card_address1'],
	  				address2: params['card_address2'],
	  				city: params['card_city'],
	 				state: params['card_state'],
	  				postal_code: params['card_postal'],
	  				country: params['card_country']
	  			};

				// We first get a recurly token and then send this to API to create a subscription
				console.log("Acquiring recurly token");
				recurly.token(billingInfo, function (err, token) {
					if (err) {
						console.log("error: " + err);
						alert("Subscription creation error!");
					} else {
						console.log("tokenId: " + token.id);
						self.sendBillingInfo(plan_name, token.id);
					}
				});
			}
		},

		// create a new subscriptions through API
    sendBillingInfo: function(plan_name, token) {
      if (!$.isEmptyObject(plan_name) && !$.isEmptyObject(token)) {
        var self = this;
        var request = new XMLHttpRequest();
        var currencyApi = 'https://currency.hubbleconnected.com/' +
         'currency/country/single/id/' +
          UserPrefs.get('locale').countryCode;
        request.onload = function () {
          var params = {
            api_key: self.api_key,
            plan_id: plan_name,
            recurly_secret: token,
            currency_unit: JSON.parse(this.responseText)[0].base_currency,
            vat_rate: JSON.parse(this.responseText)[0].vat_rate % 100,
            vat_eligible: JSON.parse(this.responseText)[0].vat_eligible,
            recurly_coupon: UserPrefs.get('coupon_code') || ''
          };
          var success = function(response) {
            console.log(response);
            self.applySubscriptionWorkflow(response['data'].subscription_uuid);
          };
          var failure = function(response) {
            console.log(response);
            alert(response);
          };
          HubbleAPI.call('USER_SUBSCRIPTION_RECURLY_CREATE', params, success, failure);
        };
        request.open('GET', currencyApi, true);
        request.send();
      }
    },


		applySubscriptionWorkflow: function(subscription_uuid) {
			var self = this;
			device_ids = [];
			var params = {};
			var current_plan_name = $('input[name="current_subscription_name"]').val();
			var new_plan_name = $('input[name="apply_plan_name"]:checked').val();
			params['api_key'] = self.api_key;
			params['plan_id'] = new_plan_name;
			$('input[name="devices"]:checked').each(function(){
				device_ids.push($(this).val());
			});
			params['devices_registration_id'] = device_ids;
			errors = self.validateForm(params);
			var success = function(response) {
				alert('success');
			};
			var failure = function(response) {
				alert(response['data']['message']);
			};
			if (errors.length == 0) {

				// We apply subscription to user selected devices
				if (!current_plan_name || current_plan_name == new_plan_name) {
					if (device_ids.length > 0) {
						HubbleAPI.call('APPLY_DEVICE_SUBSCRIPTION', params,
										success, failure);
					}
				}
				// We upgrade/downgrade if the user selected a plan other than his current one
				else {
					params['subscription_uuid'] = subscription_uuid;
					HubbleAPI.call('USER_SUBSCRIPTION_RECURLY_UPDATE', params, success, failure);
				}
			}

		},


		cancelSubscription: function(subscription_uuid) {
			var self = this;
			var params = {};
			params['api_key'] = self.api_key;
			params['subscription_uuid'] = subscription_uuid;
			var success = function(response) {
					console.log(response);
					alert(lang.t('plan_cancel_sucess'));
			};
			var failure = function(response) {
					console.log(response);
					alert(lang.t('plan_change_failure'));
			};
			HubbleAPI.call('USER_SUBSCRIPTION_RECURLY_CANCEL', params, success, failure);
		},

		// Reactivate a canceled subscription and apply the plan to user selected devices
		reactivateSubscription: function(subscription_uuid, success, failure) {
			var self = this;
			var params = {};
			params['api_key'] = self.api_key;
			params['subscription_uuid'] = subscription_uuid;
			HubbleAPI.call('USER_SUBSCRIPTION_RECURLY_REACTIVATE', params, success, failure);
		},

		// We first reactivate if a subscription is canceled and then
		// apply the subscription to user selected devices
		preSubscriptionWorkflow: function(subscription_uuid) {
			current_sub_name = $('input[name="current_subscription_name"]').
				val();
			current_sub_state = $('input[name="current_subscription_state"]').
				val();
			var params = {};
			var self = this;
			var success = function(response) {
				console.log(response);
				self.applySubscriptionWorkflow(response['data']['subscription_uuid']);
			};
			var failure = function(response) {
				console.log(response);
				alert(response['message']);
			}
			// We re-activate a canceled subscription first and then
			// apply any updates
			if (current_sub_state == "canceled") {
				params['api_key'] = self.api_key;
				params['subscription_uuid'] = subscription_uuid;
				self.reactivateSubscription(subscription_uuid, success, failure);
			} else {
				self.applySubscriptionWorkflow(subscription_uuid);
			}
		},

		// Check & display for up/downgrades when the user selects a plan
		checkPlan: function(event) {
			var self = this;
			var checked_value = $('input[name="apply_plan_name"]:checked').val();
			var checked_plan_name = self.system_plans[checked_value];
			console.log(checked_plan_name);
			$('input[name="devices"]').attr('disabled', false);
			if(!$.isEmptyObject(self.user_subscriptions) && checked_plan_name && !(checked_plan_name.plan_id in self.user_subscriptions)) {
				// Let user know if they're down/upgrading or canceling
				if (parseInt(checked_plan_name.days) > parseInt($('input[name="current_subscription_days"]').val())) {
					$('#span_state_' + checked_value).html("<span style='color:white;'>upgrade</span>");
					$('input[name="devices"]').attr('checked', true);
				} else {
					$('#span_state_' + checked_value).html("<span style='color:grey;'>downgrade</span>");
					$('input[name="devices"]').attr('disabled', true);
					alert(lang.t('plan_downgrade_confirmation'));
				}
				return;
			} else if (!$.isEmptyObject(self.user_subscriptions) && checked_plan_name && checked_plan_name.state == 'canceled') {
				alert(lang.t('plan_reactivate_message'));
			} else if (checked_value == 'freemium') {
				$('input[name="devices"]').attr('disabled', true);
				alert(lang.t('plan_cancel_message'));
			}
		},

		validateForm: function(params) {
			var errors = new Array();
			if (!params['plan_id']) {
				alert(lang.t('apply_subscription_plan_id_error'));
				errors.push(lang.t('apply_subscription_plan_id_error'));
			}
			return errors;
		},

		validateBillingInfo: function(params) {
			var errors = {};
			var errorcount = 0;
			_.each(params, function(val, idx) {
				if (val.trim() == '' && idx != 'card_address2') {
					errorcount++;
					errors[idx] = lang.t('validation_required_field_empty', {
						name: lang.t('credit_{0}'.format(idx))
					});
				}
			});
			if (recurly.validate.cardNumber(params['card_number']) != true) {
				errors['number'] = lang.t('subform_error_card_number');
			}

			if (recurly.validate.expiry(params['card_month'], params['card_year']) != true) {
				errors['expiry'] = lang.t('subform_error_card_expiry');
			}

			if (recurly.validate.cvv(params['card_cvv']) != true) {
				errors['cvv'] = lang.t('subform_error_card_cvv');
			}
			return {
				errors: errors,
				errorcount: errorcount
			};
		},

		reset: function() {
			$('#plan-form').reset();
		},


	});

	return view;
});

