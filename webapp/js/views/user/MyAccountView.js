
define('views/user/MyAccountView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var Subscriptions  = require('hubble/subscriptions');
	var UserPrefs  = require('user_prefs');

	var view = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('user/MyAccount'),

		events: {
			'click .shined_up_call_to_action': 'goToSubscriptions',
			'click .reactivate-plan': 'reactivePlan',
			'click .change-plan': 'goToSubscriptions',
			'click .apply-plan': 'goToDeviceSubscriptions',
			'click .user-settings': 'goToSettings',
			'click .update-billing': 'goToUpdateBilling',
		},

		initialize: function(options) {
			var self = this;
			self.setActiveNavButton('settings');

			self.subs = new Subscriptions({
				load: ['user_plans'],
				callback: function(subs_data) {
					self.render();
				}
			});
		},

		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;
      data.recurly_token = UserPrefs.get('recurly_token');

			data.user_has_plan = self.subs.userHasPlan();

			data.user_pending_plan = false;

			if (data.user_has_plan) {
				var plans = self.subs.getCurrentPlan();
				user_plan = plans;

				var plan = plans.active_plan;
				var pending_plan = plans.pending_plan;

				data.plan_status = 'active';
				data.subs_message = data.subs_message = lang.t('myaccount_subscriptions', {
					plan_name: lang.t('plans_{0}_title'.format(plan.plan_id))
				});

				if(data.user_has_plan === 'expired') {
					data.subs_message = lang.t('myaccount_expired');
					data.plan_status = false;
				} else if(data.user_has_plan === 'canceled') {
					data.plan_status = 'canceled';

					//data.subs_message = lang.t('myaccount_canceled');

					var canceled_plan = plans.canceled_plan;

					var cur_plan_expire = self.formatDate(canceled_plan.expires_at);

					data.subs_message = lang.t('myaccount_canceled_plan', {
							canceled_plan_name: lang.t('plans_{0}_title'.format(canceled_plan.plan_id)),
							cur_plan_expire: cur_plan_expire
						});

				} else {
					if(pending_plan) {
						data.user_pending_plan = true;
						data.contact_support_message = false;

						var cur_plan_expire = self.formatDate(plan.expires_at);

						if(cur_plan_expire >= 31) {
							data.contact_support_message = true;
						}

						data.pending_message = lang.t('myaccount_pending_plan', {
							pending_plan_name: lang.t('plans_{0}_title'.format(pending_plan.plan_id)),
							cur_plan_expire: cur_plan_expire
						});
					}
				}
			} else {
				data.subs_message = lang.t('myaccount_subscriptions_nosubsyet');
			}

			self.$el.html(_.template(self.template, data));

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_myaccount'), '#myaccount');
			breadcrumbs.render();

			// Fade in the View after done rendering
			self.$el.fadeIn('fast');
		},


		// Event Handlers

		goToSubscriptions: function(event) {
			event.preventDefault();
			var self = this;

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			window.location.replace('/#subscriptions');
		},

		goToDeviceSubscriptions: function(event) {
			event.preventDefault();
			var self = this;

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			window.location.replace('/#devicesubscriptions');
		},

		goToUpdateBilling: function(event) {
			event.preventDefault();
			var self = this;

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			window.location.replace('/#updatebilling');
		},

		goToSettings: function(event) {
			event.preventDefault();
			var self = this;

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			window.location.replace('/#settings');
		},

		reactivePlan: function(event) {
			event.preventDefault();

			reactivatePlanBtn = event.currentTarget.className;

			if(reactivatePlanBtn.indexOf('processing',0) === -1) {

				var self = this;
				var canceled_plan = {};

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
			}
		},

		// close: function() {
		// 	var self = this;
		// 	self.unbind();
		// 	self.remove();
		// 	$('#content_row').prepend('<div id="page_view"></div>');
		// },

		// Helpers

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


