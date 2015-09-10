
/**
 * Subscriptions
 * This class is responsible for talking to the hubble API and recurly when
 * subscription related actions are taken. Note that it returns an instance,
 * which means the class can reliably hold things in memory between views.
 *
 * It is this classes job to answer questions like "what is my current plan"
 * and "how many devices can I apply my current plan to."
 */

define('hubble/subscriptions', function(require) {
	var HubbleApi      = require('hubble_api');
	var _              = require('underscore');
	var Backbone       = require('backbone');
	var HubbleAPI      = require('hubble_api');
	var ErrorHandler   = require('error_handler');
	var UserPrefs      = require('user_prefs');
	var SessionManager = require('session_manager');

	var Subscriptions = function(options) {
		var pub = this;

		pub.all_plans_done = true;
		pub.user_plans_done = true;
		pub.devices_done = true;
		pub.device_subs_done = true;

		pub.all_plans = [];
		pub.user_plans = [];
		pub.device_subscriptions = [];
		pub.devices = [];

		pub.api_key = options.api_key;
		if (!pub.api_key) {
			pub.api_key = UserPrefs.get('API_KEY') ? UserPrefs.get('API_KEY') :
				SessionManager.getActiveAuthToken();
		}


		// Note that this class needs to have loaded user_plans in order to
		// answer this question accurately.
		pub.userHasPlan = function() {
			if(pub.user_plans.length === 0) {
				return false;
			} else {
				var plan_state = 'expired';

				pub.user_plans.forEach(function(user_plan){
					// Get Active Plan
					if(user_plan.state === 'active' || user_plan.state === 'canceled') {
						if(user_plan.state === 'active') {
							plan_state = 'has_plan';
						} else {
							plan_state = 'canceled';
						}

						return;
					}
				});

				return plan_state;
			}
		};

		pub.userHasActivePlan = function() {
			var plans = pub.getCurrentPlan();
			var plan = plans.active_plan;

			if(!plan) {
				return false;
			} else if(plan.state == 'active') {
				return true;
			} else {
				return false;
			}
		};

		pub.activatePlan = function(plan_id, device_ids, callback_success, callback_fail) {
			var plans = pub.getCurrentPlan();
			var canceled_plan = plans.canceled_plan;
			var current_plan = plans.active_plan;

			// console.log(current_plan);

			// TODO: detect whether there is an existing cancelled
			// subscription which needs to be updated
			if (canceled_plan) {
				console.log("reactivate plan path");
				pub.reactivateSubscription(current_plan, plan_id,
					callback_success, callback_fail);
				return;
			}

			// console.log("changePlan path");
			// console.log("callback_success");
			// console.log(callback_success);
			pub.changePlan(plan_id, device_ids, callback_success,
				callback_fail);
		};

		pub.reactivateSubscription = function(current_plan_obj, new_plan_id, callback_success, callback_fail) {
			var self = this;

			var params = {};
			if (self.api_key !== null) {
				params['api_key'] = self.api_key;
			}
			params['subscription_uuid'] = current_plan_obj.subscription_uuid;

			HubbleAPI.call('USER_SUBSCRIPTION_REACTIVATE', params,
				function(response) {
					pub.changePlan(new_plan_id, null,
						callback_success, callback_fail);
				},
				callback_fail
			);
		};

		pub.changePlan = function(new_plan_id, device_ids, callback_success, callback_fail) {
			var plans = pub.getCurrentPlan();
			var current = plans.active_plan;
			var params = {};
			params['api_key'] = pub.api_key;
			params['plan_id'] = new_plan_id;

      // No current plan is present, meaning the user is purchasing a new
      // plan after a previous one was cancelled or expired
      if (!current) {
        pub.expiredPlanCreate(new_plan_id, callback_success, callback_fail);
      }
      // The user should never be able to change their plan to the
      // current plan, the subscription view should not allow it.
      else if (current.plan_id === new_plan_id) {
        console.log("don't do anythang");
      }
      else if (current && current.plan_id !== new_plan_id) {
        params.subscription_uuid = current.subscription_uuid;
        HubbleAPI.call(
          'USER_SUBSCRIPTION_RECURLY_UPDATE',
          params,
          callback_success,
          callback_fail
        );
      }
		};

		pub.initialPlanCreate = function(plan_id, recurly_token, callback_success, callback_fail) {
      var request = new XMLHttpRequest();
      var currencyApi = 'https://currency.hubbleconnected.com/' +
       'currency/country/single/id/' +
        UserPrefs.get('locale').countryCode;
      request.onload = function () {
        var params = {
          api_key: pub.api_key,
          plan_id: plan_id,
          recurly_secret: recurly_token,
          currency_unit: JSON.parse(this.responseText)[0].base_currency,
          vat_rate: JSON.parse(this.responseText)[0].vat_rate % 100,
          vat_eligible: JSON.parse(this.responseText)[0].vat_eligible,
          recurly_coupon: UserPrefs.get('coupon_code') || ''
        };
			HubbleAPI.call('USER_SUBSCRIPTION_RECURLY_CREATE', params,
				function(response) {
					console.log("Recurly subscription create successful");
					console.log("User will need to manually attach devices to plan");

					if (callback_success !== undefined) {
						callback_success();
					}
				},
				callback_fail
			)
      };
      request.open('GET', currencyApi, true);
      request.send();
		};

		pub.expiredPlanCreate = function(plan_id, callback_success, callback_fail) {
			var params = {
				'api_key': pub.api_key,
				'plan_id': plan_id,
			};
			HubbleAPI.call('USER_SUBSCRIPTION_EXPIRED_CREATE', params,
				function(response) {
					console.log("Recurly subscription create successful");
					console.log("Automatically attaching devices to the plan");
					//pub.assignDevicesToPlan(plan_id, device_ids);

					if (callback_success !== undefined) {
						callback_success();
					}
				},
				callback_fail
			);
		};

		pub.assignDevicesToPlan = function(plan_id, device_ids) {
			var params = {};
			params['api_key'] = pub.api_key;
			if (device_ids === undefined) {
				params['devices_registration_id'] = pub.getDeviceIds(plan_id);
			} else {
				params['devices_registration_id'] = device_ids;
			}
			params['plan_id'] = plan_id;

			HubbleAPI.call('APPLY_DEVICE_SUBSCRIPTION', params,
				function(response) {
					console.log("Plan " + plan_id + " has been applied " +
						"successfully.");
				},
				function(xhr, error, exception) {
					console.log("Failed to create recurly subscription");
					console.log("xhr, error, exception");
					console.log(xhr);
					console.log(error);
					console.log(exception);
				}
			);
		};


		pub.getCurrentPlan = function() {
			var return_parms = {};

			return_parms.active_plan = false;
			return_parms.pending_plan = false;
			return_parms.canceled_plan = false;

			if ($.isEmptyObject(pub.user_plans)) {

				console.log('No Plan Found');

				return return_parms;
			}

			// Technically the interface only supports a single active
			// subscription at present, but user plans is an array which
			// could (but really shouldn't) have multiple plans in it.
			// For now, we're going to get the "current" subscription by
			// taking the first plan in the array and in the future we'll
			// have to let the user change or cancel specific plans.


			// Check for Active status rather than grabbing the first item in array
			// Also check for 'Pending' status to display message that a new plan
			// will take effect after the next billing cycle
			pub.user_plans.forEach(function(user_plan){
				// Get Active Plan
				if(user_plan.state === 'active') {
					return_parms.active_plan = user_plan;
				}

				if(user_plan.state === 'pending') {
					return_parms.pending_plan = user_plan;
				}

				if(user_plan.state === 'canceled') {
					return_parms.canceled_plan = user_plan;
				}
			});

			return return_parms;
		};

		pub.getPlan = function(plan_id) {
			var current_plan = {};
			_.each(pub.all_plans, function(plan) {
				if (plan.name == plan_id) {
					current_plan = plan;
				}
			});
			return current_plan;
		};

		pub.getPlanParam = function(plan, requested_parameter) {
			var value = null;

			_.each(plan['plan_parameters'], function(param) {
				if (requested_parameter == param['parameter']) {
					value = param['value'];
				}
			});
			if (value === null) {
				return ErrorHandler.exception("Subscriptions::getPlanParam() "+
					"returned null for param {0}".format(requested_parameter));
			}

			return value;
		};

		pub.getNumDevicesAllowed = function(plan_id) {
			var plan = pub.getPlan(plan_id);
			return pub.getPlanParam(plan, 'max_devices');
		};

		// Get device registration_ids for as many devices as are covered
		// by the specified plan
		pub.getDeviceIds = function(plan_id) {
			var allowed = pub.getNumDevicesAllowed(plan_id);

			var ids = [];
			num_devices = 0;
			console.log("getting device ids ({0}) allowed".format(allowed));
			_.each(pub.devices, function(device) {
				num_devices++;
				if (num_devices > allowed) {
					return;
				}
				ids.push(device['registration_id']);
			});
			return ids;
		};

		pub.callbackWhenReady = function() {
			if (pub.all_plans_done && pub.user_plans_done &&
				pub.devices_done && pub.device_subs_done) {
				options.callback({
					user_plans: pub.user_plans,
					all_plans: pub.all_plans,
					devices: pub.devices,
					device_subscriptions: pub.device_subscriptions
				});
			}
		};

		pub.preloadSubscriptionData = function(things_to_load) {
			_.each(things_to_load, function(item) {
				switch (item) {
					case 'user_plans':
						pub.loadUserPlans();
						break;
					case 'all_plans':
						pub.loadAllPlans();
						break;
					case 'devices':
						pub.loadDevices();
						break;
					case 'device_subscriptions':
						pub.loadDeviceSubscriptions();
						break;
				};
			});
		};

    function processPlans(results) {
      var plans = [];
      var resultsCount = results.data.length;
      results.data.forEach(function (plan, i) {
        var request = new XMLHttpRequest();
        var currencyApi = 'https://currency.hubbleconnected.com/' +
          'currency/plans/recurly/ip/' +
          UserPrefs.get('locale').query +
          '/planid/' + plan.plan_id;
        request.onload = function () {
          plans.push(localizePlan(
            plan,
            JSON.parse(this.responseText)[0])
          );
          if (plans.length == resultsCount) {
            pub.all_plans = plans.sort(function (a, b) {
              if (a.name < b.name)
                return -1;
              if (a.name > b.name)
                return 1;
              return 0;
            });
            pub.all_plans_done = true;
            return pub.callbackWhenReady();
          }
          return;
        };
        request.open('GET', currencyApi, true);
        request.send();
      });
    }

    function localizePlan(plan, localizedPlan) {
      function toDecimalFormat(price) {
        return (price / 100).toFixed(2);
      }
      function addVat(price, rate) {
        return (price * (1 + rate / 100)).toFixed(2);
      }
      return {
        id: plan.id,
        name: plan.plan_id,
        active: !!plan.is_active,
        price: {
          actual: localizedPlan.vat_eligible
            ? addVat(toDecimalFormat(localizedPlan.price_to_bill), localizedPlan.vat_rate)
            : toDecimalFormat(localizedPlan.price_to_bill),
          local: toDecimalFormat(localizedPlan.price_to_display)
        },
        currency: {
          code: {
            actual: localizedPlan.currency_to_bill,
            local: localizedPlan.currency_to_display
          },
          symbol: {
            actual: localizedPlan.billing_currency_symbol,
            local: localizedPlan.display_currency_symbol
          }
        }
      };
    }

    pub.loadAllPlans = function() {
      pub.all_plans_done = false;
      var params = { api_key: pub.api_key };
      HubbleAPI.call('GET_SUBSCRIPTION_PLANS', params, processPlans);
    };

		// Load any plans the user might already have
		pub.loadUserPlans = function() {
			pub.user_plans_done = false;

			var params = {};
			params['api_key'] = pub.api_key;
			HubbleAPI.call('GET_USER_SUBSCRIPTIONS', params,
				function(response) {
          // Set our Recurly token
          if (!UserPrefs.get('recurly_token')) {
            UserPrefs.set(
              'recurly_token',
              response.data.recurly_account_token
            );
          }
					pub.user_plans = response['data'].plans;
					pub.user_plans_done = true;
					return pub.callbackWhenReady();
				},
				function(xhr, error, exception) {

				}
			);
		};

		// This call piggybacks on the loadUserPlans call and it's purpose
		// is to return the links between user plans and devices
		pub.loadDeviceSubscriptions = function() {
			pub.device_subs_done = false;

			var params = {};
			params['api_key'] = pub.api_key;
			HubbleAPI.call('GET_DEVICE_PLANS', params,
				function(response) {
					pub.device_subscriptions = response['data'];
					pub.device_subs_done = true;
					return pub.callbackWhenReady();
				},
				function(xhr, error, exception) {

				}
			);
		};

		pub.loadDevices = function() {
			pub.devices_done = false;

			var params = {};
			params['api_key'] = pub.api_key;
			HubbleAPI.call('GET_USER_DEVICES', params,
				function(response) {
					pub.devices_done = true;
					pub.devices = response['data'];
					return pub.callbackWhenReady();
				},
				function(xhr, error, exception) {


				}
			);
		};

		if (options.load !== undefined && options.callback !== undefined) {
			pub.preloadSubscriptionData(options.load);
		}

	};

	return Subscriptions;
});

