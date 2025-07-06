/**
 * User Management Module
 * Handles user CRUD operations for the admin panel
 */

import { AdminAPI, AuthAPI, ProfileAPI } from '../../js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler, errorHandler, messages } from '../../js/ui-utils.js';
import { getThemeColors } from '../../js/utils/theme-api.js';

export class UserManagement {
    constructor(elements, dataTable, responseLog) {
        this.elements = elements;
        this.usersTable = dataTable;
        this.responseLog = responseLog;
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

    showActiveUsers() {
        const activeUsers = this.allUsers.filter(user => user.base?.is_active || user.is_active);
        this.renderUsers(activeUsers);
    }

    showInactiveUsers() {
        const inactiveUsers = this.allUsers.filter(user => !(user.base?.is_active || user.is_active));
        this.renderUsers(inactiveUsers);
    }

    renderUsers(users) {
        if (users.length === 0) {
            this.elements.userListContainer.innerHTML = '<div class="themed" style="padding:1em;">No users found</div>';
        } else {
            this.elements.userListContainer.innerHTML = users.map(user => {
                const isActive = user.base?.is_active || user.is_active;
                const actionButton = isActive ? 
                    `<button class="icon-btn toggle-user-btn btn btn-sm btn-warning" data-user-id="${user.base?.id || user.id}" data-action="deactivate" title="Deactivate">🚫</button>` :
                    `<button class="icon-btn toggle-user-btn btn btn-sm btn-success" data-user-id="${user.base?.id || user.id}" data-action="activate" title="Activate">✅</button>`;
                
                return `
                    <div class="admin-card themed" style="${this.getThemedCardStyles()}">
                        <div class="admin-card-title" style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em; cursor: pointer;">
                            ${user.base?.login || user.login || 'Unknown'}
                            <span style="${this.getThemedSecondaryStyles()} margin-left: 0.5em;">${user.base?.email || user.email || ''}</span>
                        </div>
                        <div class="admin-card-meta" style="display: flex; align-items: center; gap: 1em;">
                            <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">${isActive ? 'Active' : 'Inactive'}</span>
                            <span style="flex: 1"></span>
                            <button class="icon-btn edit-user-btn btn btn-sm btn-primary" data-user='${JSON.stringify(user)}' title="Edit">✏️</button>
                            ${actionButton}
                        </div>
                    </div>
                `;
            }).join('');
        }
        this.setupUserActions();
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

        // Filter button handlers
        const showActiveBtn = document.getElementById('showActiveUsers');
        const showInactiveBtn = document.getElementById('showInactiveUsers');
        
        if (showActiveBtn) {
            showActiveBtn.addEventListener('click', () => {
                showActiveBtn.classList.remove('btn-outline-secondary');
                showActiveBtn.classList.add('btn-outline-primary');
                showInactiveBtn.classList.remove('btn-outline-primary');
                showInactiveBtn.classList.add('btn-outline-secondary');
                this.showActiveUsers();
            });
        }
        
        if (showInactiveBtn) {
            showInactiveBtn.addEventListener('click', () => {
                showInactiveBtn.classList.remove('btn-outline-secondary');
                showInactiveBtn.classList.add('btn-outline-primary');
                showActiveBtn.classList.remove('btn-outline-primary');
                showActiveBtn.classList.add('btn-outline-secondary');
                this.showInactiveUsers();
            });
        }
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
            
            // Log the response
            if (this.responseLog) {
                this.responseLog.addResponse(response, 'Load Users');
            }
            
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
            
            // Store users for filtering
            this.allUsers = users;
            this.showActiveUsers(); // Default to showing active users
            
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
            
            // Log the response
            if (this.responseLog) {
                this.responseLog.addResponse(response, 'Update User Profile', updatedData);
            }
            
            // Show user-friendly message
            this.adminMessage.showApiResponse(response);
            
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



    setupUserActions() {
        // Edit user buttons
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userData = JSON.parse(btn.getAttribute('data-user'));
                this.displayUserProfile(userData);
            });
        });

        // Toggle user status buttons
        let confirmingBtn = null;
        document.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.dataset.confirming = 'false';
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                // Reset other buttons
                document.querySelectorAll('.toggle-user-btn').forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.dataset.confirming = 'false';
                        otherBtn.classList.remove('btn-danger');
                        otherBtn.classList.add(otherBtn.dataset.action === 'activate' ? 'btn-success' : 'btn-warning');
                    }
                });

                if (btn.dataset.confirming === 'true') {
                    btn.dataset.confirming = 'false';
                    const userId = btn.getAttribute('data-user-id');
                    const action = btn.getAttribute('data-action');
                    this.handleUserToggle(userId, action);
                } else {
                    btn.dataset.confirming = 'true';
                    btn.classList.remove('btn-success', 'btn-warning');
                    btn.classList.add('btn-danger');
                }
            });
        });

        // Reset confirmation states when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('toggle-user-btn')) {
                document.querySelectorAll('.toggle-user-btn').forEach(btn => {
                    btn.dataset.confirming = 'false';
                    btn.classList.remove('btn-danger');
                    btn.classList.add(btn.dataset.action === 'activate' ? 'btn-success' : 'btn-warning');
                });
            }
        });
    }

    async handleUserToggle(userId, action) {
        if (!userId || !action) {
            messages.error('Invalid user or action.', { toast: true });
            return;
        }

        if (!AuthAPI.isAuthenticated()) {
            messages.error('Not authenticated. Please log in.', { toast: true });
            window.location.href = '/login';
            return;
        }

        const isActivating = action === 'activate';
        const btn = document.querySelector(`[data-user-id="${userId}"].toggle-user-btn`);
        if (btn) {
            loadingManager.setLoading(btn, true, isActivating ? 'Activating...' : 'Deactivating...');
        }

        try {
            const updateData = {
                user_id: userId,
                base: {
                    is_active: isActivating
                }
            };

            const response = await ProfileAPI.update(updateData);
            
            // Log the response
            if (this.responseLog) {
                this.responseLog.addResponse(response, `Toggle User Status (${action})`, updateData);
            }
            
            if (response.success) {
                messages.success(`User ${isActivating ? 'activated' : 'deactivated'} successfully`, { toast: true });
                if (this.elements.adminProfileInfo.dataset.currentUserId === userId) {
                    this.elements.profileEditTab.classList.add('d-none');
                }
                setTimeout(() => this.loadUsers(), 1000);
            } else {
                ErrorHandler.handleApiError(response, this.adminMessage);
            }
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            errorHandler.handleNetworkError(error, this.adminMessage);
        } finally {
            if (btn) {
                loadingManager.setLoading(btn, false);
            }
        }
    }
}
