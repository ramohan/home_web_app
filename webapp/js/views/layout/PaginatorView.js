

define('views/layout/PaginatorView', function(require) {
	var $              = require('jquery');
	var _              = require('underscore');
	var Backbone       = require('backbone');
	var TemplateLoader = require('template_loader');
	var cfg            = require('hubble_config');


	var PaginatorView = Backbone.View.extend({
		el: '#page_view',
		template: TemplateLoader.get('layout/pagelinks'),
		
		first_page: 1,
		last_page: null,
		current_page: null,
		page_size: null,
		total_items: null,
		num_pages: null,
		set_page: function() {},

		events: { 
			'click .next':  'nextLink',
			'click .prev':  'prevlink',
			'click .first': 'firstLink',
			'click .last':  'lastLink',
			// this overly broad selector prevents multiple separate pagelinks
			// on a page. Should fix it. 
			'click ul.pagination a': 'setPage',
		},
		
		initialize: function(options) {
			var self = this;
			self.requireOptions(options, 'PaginatorView', ['element', 
				'page_size', 'set_page']);
				
			self.el = options.element;
			
			self.page_size = options.page_size;
			self.current_page = 1;
			
			// callback to be fired when pagelink is clicked
			self.set_page = options.set_page;
			
			// dev overrides
			self.total_items = 10;
		},
		
		render: function() {
			var self = this;
			var data = {};
			var pages = {};
			for (var i = 1; i <= self.num_pages; i++) {
				pages[i] = i;
			}
			data.current_page = parseInt(self.current_page);
			data.max_pagelinks = parseInt(cfg.get('MAX_PAGELINKS'));
			data.last_page = self.num_pages;
			data.pages = pages;
			
			// We need to set self.$el() here because that dom element
			// did not exist when this view was created
			self.$el = $(self.el);
			self.$el.html(_.template(self.template, data));
			self.$el.find('li').removeClass('active');
			self.$el.find('a:contains("'+self.current_page+'")').first().
				parent().addClass('active');
			//self.bindEvents();				
			return this;
		},

		// Event Handlers
	
		setPage: function(event) {
			event.preventDefault();
			var self = this;
			var pageno = $(event.target).attr('data-pageno');
			self.current_page = pageno;
			self.set_page(pageno);
			self.render();
		},

		// Helpers

		setTotalItems: function(total) {
			var self = this;
			self.total_items = total;
			self.num_pages = Math.round(total / self.page_size);
		},	
	});

	return PaginatorView;

});
