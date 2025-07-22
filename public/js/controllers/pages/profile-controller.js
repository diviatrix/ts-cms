import { ProfileAPI } from '../../core/api-client.js';
import { ImagePreview } from '../../components/image-preview.js';
import { notifications } from '../../modules/notifications.js';

export default class ProfileController {
    constructor(app) {
        this.app = app;
        this.profileAPI = ProfileAPI;
        this.container = document.getElementById('profileContent');
        this.init();
    }

    async init() {
        if (!this.app.user.isAuthenticated) {
            window.location.href = '/';
            return;
        }
        await this.loadProfile();
    }

    async loadProfile() {
        try {
            const response = await this.profileAPI.get();
            if (response.success) {
                this.renderProfile(response.data);
            } else {
                notifications.error(response.message || 'Failed to load profile');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            notifications.error('Failed to connect to server');
        }
    }

    renderProfile(profile) {
        const createdAt = profile.created_at ? profile.created_at.replace(/^"|"$/g, '') : null;
        
        this.container.innerHTML = `
            <h2 class="page-title">Profile Settings</h2>
            <div class="meta-row">
                <span>Member since: ${createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
            
            <div class="card-grid">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Edit Profile</h3>
                        <form id="profileForm">
                            <div class="form-row">
                                <div class="form-row-flex">
                                    <label for="profilePictureUrl">Profile Picture URL</label>
                                    <input type="text" id="profilePictureUrl" value="${profile.profile_picture_url || ''}" placeholder="https://example.com/avatar.jpg">
                                    <small class="form-hint">Enter a URL to an image</small>
                                </div>
                                <div id="avatarPreview"></div>
                            </div>
                            
                            <label for="publicName">Public Name</label>
                            <input type="text" id="publicName" value="${profile.public_name || ''}" placeholder="Display name for posts">
                            
                            <label for="bio">Bio</label>
                            <textarea id="bio" rows="4" placeholder="Tell us about yourself">${profile.bio || ''}</textarea>
                            
                            <button type="submit" class="btn">Update Profile</button>
                        </form>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Change Password</h3>
                        <form id="passwordForm">
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" required>
                            
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" required>
                            
                            <button type="submit" class="btn">Change Password</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('profileForm').addEventListener('submit', (e) => this.handleProfileUpdate(e));
        document.getElementById('passwordForm').addEventListener('submit', (e) => this.handlePasswordChange(e));
        
        this.avatarPreview = new ImagePreview('avatarPreview', { className: 'avatar-preview' });
        if (profile.profile_picture_url) {
            this.avatarPreview.update(profile.profile_picture_url);
        }
        
        const avatarInput = document.getElementById('profilePictureUrl');
        if (avatarInput) {
            avatarInput.addEventListener('input', (e) => this.avatarPreview.update(e.target.value));
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const formData = {
            public_name: document.getElementById('publicName').value,
            bio: document.getElementById('bio').value,
            profile_picture_url: document.getElementById('profilePictureUrl').value
        };

        try {
            const response = await this.profileAPI.update(formData);
            if (response.success) {
                notifications.success('Profile updated successfully');
            } else {
                notifications.error(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            notifications.error('Failed to connect to server');
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            notifications.error('Passwords do not match');
            return;
        }

        try {
            const response = await this.profileAPI.changePassword(newPassword);
            if (response.success) {
                notifications.success('Password changed successfully');
                document.getElementById('passwordForm').reset();
            } else {
                notifications.error(response.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            notifications.error('Failed to connect to server');
        }
    }
}