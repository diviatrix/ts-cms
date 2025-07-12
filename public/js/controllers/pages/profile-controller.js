import { ProfileAPI } from '../../core/api-client.js';
import { setImagePreview } from '../../utils/image-preview.js';

/**
 * Profile Page Controller
 * Manages user profile updates.
 */
export default class ProfileController {
  constructor(app) {
    this.app = app;

    // Redirect if not authenticated
    if (!this.app.user.isAuthenticated) {
      window.location.href = '/';
      return;
    }
    
    // Get DOM elements
    this.elements = {
      publicName: document.getElementById('publicName'),
      profilePictureUrl: document.getElementById('profilePictureUrl'),
      profilePicturePreview: document.getElementById('profilePicturePreview'),
      bio: document.getElementById('bio'),
      saveButton: document.getElementById('saveButton'),
      messageDiv: document.getElementById('messageDiv'),
      
      newPassword: document.getElementById('newPassword'),
      confirmPassword: document.getElementById('confirmPassword'),
      changePasswordButton: document.getElementById('changePasswordButton'),
      passwordMessageDiv: document.getElementById('passwordMessageDiv')
    };
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadProfile();
  }

  setupEventListeners() {
    this.setupTabs();

    this.elements.saveButton.addEventListener('click', () => this.saveProfile());
    this.elements.profilePictureUrl.addEventListener('input', () => setImagePreview(this.elements.profilePicturePreview, this.elements.profilePictureUrl.value, 'Profile picture preview'));
    
    // TODO: Re-enable password update when API endpoint is confirmed.
    // this.elements.changePasswordButton.addEventListener('click', () => this.handlePasswordUpdate());
  }

  setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-header .btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabLinks.forEach((link, idx) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        tabLinks.forEach(l => l.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        link.classList.add('active');
        tabPanes[idx].classList.add('active');
      });
    });
  }

  async loadProfile() {
    try {
      const response = await ProfileAPI.get();
      
      if (!response.success) {
        console.error('Error fetching profile:', response);
        this.elements.messageDiv.textContent = response.message || 'Failed to load profile.';
        return;
      }

      const profileData = response.data || {};
      
      this.elements.publicName.value = profileData.public_name || '';
      this.elements.profilePictureUrl.value = profileData.profile_picture_url || '';
      this.elements.bio.value = profileData.bio || '';
      setImagePreview(this.elements.profilePicturePreview, this.elements.profilePictureUrl.value, 'Profile picture preview');
      
    } catch (error) {
      console.error('Error loading profile:', error);
      this.elements.messageDiv.textContent = 'An error occurred while loading your profile.';
    }
  }

  async saveProfile() {
    this.elements.messageDiv.textContent = 'Saving...';
    try {
      const profileData = {
        public_name: this.elements.publicName.value.trim(),
        profile_picture_url: this.elements.profilePictureUrl.value.trim(),
        bio: this.elements.bio.value.trim()
      };
      
      // The API documentation specifies PUT for self-update.
      const response = await ProfileAPI.update({ profile: profileData });
      
      if (response.success) {
        this.elements.messageDiv.textContent = 'Profile saved successfully!';
        await this.loadProfile(); // Refresh data
      } else {
        this.elements.messageDiv.textContent = response.message || 'Failed to save profile.';
        console.error('Failed to save profile:', response);
      }
    } catch (error) { 
        console.error('Error saving profile:', error);
        this.elements.messageDiv.textContent = 'An error occurred while saving your profile.';
    } 
  }

  // --- Password Update (Currently Disabled) ---
  /*
  async handlePasswordUpdate() {
    const newPassword = this.elements.newPassword.value;
    const confirmPassword = this.elements.confirmPassword.value;

    if (!this.validatePassword(newPassword, confirmPassword)) {
      return;
    }

    this.elements.passwordMessageDiv.textContent = 'Updating...';
    try {
      // TODO: This endpoint is not in the documentation. Confirm and re-enable.
      const response = await ProfileAPI.updatePassword({
        newPassword: newPassword
      });
      if (response.success) {
        this.elements.passwordMessageDiv.textContent = 'Password updated successfully.';
        this.clearPasswordForm();
      } else {
        this.elements.passwordMessageDiv.textContent = response.message || 'Failed to update password.';
      }
    } catch (error) {
      console.error('Error changing password:', error);
      this.elements.passwordMessageDiv.textContent = 'An error occurred.';
    } 
  }

  validatePassword(newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
      this.elements.passwordMessageDiv.textContent = 'Passwords do not match.';
      return false;
    }
    if (newPassword.length < 6) {
      this.elements.passwordMessageDiv.textContent = 'Password must be at least 6 characters long.';
      return false;
    }
    if (!newPassword.trim()) {
      this.elements.passwordMessageDiv.textContent = 'Password cannot be empty.';
      return false;
    }
    return true;
  }

  clearPasswordForm() {
    this.elements.newPassword.value = '';
    this.elements.confirmPassword.value = '';
  }
  */
}
