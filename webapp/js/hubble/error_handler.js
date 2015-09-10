
define('error_handler', function(require) {
	var _           = require('underscore');
	var EventLogger = require('hubble/event_logger');
	var cfg         = require('hubble_config');

	var ErrorHandler = function() {
		var pub = this;

		pub.exception = function(errmsg, extra_data, severity) {
			var err = new Error();

			if (err.stack !== undefined) {
				stacktrace = err.stack;
			} else {
				stacktrace = pub.getStackTrace();
			}

			var report_info = _.extend({
				"Error Message": errmsg,
				"Stack Trace":   stacktrace,
				"Severity": 1
			}, extra_data);

			if (cfg.get('DEBUG_MODE')) {
				console.log(report_info);
			}
			EventLogger.logEvent("WebApp Exception", report_info);
		};

		pub.getStackTrace = function() {
			function st2(f) {
				return !f ? [] : 
					st2(f.caller).concat([f.toString().split('(')[0].substring(9) + '(' + Array.prototype.slice.call(f.arguments).join(',') + ')']);
				}
			return st2(arguments.callee.caller);			
		};
	};

	return new ErrorHandler();
});

