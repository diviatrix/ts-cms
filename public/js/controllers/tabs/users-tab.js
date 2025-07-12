import { AdminAPI, ProfileAPI, isAuthenticated } from '../../core/api-client.js';
import { BaseTabController } from './base-tab-controller.js';
import { TabManager } from '../../components/tab-manager.js';
import { renderCard } from '../../utils/ui-snippets.js';

export class UsersTab extends BaseTabController {
    constructor(container) {
        super(container, '/partials/users-tab.html');
        this.allUsers = [];
        this.elements = {};
        this.mainTabManager = null;
        this.filterTabManager = null;
    }

    async init() {
        await this.loadUsers();
        this.setupMainTabs();
        this.setupEventListeners();
    }

    setupMainTabs() {
        const mainTabsContainer = this.container.querySelector('#user-management-tabs');
        const config = {
            initialTab: 'active',
            tabs: [
                {
                    id: 'active',
                    label: 'Active',
                    loader: (panel) => {
                        panel.innerHTML = '';
                        panel.className = 'tab-pane';
                        panel.dataset.tabPanel = 'active';
                        this.renderUsers(this.getFilteredUsers(true), panel);
                    }
                },
                {
                    id: 'inactive',
                    label: 'Inactive',
                    loader: (panel) => {
                        panel.innerHTML = '';
                        panel.className = 'tab-pane';
                        panel.dataset.tabPanel = 'inactive';
                        this.renderUsers(this.getFilteredUsers(false), panel);
                    }
                },
                {
                    id: 'edit',
                    label: 'Edit User',
                    loader: (panel) => {
                        panel.innerHTML = this.renderEditUserForm();
                        panel.className = 'tab-pane';
                        panel.dataset.tabPanel = 'edit';
                        // Cache elements for editing
                        this.elements.adminServerAnswerTextarea = panel.querySelector('#adminServerAnswerTextarea');
                        this.elements.adminProfileInfo = panel.querySelector('#adminProfileInfo');
                        this.elements.adminRolesInput = panel.querySelector('#adminRolesInput');
                        this.elements.adminMessageDiv = panel.querySelector('#adminMessageDiv');
                    }
                }
            ]
        };
        this.mainTabManager = new TabManager(mainTabsContainer, config);
        this.mainTabManager.navContainer.querySelector('[data-tab-id="edit"]').style.display = 'none';
    }

    renderEditUserForm(user = null) {
        // Render the edit form, optionally with user data
        const userJson = user ? JSON.stringify(user, null, 2) : '';
        const roles = user && user.roles ? user.roles.join(', ') : '';
        return `
      <div id="profileEditTab" class="card">
        <h2 class="card-title">Edit User Profile</h2>
        <div id="adminProfileInfo" data-current-user-id="${user?.base?.id || user?.id || ''}">
          <div class="field">
            <label for="adminServerAnswerTextarea">Server Answer (editable JSON):</label>
            <textarea id="adminServerAnswerTextarea" rows="16">${userJson}</textarea>
          </div>
          <div class="field">
            <label for="adminRolesInput">Groups/Roles (comma-separated):</label>
            <input type="text" id="adminRolesInput" value="${roles}" placeholder="e.g. admin,user,editor">
          </div>
        </div>
        <div class="meta-row">
          <button id="adminSaveButton" class="btn">Save Changes</button>
          <button id="adminCancelButton" class="btn">Cancel</button>
        </div>
        <div id="adminMessageDiv"></div>
      </div>
        `;
    }

    async loadUsers() {
        if (!isAuthenticated()) return;
        console.log('[UsersTab] Calling AdminAPI.getUsers...');
        const response = await AdminAPI.getUsers();
        console.log('[UsersTab] AdminAPI.getUsers response:', response);
        // Support nested data structure
        const usersArr = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
        this.allUsers = usersArr;
        // Always activate the current or default to 'active' tab after loading users
        if (this.mainTabManager) {
            const tabId = this.mainTabManager.activeTabId || 'active';
            this.mainTabManager.activateTab(tabId);
        }
    }

    getFilteredUsers(isActive) {
        // Defensive: log and check structure
        console.log('[UsersTab] getFilteredUsers called, isActive:', isActive, 'allUsers:', this.allUsers);
        // Try to support both flat and nested user objects
        return this.allUsers.filter(user => {
            // If user.base exists, use user.base.is_active, else use user.is_active
            const active = user.base && typeof user.base.is_active !== 'undefined'
                ? user.base.is_active
                : user.is_active;
            return active === isActive;
        });
    }

