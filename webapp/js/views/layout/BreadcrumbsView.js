
define('views/layout/BreadcrumbsView', function(require) {
	var $              = require('jquery');
	var bootstrap      = require('jquery_bootstrap');
	var _              = require('underscore');
	var Backbone       = require('backbone');
	var TemplateLoader = require('template_loader');

	var BreadcrumbsView = Backbone.View.extend({
		el: '#breadcrumbs',
		template: TemplateLoader.get('layout/breadcrumbs'),
		
		crumbs: [],

		// The last crumb added on a given page is considered the page title
		page_title: '',

		add: function(name, url) {
			var self = this;
			newcrumb = {name: name};
			if (url !== undefined) {
				newcrumb['url'] = url;
			}
			self.crumbs.push(newcrumb);
			self.page_title = name;
		},
		
		reset: function() {
			var self = this;
			self.page_title = '';
			self.crumbs = [];
		},
		
		render: function() {
			var self = this;
			var data = {};
			self.el = '#breadcrumbs';
			self.$el = $(self.el);
			data.crumbs = self.crumbs;
			self.$el.html(_.template(self.template, data));
			$('#page_title').html(self.page_title);
			//$('#crumb_row').hide();
			//$('#page_title').attr('visibility', 'visibile');

			$('.breadcrumb li:last-child').addClass('active');

			return this;
		}
	});
	
	// Unlike most views, this one returns it's instance, so 
	// calling modles can simply use breadcrumbs.reset() and
	// breadcrumbs.add() to manage the crumbs.
	return new BreadcrumbsView();
});
