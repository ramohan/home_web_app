
define('views/timeline/GlobalTimelineView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');	
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');
	var moment         = require('moment');
	var timeline       = require('timeline');
	var VideoPlayer    = require('video_player');
	var PaginatorView  = require('views/layout/PaginatorView');

	var GlobalTimelineView = Backbone.View.extend({
		el: '#page_view',
	
		template: TemplateLoader.get('timeline/GlobalTimeline'),

		// Hard coding the width of event items here for now. As new cameras 
		// with different aspect ratios come up, I'm not sure what sort of logic
		// may determine this value
		event_picture_width: 385,

		// This is set when the user filters to events using the "Before" 
		// buttons
		selected_before_time: '24-hours',

		timeline_events: [],

		// This array is populated as the timeline data is build for the plugin
		// After the page is rendered, swfobjects are created from this array
		// for all detected files
		timeline_videos: [],
		
		events: {
			'click .get-events':  'reloadEvents',
		},

		initialize: function(options) {
		},

		// This view uses the run method here to workaround the problem that 
		// PaginatorView will leave it's event listeners on the pagelink 
		// elements, which causes a problem if multiple views use PaginatorView
		// in one session. The addition to run() and close() to the view which
		// has PaginatorView as a subview prevents issues but does feel a bit 
		// messy.
		run: function() {
			var self = this;

			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_globaltimeline'));
			breadcrumbs.render();
			self.setActiveNavButton('timeline');


			self.lockScreenForLoading();
			// Generate page links for navigating device events
			self.paginator = new PaginatorView({
				'page_size': cfg.get('GLOBAL_TIMELINE_EVENTS_PER_PAGE'),
				'element': '#event_pagelinks',
				'set_page': function(new_page) {
					// Global
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
			data.lang = lang;
			self.$el.html(_.template(self.template, data));
			self.buildTimeline(self.timeline_events);
			self.activateTimelineVideos();
			self.paginator.render();
			//self.activateTimelineVideosJwPlayer();
			//self.activateTimelineVideosSwfObject();
			self.unlockScreenForLoading();
		},

		close: function() {
			var self = this;
			self.paginator.close();
		},

		// Event Handlers

		reloadEvents: function(event) {
			var self = this;
			var timespan = $(event.target).attr('data-time-period');
			self.lockScreenForLoading();
			self.loadEvents(1, timespan);
		},

		// Helpers

		getBeforeTime: function(timespan) {
			//2013-12-20 20:10:18 (yyyy-MM-dd HH:mm:ss)
			var now = moment();
			if (timespan == '1-hour') {
				now = now.subtract('hours', 1);
			} else if (timespan == '3-hours') {
				now = now.subtract('hours', 3);
			} else if (timespan == '24-hours') {
				now = now.subtract('hours', 24);
			} else if (timespan == '14-days') {
				now = now.subtract('days', 14);
			} else if (timespan == '30-days') {
				now = now.subtract('days', 30);
			} else {
				now = now.subtract('years', 80);
			}
			if (cfg.get('DEBUG_MODE')) {
				console.log("Getting events from {0}".
					format(now.format(cfg.get('MOMENT_FORMAT_FOR_API'))));
			}
			return now.format(cfg.get('MOMENT_FORMAT_FOR_API'));
		},

		loadEvents: function(page_number, timespan) {
			var self = this;
			var params = {};
			self.timeline_videos = [];

			if (cfg.get('DEBUG_MODE')) {
				console.log("Loading device events page {0}".format(page_number));
			}

			//params.before_start_time = self.getBeforeTime(timespan);
			params.page = page_number;
			params.size = cfg.get('GLOBAL_TIMELINE_EVENTS_PER_PAGE');

			HubbleAPI.call('GET_GLOBAL_EVENTS', params, function(response) {
				self.paginator.setTotalItems(response.data.total_events);
				self.timeline_events = response.data.events;
				self.render();
			});
		},

		activateTimelineVideos: function() {
			var self = this;

			var width = self.event_picture_width;
			var options = {
				width: width,
				height: self.getHeightFromWidth16x9(width)
			};

			_.each(self.timeline_videos, function(vid) {
				options['file'] = vid['url'],
				options['image'] = vid['image']
				options['target'] = vid['id'];

				var player = new VideoPlayer(options);
				player.init();
			});			
			
			_.each(self.timeline_videos, function(vid) {
				
			});
		},

		activateTimelineVideosJwPlayer: function() {
			var self = this;
			jwplayer.key = cfg.get('JWPLAYER_LICENSE_KEY');

			var config = {
				autostart: 'false',
				width: self.event_picture_width,
				height: self.getHeightFromWidth16x9(self.event_picture_width),
				stretching: 'exactfit',
				hideLogo: true
			};

			_.each(self.timeline_videos, function(vid) {
				config['file'] = vid['url'];
				config['image'] = vid['image'];
				try	{
					jwplayer(vid['id']).setup(config);
				} catch(err) {
					console.log("Sometimes jwplayer.setup() is not a function.");
					console.log("If it's not a function, what is it?");
					console.log(vid['id']);
					console.log(jwplayer);

				}
			});


		},

		getHeightFromWidth16x9: function(width) {
			// basic 16x9 formula: width / height = 1.77
			// width / 1.77 = height
			return Math.round(width / 1.77);
		},


		buildTimeline: function(timeline_events) {
			var self = this;

			var events = [];
			_.each(timeline_events, function(event) {
				var content = event['alert_name'];
				var width = self.event_picture_width;
				var height = self.getHeightFromWidth16x9(width);
				var title = lang.t('camevents_{0}'.format(event['alert_name']));
				var tstamp = moment(event.time_stamp).format('h:mm A');
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

						var height = self.getHeightFromWidth16x9(width);
						var size = "width: {0}px; height: {1}px;".
							format(width, height);
					
						var image = '<a href="{0}" target="_blank"><img src="{0}" style="{1}" alt="{2}"></a>'.
							format(item['image'], size, event['alert_name']);

						if (item['file'] !== undefined && item['file'] != '') {
							var id = 'vid_{0}{1}'.format(index, event['id']);
							content = '<div id="{0}">{1}</div>'.
								format(id, image);
							self.timeline_videos.push({
								url:   item['file'],
								image: item['image'],
								id:    id
							});

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

			var timeline = new Timeline($('#global_timeline'), events);
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
		}
	});
	
	return GlobalTimelineView;
	
});


