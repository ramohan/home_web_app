
/**
 * TemplateLoader
 * Returns a string containing an HTML template. If the template has been
 * packed into index.html, as python is supposed to do with all of them in
 * production, it simply returns it from there. Otherwise, it uses requirejs
 * text plugin to load and return it.
 *
 * This is an important means of reducing the total number of HTTP requests
 * per client.
 *
 * Note that for regular js files, require() should automatically detect that
 * modules are loaded and simply return their objects.
 */
define('template_loader', function(require) {
	var global  = require('global');
	var cfg     = require('hubble_config');
	var $       = require('jquery');
	var ErrorHandler  = require('error_handler');
	
	var TemplateLoader = function() {
		var pub = this;
	
		pub.get = function(path) {
			var template_name = path.replaceAll('/', '-');
			
			var template = $('#{0}'.format(template_name));
		
			if (template.length == 0) {
			
				// If template has not bundled into index.html, fallback to
				// loading it with synchronous ajax
				
				if (cfg.get('DEBUG_MODE')) {
					console.log('Downloading template {0}/{1}'.
						format(cfg.get('TEMPLATE_PATH'), path));
				}
					
				var require_path = '{0}/{1}.html'.
					format(cfg.get('TEMPLATE_PATH'), path);
				
				var template = null;
				$.ajax({
					type: 'get',
					url: require_path,
					async: false,
					dataType: 'html',
					success: function(response) {
						template = response;
					},
					error: function(response) {
						ErrorHandler.exception('Loading template {0} failed.'.format(require_path));
					}
				});				
				
				return template;
			} else {
				return template.html();
			}
		};
	};
	
	return new TemplateLoader();
});


