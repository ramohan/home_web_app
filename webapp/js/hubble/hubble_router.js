
/**
 * hubble_router.js
 * Once the main.js and hubble_main.js bootstrapping is complete, this page
 * decides what views to render. Over the course of development, it will
 * grow and get a bit messy, and then refactoring will happen a bit later
 * to clean up and define what-shows-up-when. For now, think of it as the
 * front controller.
 */

define('hubble_router', function(require) {
	var $                  = require('jquery');
	var _                  = require('underscore');
	var cfg                = require('hubble_config');
	var global             = require('global');
	var Backbone           = require('backbone');
	var SessionManager     = require('session_manager');
	
	// Site features
	var DeviceListView     = require('views/device/DeviceListView');
	var DeviceDetailsView  = require('views/device/DeviceDetailsView');
	var GlobalTimelineView = require('views/timeline/GlobalTimelineView');
	var SharingView        = require('views/sharing/SharingView');

	// User/account management
	var SettingsView       = require('views/user/SettingsView');
	var RegisterView       = require('views/user/RegisterView');
	var LoginView          = require('views/user/LoginView');
	var LogoutView         = require('views/user/LogoutView');
	var ResetPasswordView  = require('views/user/ResetPasswordView');
	var LostPasswordView   = require('views/user/LostPasswordView');
	var DevicePlansView    = require('views/device/plan/DevicePlansView');

	var MyAccountView      = require('views/user/MyAccountView');
	var BillingInfoView    = require('views/subscriptions/BillingInfoView');
	var UpdateBillingInfoView = require('views/subscriptions/UpdateBillingInfoView');
	var SubscriptionView   = require('views/subscriptions/SubscriptionView');

	var DeviceSubscriptionsView = require('views/subscriptions/DeviceSubscriptionsView');
	var CancelConfirmationView = require('views/subscriptions/CancelConfirmationView');
	var PurchaseCompleteView = require('views/subscriptions/PurchaseCompleteView');


	// Common layout pieces
	var HeaderView        = require('views/layout/HeaderView');
	var NavbarView        = require('views/layout/NavbarView');


	var AppRouter = Backbone.Router.extend({
		last_module: null,
	
		initialize: function() {
			var self = this;

			// Force the use of https here
			if (window.location.protocol != "https:" && cfg.get('FORCE_HTTPS')) {
				var url = window.location.href.substring(
					window.location.protocol.length
				)
				//window.location.href = "https:" + url;
			}

			// log any route that is run
			// TODO: Look up what all of the params to this event are. Sometimes
			// null, other times an empty string? 
			this.bind('all', function(route, p1, p2) {
				if (p1 != 'defaultAction' && p1 != '' && p1 !== null) {
					$('body').removeClass().addClass(p1);
					$('html').removeClass().addClass(p1);
				}
				self.last_module = p1;
				if (cfg.get('DEBUG_MODE')) {
					console.log("{0}({1}, {2})".format(route, p1, p2));
				}
			});

			// Add 'page-transition' to event queue.
			this.listenTo( Backbone, 'page-transition', this.animate );
		},

		animate: function(el) {
   			var $el = $(el.selector);

   			console.log('animation trigger');

   			// Fade out current view and display loader.
			$el.fadeOut('fast');			
  		},
	
		routes: {
		//  pattern:                    'handlerFunction',
			login:                      'login',
			logout:                     'logout',
			switchUser:                 'switchUser',
			'resetpassword/:key':       'resetpassword',
			lostpassword:               'lostpassword',
			devices:                    'devices',
			savedVideos:                'savedVideos',
			timeline:                   'timeline',
			sharing:                    'sharing',
			settings:                   'settings',
			'register/:invitation_key': 'register_invite',
			'plans/:api_key':           'plans',
			create_account:             'register',
			

			myaccount:                  'myAccount',
			'billing(/:api_key)':       'billingInfo',
			'updatebilling(/:api_key)': 'updateBillingInfo',
			'subscriptions(/:api_key)': 'subscriptions',
			'devicesubscriptions':      'devicesubscriptions',
			'cancelconfirmation':       'cancelconfirmation',
			'purchasecomplete':         'purchaseComplete',

			// Meant to be disabled in production, but doesn't really matter
			tests:                      'tests',
			
			'device/:id':               'deviceDetails',
			'*actions':                 'defaultAction',
			
			//probably won't be used
			store:        'store',
			support:      'support',
		},
	});

	var initialize = function() {
		var router = new AppRouter;
		
		var navbar = new NavbarView();
		var header = new HeaderView({
			router: router,
			navbar: navbar
		});
		navbar.render();
		
		//var footer = new FooterView();

		var timeline = null;
		var last_device = null;
		var billingInfo = null;
		var updateBillingInfo = null;
		var devicesubscriptions = null;
		var myaccount = null;
		var settings = null;
		var subscriptions = null;
		var cancelsubscriptions = null;
		var purchasecomplete = null;
		
		var killZombie = function(view) {
			view.close();
		}

		// This here is a bit of explicit view destroying to prevent
		// leftover event handlers from the billings info. A better solution
		// would be to have a new object whose job is to create and
		// destroy views between each route.
		var killViews = function() {
			killBillings();
			killUpdateBillings();
			killMyAccount();
			killSettings();
			killDevSubs();
			killSubscriptions();
			killCancelSubscriptions();
			killPurchaseComplete();
			killDeviceDetails();
			killTimeline();
		}

		var killTimeline = function() {
			if (timeline !== null) {
				timeline.close();
				timeline = null;
			}
		}

		var killDeviceDetails = function() {
			if (last_device !== null) {
				last_device.close();
			}
		}

		var killMyAccount = function() {
			if(myaccount !== null) {
				killZombie(myaccount);
			}
		}

		var killSettings = function() {
			if(settings !== null) {
				killZombie(settings);
			}
		}

		var killBillings = function() {
			if(billingInfo !== null) {
				killZombie(billingInfo);
			}
		}

		var killUpdateBillings = function() {
			if(updateBillingInfo !== null) {
				killZombie(updateBillingInfo);
			}
		}

		var killSubscriptions = function() {
			if(subscriptions !== null) {
				killZombie(subscriptions);
			}
		}

		var killCancelSubscriptions = function() {
			if(cancelsubscriptions !== null) {
				killZombie(cancelsubscriptions);
			}
		}

		var killDevSubs = function() {
			if(devicesubscriptions !== null) {
				killZombie(devicesubscriptions);
			}
		}

		var killPurchaseComplete = function() {
			if(purchasecomplete !== null) {
				killZombie(purchasecomplete);
			}	
		}
		
		router.on('route:devices', function() {
			if (!SessionManager.aSessionExists()) {
				return router.navigate('login', { trigger: true })
			}
			// Re render the header to restore the logout button if a logout
			// was cancelled
			header.render();
			navbar.setActive('dashboard');

			killViews();

			return new DeviceListView();
		});
		
		router.on('route:deviceDetails', function(id) {
			if (!SessionManager.aSessionExists()) {
				return router.navigate('login', { trigger: true })
			}
			navbar.setActive('dashboard');

			killViews();
			
			last_device = new DeviceDetailsView({ id: id });
			return last_device;
		});
		
		router.on('route:timeline', function() {
			navbar.setActive('timeline');

			killViews();

			timeline = new GlobalTimelineView();
			return timeline.run();
		});
		
		router.on('route:settings', function() {
			navbar.setActive('settings');

			killViews();

			settings = new SettingsView();

			return settings;
		});

		router.on('route:myAccount', function() {
			navbar.setActive('settings');

			killViews();

			myaccount = new MyAccountView();

			return myaccount;
		});

		router.on('route:subscriptions', function(api_key) {
			navbar.setActive('settings');

			killViews();

			subscriptions = new SubscriptionView({
				api_key: api_key
			});

			return subscriptions;
		});

		router.on('route:billingInfo', function() {
			navbar.setActive('settings');

			killViews();

			billingInfo = new BillingInfoView();
			return billingInfo;
		});

		router.on('route:updateBillingInfo', function() {
			navbar.setActive('settings');

			killViews();

			updateBillingInfo = new UpdateBillingInfoView();
			return updateBillingInfo;
		});

		router.on('route:purchaseComplete', function() {
			navbar.setActive('settings');

			killViews();

			purchasecomplete = new PurchaseCompleteView();

			return purchasecomplete;
		});

		router.on('route:devicesubscriptions', function() {
			navbar.setActive('settings');

			killViews();

			devicesubscriptions = new DeviceSubscriptionsView();

			return devicesubscriptions;
		});

		router.on('route:cancelconfirmation', function() {
			navbar.setActive('settings');

			killViews();
			
			cancelsubscriptions = new CancelConfirmationView();

			return cancelsubscriptions;
		});

		router.on('route:sharing', function() {
			navbar.setActive('sharing');
			return new SharingView();
		});
		
		router.on('route:register_invite', function(invitation_key) {
			return new RegisterView({
				invitation_key: invitation_key
			});
		});
		
		router.on('route:register', function() {
			return new RegisterView();
		});

		router.on('route:login', function() {
			header.render();
			return new LoginView();
		});

		router.on('route:logout', function() {

			killViews();

			return new LogoutView({
				header: header
			});
		});
		
		router.on('route:lostpassword', function() {
			return new LostPasswordView();
		});

		router.on('route:plans', function(api_key) {
			return new DevicePlansView({
				api_key: api_key
			});
		});
		
		router.on('route:resetpassword', function(resetpassword_key) {
			return new ResetPasswordView({
				resetpassword_key: resetpassword_key
			});
		});

		router.on('route:defaultAction', function() {
			if (!SessionManager.aSessionExists()) {
				return router.navigate('login', { trigger: true })
			}
			return router.navigate('devices', { trigger: true });
		});
		
		// Header is explicitly rendered, because it will need to be rendered
		// again each time session status changes
		header.render();
		
		Backbone.history.start();
	};
	
	return {
		initialize: initialize
	};
});

