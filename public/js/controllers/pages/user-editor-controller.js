import { AdminAPI, ProfileAPI, apiFetch } from '../../core/api-client.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';

export default class UserEditorController extends BasePageController {
    constructor(app) {
        super();
        this.app = app;
        this.container = document.getElementById('user-editor-container');
        this.userId = null;
        this.user = null;
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }

        // Get user ID from URL
        const params = new URLSearchParams(window.location.search);
        this.userId = params.get('id');

        if (!this.userId) {
            notifications.error('No user ID provided');
            setTimeout(() => window.location.href = '/users-manage', 1000);
            return;
        }

        await this.loadUser();
        this.render();
    }

    async loadUser() {
        await this.safeApiCall(
            () => AdminAPI.getUserProfile(this.userId),
            {
                successCallback: (response) => {
                    this.user = response.data;
                },
                errorCallback: () => {
                    notifications.error('Failed to load user');
                    setTimeout(() => window.location.href = '/users-manage', 1000);
                }
            }
        );
    }

    render() {
        if (!this.user) return;

        this.container.innerHTML = `
            <h2 class="page-title">Edit User: ${this.user.base?.login || 'Unknown'}</h2>
            
            <form id="userForm">
                <div class="card-grid">
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title">Base User Information</h3>
                            
                            <label for="userLogin">Username (ID: ${this.user.base?.id || ''})</label>
                            <input type="text" id="userLogin" value="${this.user.base?.login || ''}" disabled>
                            
                            <label for="userEmail">Email</label>
                            <input type="email" id="userEmail" value="${this.user.base?.email || ''}" required>
                            
                            <label class="checkbox-label">
                                <input type="checkbox" id="userActive" ${this.user.base?.is_active ? 'checked' : ''}>
                                Active Account
                            </label>
                            
                            <label for="userRoles">Roles (comma-separated)</label>
                            <input type="text" id="userRoles" value="${(this.user.profile?.roles || []).join(', ')}" placeholder="user, admin">
                            <small class="text-muted">Available roles: user, admin</small>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title">Profile Information</h3>
                            
                            <label for="userPublicName">Public Name</label>
                            <input type="text" id="userPublicName" value="${this.user.profile?.public_name || ''}" placeholder="Display name">
                            
                            <label for="userBio">Bio</label>
                            <textarea id="userBio" rows="4" placeholder="User biography">${this.user.profile?.bio || ''}</textarea>
                            
                            <label for="userAvatar">Profile Picture URL</label>
                            <input type="text" id="userAvatar" value="${this.user.profile?.profile_picture_url || ''}" placeholder="Avatar image URL">
                            
                            ${this.user.profile?.created_at || this.user.profile?.updated_at ? `
                                <div class="meta-row mt-2">
                                    ${this.user.profile?.created_at ? `<span class="text-muted">Profile created: ${new Date(this.user.profile.created_at).toLocaleDateString()}</span>` : ''}
                                    ${this.user.profile?.updated_at ? `<span class="text-muted">Profile updated: ${new Date(this.user.profile.updated_at).toLocaleDateString()}</span>` : ''}
                                </div>
                            ` : ''}
                            
                            <h3 class="card-title mt-2">Change Password</h3>
                            <label for="newPassword">New Password (leave empty to keep current)</label>
                            <input type="password" id="newPassword" placeholder="Enter new password">
                            
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" placeholder="Confirm new password">
                            
                            <div class="theme-actions mt-2">
                                <button type="submit" class="btn">Save Changes</button>
                                <a href="/users-manage" class="btn btn-secondary">Cancel</a>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        document.getElementById('userForm').addEventListener('submit', (e) => this.handleSubmit(e));
    }


    async handleSubmit(e) {
        e.preventDefault();

        // Prepare data according to API documentation
        const updateData = {
            user_id: this.userId,
            profile: {
                public_name: document.getElementById('userPublicName').value,
                profile_picture_url: document.getElementById('userAvatar').value,
                bio: document.getElementById('userBio').value
            },
            base: {
                email: document.getElementById('userEmail').value,
                is_active: document.getElementById('userActive').checked
            },
            roles: []
        };

        // Collect roles from text input
        const rolesInput = document.getElementById('userRoles').value;
        updateData.roles = rolesInput
            .split(',')
            .map(role => role.trim())
            .filter(role => role.length > 0);

        // Check password
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword) {
            if (newPassword !== confirmPassword) {
                notifications.error('Passwords do not match');
                return;
            }
            updateData.password = newPassword;
        }

        await this.safeApiCall(
            () => apiFetch('/api/profile', { method: 'POST', data: updateData }),
            {
                loadingElement: e.target.querySelector('button[type="submit"]'),
                successCallback: () => {
                    notifications.success('User updated successfully');
                    setTimeout(() => window.location.href = '/users-manage', 1000);
                },
                errorCallback: (response) => {
                    notifications.error(response.message || 'Failed to update user');
                }
            }
        );
    }
}