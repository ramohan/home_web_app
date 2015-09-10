
define('views/sharing/SharingView', function(require) {
	var $              = require('jquery');
	var underscore     = require('underscore');
	var cfg            = require('hubble_config');
	var Backbone       = require('backbone');	
	var HubbleAPI      = require('hubble_api');
	var TemplateLoader = require('template_loader');
	var breadcrumbs    = require('views/layout/BreadcrumbsView');
	var lang           = require('hubble_lang');

	var SharingView = Backbone.View.extend({
		el: '#page_view',

		invitations_loaded: false,
		invitations: {},
		my_shares_loaded: false,
		my_shares: {},
		other_shares_loaded: false,
		other_shares: {},
		
		events: {
			'click .remove-sharing':    'removeSharingPermission',
			'click .cancel-invitation': 'cancelSharingInvitation',
			'click button[data-action="remove-sharing-confirm"]': 'removeSharingConfirm',
			'click button[data-action="cancel-invitation-confirm"]': 'cancelInvitationConfirm',
		},

		removeSharingPermission: function(event) {
			var self = this;
			var id = $(event.target).attr('data-user-id');
			var confirm_btn = $('#confirm_button');
			var reg_id = $(event.target).attr('data-registration-id');
			confirm_btn.attr('data-user-id', id);
			confirm_btn.attr('data-action', 'remove-sharing-confirm');
			confirm_btn.attr('data-registration-id', reg_id);
			$('#confirmation_dialog').modal();
		},
		
		removeSharingConfirm: function(event) {
			var self = this;
			$('#confirmation_dialog').modal('hide')
			event.preventDefault();
			
			var id = $(event.target).attr('data-user-id');			
			var reg_id = $(event.target).attr('data-registration-id');
			var params = {
				user_ids: id,
				registration_id: reg_id
			};
			
			// Hacky solution to the issue of the modal backdrop sometimes not 
			// disappearing when the submit button is clicked.
			$('body').removeClass('modal-open');
			$('.modal-backdrop').remove();
			
			HubbleAPI.call('REMOVE_SHARING_PERMISSION', params, function(response) {
				self.initialize();
			});
		},

		cancelSharingInvitation: function(event) {
			var self = this;
			var email = $(event.target).attr('data-invite-email');
			var confirm_btn = $('#confirm_button');
			var reg_id = $(event.target).attr('data-registration-id');
			confirm_btn.attr('data-invite-email', email);
			confirm_btn.attr('data-action', 'cancel-invitation-confirm');
			confirm_btn.attr('data-registration-id', reg_id);
			$('#confirmation_dialog').modal();
		},
		
		cancelInvitationConfirm: function(event) {
			var self = this;
			$('#confirmation_dialog').modal('hide')
			event.preventDefault();
			
			var email = $(event.target).attr('data-invite-email');
			var reg_id = $(event.target).attr('data-registration-id');
			var params = {
				emails: email,
				registration_id: reg_id
			};
			
			// Hacky solution to the issue of the modal backdrop sometimes not 
			// disappearing when the submit button is clicked.
			$('body').removeClass('modal-open');
			$('.modal-backdrop').remove();
			
			HubbleAPI.call('CANCEL_SHARING_INVITATION', params, function(response) {
				self.initialize();
			});
		
		},
	
		template: TemplateLoader.get('sharing/Sharing'),

		myPendingInvitations: function() {
			var self = this;
			HubbleAPI.call('GET_USER_SHARING_INVITATIONS', {}, function(response) {
				self.invitations_loaded = true;
				self.invitations = response['data'];
				self.render();
			});
		},

		sharedByMe: function() {
			var self = this;
			HubbleAPI.call('GET_DEVICES_SHARED_BY_USER', {}, function(response) {
				self.my_shares_loaded = true;
				self.my_shares = response['data'];
				self.render();

			});
		},

		sharedWithMe: function() {
			var self = this;
			HubbleAPI.call('GET_DEVICES_SHARED_WITH_USER', {}, function(response) {
				self.other_shares_loaded = true;
				self.other_shares = response['data'];
				self.render();
			});
		},
		
		initialize: function(options) {
			var self = this;
			breadcrumbs.reset();
			breadcrumbs.add(lang.t('crumb_sharingpage'), '#sharing');
			breadcrumbs.render();
			
			self.lockScreenForLoading();

			self.myPendingInvitations();
			self.sharedByMe();
			self.sharedWithMe();
		},
		
		render: function() {
			var self = this;
			if (!self.invitations_loaded || !self.my_shares_loaded ||
				!self.other_shares_loaded) {
				return;
			}

			var data = {};
			data.invitations = self.invitations;
			data.my_shares = self.my_shares;
			data.other_shares = self.other_shares;
			self.$el.html(_.template(self.template, data));
			
			self.unlockScreenForLoading();
		}
	});
	
	return SharingView;
	
});


