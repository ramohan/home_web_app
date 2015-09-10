/**
 * Helpful things that the developer likes.
 */

String.prototype.format = String.prototype.f = function() {
	var s = this,
	i = arguments.length;

	while (i--) {
		s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
	}
	return s;
};

String.prototype.replaceAll = function(search, replace)
{
	//if replace is null, return original string otherwise it will
	//replace search string with 'undefined'.
	if (!replace) 
		return this;

	return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

if (console === undefined) {
	console = {
		log: function() {}
	};
}

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}   


define('global', function(require) {
	var _         = require('underscore');
	var Backbone  = require('backbone');
	var lang      = require('hubble_lang');
	var UserPrefs = require('user_prefs');

	_.extend(Backbone.View.prototype, {
		// A view helper for dealing with rebinding events to subviews 
		// after they are refreshed. Will be removed it if never gets 
		// used, but I liked the idea.
		assign: function (view, selector) {
			view.setElement(this.$(selector)).render();
		},
		
		// A shorthand for defining required options for modules and 
		// throwing exceptions when they are not provided.
		requireOptions: function(options, module_name, required_options) {
			_.each(required_options, function(option_name) {
				if (options[option_name] === undefined) {
					throw "{0} was called without being given an {1} parameter".
						format(module_name, option_name);
				}
			});
		},

		// Returns the temperature value as celsius or fahrenheit depending
		// on users preference
		getTempDisplayValue: function(temp) {
			var self = this;
			if (UserPrefs.get('TEMP_FORMAT_CELSIUS')) {
				return temp;
			} else {
				return self.convertCelsiusToFahrenheit(temp);
			}
		},

		convertCelsiusToFahrenheit: function(celsius) {
			celsius = celsius * 9;
			celsius = celsius / 5;
			celsius = celsius + 32;
			return Math.round(celsius, 2);
		},

		setActiveNavButton: function(navbutton) {
			// Apply an active class to the currently selected nav button, 
			// effectively reminding the user which "section" of the site
			// they are in.
			$('.nav-tabs').find('li').removeClass('highlight');
			$('.nav-tabs').find('li.nav_{0}'.format(navbutton))
				.addClass('highlight');

			// Hide and show the camera control buttons as needed
			if (navbutton == 'dashboard') {
				$('.deviceminilist-tab').show();
				$('.controls-tab').show();
				$('.timeline-tab').show();

			} else {
				$('.deviceminilist-tab').hide();
				$('.controls-tab').hide();
				$('.timeline-tab').hide();

			}
		},

		getHeightFromWidth16x9: function(width) {
			return Math.round(width / 1.777777777777778);
		},

		getWidthFromHeight16x9: function(height) {
			return Math.round(1.777777777777778 * height);
		},		

		// Remove any created event handlers. Let those zombie views rest.
		close: function() {
			this.remove();
			this.stopListening();

			// Since almost every view uses #page_view as it's $el, and
			// remove() destroy's it to get rid of the lingering event handlers,
			// it is recreated here to allow new views to render to it.
			// Perhaps it would be better to have views create the div if they
			// need it rather than enforce it here.
			$('#content_row').
				html('<div id="page_view"></div><div id="loader"><img src="images/bubble_loader.svg" alt="loading"></div>');
		},

		// Make a link protocolless, so that they use the same protocol 
		// (http or https) as the page does. In practice, this should mean
		// everything always uses https.
		normalizeLinkProtocol: function(url) {
			if (window.location.protocol == 'http:') {
				if (url.substr(0, 6) == 'https:') {
					return 'http://' + url.substr(6);
				}
			} else if (window.location.protocol == 'https:') {
				if (url.substr(0, 5) == 'http:') {
					return 'https:' + url.substr(5);
				}			
			}
			// Perhaps url is already without a specific protocol?
			return url;
		},
		
		lockScreenForLoading: function() {
			$('#api-loading-message').html(lang.t('loading_message'));
			$('#api_loading_dlg').modal({
				backdrop: 'static',
				keyboard: false
			});
			
		},
		
		unlockScreenForLoading: function() {
			$('#api_loading_dlg').modal('hide');
		},

		isMobileBrowser: function() {
			var self = this;
			return self.detectMobileBrowserDotComFunction(
				navigator.userAgent||navigator.vendor||window.opera
			);
		},

		// Mobile Browser Detection from detectmobilebrowsers.com. Updated 1 Aug. 2014
		detectMobileBrowserDotComFunction: function(a){
		    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) {
				return true;
			}
			return false;
		},
	});
});


