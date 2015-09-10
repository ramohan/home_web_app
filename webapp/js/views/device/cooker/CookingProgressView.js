
define('views/device/cooker/CookingProgressView', function(require) {
	var $                   = require('jquery');
	//var jquery_ui           = require('jquery_ui');
	var underscore          = require('underscore');
	var cfg                 = require('hubble_config');
	var global              = require('global');
	var Backbone            = require('backbone');	
	var HubbleAPI           = require('hubble_api');
	var TemplateLoader      = require('template_loader');
	var breadcrumbs         = require('views/layout/BreadcrumbsView');
	var jquery_countdown    = require('lib/countdown/jquery.countdown');

	
	var CookingProgressView = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('device/cooker/CookingPage'),
		
		// Device ID, passed from URL splat and used to load device details
		id: null,

		// Device details, loaded from API or cache built on device list		
		device: null,

		events: {
			'click #stop_cooking': 'stopCurrentProgram',

		},
		
		/**
		 * The DeviceDetailsView has already loaded device and events data
		 * for this view.
		 */
		initialize: function(options) {
			console.log("initialize()");

			var self = this;
			self.requireOptions(options, 'CookingProgressView', [
				'registration_id', 'CookerModel', 'detailsView']);

			self.id = options.registration_id;
			self.device = options.CookerModel;

			// just taking this in to pass it back to CookerDetailsView
			// when cooking is finished.
			self.detailsView = options.detailsView;
			
			self.start_program = options.start_program;

			self.delay_hour = options.delay_hour;
			self.delay_min = options.delay_min;

			self.recipe_url = options.recipe_url;
			
			breadcrumbs.reset();
			breadcrumbs.add('Dashboard', '#devices');
			breadcrumbs.add(self.device.get('name') + " - Cooking");
			breadcrumbs.render();


			self.startOrTrackProgram();
		},

		startOrTrackProgram: function() {
			console.log("startOrTrackProgram()");
			var self = this;
			self.checkStatus();

			if (self.delay_hour != 0 || self.delay_min != 0) {
				self.scheduledStartProgram();
			
			} else if (self.recipe_url !== undefined) {
				self.start3rdPartyRecipe();

			} else {
				self.startProgram();
			}

		},

		synchTimeWithCooker: function() {
			console.log("synchTimeWithCooker()");
			var self = this;
			var date = new Date();
			var datestr = "{0}/{1}/{2} {3}:{4}:{5}".format(date.getMonth(), 
				date.getDay(), date.getFullYear(), date.getHours(),
				date.getMinutes(), date.getSeconds());

			HubbleAPI.call('SET_COOKER_CLOCK', {
					registration_id: self.id,
					date_time: datestr
				}, function(response) {

				}
			);

		},

		scheduledStartProgram: function() {
			console.log("scheduledStartProgram()");
			var self = this;

			self.synchTimeWithCooker();

			HubbleAPI.call('SCHEDULE_RECIPE', {
					registration_id: self.id,
					program_code: self.start_program,
					delay_hour: self.delay_hour,
					delay_min: self.delay_min
				},
				function(response) {
					self.startCountdownTimer();
					$('#stop_cooking').show();
				}
			);
		},

		start3rdPartyRecipe: function() {
			var self = this;
			self.synchTimeWithCooker();

			HubbleAPI.call('COOK_3RDPARTY_RECIPE', {
					registration_id: self.id,
					recipe_url: self.recipe_url
				}, function(response) {
					$('#countdown').html("Recipe in progress...");
					//self.startCountdownTimer();
					$('#stop_cooking').show();
				}, function(response) {
					$('#countdown').html("This recipe is not supported.");
					$('#stop_cooking').html('Return').show();


				}
			);
		},

		startProgram: function() {
			console.log("startProgram()");
			var self = this;

			$('.cooker_countdown').html("Sending command to cooker...");
			$('#stop_cooking').hide();

			HubbleAPI.call('START_COOKING', {
					registration_id: self.id,
					program_code: self.start_program
				}, function(response) {
					console.log("start_cooking complete. Begin progress bar" + 
						" and countdown timer.");
					self.startCountdownTimer();
					$('#stop_cooking').show();

				}
			);
		},

		trackProgram: function() {

		},


		startCountdownTimer: function() {
			console.log("startCountDownTimer()");
			var self = this;
			var until = self.device.getRecipeDuration(self.start_program);
			console.log("until:");
			console.log(until);
			$('#countdown').countdown({until: until});

		},

		// Tells the cooker to stop the current cooking program and returns with
		// the view listing recipes.
		stopCurrentProgram: function() {
			console.log("stopCurrentProgram()");
			var self = this;
			HubbleAPI.call('CANCEL_COOKING_JOBS', {registration_id:self.id}, 
				function(response) {
					self.backToRecipes();
				}
			);
		},

		backToRecipes: function() {
			console.log("backToRecipes()");
			var self = this;
			self.detailsView.render();
		},

		
		// Continually check the cookers status. Not sure what this returns 
		// exactly
		checkStatus: function() {
			console.log("checkStatus()");
			var self = this;
			HubbleAPI.call('COOKER_STATUS', {registration_id: self.id}, 
				function(response) {
			
				},
				function(error) {
					console.log("Status error");
					console.log(error);

				}
			);
		
		},

		render: function() {
			console.log("render()");
			var self = this;
			var data = {};
			data.device = self.device;
			
			self.$el.html(_.template(self.template, data));
			
			if (self.start_program !== undefined) {
				self.$el.find('.select_program').hide();
				self.$el.find('[data-program-code="' + self.start_program + '"]').
					addClass('active').show()
					.prop('disabled', true);
			}
			
			//self.addWidgets(self.device);
			
			return this;
		}

	});
	
	return CookingProgressView;
});


