
define('hubble_lang', function(require) {
	var polyglot   = require('lib/polyglot');
	var cfg        = require('hubble_config');
	var $          = require('jquery');
	var _          = require('underscore');
	var jquery_csv = require('lib/jquery.csv-0.71');


	var HubbleLang = function() {
		var pub = this;
		pub.lang = cfg.get('DEFAULT_LANG');
		pub.polyglot = null;

		// Get csv file of for users current language from server and load it
		// into polyglot
		var loadText = function() {
			$.ajax({
				type: 'get',
				url: 'lang/{0}.csv'.format(pub.lang),
				async: false,
				dataType: 'text',
				cache: false,
				success: function(response) {
					var data = $.csv.toArrays(response);
					var phrases = {};

					// convert csv phrases into correct format for polyglot
					_.each(data, function(val, idx) {
						phrases[val[0]] = val[1];
					});
					pub.polyglot = new Polyglot({
						phrases: phrases
					});
				},
				error: function(response) {
					throw 'Failed to load language file for "{0}.csv".'.
						format(pub.lang);
				}
			});
		};


		pub.t = function(phrase, variables) {
			return pub.polyglot.t(phrase, variables);
		};

		loadText();
	}

	return new HubbleLang();
});


