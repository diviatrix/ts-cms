/**
 * User Management Module
 * Handles user CRUD operations for the admin panel
 */

import { AdminAPI, AuthAPI, ProfileAPI } from '../../js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler, errorHandler, messages } from '../../js/ui-utils.js';
import { getThemeColors } from '../../js/utils/theme-api.js';

export class UserManagement {
    constructor(elements, dataTable) {
        this.elements = elements;
        this.usersTable = dataTable;
        this.adminMessage = new MessageDisplay(elements.adminMessageDiv);
        
        this.setupEventHandlers();
    }

    /**
     * Get themed card styles using theme API
     */
    getThemedCardStyles() {
        const colors = getThemeColors();
        return `border-radius: 10px; margin-bottom: 1em; padding: 1em; background: ${colors.surfaceColor}; color: ${colors.textColor}; border: 1px solid ${colors.borderColor}; min-height: 3.5em;`;
    }

    /**
     * Get themed secondary text styles using theme API
     */
    getThemedSecondaryStyles() {
        const colors = getThemeColors();
        return `color: ${colors.secondaryColor}; font-size: 0.9em;`;
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
                    messages.error('Error loading user data', { toast: true });
                }
            }
        });
    }

    /**
     * Load users and populate the data table
     */
    async loadUsers() {
        try {
            if (!AuthAPI.isAuthenticated()) {
                messages.error('Not authenticated. Please log in.', { toast: true });
                window.location.href = '/login';
                return;
            }
            this.adminMessage.hide();
            this.elements.userListContainer.innerHTML = '<div class="themed" style="padding:1em;">Loading users...</div>';
            const response = await AdminAPI.getUsers();
            if (!response.success) {
                messages.error('Failed to load users', { toast: true });
                errorHandler.handleApiError(response, this.adminMessage);
                return;
            }
            let users = [];
            if (Array.isArray(response.data)) {
                users = response.data;
            } else if (response.data && typeof response.data === 'object') {
                if (Array.isArray(response.data.users)) {
                    users = response.data.users;
                } else if (Array.isArray(response.data.data)) {
                    users = response.data.data;
                } else {
                    users = Object.values(response.data);
                }
            }
            if (users.length === 0) {
                this.elements.userListContainer.innerHTML = '<div class="themed" style="padding:1em;">No users found</div>';
            } else {
                this.elements.userListContainer.innerHTML = users.map(user => `
                    <div class="admin-card themed" style="${this.getThemedCardStyles()}">
                        <div class="admin-card-title" style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em; cursor: pointer;">
                            ${user.base?.login || user.login || 'Unknown'}
                            <span style="${this.getThemedSecondaryStyles()} margin-left: 0.5em;">${user.base?.email || user.email || ''}</span>
                        </div>
                        <div class="admin-card-meta" style="display: flex; align-items: center; gap: 1em;">
                            <span class="badge ${user.base?.is_active || user.is_active ? 'bg-success' : 'bg-secondary'}">${user.base?.is_active || user.is_active ? 'Active' : 'Inactive'}</span>
                            <span style="flex: 1"></span>
                            <button class="icon-btn edit-user-btn btn btn-sm btn-primary" data-user='${JSON.stringify(user)}' title="Edit">✏️</button>
                            <button class="icon-btn delete-user-btn btn btn-sm btn-secondary" data-user-id="${user.base?.id || user.id}" title="Delete">🗑️</button>
                        </div>
                    </div>
                `).join('');
                this.setupUserActions();
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            messages.error('Network error occurred', { toast: true });
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
            messages.error('No user selected for saving.', { toast: true });
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
            messages.error('Invalid JSON format.', { toast: true });
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
            messages.success(response.message || 'Operation completed successfully', { toast: true });
        } else {
            errorHandler.handleApiError(response, this.adminMessage);
        }
    }

    setupUserActions() {
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userData = JSON.parse(btn.getAttribute('data-user'));
                this.displayUserProfile(userData);
            });
        });
        // Double-click-to-confirm delete logic
        let confirmingBtn = null;
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-secondary');
            btn.setAttribute('title', 'Click again to confirm deletion');
            btn.dataset.confirming = 'false';
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                document.querySelectorAll('.delete-user-btn').forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.classList.remove('btn-danger');
                        otherBtn.classList.add('btn-secondary');
                        otherBtn.setAttribute('title', 'Click again to confirm deletion');
                        otherBtn.dataset.confirming = 'false';
                    }
                });
                if (btn.dataset.confirming === 'true') {
                    btn.classList.remove('btn-danger');
                    btn.classList.add('btn-secondary');
                    btn.setAttribute('title', 'Click again to confirm deletion');
                    btn.dataset.confirming = 'false';
                    const userId = btn.getAttribute('data-user-id');
                    this.handleUserDelete(userId);
                } else {
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-danger');
                    btn.setAttribute('title', 'Click again to permanently delete');
                    btn.dataset.confirming = 'true';
                    confirmingBtn = btn;
                }
            });
        });
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-user-btn')) {
                document.querySelectorAll('.delete-user-btn').forEach(btn => {
                    btn.classList.remove('btn-danger');
                    btn.classList.add('btn-secondary');
                    btn.setAttribute('title', 'Click again to confirm deletion');
                    btn.dataset.confirming = 'false';
                });
            }
        });
    }

    async handleUserDelete(userId) {
        // Implement user deletion logic here, e.g., call AdminAPI.deleteUser(userId)
        messages.info('User deletion not implemented yet.', { toast: true });
    }
}
