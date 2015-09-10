/**
 * Hubble API Endpoints
 * Full list of API functions and their parameters. This should be updated whenever 
 * the API is changed.
 *
 * Global API parameters:
 * -suppress_response_codes - bool
 * -api_key - string
 *
 * TODO: Store optional parameters here as well, so they can be validated
 * if present.
 */
 
define('hubble_api_endpoints', function(require) {

	return {
		// Users
		CREATE_USER : ['post', 'users/register', [
			'name', 'email', 'password', 'password_confirmation'
		]],
		GET_AUTH_TOKEN: ['post', 'users/authentication_token', [
			'login', 'password'
		]],
		GET_CURRENT_USER: ['get', 'users/me'],
		UPDATE_USER: ['post', 'users/me', [
			'email'
		]],
		CHANGE_USER_PASSWORD: ['post', 'users/me/change_password', [
			'password', 'password_confirmation'
		]],
		FIND_USER_BY_PASSWORD: ['get', 'users/find_by_password_token', [
			'reset_password_token'
		]],
		RESET_PASSWORD: ['post', 'users/reset_password', [
			'password', 'password_confirmation', 'reset_password_token'
		]],
		FORGOT_PASSWORD: ['post', 'users/forgot_password', [
			'login'
		]],
		GET_USER_AUDITS: ['get', 'users/{id}/audit', [
			'id'
		]],
		USER_CUSTOM_NOTIFICATION: ['post', 'users/notify', [
			'user_ids', 'message'
		]],
		REGISTER_VIA_FACEBOOK: ['post', 'users/login_with_facebook', [
			'access_token', 'email'
		]],


	
		// Authentications
		GET_USER_AUTHENTICATIONS: ['get', 'authentications'], // api_key
	
		// devices
		CREATE_DEVICE: ['post', 'device/register', [
			'name', 'registration_id', 'mode', 'firmware_version', 'time_zone'
		]],
		GET_USER_DEVICES: ['get', 'devices/own'], // api_key
		CANCEL_DEVICE_SUBSCRIPTION: ['post', 'devices/{registration_id}/cancel_subscription', [
			'registration_id'
		]],
		// Darrel note: This explanation comes from the Indian team and I'm 
		// not super clear on what all of this means.
		// If event_code is specified before_start_time and alerts are not 
		// considered. start_time is having more preference than page,size. 
		// If page is 2 and size is 5 , It returns maximum 5 events of page 2.
		//
		// optional params:
		// before_start_time 
		//     Example format : 2013-12-20 20:10:18 (yyyy-MM-dd HH:mm:ss).
		// alerts 
		//     Comma separated list of alerts. Example : 1,2,3,4
		// page
		//     Page number.
		// size 
		//     Number of records per page (defaut 10).
		GET_DEVICE_EVENTS: ['get', 'devices/{registration_id}/events', [
			'registration_id'
			// Optional params:
			//'before_start_time', 'event_code', 'alerts', 'page', 'size'
		]],
		GET_GLOBAL_EVENTS: ['get', 'devices/events', [
			// Optional params:
			//'before_start_time', 'event_code', 'alerts', 'page', 'size'
		]],
		
		GET_DEVICE_INFO: ['get', 'devices/{registration_id}', [
			'registration_id'
		]],
		SEND_DEVICE_COMMAND: ['post', 'devices/{registration_id}/send_command', [
			'registration_id', 'command'
		]],
		/*
			Commands are as follows:

			action=command&command=melody1
			action=command&command=melody2
			action=command&command=melody3
			action=command&command=melody4
			action=command&command=melody5
			action=command&command=melodystop
			action=mini_device_status
			streamer_status
			action=command&command=check_cam_ready
			get_session_key&mode=any
			get_session_key&mode=relay_rtmp
			get_log
			*/
		CREATE_DEVICE_SESSION: ['post', 'devices/{registration_id}/create_session', [
			'registration_id', 'client_type'
		]],
		CLOSE_DEVICE_SESSION: ['post', 'devices/close_session', [
			'session_id'
		]],
		DELETE_DEVICE: ['post', 'devices/{registration_id}', [
			'registration_id', 'comment'
		]],
		UPDATE_DEVICE_INFO: ['put', 'devices/{registration_id}/basic', [
			'registration_id', 'name', 'time_zone', 'mode', 'firmware_version'
		]],
		/*
		The parameter settings takes an array. An example of the input is shown as 
		follows: { “api_key” : “some_api_key……”, “settings” : [ { “name” : “zoom”, 
		“value” : 8 ), [ “name” : “pan”, “value” : 9 ), [ “name” : “tilt”, 
		“value” : 9 ), [ “name” : “contrast”, “value” : 4 } ] }

		*** This query CANNOT be executed using Swagger framework. Please use some 
		REST client (like Postman, or RESTClient etc.)
		*/
		UPDATE_DEVICE_SETTINGS: ['put', 'device/{registration_id}/settings', [
			'registration_id', 'settings'
		]],
		IS_DEVICE_AVAILABLE: ['post', 'devices/{registration_id}/is_availale', [
			'registration_id'
		]],
		DEVICE_EXISTS: ['get', 'devices/{registration_id}/check_exist', [
			'registration_id'
		]],
		GET_DEVICE_AUDITS: ['get', 'devices/{registration_id}/audit', [
			'registration_id'
		]],
		DEVICE_OWNER_NOTIFICATION: ['post', 'devices/notify_owners', [
			'registration_ids', 'message'
		]],
		MODIFY_SUBSCRIPTION: ['post', 'devices/{registration_id}/change_subscription', [
			'registration_id', 'plan_id'
		]],
		FREEMIUM_PLAN_UPGRADE: ['post', 'devices/{registration_id}/upgrade_plan', [
			'registration_id', 'plan_id'
		]],
		GET_DEVICE_CAPABILITY: ['get', 'devices/{registration_id}/capability', [
			'registration_id'
		]],
		// Mode (upnp OR stun OR relay)
		DEVICE_SESSION_SUMMARY: ['post', 'devices/{registration_id}/session_id', [
			'registration_id', 'mode', 'start_time', 'end_time', 'session_time'
		]],
		
		// Device access by all users
		GET_DEVICE_ACTIONS: ['get', 'devices/{registration_id}/event_log', [
			'registration_id', 
			//optional: 'event_name', 'user_id'
		]],
		
		/* Endpoints related to device sharing */
		SHARE_DEVICE: ['post', 'devices/{registration_id}/share', [
			'registration_id', 'emails' // comma separated
		]],
		ACCEPT_SHARING_INVITATION: ['post', 'devices/accept_sharing_invitation', [
			'invitation_key'
		]],
		SEND_OUTSTANDING_SHARE_REMINDERS: ['post', 'devices/send_sharing_invitation_reminder'],
		GET_USER_SHARING_INVITATIONS: ['get', 'devices/sharing_invitations_by_me', [
			//'user_id' // optional?
		]],
		GET_DEVICES_SHARED_BY_USER: ['get', 'devices/shared_by_me', [
			//'user_id' // optional?
		]],
		GET_DEVICES_SHARED_WITH_USER: ['get', 'devices/shared_with_me', [
			//'user_id' // optional?
		]],
		CANCEL_SHARING_INVITATION: ['delete', 'devices/{registration_id}/remove_sharing_invitations', [
			'registration_id', 'emails' // comma separated
		]],
		REMOVE_SHARING_PERMISSION: ['delete', 'devices/{registration_id}/remove_sharing', [
			'registration_id', 'user_ids' // comma separated
		]],

		// Cooker specific endpoints
		ADD_RECIPE: ['post', 'recipes/add', [
			'program_code', 'device_model_id', 'name', 'default_duration'
			//min_duration, max_duration
		]],
		EDIT_RECIPE: ['post', 'recipes/{id}', [
			'id', 'program_code', 'device_model_id', 'name', 'default_duration'
			//min_duration, max_duration
		]],	
		DELETE_RECIPE: ['delete', 'recipes/{id}', [ 'id' ]],
		LIST_RECIPES: ['get', 'recipes/list', [ 
			//'q' 
		]],
		START_COOKING: ['post', 'cooker/{registration_id}/start_cook', [
			'registration_id', 'program_code',
			//enable_keep_warm, cook_hour, cook_min
		]],
		CANCEL_COOKING_JOBS: ['post', 'cooker/{registration_id}/cancel_all_tasks', [
			'registration_id' 
		]],
		COOKER_STATUS: ['get', 'cooker/{registration_id}/status', [
			'registration_id'
		]],
		SET_COOKER_CLOCK: ['post', 'cooker/{registration_id}/set_clock', [
			'registration_id', 'date_time'
		]],
		SCHEDULE_RECIPE: ['post', 'cooker/{registration_id}/schedule_cooking', [
			'registration_id', 'program_code', 'delay_hour', 'delay_min',
			//cook_hour, cook_min, enable_keep_warm
		]],
		CHANGE_CURRENT_RECIPE: ['post', 'cooker/{registration_id}/alter_current_cook', [
			'registration_id', 'program_code', 'enable_keep_warm', 'cook_hour',
			'cook_min',
		]],
		SAVE_CUSTOM_RECIPE: ['post', 'cooker/{registration_id}/cook_user_program', [
			'registration_id', 'user_program'
		]],
		GET_CUSTOM_RECIPE: ['get', 'cooker/{registration_id}/cook_user_program', [
			'registration_id'
		]],
		COOK_3RDPARTY_RECIPE: ['post', 'cooker/{registration_id}/cook_other_recipe', [
			'registration_id', 'recipe_url'
		]],

	
		// Apps
		LIST_USER_APPS: ['get', 'apps'],
		ADD_USER_APP: ['post', 'apps/register', [
			'name', 'device_code', 'software'
		]],
		// Notification type. Currently supports ‘gcm’ and ‘apns’
		// App registration id or device token provided by either GCM or APNS.
		REGISTER_PUSH_NOTIFICATIONS: ['post', 'apps/{id}/register_notifications', [
			'id', 'notification_type', 'registration_id'
		]],
		UNREGISTER_PUSH_NOTIFICATION: ['post', 'apps/{id}/unregister_notifications', [
			'id'
		]],
		UPDATE_APP: ['put', 'apps/{id}', [
			'id', 'name', 'software_version'
		]],
		DELETE_APP: ['delete', 'apps/{id}/unregister', [
			'id'
		]],
		UPDATE_DEVICE_ALERT_SETTINGS: ['put', 'apps/{id}/notifications', [
			'id', 'settings'
		]],
			/*
			The parameter settings takes an array. An example of the input is shown as follows:
			{
			"api_key" : "some_api_key......",
			"settings" : [ 
				{ "device_id" : 1, "alert" : 1, "is_enabled" : false ),
				{ "device_id" : 1, "alert" : 2, "is_enabled" : false ),
				{ "device_id" : 2, "alert" : 2, "is_enabled" : false ),
				{ "device_id" : 2, "alert" : 1, "is_enabled" : true }   ] }

			*** This query CANNOT be executed using Swagger framework. Please use some REST client (like Postman, or RESTClient etc.)
			*/
	
	
		// Uploads
		BATCH_RESOLVE_LOCATIONS: ['post', 'uploads/batch_location_convert', [
			'file' // csv file
		]],
	
		// Recurly
		RECURLY_SUBSCRIPTION_CONFIRM: ['post', 'recurly/confirm_subscription', [
			'recurly_token' // token returned from recurly after subscription
		]],
		RECURLY_PUSH_NOTIFICATION: ['post', 'recurly/recurly_push_notification'],
	
		// Device Models. This stuff is probably admin only
		// UDID scheme. 1 for Monitor Device Type and 2 for Desktop device type
		REGISTER_NEW_MODEL: ['post', 'device_models/register', [
			'type_code', 'name', 'model_no', 'udid_scheme', 'description'
		]],
		GET_DEVICE_MODELS: ['get', 'device_models', [
			'q', 'page', 'size'
		]],
		GET_DEVICE_MODEL: ['get', 'device_models/{model_no}', [
			'model_no'
		]],
		DELETE_MODEL: ['delete', 'device_model', [
			'model_no', 'comment'
		]],
		// UDID scheme. 1 for Monitor Device Type and 2 for Desktop device type
		UPDATE_MODEL: ['put', 'device_models/{model_no}', [
			'model_no', 'name', 'description', 'udid_scheme'
		]],
		GET_DEVICE_TYPE_AUDITS: ['get', 'device_models/{model_no}/audit', [
			'model_no'
		]],
		UPLOAD_DEVICE_MASTER_CSV: ['post', 'device_models/{model_no}/device_master', [
			'model_no', 'file'
		]],
		// No idea what this does
		SET_DEVICE_MODEL_CAPABILITY: ['post', 'device_models/device_model_capability', [
			'model_no', 'firmware_prefix', 'file' // csv file
		]],
		GET_DEVICE_MODEL_MASTER_BATCHES: ['get', 'device_models/{model_no}/batches', [
			'model_no'
		]],
		GET_BATCH_DEVICES: ['get', 'device_models/{batch_id}/device', [
			'batch_id'
		]],
	
		// Device Types
		ADD_DEVICE_TYPE: ['post', 'device_types/register', [
			'name', 'type_code', 'description'
		]],
		GET_DEVICE_TYPES: ['get', 'device_types', [
			'q', 'page', 'size'
		]],
		GET_DEVICE_TYPE: ['get', 'device_types/{type_code}', [
			'type_code'
		]],
		DELETE_DEVICE_TYPE: ['delete', 'device_types/{type_code}', [
			'type_code', 'comment'
		]],
		UPDATE_DEVICE_TYPE: ['put', 'device_types/{type_code}', [
			'type_code', 'name', 'description'
		]],
		GET_DEVICE_TYPE_AUDITS: ['get', 'device_types/{type_code}/audit', [
			'type_code'
		]],
		SET_DEVICE_TYPE_CAPABILITY: ['post', 'device_types/device_type_capability', [
			'type_code', 'file'
		]],

		// --- Subscription related endpoints ---

		GET_USER_SUBSCRIPTIONS: ['get', 'users/subscriptions'],

		GET_USER_BILLING_INFO: ['get', 'users/subscriptions/billing_info', [
		]],
		UPDATE_USER_BILLING_INFO: ['put', 'users/subscriptions/billing_info', [
			'recurly_secret'
		]],


		// Subscriptions on user account
		USER_SUBSCRIPTION_RECURLY_CREATE: ['post', 'users/subscriptions', [
			'plan_id', 'recurly_secret', 'currency_unit', 'recurly_coupon'
		]],
		USER_SUBSCRIPTION_EXPIRED_CREATE: ['post', 'users/subscriptions', [
			'plan_id', 
		]],
		USER_SUBSCRIPTION_RECURLY_UPDATE: ['put', 'users/subscriptions/{subscription_uuid}', [
			'subscription_uuid', 'plan_id'
		]],
		USER_SUBSCRIPTION_RECURLY_REACTIVATE: ['put', 'users/{subscription_uuid}/recurly/reactivate', [
		'subscription_uuid']],
		USER_SUBSCRIPTION_REACTIVATE: ['put', 'users/subscriptions/{subscription_uuid}/reactivate', [
		'subscription_uuid']],
		USER_SUBSCRIPTION_RECURLY_CANCEL: ['delete', 'users/{subscription_uuid}/recurly/cancel', [
		'subscription_uuid']],
		USER_SUBSCRIPTION_CANCEL: ['put', 'users/subscriptions/{subscription_uuid}/cancel', [
		'subscription_uuid']],
	

		// Links between devices and subscriptions
		GET_DEVICE_PLANS: ['get', 'devices/subscriptions'],
		APPLY_DEVICE_SUBSCRIPTION: ['put', 'devices/subscriptions', [
		'plan_id', 'devices_registration_id']],
	

		// Plans
		CREATE_SUBSCRIPTION_PLAN: ['post', 'subscription_plans/create', [
			'plan_id', 'charge'
		]],
		ADD_PLAN_PARAMETER: ['post', 'subscription_plans/{id}/plan_parameter', [
			'id', 'parameter', 'value'
		]],
		GET_SUBSCRIPTION_PLANS: ['get', 'subscription_plans'],
		DELETE_SUBSCRIPTION_PLAN: ['delete', 'subscription_plans/{id}', [
			'id'
		]],
		UPDATE_SUBSCRIPTION_PLAN: ['put', 'subscription_plans/{id}/update', [
			'id', 'charge'
		]],
	};
});


