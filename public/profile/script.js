import { ProfileAPI, AuthAPI } from '../js/api-client.js';
import { loadingManager, messages } from '../js/ui-utils.js';

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
      // JSON editor elements
      profileData: document.getElementById('profileData'),
      fetchButton: document.getElementById('fetchButton'),
      saveButton: document.getElementById('saveButton'),
      jsonValidation: document.getElementById('jsonValidation'),
      
      // Password change elements
      newPassword: document.getElementById('newPassword'),
      confirmPassword: document.getElementById('confirmPassword'),
      savePasswordButton: document.getElementById('savePasswordButton'),
      passwordMessage: document.getElementById('passwordMessage')
    };
    
    this.init();
  }

  /**
   * Initialize the profile page
   */
  async init() {
    // Simple auth check - if not authenticated, redirect to frontpage
    if (!this.authAPI.isAuthenticated()) {
      window.location.href = '/';
      return;
    }

    this.setupEventListeners();
    await this.loadProfile();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // JSON editor event listeners
    this.elements.fetchButton.addEventListener('click', () => this.loadProfile());
    this.elements.saveButton.addEventListener('click', () => this.saveProfile());
    this.elements.profileData.addEventListener('input', () => this.validateJson());
    
    // Password change event listeners
    this.elements.savePasswordButton.addEventListener('click', () => this.handlePasswordUpdate());
    this.elements.newPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handlePasswordUpdate();
      }
    });
    this.elements.confirmPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handlePasswordUpdate();
      }
    });
  }

  /**
   * Load profile data from API
   */
  async loadProfile() {
    try {
      loadingManager.setLoading(this.elements.fetchButton, true, 'Loading...');
      
      const response = await this.profileAPI.get();
      
      if (!response.success) {
        console.error('Error fetching profile:', response);
        messages.error(response.message || 'Failed to load profile', { toast: true });
        this.elements.profileData.value = '';
        return;
      }

      // Extract only the actual profile data from the API response
      const profileData = response.data || {};
      
      // Populate JSON editor with the profile data directly
      this.elements.profileData.value = JSON.stringify(profileData, null, 2);
      this.validateJson();
      messages.success('Profile loaded successfully', { toast: true });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      messages.error('Network error occurred. Please try again.', { toast: true });
      this.elements.profileData.value = '';
    } finally {
      loadingManager.setLoading(this.elements.fetchButton, false);
    }
  }

  /**
   * Save profile data to API
   */
  async saveProfile() {
    try {
      // Parse the user's JSON input (should be just the profile data)
      const userInputData = JSON.parse(this.elements.profileData.value);
      
      loadingManager.setLoading(this.elements.saveButton, true, 'Saving...');
      
      // Send the user input as the profile data payload
      const payload = { profile: userInputData };
      
      const response = await this.profileAPI.update(payload);
      
      if (response.success) {
        messages.success('Profile saved successfully', { toast: true });
        // Reload profile to show updated data
        await this.loadProfile();
      } else {
        messages.error(response.message || 'Failed to save profile', { toast: true });
      }
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        messages.error('Invalid JSON format. Please check the syntax and try again.', { toast: true });
      } else {
        console.error('Error saving profile:', error);
        messages.error('Network error occurred. Please try again.', { toast: true });
      }
    } finally {
      loadingManager.setLoading(this.elements.saveButton, false);
    }
  }

  /**
   * Validate JSON input and update UI
   */
  validateJson() {
    try {
      JSON.parse(this.elements.profileData.value);
      this.elements.jsonValidation.innerHTML = 
        '<div class="text-success small"><i class="fas fa-check-circle"></i> Valid JSON format</div>';
      this.elements.saveButton.disabled = false;
    } catch (error) {
      this.elements.jsonValidation.innerHTML = 
        `<div class="text-danger small"><i class="fas fa-exclamation-triangle"></i> Invalid JSON: ${error.message}</div>`;
      this.elements.saveButton.disabled = true;
    }
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
      loadingManager.setLoading(this.elements.savePasswordButton, true, 'Updating...');
      
      const response = await this.profileAPI.updatePassword({
        newPassword: newPassword
      });

      if (response.success) {
        messages.success('Password updated successfully', { toast: true });
        this.clearPasswordForm();
      } else {
        messages.error(response.message || 'Failed to update password', { toast: true });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      messages.error('Network error occurred. Please try again.', { toast: true });
    } finally {
      loadingManager.setLoading(this.elements.savePasswordButton, false);
    }
  }

  /**
   * Validate password input
   */
  validatePassword(newPassword, confirmPassword) {
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      messages.error('Passwords do not match.', { toast: true });
      return false;
    }

    // Check password length
    if (newPassword.length < 6) {
      messages.error('Password must be at least 6 characters long.', { toast: true });
      return false;
    }

    // Check if password is not empty
    if (!newPassword.trim()) {
      messages.error('Password cannot be empty.', { toast: true });
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ProfileController();
});
