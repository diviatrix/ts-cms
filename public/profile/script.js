import { ProfileAPI, AuthAPI } from '../js/api-client.js';
import { setImagePreview } from '../js/utils/image-preview.js';

/**
 * Profile Page Controller
 * Simple profile management for authenticated users
 */
class ProfileController {
  constructor() {
    this.profileAPI = ProfileAPI;
    this.authAPI = AuthAPI;
    
    // Get DOM elements
    this.elements = {
      // Profile form elements
      publicName: document.getElementById('publicName'),
      profilePictureUrl: document.getElementById('profilePictureUrl'),
      profilePicturePreview: document.getElementById('profilePicturePreview'),
      bio: document.getElementById('bio'),
      saveButton: document.getElementById('saveButton'),
      messageDiv: document.getElementById('messageDiv'),
      
      // Password change elements
      currentPassword: document.getElementById('currentPassword'),
      newPassword: document.getElementById('newPassword'),
      confirmPassword: document.getElementById('confirmPassword'),
      changePasswordButton: document.getElementById('changePasswordButton'),
      passwordMessageDiv: document.getElementById('passwordMessageDiv')
    };
    
    this.init();
  }

  async init() {
    if (!this.authAPI.isAuthenticated(messages)) {
      window.location.href = '/';
      return;
    }

    this.setupEventListeners();
    await this.loadProfile();
  }

  setupEventListeners() {
    this.setupTabs();

    this.elements.saveButton.addEventListener('click', () => this.saveProfile());
    this.elements.profilePictureUrl.addEventListener('input', () => setImagePreview(this.elements.profilePicturePreview, this.elements.profilePictureUrl.value, 'Profile picture preview'));
    this.elements.changePasswordButton.addEventListener('click', () => this.handlePasswordUpdate());
    this.elements.newPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { this.handlePasswordUpdate(); }
    });
    this.elements.confirmPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { this.handlePasswordUpdate(); }
    });
  }

  setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-header .btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabLinks.forEach((link, idx) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active from all
        tabLinks.forEach(l => l.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        // Add active to clicked
        link.classList.add('active');
        tabPanes[idx].classList.add('active');
      });
    });
  }

  async loadProfile() {
    try {
      const response = await this.profileAPI.get();
      
      if (!response.success) {
        console.error('Error fetching profile:', response);
        return;
      }

      // Extract profile data from the API response
      const profileData = response.data || {};
      
      // Populate form fields with profile data
      this.elements.publicName.value = profileData.public_name || '';
      this.elements.profilePictureUrl.value = profileData.profile_picture_url || '';
      this.elements.bio.value = profileData.bio || '';
      setImagePreview(this.elements.profilePicturePreview, this.elements.profilePictureUrl.value, 'Profile picture preview');
      
      console.log('Profile loaded successfully');
      
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async saveProfile() {
    try {
      // Get form data
      const profileData = {
        public_name: this.elements.publicName.value.trim(),
        profile_picture_url: this.elements.profilePictureUrl.value.trim(),
        bio: this.elements.bio.value.trim()
      };
      
      const response = await this.profileAPI.update({ profile: profileData });
      
      if (response.success) {
        console.log('Profile saved successfully');
        // Reload profile to show updated data
        await this.loadProfile();
      } else {
        console.error('Failed to save profile:', response.message);
      }
    } catch (error) { console.error('Error saving profile:', error); } 
  }

  /**
   * Handle password update
   */
  async handlePasswordUpdate() {
    const newPassword = this.elements.newPassword.value;
    const confirmPassword = this.elements.confirmPassword.value;

    if (!this.validatePassword(newPassword, confirmPassword)) {
      return;
    }

    try {
      const response = await this.profileAPI.updatePassword({
        newPassword: newPassword
      });
      if (response.success) {
        console.log('Password updated successfully');
        this.clearPasswordForm();
      } else {
        console.error('Failed to update password:', response.message);
      }
    } catch (error) {
      console.error('Error changing password:', error);
    } 
  }

  /**
   * Validate password input
   */
  validatePassword(newPassword, confirmPassword) {
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      console.error('Passwords do not match.');
      return false;
    }

    // Check password length
    if (newPassword.length < 6) {
      console.error('Password must be at least 6 characters long.');
      return false;
    }

    // Check if password is not empty
    if (!newPassword.trim()) {
      console.error('Password cannot be empty.');
      return false;
    }

    return true;
  }

  /**
   * Clear password form after successful update
   */
  clearPasswordForm() {
    this.elements.newPassword.value = '';
    this.elements.confirmPassword.value = '';
  }
}

document.addEventListener('navigationLoaded', () => {
  new ProfileController();
});
