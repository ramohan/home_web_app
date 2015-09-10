
define('views/subscriptions/DeviceSubscriptionsView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');	
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var UserPrefs      = require('user_prefs');
	var Subscriptions  = require('hubble/subscriptions');

	var view = Backbone.View.extend({
		// An instance of the subscriptions helper class
		subscriptions: null,

		user_plans: {},
		all_plans: {},
		devices: {},
		device_subscriptions: {},

		max_devices: 0,

		// an array of registration ids, this will be saved to localstorage
		// when the user hits "Continue" and sent to the api only when the
		// plan is confirmed
		stored_devsubs: [],

		el: '#page_view',
	
		template: TemplateLoader.get('subscriptions/DeviceSubscriptions'),

		events: {
			'click .slider-frame':         'toggleDevice',
			'click .devsub-submit-button': 'submitHandler',
		},
		
		initialize: function(options) {
			var self = this;
			self.api_key = UserPrefs.get('API_KEY');

			self.subs = new Subscriptions({
				load: ['user_plans', 'all_plans', 'devices', 
					'device_subscriptions'],
				callback: function(mah_datas) {
					self.user_plans           = mah_datas.user_plans;
					self.all_plans            = mah_datas.all_plans;
					self.devices              = mah_datas.devices;
					self.device_subscriptions = mah_datas.device_subscriptions;
					self.render();
				}
			});
		},

		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;
			self.normalizeThumbnailsProtocol();
			data.devices = self.devices;

			var plans = self.subs.getCurrentPlan();
			var plan = plans.active_plan;
			var plan_id = plan.plan_id;

			self.user_plans = plan;

			data.device_subscriptions_remaining = self.device_subscriptions.plan_device_availability[plan_id];
			self.max_devices = data.device_subscriptions_remaining;

			data.sel_plan = lang.t('plans_{0}_title'.format(plan.plan_id));

			// Check if user has a plan in pending
			data.user_has_plan = self.subs.userHasPlan();
			data.user_pending_plan = false;

			//console.log(self.devices);

			if(self.devices.length) {
				data.user_has_devices = true;

				if (data.user_has_plan) {
					var pending_plan = plans.pending_plan;

					data.devsubs_info_msg = lang.t('devsubs_info', {
						plan_name: lang.t('plans_{0}_title'.format(plan.plan_id)),
					});

					data.devsubs_apply_sub = lang.t('devsubs_apply', {
						plan_name: lang.t('plans_{0}_title'.format(plan.plan_id)),
					});

					// data.subs_message = lang.t('myaccount_subscriptions', {
					// 	plan_name: lang.t('plans_{0}_title'.format(plan.plan_id)) 
					// });

					if(pending_plan) {
						data.user_pending_plan = true;
						data.pending_message = lang.t('devsub_pending_plan', {
							pending_plan_name: lang.t('plans_{0}_title'.format(pending_plan.plan_id)),
							cur_plan_expire: self.formatDate(plan.expires_at)
						});
					}
				} else {
					//data.subs_message = lang.t('myaccount_subscriptions_nosubsyet');
				}
			} else {
				data.user_has_devices = false;
			}

			self.$el.html(_.template(self.template, data));			

			self.checkActiveDevices();

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_myaccount'), '#myaccount');
			//breadcrumbs.add(lang.t('crumb_subscriptions'), '#subscriptions');
			breadcrumbs.add(lang.t('crumb_devsub'), '#devicesubscriptions');
			breadcrumbs.render();

			// Fade in the View after done rendering
			self.$el.fadeIn('fast');
		},

		// Event Handlers

		toggleDevice: function(event) {
			var self = this;
			var target = $(event.target);

			if (target.hasClass('slider-frame')) {
				var frame = $(event.target)
				var slider = $(event.target).find('.slider-button');
			} else {
				var frame = $(event.target).parent();
				var slider = $(event.target);
			}

			var id = frame.attr('data-device-registration-id');
			var devsub_tile = $('.devsub-device[data-device-registration-id="{0}"]'.format(id));

			console.log(id);

			if (frame.hasClass('on')) {
				console.log('on');

				frame.removeClass('on').addClass('off');
				slider.removeClass('on').addClass('off');

				var idx = self.stored_devsubs.indexOf(id);
				self.stored_devsubs.splice(idx, 1);

				self.max_devices++;

				$('.devsub-remaining').html(self.max_devices);

				self.subs.assignDevicesToPlan('', id);

				devsub_tile.find('.devsub-plan.new').hide();
				devsub_tile.find('.devsub-plan.old').show();

			} else {
				console.log('off');

				var params = {};
				params['api_key'] = UserPrefs.get('API_KEY');
				params['devices_registration_id'] = id;
				
				params['plan_id'] = self.user_plans.plan_id;

				HubbleAPI.call('APPLY_DEVICE_SUBSCRIPTION', params,
					function(response) {
						console.log("Plan " + self.user_plans.plan_id + " has been applied " +
							"successfully.");

						frame.removeClass('off').addClass('on');
						slider.removeClass('off').addClass('on');

						self.stored_devsubs.push(id);
						--self.max_devices;

						$('.devsub-remaining').html(self.max_devices);

						devsub_tile.find('.devsub-plan.new').show();
						devsub_tile.find('.devsub-plan.old').hide();

					},
					function(xhr, error, exception) {
						console.log("Failed to create recurly subscription");
						console.log("xhr, error, exception");
						console.log(xhr);
						console.log(error);
						console.log(exception);

						alert(lang.t('devsub_error'));
					}
				);
			}

			// Did the user try to check more boxes than subscriptions?
			console.log(self.stored_devsubs);

		},

		// Helpers

		checkActiveDevices: function() {
			var self = this;

			_.each(self.device_subscriptions.devices, function(devsub) {
				console.log(devsub);
				var frame = $('.slider-frame[data-device-registration-id="{0}"]'.format(devsub.registration_id));
				var slider = frame.find('.slider-button');

				var devsub_tile = $('.devsub-device[data-device-registration-id="{0}"]'.format(devsub.registration_id));

				// Check if the device plan matches the current plan
				if(devsub.plan_id === self.user_plans.plan_id) {
					frame.addClass('on');
					slider.addClass('on');

					devsub_tile.find('.devsub-plan.old').hide();
				}
				else {
					devsub_tile.find('.devsub-plan.new').hide();
				}

				//self.stored_devsubs.push(devsub.registration_id);
			});

		},

		normalizeThumbnailsProtocol: function() {
			var self = this;
			_.each(self.devices, function(device, idx) {
				self.devices[idx]['snaps_url'] = self.
					normalizeLinkProtocol(device['snaps_url']);
			});
		},

		formatDate: function(plan_date) {
			date = new Date(plan_date);

			var exp_date = date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear();
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth()+1; //January is 0!
			var yyyy = today.getFullYear();

			if(dd<10) {
			    dd='0'+dd
			} 

			if(mm<10) {
			    mm='0'+mm
			} 

			today = mm+'/'+dd+'/'+yyyy;

			var date1 = new Date(today);
			var date2 = new Date(exp_date);
			var timeDiff = Math.abs(date2.getTime() - date1.getTime());
			var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
			
			return diffDays;
		},

		
	});
	
	return view;
	
});


