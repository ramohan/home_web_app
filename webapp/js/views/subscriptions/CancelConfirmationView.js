
define('views/subscriptions/CancelConfirmationView', function(require) {
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
		el: '#page_view',
	
		template: TemplateLoader.get('subscriptions/CancelConfirmation'),

		events: {
			'click .cancel-button': 'cancelPlan',
		},
		
		initialize: function(options) {
			var self = this;
			self.api_key = UserPrefs.get('API_KEY');

			self.subs = new Subscriptions({
				load: ['user_plans'],
				callback: function(sub_data) {
					self.render();
				}
			});
		},
		
		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;
			plans = self.subs.getCurrentPlan();
			data.plan = plans.active_plan;
			self.$el.html(_.template(self.template, data));

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_myaccount'), '#myaccount');
			breadcrumbs.add(lang.t('crumb_subscriptions'), '#subscriptions');
			breadcrumbs.add(lang.t('crumb_cancelsub'), '#cancelsubscription');
			breadcrumbs.render();

			// Fade in the View after done rendering
			self.$el.fadeIn('fast');
		},


		// Event Handlers

		cancelPlan: function(event) {
			event.preventDefault();
			var self = this;

			cancelPlanBtn = event.currentTarget.className;

			if(cancelPlanBtn.indexOf('processing',0) === -1) {

				$('.cancel-button').addClass('processing').text(lang.t('plan_cancel_processing'));

				var plans = self.subs.getCurrentPlan(); 
				var plan = plans.active_plan;

				var params = {};
				if (self.api_key !== null) {
					params['api_key'] = self.api_key;
				}
				params['subscription_uuid'] = plan.subscription_uuid;

				HubbleAPI.call('USER_SUBSCRIPTION_CANCEL', params,
					function(response) {
						//alert('YA BURNT, PLAN');
						console.log('Plan Canceled');

						self.goToMyAccount();
					},
					function(xhr, error, exception) {
						//alert('ow, ya failed bro');
						console.log('Unable to Cancel Plan');
						console.log(error);

						self.goToMyAccount();
					}
				);
			}

		},



		// Helpers
		goToMyAccount: function() {
			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			return window.location.replace('/#myaccount');
		}
		
	});
	
	return view;
	
});


