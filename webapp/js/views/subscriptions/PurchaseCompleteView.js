
define('views/subscriptions/PurchaseCompleteView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');	
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var Subscriptions  = require('hubble/subscriptions');

	var view = Backbone.View.extend({
		el: '#page_view',
	
		template: TemplateLoader.get('subscriptions/PurchaseComplete'),

		events: {
			'click .apply-plan': 'goToDeviceSubscriptions',
		},
		
		initialize: function(options) {
			var self = this;

			self.subs = new Subscriptions({
				load: ['user_plans'],
				callback: function(subs_data) {
					self.render();
				}
			})
		},
		
		render: function() {
			var self = this;
			var data = {};
			data.lang = lang;

			data.is_error = (document.URL.indexOf('error') > 0) ? true : false;

			data.user_pending_plan = false;
			data.contact_support_message = false;
			
			if (data.is_error) {
				data.message = lang.t('purchaseconfirm_message_error');
				data.undermessage = lang.t('purchaseconfirm_undermessage_error');
				$('.purchasecomplete-applyplan').hide();
			} else {
				var plans = self.subs.getCurrentPlan();
				var plan = plans.active_plan;
				var pending_plan = plans.pending_plan;

				if(pending_plan) {
					data.user_pending_plan = true;

					var cur_plan_expire = self.formatDate(plan.expires_at);

					if(cur_plan_expire >= 31) {
						data.contact_support_message = true;
					}

					data.pending_message = lang.t('purchaseconfirm_pending_plan', {
						pending_plan_name: lang.t('plans_{0}_title'.format(pending_plan.plan_id)),
						cur_plan_expire: cur_plan_expire,
					});
				}

				data.message = lang.t('purchaseconfirm_message');
				if (data.is_mobile) {
					$('.purchaseconfirm-undermessage').hide();
				} else {
					data.undermessage = lang.t('purchaseconfirm_undermessage');
				}
			}

			self.$el.html(_.template(self.template, data));

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_myaccount'), '#myaccount');
			breadcrumbs.add(lang.t('crumb_subscriptions'), '#subscriptions');
			//breadcrumbs.add(lang.t('crumb_devsub'), '#devicesubscriptions');
			breadcrumbs.add(lang.t('crumb_billinginfo'), '#billing');
			breadcrumbs.add(lang.t('crumb_purchasecomplete', '#purchasecomplete'),
				'#purchasecomplete');
			breadcrumbs.render();

			// Fade in the View after done rendering
			self.$el.fadeIn('fast');
		},


		// Event Handlers

		goToDeviceSubscriptions: function(event) {
			event.preventDefault();
			var self = this;

			// Trigger Page Transition animation
			Backbone.trigger('page-transition', this.$el);

			window.location.replace('/#devicesubscriptions');
		},

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


