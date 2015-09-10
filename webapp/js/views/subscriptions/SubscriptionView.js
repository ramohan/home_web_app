
define('views/subscriptions/SubscriptionView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var recurly        = require('recurly');
	var UserPrefs      = require('user_prefs');
	var Subscriptions  = require('hubble/subscriptions');
	var SessionManager = require('session_manager');

	// Placing this here ensures it runs once even if the user causes this
	// module to be run multiple times.
  recurly.configure(cfg.get('RECURLY_TOKEN'));

	var view = Backbone.View.extend({

		// Flgs used to render the page only after all ajax data is loaded
		userinfo_done: false,
		planinfo_done: false,

		user_plans: {},
		all_plans: {},

		// This module works as a standalone page (when the user is sent
		// here from the mobile app) and when the user is already logged
		// into the webapp. When it is accessed as a standalone page,
		// the api_key is specified in the url and stored here.
		api_key: null,

		el: '#page_view',

		template: TemplateLoader.get('subscriptions/Subscription'),

		events: {
			'click .plan-gobutton:not(.highlight)': 'chooseSubscription',
			'click .gobutton-text:not(.highlight)': 'chooseSubscription',
			'click .cancelsub': 'cancelSubscription',
		},

		initialize: function(options) {
			var self = this;

			self.api_key = options.api_key ? options.api_key : UserPrefs.
				get('API_KEY');
			if (!self.api_key) {
				self.api_key = SessionManager.getActiveAuthToken();
			}

			UserPrefs.set('API_KEY', self.api_key);
			self.setActiveNavButton('settings');

			self.subs = new Subscriptions({
				api_key: self.api_key,
				load: ['user_plans', 'all_plans', 'devices'],
				callback: function(mah_datas) {
					self.user_plans = mah_datas.user_plans;
					self.all_plans  = mah_datas.all_plans;
					self.render();
				}
			});
		},

		render: function() {
			var self = this;
			var data = {};

			data.user_pending_plan = false;
			data.has_annual_plan = false;
			data.user_has_plan = self.subs.userHasActivePlan();

			// Check if User Has any Pending plans
			if(data.user_has_plan) {
				var user_plans = self.subs.getCurrentPlan();
				var activeplan = user_plans.active_plan;
				var pending_plan = user_plans.pending_plan;

				data.cur_plan = activeplan;

				if(pending_plan) {
					data.user_pending_plan = true;
					data.pending_message = lang.t('subs_pending_plan', {
						pending_plan_name: lang.t('plans_{0}_title'.format(pending_plan.plan_id)),
						cur_plan_expire: self.formatDate(activeplan.expires_at)
					});
				}

				// Check for annual plan
				if(activeplan.plan_id.indexOf('-yearly', 0) > -1) {
					data.has_annual_plan = true;
					data.annual_plan_sub = lang.t('subs_annual_plan', {
						annual_plan: lang.t('plans_{0}_title'.format(activeplan.plan_id)),
					});
				}
			}

			data.lang = lang;
			data.all_plans = self.removeSomePlans(self.all_plans);
			data.all_plans = self.highlightPlan(data.all_plans);

			self.$el.html(_.template(self.template, data));

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_myaccount'), '#myaccount');
			if (data.user_has_plan) {
				breadcrumbs.add(lang.t('crumb_subscriptions'),
					'#subscriptions/{0}'.format(self.api_key));
			} else {
				breadcrumbs.add(lang.t('crumb_chooseplan'), '#subscriptions');
			}
			breadcrumbs.render();

			// Fade in the View after done rendering
			self.$el.fadeIn('fast');
		},


		// Event Handlers

		chooseSubscription: function(event) {
			event.preventDefault();
			var self = this;
			var plan = $(event.target).attr('data-plan');

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			// If this is a first time subscription, user will be sent to
			// billing info view, which will acquire a recurly token, save it
			// to userprefs RECURLY_TOKEN, and send user back to this view
			// to complete sign up. This view (instead of billing info view)
			// handles the actual subscription-plan changes in that situation
			// because it also handles them when the user already has a plan.
			UserPrefs.set('CHOOSING_PLAN', plan);

			return window.location.replace('/#billing');

		},

		cancelSubscription: function(event) {
			event.preventDefault();

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			return window.location.replace('/#cancelconfirmation');
		},

		// Helpers

		// Choose a plan to add a property "highlight = true" so the template
		// will feature it. If user has an active plan, highlight that one,
		// otherwise highlight the 7 day plan.
		highlightPlan: function(plans) {
			var self = this;
			var new_plans = [];
			var user_plans = self.subs.getCurrentPlan();
			var activeplan = user_plans.active_plan;

			var has_active_plan = false;

			if(!activeplan) {
				has_active_plan = false;
			} else if (activeplan.state == 'active') {
				has_active_plan = true;
			} else {
				has_active_plan = false;
			}

			_.each(plans, function(plan) {

				plan.is_active = false;
				if (activeplan) {
					if (activeplan.plan_id == plan.name &&
						activeplan.state == 'active') {
						plan.active = true;
						plan.highlight = true;
					}
				}

				new_plans.push(plan);
			});

			return new_plans;
		},

		// Returns the array of plans with entries removed which should not
		// be displayed, such as yearly plans.
		removeSomePlans: function(plans) {
			var new_plans = [];
			_.each(plans, function(plan) {
				if (plan.name.indexOf('yearly') > 0) {
					return;
				}

				new_plans.push(plan);
			});
			return new_plans;
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


