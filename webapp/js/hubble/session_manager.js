
/**
 * HubbleSession
 * Manages lists of authentication tokens and uses HubbleApi object to
 * add new sessions.
 *
 * Note that all user sessions are stored in localStorage. active_session is
 * stored only in memory, so that different tabs can have different active
 * sessions, but will share the same pool of sessions.
 */

define('session_manager', function(require) {

	var HubbleApi = require('hubble_api');
	var _         = require('underscore');
	var Backbone  = require('backbone');
	var UserPrefs = require('user_prefs');
	var HubbleAPI = require('hubble_api');

	var SessionManager = function() {
		var pub = this;

		// Pass an reference to the SessionManager to the API, so it can
		// pass the auth token with requests, and
		HubbleAPI.setSessionManager(this);

		pub.sessions = {};

		pub.active_session = null;

		// Return a collection of user sessions, each one holding a username
		// and authentication token.
		pub.getSessions = function() {

			// in-memory sessions are empty, fetch them from localStorage
			if (_.isEmpty(pub.sessions)) {
				var sessions = UserPrefs.get('sessions');
				if (!_.isEmpty(sessions)) {
					pub.sessions = sessions;
				}
			}

      // Get the client locale, ie. IP address, et al
      var localized = !!UserPrefs.get('locale');
      if (!localized) {
        (function() {
          var request = new XMLHttpRequest();
          request.open('GET', 'https://currency.hubbleconnected.com/currency/me', true);
          request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
              UserPrefs.set('locale', JSON.parse(request.responseText));
            } else {
              // Sad trombone ♫
            }
          };
          request.onerror = function() {
            // More sad trombone ♫
          };
          request.send();
        })()
        localized = true;
      }

			// Edge case: we have sessions, but none set as active.
			// Set the first one as active.
			if (!_.isEmpty(pub.sessions) && pub.active_session === null) {
				// Check if active session is stored, and load it if so

				var login = UserPrefs.get('active_session');
				if (login !== undefined && pub.sessions[login] !== undefined) {
					pub.setActiveSession(login, pub.sessions[login]);
					return pub.sessions;
				}

				// iterate through sessions, choosing the first one as active.
				// It is this behaviour that allows a call to
				// SessionManager.getSessions() to be used to pick a new session
				// after one has been cleared.
				_.find(pub.sessions, function(token, login) {
					return pub.setActiveSession(login, token);
				});
			}

			return pub.sessions;
		};

		// Save a new set of sessions to localStorage and in memory.
		pub.setSessions = function(sessions) {
			UserPrefs.set('sessions', sessions);
			pub.sessions = sessions;
		};


		// Get the number of authentication tokens stored on the client
		pub.getSessionCount = function() {
			var count = 0;
			_.each(pub.getSessions(), function() {
				count++;
			});
			return count;
		};

		// One session at a time is considered active, and it's authentication
		// token will be sent with all API requests.
		pub.getActiveSession = function() {
			if (!pub.active_session) {
				// No active session yet. Calling getSessions() will force the
				// first one to be chosen.
				pub.getSessions();
			}
			return pub.active_session;
		};

		/**
		 * @return the active session auth token, or NULL if there is no active
		 * session.
		 */
		pub.getActiveAuthToken = function() {
			if (pub.sessions[pub.active_session] === undefined) {
				return null;
			}
			return pub.sessions[pub.active_session];
		};

		pub.logoutActiveSession = function() {
			pub.logoutSession(pub.active_session);
			UserPrefs.remove('active_session');
			UserPrefs.remove('LAST_DEVICE_LOADED');
			UserPrefs.remove('USER_DEVICES');
			UserPrefs.remove('TEMP_FORMAT_CELSIUS');
			pub.active_session = null;
		};

		// Delete an auth token from the client.
		pub.logoutSession = function(login) {
			var sessions = pub.getSessions();
			var newsessions = {};

			_.each(sessions, function(value, key, obj) {
				if (key == login) {
					return;
				}
				newsessions[key] = value;
			});

			pub.setSessions(newsessions);

			// Call getSessions() because it has the side-effect of ensuring
			// there is an active session (if there is at least one session).
			pub.getSessions();
		};

		// Remove all stored session and localStorage data.
		pub.clearAll = function() {
			pub.setSessions({});
			pub.getSessions();
			pub.active_session = null;

			UserPrefs.remove('active_session');
			UserPrefs.remove('sessions');
			UserPrefs.remove('locale');
			UserPrefs.remove('LAST_DEVICE_LOADED');
			UserPrefs.remove('USER_DEVICES');
			UserPrefs.remove('TEMP_FORMAT_CELSIUS');
		};

		pub.setActiveSession = function(login, token) {
			pub.active_session = login;
			UserPrefs.set('active_session', login);
		};


		// Return a bool for whether we have at least one session in storage.
		pub.aSessionExists = function() {
			var sessions = pub.getSessions();
			if (_.isEmpty(sessions)) {
				return false;
			}
			return true;
		};

		// Saves a token and email to the sessions array, and sets this new one
		// as active.
		pub.saveSessionToken = function(login, token) {
			pub.sessions[login] = token;
			UserPrefs.set('sessions', pub.getSessions());
			pub.setActiveSession(login, token);
		};

	};

	return new SessionManager();
});

