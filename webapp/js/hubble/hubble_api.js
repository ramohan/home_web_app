/**
 * HubbleAPI
 * Talks to the API.
 * Adds the authentication token to requests once it is known. Makes sure API 
 * calls have all required params at runtime and generates correct service URLs 
 * when given an alias for a call. Refer to hubble_api_endpoints.js for all API 
 * services.
 * 
 * Usage: 
 * var api = new HubbleAPI(HUBBLE_API_ENDPOINTS);
 * api.call('GET_AUTH_TOKEN', { user: 'user', password: 'pass' }, function() {
 * 	  var token = response['data']['authentication_token'];
 *    continue();
 * });
 */

define('hubble_api', function(require) {
	var $             = require('jquery');
	var cfg           = require('hubble_config');
	var global        = require('global');
	var lang          = require('hubble_lang');
	var api_endpoints = require('hubble_api_endpoints');
	var jquery_xdr    = require('lib/jquery.xdomainrequest.min');

	var HubbleAPI = function(endpoints) {
		// public members
		var pub = this;
	
		// List of all API functions with parameters
		pub.endpoints = endpoints;

		pub.api_base = cfg.get('API_BASE');
		pub.api_version = cfg.get('API_VERSION');

		pub.session_manager = null;

		// Intended to be used as a memoization type of cache for API calls
		pub.generic_cache = {};

		// See hubble/config.js for what this does		
		pub.api_save_wait_ms = cfg.get('API_SAVE_WAIT_MS');
		
		pub.api_command_delay_timer = null;
			
		// end constuctor

		/**
		 * HubbleAPI needs to know the auth token in order to send it with
		 * requests, and needs to be able to tell the Session Manager to
		 * to delete a saved session if the credentials become invalid.
		 *
		 * SessionManager is assigned here in this way to avoid a circular
		 * dependency in the require()'s above.
		 * 
		 * @param {SessionManager} manager
		 */
		pub.setSessionManager = function(manager) {
			pub.session_manager = manager;
		};

		/**
		 * Performs an API query and caches the result in memory. Future calls
		 * will use the cache instead of a fresh query, and other modules can
		 * check the cache before making queries.
		 *
		 * Note: this is not complete, and may never be, as the API has gotten
		 * considerably faster since early development. May just remove this.
		 * 
		 * @param {string} key   Alias for the endpoint, defined in api_endpoints.js
		 * @param {obj} params   Hash of parameters to pass to API
		 * @param {func} success Success callback
		 * @param {func} failure Failure callback
		 * @param {int} cache_mins Number of minutes to serve response on 
		 * subsequent calls to this function
		 */
		pub.cachedCall = function(key, params, success, failure, cache_mins) {
			var cached_callback = function(response) {
				// Not perfect, as the same call with different params will 
				// yield undesirable results. TODO: fix that.
				pub.generic_cache[key] = response;
				success(response);
			};
			
			pub.call(key, params, cached_callback, failure);
		};
		
		// Some javascript UI widgets could send a lot of events to the api
		// in quick succession, confusing and irritating it. Here we use a timer
		// to make sure that doesn't happen.
		pub.throttledApiCommand = function(registration_id, command, value) {
			if (pub.api_command_delay_timer !== null) {
				clearTimeout(self.api_command_delay_timer);
			}
			
			var return_val = null;

			pub.api_command_delay_timer = setTimeout(function() {
				return_val = pub.sendCommand(registration_id, command, value);
				pub.api_command_delay_timer = null;
			}, pub.api_save_wait_ms);

			return return_val;
		};
		
				
		/**
		 * This method queries the API. If you want to make authenticated calls,
		 * you must call HubbleUser.resumeSession(), and once that has been done
		 * the authentication token will automatically be added to calls made
		 * with this method (as api_key).
		 *
		 * @param {string} key   Alias for the endpoint, defined in api_endpoints.js
		 * @param {obj} params   Hash of parameters to pass to API
		 * @param {func} options Success callback or hash containing various
		 * options. Supported options include success, failure and async, to make
		 * this function return the response rather than use a callback.
		 * @param {func} failure Failure callback
		 */
		pub.call = function(service_key, params, options, failure) {
			if (!(service_key in pub.endpoints)) {
				throw "Attempted to contact invalid API service: {0}. Typo?".
					format(service_key);
			}
			// Support the old function signature where success callback was the
			// third argument
			if (typeof options == 'function') {
				options = {
					success: options,
					include_api_key: true
				};
			}

			// Make sure options object has expected keys
			var default_options = {
				async: true,
				success: undefined,
				failure: failure
			};
			if (options !== undefined) {
				_.defaults(options, default_options);
			} else {
				options = default_options;
			}

			service = pub.endpoints[service_key];
			var token = pub.session_manager.getActiveAuthToken();
			if (token !== null) {
				params['api_key'] = token;
			}
		
			var svc_params = service[2];
			var svc_path = service[1];

			if (svc_params !== undefined) {
				var tag = null;
				svc_params.forEach(function(param_name) {
					// Validate that no parameters defined in api_endpoints have
					// been left out of this call.
					if (!(param_name in params)) {
						throw "Parameter {0} was missing from API call {1}".
							format(param_name, service_key);
					}
				
					// Try to insert each param into the url. This handles the
					// common use of {registration_id} in URLs and other things.
					tag = '{' + param_name + '}';
					if (svc_path.indexOf(tag) != -1) {
						svc_path = svc_path.replace(tag, params[param_name]);
						// I don't think there are any cases where you use a 
						// param in the URL and also send it.
						delete params[param_name];
					}
				});
			}
		
			var method = service[0];
			if (method == 'post') {
				params = JSON.stringify(params);
			}
		

			$('#api-loading').fadeIn(900);
			//var loadmsg = lang.t('api_{0}'.format(service_key));
			//var loadmsg = lang.t('api_loading_generic');			
			//$('#api-loading-message').html(loadmsg);
			
			var url = pub.api_base + pub.api_version + '/' + svc_path + '.json';
			
			// jquery is not automatically appending params to the URL for
			// DELETE requqests as it does for GET, so we have to do it explicitly
			// http://bugs.jquery.com/ticket/11586
			var method = method.toLowerCase();
			if (method == 'delete') {
				url += '?' + $.param(params);
				params = undefined;
			}
			
			// jquery's handling of PUT appears to be an issue with rails
			//http://stackoverflow.com/questions/4007605/using-http-put-to-send-json-with-jquery-and-rails-3
			if (method == 'put') {
				params = JSON.stringify(params);
			}


			if (cfg.get('DEBUG_MODE')) {
				console.log("HubbleAPI call ({0}:{1})".format(url, JSON.stringify(params)));
			}
			
			$.ajax({
				type: method,
				url: url,
				contentType: 'application/json',
				data: params,
				dataType: 'json',
				success: function(response) {
					if (cfg.get('DEBUG_MODE')) {
						console.log("api call: {0}".format(service_key));
						console.log(response);
					}
					$('#api-loading').fadeOut(450);
					if (typeof options.success === 'function') {
						options.success(response);
					}
				},
				error: function(xhr, error, exception) {
					if (cfg.get('DEBUG_MODE')) {
						console.log("HubbleAPI call failed! ({0}:{1}:{2}:{3})".
							format(service_key, error, exception, JSON.stringify(xhr)));
						console.log("{0} {1}".format(method, url));
						console.log(JSON.stringify(params));
					}

					// For some reason IE isn't returning the "Authorized" error
					// message or status code. We will then assume *any* API
					// error is an authorized error so we can terminate the
					// users session. This check only catches IE 10 and below,
					// which may be well enough.
					if (window.navigator.userAgent.indexOf("MSIE ") > 0) {
						exception = "Unauthorized";
					}

					// If calling these endpoints, the Unathorized exception 
					// means the 'current password' in the confirmation box was 
					// wrong, so prevent the normal action in response to an
					// unauthorized request and let the calling code's failure
					// handler print out a user friendly message.
					if (exception == "Unauthorized" &&
						(service_key == 'UPDATE_USER' || 
						service_key == 'CHANGE_USER_PASSWORD')) {
						exception = 'wrong_password';
					}


					if (exception == "Unauthorized") {
						// Session token is invalid. It's not perfect but 
						// delete the token and reload the page, shunting 
						// them back to login without any feedback.
						pub.session_manager.logoutActiveSession();
						$('#api-loading').show();
						$('#api-loading-message').
							html(lang.t('api_request_unauthorized'));
					}
					if (typeof options.failure === 'function') {
						options.failure(xhr, error, exception);
					}
				}
			});
		};


		/**
		 * Sends a synchronous request to the API and parses out the value
		 * of a parameter (such as brightness or motion detection sensivity)
		 * from the response and returns the response as an int.
		 * @param string command
		 */
		pub.getCommandResponse = function(registration_id, command) {
			var response = pub.sendCommand(
				registration_id, command, undefined, false
			);
			if (response === null) {
				console.log("Command {0} returned null.".format(command));
				var err = new Error();
				console.log(err.stack);
			}
			var val = response['device_response']['body'];
			val = val.substring(val.indexOf(':')+2);
			if (!isNaN(val)) {
				return parseInt(val);
			} else {
				return val;
			}
		};
		
		/**
		 * Sends a command to the device. This particular, awkward format for 
		 * sending commands will probably only ever be used for cameras.
		 * 
		 * @param {string} command Name of the command to be sent to device. 
		 * Examples: get_brightness, get_contrast, vox_enable, vox_get_threshold
		 * @param {string or int} value To be sent to device.
		 * @param {bool} async Controls whether the function returns a value or
		 * provides the device response to a callback.
		 */
		pub.sendCommand = function(registration_id, command, value, async, 
								   callback) {
			// These commands use the format 
			// "action=command&command=COMMAND+VALUE"
			var silly_commands = {
				melody: 1, move_forward: 1, move_backward: 1, move_left: 1, 
				move_right: 1,
			};

			if (async === undefined) {
				async = true;
			}

			pub.return_val = null;
			var options = {
				success: function(response) {
					pub.return_val = response['data'];
				}
			};
			if (callback !== undefined) {
				options.success = callback;
			}

			var params = {
				'registration_id': registration_id,
				'action': 'command'
			};
			
			var orig_command = command;
			command = 'action=command&command={0}'.format(command);
			
			if (silly_commands[orig_command] !== undefined) {
				params['command'] = command + value;
				params['duty'] = 0.1;

			} else {
				params['command'] = command;
				
				// A weird exception, "value" param is called "setup" for volume.
				if (orig_command == 'set_spk_volume') {
					params['command'] += '&setup={0}'.format(value);
					value = undefined;
				}

				if (value !== undefined) {
					params['command'] += '&value={0}'.format(value);
				}

				// Special case to accomodate toggling motion detection
				if (orig_command == 'set_motion_area') {
					params['command'] = 'action=command&command=' + 
						'set_motion_area&grid=1x1&zone=';
					if (value) {
						params['command'] += '00';
					} 
				}
			}

			pub.call('SEND_DEVICE_COMMAND', params, options);

			return pub.return_val;
		};

	};

	return new HubbleAPI(api_endpoints);
});



