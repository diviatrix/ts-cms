/**
 * User Management Module
 * Handles user CRUD operations for the admin panel
 */

import { AdminAPI, AuthAPI, ProfileAPI } from '../../js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler, errorHandler } from '../../js/ui-utils.js';

export class UserManagement {
    constructor(elements, dataTable) {
        this.elements = elements;
        this.usersTable = dataTable;
        this.adminMessage = new MessageDisplay(elements.adminMessageDiv);
        
        this.setupEventHandlers();
    }

    /**
     * Setup user management event handlers
     */
    setupEventHandlers() {
        // Save button for user profiles
        if (this.elements.adminSaveButton) {
            this.elements.adminSaveButton.addEventListener('click', () => this.handleUserSave());
        }

        // User link clicks in the data table
        this.elements.userListContainer.addEventListener('click', (e) => {
            const userLink = e.target.closest('.user-link');
            if (userLink) {
                e.preventDefault();
                try {
                    const userData = JSON.parse(userLink.dataset.user);
                    this.displayUserProfile(userData);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    this.adminMessage.showError('Error loading user data');
                }
            }
        });
    }

    /**
     * Load users and populate the data table
     */
    async loadUsers() {
        try {
            // Check authentication
            if (!AuthAPI.isAuthenticated()) {
                this.adminMessage.showError('Not authenticated. Please log in.');
                window.location.href = '/login';
                return;
            }

            this.adminMessage.hide();
            
            // Show loading state
            this.usersTable.showLoading('Loading users...');
            
            const response = await AdminAPI.getUsers();

            if (!response.success) {
                this.usersTable.showError('Failed to load users');
                errorHandler.handleApiError(response, this.adminMessage);
                return;
            }

            let users = [];
            if (Array.isArray(response.data)) {
                users = response.data;
            } else if (response.data && typeof response.data === 'object') {
                // If data is an object with an array property, extract it
                if (Array.isArray(response.data.users)) {
                    users = response.data.users;
                } else if (Array.isArray(response.data.data)) {
                    users = response.data.data;
                } else {
                    // Convert object to array if needed
                    users = Object.values(response.data);
                }
            }
            
            if (users.length === 0) {
                this.usersTable.showEmpty('No users found');
            } else {
                this.usersTable.updateData(users);
            }

        } catch (error) {
            console.error('Error fetching users:', error);
            this.usersTable.showError('Network error occurred');
            errorHandler.handleNetworkError(error, this.adminMessage);
        }
    }

    /**
     * Display user profile for editing
     */
    displayUserProfile(user) {
        console.log('displayUserProfile: user object:', user);
        this.elements.profileEditTab.classList.remove('d-none');
        this.elements.adminServerAnswerTextarea.value = JSON.stringify(user, null, 2);
        this.elements.adminProfileInfo.dataset.currentUserId = user.base?.id || user.id;
        this.adminMessage.hide();
    }

    /**
     * Handle user profile save
     */
    async handleUserSave() {
        const userIdToUpdate = this.elements.adminProfileInfo.dataset.currentUserId;
        if (!userIdToUpdate) {
            this.adminMessage.showError('No user selected for saving.');
            return;
        }

        let updatedData;
        try {
            const parsedData = JSON.parse(this.elements.adminServerAnswerTextarea.value);
            updatedData = {
                user_id: userIdToUpdate,
                base: parsedData.base,
                profile: parsedData.profile
            };
        } catch (e) {
            console.error('Invalid JSON format:', e);
            this.adminMessage.showError('Invalid JSON format.');
            return;
        }

        try {
            loadingManager.setLoading(this.elements.adminSaveButton, true, 'Saving...');
            
            const response = await ProfileAPI.update(updatedData);
            
            console.log('adminSaveButton: result object:', response);
            this.elements.adminServerAnswerTextarea.value = JSON.stringify(response, null, 2);
            
            // Show API response using custom method
            this.showApiResponse(response);
            
            if (response.success) {
                // Show success feedback and refresh the users list
                setTimeout(() => {
                    this.loadUsers();
                }, 1000); // Small delay to let user see the success message
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            errorHandler.handleNetworkError(error, this.adminMessage);
        } finally {
            loadingManager.setLoading(this.elements.adminSaveButton, false);
        }
    }

    /**
     * Show API response (custom method)
     */
    showApiResponse(response) {
        if (response.success) {
            this.adminMessage.showSuccess(response.message || 'Operation completed successfully');
        } else {
            errorHandler.handleApiError(response, this.adminMessage);
        }
    }
}