    renderUsers(users, panel) {
        console.log('[UsersTab] renderUsers called, users:', users, 'panel:', panel);
        if (!panel) return;
        if (users.length === 0) {
            panel.innerHTML = '<p>No users found.</p>';
            return;
        }
        // Create a grid container for user cards
        const grid = document.createElement('div');
        grid.className = 'card-grid';
        users.forEach(user => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'card-grid-item';
            cardWrapper.innerHTML = this.renderUserCard(user);
            // If you need to initialize card-specific logic, do it here
            // e.g., this.initUserCard(cardWrapper, user);
            grid.appendChild(cardWrapper);
        });
        panel.innerHTML = '';
        panel.appendChild(grid);
    }

    renderUserCard(user) {
        // Use actual user structure: user.base, user.profile, user.roles
        const login = user.base?.login || user.login || 'Unknown';
        const email = user.base?.email || user.email || '';
        const isActive = user.base?.is_active ?? user.is_active;
        const roles = (user.roles || []).join(', ');
        const createdAt = user.base?.created_at || user.created_at || '';
        const actionButton = isActive
            ? `<button class="btn toggle-user-btn" data-user-id="${user.base?.id || user.id}" data-action="deactivate" title="Deactivate">🚫</button>`
            : `<button class="btn toggle-user-btn" data-user-id="${user.base?.id || user.id}" data-action="activate" title="Activate">✅</button>`;
        return `
            <div class="card">
                <div class="admin-card-title">
                    <strong>${login}</strong> <span style="color: #888;">${email}</span>
                </div>
                <div class="admin-card-meta">
                    <span>${isActive ? 'Active' : 'Inactive'}</span>
                    <span>Roles: ${roles}</span>
                    <span style="flex: 1"></span>
                    <button class="btn edit-user-btn" data-user='${JSON.stringify(user)}'>Edit</button>
                    ${actionButton}
                </div>
                <div class="meta-row">
                    <small>Created: ${createdAt ? new Date(createdAt).toLocaleDateString() : ''}</small>
                </div>
            </div>
        `;
    }

    displayUserProfile(user) {
        // Show the edit tab and activate it
        const editTabBtn = this.mainTabManager.navContainer.querySelector('[data-tab-id="edit"]');
        if (editTabBtn) editTabBtn.style.display = '';
        // Activate the edit tab and render the form with user data
        this.mainTabManager.activateTab('edit');
        const editPanel = this.container.querySelector('[data-tab-panel="edit"]');
        if (editPanel) {
            editPanel.innerHTML = this.renderEditUserForm(user);
            this.elements.adminServerAnswerTextarea = editPanel.querySelector('#adminServerAnswerTextarea');
            this.elements.adminProfileInfo = editPanel.querySelector('#adminProfileInfo');
            this.elements.adminRolesInput = editPanel.querySelector('#adminRolesInput');
            this.elements.adminMessageDiv = editPanel.querySelector('#adminMessageDiv');
        }
    }

    async handleUserSave() {
        const userId = this.elements.adminProfileInfo.dataset.currentUserId;
        if (!userId) return;

        let updatedData;
        try {
            const parsedData = JSON.parse(this.elements.adminServerAnswerTextarea.value);
            const roles = this.elements.adminRolesInput.value.trim().split(',').map(r => r.trim()).filter(Boolean);
            updatedData = {
                user_id: userId,
                base: parsedData.base,
                profile: parsedData.profile,
                roles: roles
            };
        } catch (e) {
            console.error('Invalid JSON in textarea:', e);
            console.log('Error: Invalid JSON format.');
            return;
        }

        const response = await ProfileAPI.adminUpdate(userId, updatedData);
        if (response.success) {
            console.log('User updated successfully.');
            await this.loadUsers(); // Reload all data
            this.mainTabManager.activateTab('list');
        } else {
            console.log(`Failed to update user: ${response.message}`);
        }
    }

    async handleUserToggle(userId, action) {
        const isActivating = action === 'activate';
        const updateData = { base: { is_active: isActivating } };

        const response = await ProfileAPI.adminUpdate(userId, updateData);
        if (response.success) {
            console.log(`User ${isActivating ? 'activated' : 'deactivated'} successfully.`);
            await this.loadUsers(); // Reload all data
        } else {
            console.log(`Failed to ${action} user: ${response.message}`);
        }
    }

    setupEventListeners() {
        // Delegated event handling for user card actions
        this.container.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-user-btn');
            const toggleBtn = e.target.closest('.toggle-user-btn');
            const saveBtn = e.target.closest('#adminSaveButton');
            const cancelBtn = e.target.closest('#adminCancelButton');

            if (editBtn) {
                // Parse user data from data attribute
                let user;
                try {
                    user = JSON.parse(editBtn.dataset.user);
                } catch (err) {
                    console.error('Failed to parse user data for edit:', err);
                    return;
                }
                this.displayUserProfile(user);
            } else if (toggleBtn) {
                const userId = toggleBtn.dataset.userId;
                const action = toggleBtn.dataset.action;
                this.handleToggleUser(userId, action);
            } else if (saveBtn) {
                this.handleSaveUser();
            } else if (cancelBtn) {
                // Hide edit tab and return to previous tab (default to 'active')
                const editTabBtn = this.mainTabManager.navContainer.querySelector('[data-tab-id="edit"]');
                if (editTabBtn) editTabBtn.style.display = 'none';
                this.mainTabManager.activateTab('active');
            }
        });
    }

    // Cleanup method for tab switching
    destroy() {
        this.elements = {};
        if (this.filterTabManager && typeof this.filterTabManager.destroy === 'function') {
            this.filterTabManager.destroy();
            this.filterTabManager = null;
        }
    }
}