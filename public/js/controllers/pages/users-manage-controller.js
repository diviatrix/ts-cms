import { AdminAPI } from '../../core/api-client.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';

export default class UsersManageController extends BasePageController {
    constructor(app) {
        super();
        this.app = app;
        this.container = document.getElementById('users-manage-container');
        this.users = [];
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        this.render();
        await this.loadUsers();
    }

    async loadUsers() {
        await this.safeApiCall(
            () => AdminAPI.getUsers(),
            {
                successCallback: (response) => {
                    // API returns nested structure: response.data contains the actual users array
                    if (response && response.data && Array.isArray(response.data)) {
                        this.users = response.data;
                    } else if (response && Array.isArray(response)) {
                        this.users = response;
                    } else {
                        this.users = [];
                    }
                    this.renderUsers();
                },
                errorCallback: () => {
                    notifications.error('Failed to load users');
                }
            }
        );
    }

    render() {
        this.container.innerHTML = `
            <h2 class="page-title">Manage Users</h2>
            <div id="usersList">
                <div class="text-center">
                    <p>Loading users...</p>
                </div>
            </div>
        `;
    }

    renderUsers() {
        const usersList = document.getElementById('usersList');
        
        if (!this.users.length) {
            usersList.innerHTML = '<p class="text-center">No users found</p>';
            return;
        }


        usersList.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Groups</th>
                                <th>Profile Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.users.map(user => `
                                <tr>
                                    <td><strong>${user.base.login}</strong></td>
                                    <td>${user.base.email}</td>
                                    <td>
                                        <span class="badge ${user.base.is_active ? 'badge-success' : 'badge-secondary'}">
                                            ${user.base.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>${user.profile.roles ? user.profile.roles.join(', ') : 'No groups'}</td>
                                    <td>${user.profile.created_at ? new Date(user.profile.created_at).toLocaleDateString() : '-'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="window.usersManageController.editUser('${user.base.id}')">
                                            Edit
                                        </button>
                                        <button class="btn btn-sm ${user.base.is_active ? 'btn-secondary' : 'btn-success'}" 
                                                onclick="window.usersManageController.toggleUserStatus('${user.base.id}', ${!user.base.is_active})">
                                            ${user.base.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Make controller available globally for onclick handlers
        window.usersManageController = this;
    }

    editUser(userId) {
        window.location.href = `/user-editor?id=${userId}`;
    }

    async toggleUserStatus(userId, newStatus) {
        const confirmMsg = newStatus 
            ? 'Are you sure you want to activate this user?' 
            : 'Are you sure you want to deactivate this user?';
            
        if (!confirm(confirmMsg)) return;

        await this.safeApiCall(
            () => AdminAPI.updateUserStatus(userId, newStatus),
            {
                loadingElement: document.querySelector(`[onclick*="${userId}"]`),
                successCallback: () => {
                    notifications.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
                    this.loadUsers();
                },
                errorCallback: () => {
                    notifications.error('Failed to update user status');
                }
            }
        );
    }
}