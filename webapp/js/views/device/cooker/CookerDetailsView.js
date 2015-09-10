
define('views/device/cooker/CookerDetailsView', function(require) {
	var $                   = require('jquery');
	//var jquery_ui           = require('jquery_ui');
	var underscore          = require('underscore');
	var cfg                 = require('hubble_config');
	var global              = require('global');
	var Backbone            = require('backbone');	
	var HubbleAPI           = require('hubble_api');
	var TemplateLoader      = require('template_loader');
	var breadcrumbs         = require('views/layout/BreadcrumbsView');
	var CookingProgressView = require('views/device/cooker/CookingProgressView');
	
	var CookerDetailsView = Backbone.View.extend({
		el: '#page_view',

		template: TemplateLoader.get('device/cooker/DeviceDetails'),
		
		// Device ID, passed from URL splat and used to load device details
		id: null,

		// Device details, loaded from API or cache built on device list		
		device: null,
		
		progress_view: null,
		
		events: {
			'click .select_program': 'startProgram',
		},
	
		/**
		 * The DeviceDetailsView has already loaded device and events data
		 * for this view.
		 */
		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'CookerDetailsView', [
				'registration_id', 'deviceModel', 'eventsView']);

			self.id = options.registration_id;
			self.deviceEventsView = options.eventsView;
			self.device = options.deviceModel;			
		},
		
		startProgram: function(event) {
			console.log("running startProgram");
			var self = this;
			var name = $(event.target).attr('data-recipe-name');
			console.log(name);
			var id = $(event.target).attr('data-recipe-id');
			console.log(id);
			var program_code = $(event.target).attr('data-program-code');
			console.log(program_code);

			var delay_hour = $('input[name="cook_hour"]').val();
			var delay_min = $('input[name="cook_minute"]').val();
			console.log("delay values");
			console.log(delay_hour);
			console.log(delay_min);
			
			var view = new CookingProgressView({
				registration_id: self.id,
				start_program: program_code,
				CookerModel: self.device,
				detailsView: self,
				delay_hour: delay_hour,
				delay_min: delay_min
			});
			view.render();
		
		},

		addCookerControlWidgets: function(device) {
			
			$('input[name=finish_hour]').spinner({
				spin: function(event, ui) {
					if (ui.value > 23) {
						$(this).spinner('value', 0);
						return false;
					}
					if (ui.value < 0) {
						$(this).spinner('value', 23);
						return false;
					}
				}
			});
			$('input[name=finish_minute]').spinner({
				spin: function(event, ui) {
					if (ui.value > 59) {
						$(this).spinner('value', 0);
						return false;
					}
					if (ui.value < 0) {
						$(this).spinner('value', 59);
						return false;
					}
				}
			});
			$('input[name=cook_hour]').spinner({
				spin: function(event, ui) {
					if (ui.value > 23) {
						$(this).spinner('value', 0);
						return false;
					}
					if (ui.value < 0) {
						$(this).spinner('value', 23);
						return false;
					}
				}
			});
			$('input[name=cook_minute]').spinner({
				spin: function(event, ui) {
					if (ui.value > 59) {
						$(this).spinner('value', 0);
						return false;
					}
					if (ui.value < 0) {
						$(this).spinner('value', 59);
						return false;
					}
				}
			});
		
		},


		activateAjaysRecipeThing: function() {
			var self = this;

			var recipeParent = document.getElementById("rec-parent");
			var rowDiv = document.createElement("div");
			rowDiv.className = "row";
			var i = 1;
			
			HubbleAPI.call('LIST_RECIPES', {}, function(data) {
				var dataElements = data.data;
				dataElements.forEach(function (value) {
				        
					var recipes = document.createElement('ul');
					recipes.className = 'external-recipes';
					var span3 = document.createElement('li');
					var thumbDiv = document.createElement('div');
					var imgUrl = document.createElement("img");
					var capDiv = document.createElement('div');
					var h4 = document.createElement('h4');

					span3.className = 'col-sm-6 col-md-3';
					thumbDiv.className = 'thumbnail';
					capDiv.className = 'caption';

					h4.innerHTML = value.title;
					var p = document.createElement(p);
					var button = document.createElement('button');
					button.innerHTML = 'Cook This!';
					button.onclick = function () {
						var view = new CookingProgressView({
							registration_id: self.id,
							start_program: 0,
							CookerModel: self.device,
							detailsView: self,
							delay_hour: 0,
							delay_min: 0,
							recipe_url: value.source_url
						});
						view.render();
					};
					imgUrl.setAttribute('src', value.image_url);
					imgUrl.style.height = '150px';
					imgUrl.style.width = '150px';
					var recipeHref = document.createElement('a');
					recipeHref.href = '#';
					recipeHref.setAttribute('data-toggle', 'modal');
					recipeHref.setAttribute('data-target', '#myModal');
					recipeHref.onclick = function(e) {
						e.preventDefault();
						console.log("function called");
						var url = value.source_url;
						console.log(url)
						$(".modal-body").html('<iframe width="100%" height="100%" frameborder="0" allowtransparency="true" src="'+url+'"></iframe>');
						//$(".myModal").show();
					};
					recipeHref.appendChild(imgUrl);
					capDiv.appendChild(h4);
					p.appendChild(button);
					capDiv.appendChild(p);                
					thumbDiv.appendChild(recipeHref);
					thumbDiv.appendChild(capDiv);
					span3.appendChild(thumbDiv);
					recipes.appendChild(span3);
					rowDiv.appendChild(recipes);
					if (i%4 == 0) {
						recipeParent.appendChild(rowDiv);
						rowDiv = document.createElement('div');
						rowDiv.className = 'row';
					} 
					i++;	    
				});
			});
		},

		render: function() {
			var self = this;
			var data = {};
			data.device = self.device;

			//self.setElement($('#page_view'));
			breadcrumbs.reset();
			breadcrumbs.add('Dashboard', '#devices');
			breadcrumbs.add(self.device.get('name'));
			breadcrumbs.render();
			
			self.$el.html(_.template(self.template, data));


			self.addCookerControlWidgets(self.device);
			self.deviceEventsView.render();
			
			self.activateAjaysRecipeThing();

			return this;
		}

	});
	
	return CookerDetailsView;
});


