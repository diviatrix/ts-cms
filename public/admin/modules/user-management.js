/**
 * User Management Module
 * Handles user CRUD operations for the admin panel
 */

import { AdminAPI, ProfileAPI } from '../../js/api-core.js';
import { AuthAPI } from '../../js/api-auth.js';
import { loadingManager, messages } from '../../js/ui-utils.js';
import { BaseAdminController } from './base-admin-controller.js';
import { renderCardTitle, renderMetaRow, renderEditButton, renderDeleteButton, renderActivateButton, renderDeactivateButton, renderEmptyState, renderErrorState } from '../../js/shared-components/ui-snippets.js';

export class UserManagement extends BaseAdminController {
    constructor(elements, dataTable) {
        super({
            elements,
            messageDiv: elements.adminMessageDiv
        });
        
        this.usersTable = dataTable;
        this.allUsers = [];
        
        this.setupEventHandlers();
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
            this.elements.userListContainer.innerHTML = renderEmptyState('No users found');
        } else {
            this.elements.userListContainer.innerHTML = users.map(user => {
                const isActive = user.base?.is_active || user.is_active;
                const actionButton = isActive ? 
                    `<button class="icon-btn toggle-user-btn btn btn-sm btn-warning" data-user-id="${user.base?.id || user.id}" data-action="deactivate" title="Deactivate">🚫</button>` :
                    `<button class="icon-btn toggle-user-btn btn btn-sm btn-success" data-user-id="${user.base?.id || user.id}" data-action="activate" title="Activate">✅</button>`;
                
                return `
                    <div class="admin-card themed" style="${this.getThemedCardStyles()}">
                        <div class="admin-card-title" style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em; cursor: pointer;">
                            ${renderCardTitle(user.base?.login || user.login || 'Unknown')}
                            <span style="${this.getThemedSecondaryStyles()} margin-left: 0.5em;">${renderMetaRow(user.base?.email || user.email || '')}</span>
                        </div>
                        <div class="admin-card-meta" style="display: flex; align-items: center; gap: 1em;">
                            <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">${isActive ? 'Active' : 'Inactive'}</span>
                            <span style="flex: 1"></span>
                            ${renderEditButton(`data-user='${JSON.stringify(user)}'`)}
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
        // Bind direct element events
        this.bindEvents({
            adminSaveButton: {
                click: () => this.handleUserSave()
            }
        });

        // Setup delegated events for dynamic content
        this.setupDelegatedEvents(this.elements.userListContainer, {
            '.user-link': {
                click: (event, target) => {
                    event.preventDefault();
                    try {
                        const userData = JSON.parse(target.dataset.user);
                        this.displayUserProfile(userData);
                    } catch (error) {
                        messages.showError('Error loading user data: ' + (error?.message || error?.toString()));
                    }
                }
            }
        });

        // Filter button handlers
        this.bindEvents({
            '#showActiveUsers': {
                click: () => {
                    const showActiveBtn = document.getElementById('showActiveUsers');
                    const showInactiveBtn = document.getElementById('showInactiveUsers');
                    
                    showActiveBtn.classList.remove('btn-outline-secondary');
                    showActiveBtn.classList.add('btn-outline-primary');
                    showInactiveBtn.classList.remove('btn-outline-primary');
                    showInactiveBtn.classList.add('btn-outline-secondary');
                    this.showActiveUsers();
                }
            },
            '#showInactiveUsers': {
                click: () => {
                    const showActiveBtn = document.getElementById('showActiveUsers');
                    const showInactiveBtn = document.getElementById('showInactiveUsers');
                    
                    showInactiveBtn.classList.remove('btn-outline-secondary');
                    showInactiveBtn.classList.add('btn-outline-primary');
                    showActiveBtn.classList.remove('btn-outline-primary');
                    showActiveBtn.classList.add('btn-outline-secondary');
                    this.showInactiveUsers();
                }
            }
        });
    }

    /**
     * Load users and populate the data table
     */
    async loadUsers() {
        if (!this.checkAuthentication()) {
            return;
        }

        messages.clearAll();
        this.showContainerLoading(this.elements.userListContainer, 'Loading users...');
        
        const response = await this.safeApiCall(
            () => AdminAPI.getUsers(),
            {
                operationName: 'Load Users',
                successCallback: (data) => {
                    let users = [];
                    if (Array.isArray(data)) {
                        users = data;
                    } else if (data && typeof data === 'object') {
                        if (Array.isArray(data.users)) {
                            users = data.users;
                        } else if (Array.isArray(data.data)) {
                            users = data.data;
                        } else {
                            users = Object.values(data);
                        }
                    }
                    
                    // Store users for filtering
                    this.allUsers = users;
                    this.showActiveUsers(); // Default to showing active users
                }
            }
        );

        if (!response.success) {
            this.showContainerError(this.elements.userListContainer, 'Failed to load users');
        }
    }

    /**
     * Display user profile for editing
     */
    displayUserProfile(user) {
        this.displayItemForEdit(user, {
            editTabSelector: '#profileEditTab',
            formFields: {
                adminServerAnswerTextarea: 'json' // Special case for JSON display
            }
        });
        // Handle JSON display
        this.elements.adminServerAnswerTextarea.value = JSON.stringify(user, null, 2);
        this.elements.adminProfileInfo.dataset.currentUserId = user.base?.id || user.id;
        // Populate roles input from top-level roles
        if (this.elements.adminRolesInput) {
            const roles = user.roles || [];
            this.elements.adminRolesInput.value = Array.isArray(roles) ? roles.join(', ') : '';
        }
    }

    /**
     * Handle user profile save
     */
    async handleUserSave() {
        const userIdToUpdate = this.elements.adminProfileInfo.dataset.currentUserId;
        if (!userIdToUpdate) {
            messages.showError('No user selected for saving.');
            return;
        }

        let updatedData;
        try {
            const parsedData = JSON.parse(this.elements.adminServerAnswerTextarea.value);
            // Read roles from input and add as top-level property
            let rolesArr = [];
            if (this.elements.adminRolesInput) {
                const rolesStr = this.elements.adminRolesInput.value.trim();
                rolesArr = rolesStr ? rolesStr.split(',').map(r => r.trim()).filter(Boolean) : [];
            }
            updatedData = {
                user_id: userIdToUpdate,
                base: parsedData.base,
                profile: parsedData.profile,
                roles: rolesArr // <-- top-level property
            };
        } catch (e) {
            console.error('Invalid JSON format:', e);
            messages.showError('Invalid JSON format.');
            return;
        }

        const response = await this.safeApiCall(
            () => ProfileAPI.update(updatedData),
            {
                loadingElements: [this.elements.adminSaveButton],
                loadingText: 'Saving...',
                operationName: 'Update User Profile',
                requestData: updatedData,
                successCallback: () => {
                    this.loadUsers();
                }
            }
        );

        this.handleApiResponse(response);
    }

    setupUserActions() {
        // Edit user buttons - use event delegation for robustness
        this.elements.userListContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.edit-user-btn');
            if (btn) {
                try {
                    const userData = JSON.parse(btn.getAttribute('data-user'));
                    this.displayUserProfile(userData);
                } catch (err) {
                    console.error('[UserManagement] Failed to parse user data:', err, btn.getAttribute('data-user'));
                    messages.showError('Failed to parse user data for editing.');
                }
            }
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
            messages.showError('Invalid user or action.');
            return;
        }

        if (!this.checkAuthentication()) {
            return;
        }

        const isActivating = action === 'activate';
        const btn = document.querySelector(`[data-user-id="${userId}"].toggle-user-btn`);
        
        const updateData = {
            user_id: userId,
            base: {
                is_active: isActivating
            }
        };

        const response = await this.safeApiCall(
            () => ProfileAPI.update(updateData),
            {
                loadingElements: btn ? [btn] : [],
                loadingText: isActivating ? 'Activating...' : 'Deactivating...',
                operationName: `Toggle User Status (${action})`,
                requestData: updateData,
                successCallback: () => {
                    if (this.elements.adminProfileInfo.dataset.currentUserId === userId) {
                        this.elements.profileEditTab.classList.add('d-none');
                    }
                    this.loadUsers();
                }
            }
        );

        this.handleApiResponse(response);
    }
}
