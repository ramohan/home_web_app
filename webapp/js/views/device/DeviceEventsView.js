
define('views/device/DeviceEventsView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');	
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var PaginatorView  = require('views/layout/PaginatorView');
	var moment         = require('moment');
	var timeline       = require('timeline');
	var VideoPlayer    = require('video_player');
	var lang           = require('hubble_lang');
	var UserPrefs      = require('user_prefs');
	
	var DeviceEventsView = Backbone.View.extend({
		el: '#page_view',

		// This is set as a variable in order to render maximize the 
		// events_timeline.
		render_target: '#events_timeline',
	
		// template depends on device type
		template: null,
		
		device_events: {},

		// This is set when the user filters to events using the "Before" 
		// buttons
		selected_before_time: '1-hour',

		// Hard coding the width of event items here for now. As new cameras 
		// with different aspect ratios come up, I'm not sure what sort of logic
		// may determine this value
		// If changing this value, the other place it must be changed is in
		// layout.css.
		event_picture_width: 305,


		events: {
			'click .get-events':  'reloadEvents',
			'click .toggle-size':  'toggleSize',
			'click .activate-motion-event': 'activateMotionEvent',
		},

		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'DeviceEventsView', 
				['CameraModel', 'registration_id']);
			
			self.id = options.registration_id;
			self.camera = options.CameraModel;
			
			// TODO: Add option for device type, as events timeline may look
			// different for cookers and whatnot
			self.template = TemplateLoader.get('device/camera/eventsTimeline');

			self.lockScreenForLoading();

			// Generate page links for navigating device events
			self.paginator = new PaginatorView({
				'page_size': cfg.get('DEVICE_DETAILS_EVENTS_PER_PAGE'),
				'element': '#event_pagelinks',
				'set_page': function(new_page) {
					// device
					// paginator needs to tell this view what the new page is,
					// so it can set the new page in the query
					self.loadEvents(new_page, self.selected_before_time);
					
					// just re render this view when the new page has loaded
					self.onEventsLoad = self.render;
				}
			});
			
			self.loadEvents(1, self.selected_before_time);
		},
		
		
		render: function() {
			var self = this;
			var data = {};

			data.device_events = self.device_events;
			self.el = $(self.render_target);
			self.el.html(_.template(self.template, data));

			if (self.device_events.length == 0) {
				$('.timeline-tab').removeClass('active').hide();
				$('#timeline').hide();
				$('.controls-tab').addClass('active');
				$('#controls').show();
			}

			self.unlockScreenForLoading();
			self.paginator.render();
			return this;
		},

		// Event Handlers

		activateMotionEvent: function(event) {
			var self = this;
			var eventid = $(event.target).attr('data-event-id');
			// This event handler is fired by multiple dom elements. Find the
			// eventid when it isn't present on the event target
			eventid = parseInt(eventid);
			
			var width = self.event_picture_width;
			var options = {
				width:     width,
				height:    self.camera.getHeightFromWidth16x9(width),
				autostart: true
			};

			var vid = self.timeline_videos[eventid];

			options['file'] = vid['url'],
			options['image'] = vid['image']
			options['target'] = vid['id'];

			var player = new VideoPlayer(options);
			player.init();
		},

		toggleSize: function(event) {
			var self = this;
			event.preventDefault();

			if (self.render_target == '#events_timeline') {
				self.render_target = '#page_view';
				self.render();
				$('.glyphicon-resize-full').removeClass('glyphicon-resize-full').
					addClass('glyphicon-resize-small');
			} else {
				window.location.reload(false);
			}
		},

		reloadEvents: function(event) {
			var self = this;
			var timespan = $(event.target).attr('data-time-period');
			self.selected_before_time = timespan;
			self.loadEvents(1, timespan);
		},

		// Helpers

		loadEvents: function(page_number, timespan) {
			var self = this;
			var params = {};
			self.timeline_videos = {};
			
			if (cfg.get('DEBUG_MODE')) {
				console.log("Loading device events page {0}".
					format(page_number));
			}

			params.registration_id = self.id;
			params.page = page_number;
			params.size = cfg.get('DEVICE_DETAILS_EVENTS_PER_PAGE');

			var tempformat = 'C';
			if (!UserPrefs.get('TEMP_FORMAT_CELSIUS')) {
				tempformat = 'F';
			}
		
			HubbleAPI.call('GET_DEVICE_EVENTS', params, function(response) {
				self.paginator.setTotalItems(response.data.total_events);
				_.each(response.data.events, function(event, idx) {

					// Here we're making sure that if the page uses https, the
					// resource links also use https. The try-catch is used
					// as a syntax succinct way of handling the fact that not
					// all events have "data[0]" in them
					try {
						event.thumbnail = self.
							normalizeLinkProtocol(event.data[0].image);

						event.video = self.
							normalizeLinkProtocol(event.data[0].file);

						event.data = undefined;
						response.data.events[idx] = event;

						self.timeline_videos[event.id] = {
							url:   event.video,
							image: event.thumbnail,
							id:    'vid_{0}'.format(event.id)
						};


					} catch(err) {

					}

					if (event.alert_name.indexOf('temperature detected') > -1) {
						event.value = self.getTempDisplayValue(event.value);
						event.tempformat = tempformat;
						event.type = 'temperature';
						if (event.alert_name.indexOf('high') > -1) {
							event.temptype = 'high';
						} else {
							event.temptype = 'low';
						}
					} else if (event.alert_name.indexOf('sound') > -1) {
						event.type = 'sound';
					} else if (event.alert_name.indexOf('motion') > -1) {
						event.type = 'motion';
					}

					var title = lang.t('camevents_{0}'.
						format(event.alert_name), {
							value: event.value,
							format: tempformat
						});
					//title = title.toLowerCase();
					event.title = title;
					event.timeofday = moment(event.time_stamp).format('hh:mm A');
					event.date = moment(event.time_stamp).format('MMM D YYYY');
					response.data.events[idx] = event;

				});


				self.device_events = response.data.events;
				self.render();
			});
		},

		activateTimelineVideos: function() {
			var self = this;

			var width = self.event_picture_width;
			var options = {
				width: width,
				height: self.camera.getHeightFromWidth16x9(width)
			};

			_.each(self.timeline_videos, function(vid) {
				options['file'] = vid['url'],
				options['image'] = vid['image']
				options['target'] = vid['id'];

				var player = new VideoPlayer(options);
				player.init();
			});
		},

		renderVerticalTimeline: function() {
			var self = this;
			
			var events = [];

			_.each(self.device_events, function(event, idx) {
				var content = event['alert_name'];
				var width = self.event_picture_width;
				var height = self.camera.getHeightFromWidth(width);
				var size = "width: {0}px; height: {1}px;".
					format(width, height);
				var title = lang.t('camevents_{0}'.format(event['alert_name']));
				var tstamp = moment(event.time_stamp).format('hh:mm A');
				title = title.toLowerCase();
				title = "{1} - {0}".format(title, tstamp);
				content = '';

				if (event['data'] === undefined) {
					return;
				}

				if (event['alert_name'].indexOf('temperature') > 0) {
					var format = 'C';
					if (event['value'] > 50) {
						format = 'F';
					}
					title = lang.t('camevents_{0}'.format(event['alert_name']), {
								temp: event['value'],
								format: format
							});
					title = "{1} - {0}".format(title, tstamp);				
				}
				
				try {
					_.each(event['data'], function(item, index) {
						if (index > 0) {
							// Not sure why, but event data seems to return
							// some unplayable videos for some motion 
							// detection events. Skipping these for now (any
							// after the first), possibly never to be used
							return;
						}

						

						item['file'] = self.normalizeLinkProtocol(item['file']);
						item['image'] = self.normalizeLinkProtocol(item['image']);

						height = self.camera.getHeightFromWidth16x9(width);
						size = "width: {0}px; height: {1}px;".
							format(width, height);
					

						var image = '<a href="{0}" target="_blank"><img src="{0}" style="{1}" alt="{2}"></a>'.
							format(item['image'], size, event['alert_name']);

						if (item['file'] !== undefined && item['file'] != '') {
							var id = 'vid_{0}{1}'.format(index, event['id']);
							content = '<div id="{0}">{1}</div>'.
								format(id, image);
							title = '<a class="pull-left timeline-videodownload" href="{0}"><span class="glyphicon glyphicon-download"></span></a> {1}'.
								format(item['file'], title);
						} else {
							content = image;
						}
					});

				} catch (e) {
					// Nothing to do here, we're just watching errors 
					// resulting from trying to access data from a hash that
					// might not exist
				}

				events.push({
					type:  'blog_post',
					date:  event['time_stamp'],
					title: title,
					content: content,
					readmore: null
				});
			});

			var timeline = new Timeline($('#events_timeline'), events);
			timeline.setOptions({
				animation: true,
				lightbox: true,
				showMonth: true,
				allowDelete: false,
				separator: null,
				columnMode: 'dual',
				order: 'desc',
			});

			timeline.display();
		},
	});
	
	return DeviceEventsView;
		
});

