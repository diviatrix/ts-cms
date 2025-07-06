import { ProfileAPI, AuthAPI } from '../js/api-client.js';
import { loadingManager, messages } from '../js/ui-utils.js';
import { initResponseLog } from '/js/shared-components/response-log-init.js';
import { jwtDecode } from '../js/jwt-decode.js';

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

    // Admin check and log init after async work
    let isAdmin = false;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        isAdmin = decoded?.roles?.includes('admin');
      }
    } catch {}
    if (isAdmin) {
      initResponseLog();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab functionality
    this.setupTabs();
    
    // Profile form event listeners
    this.elements.saveButton.addEventListener('click', () => this.saveProfile());
    
    // Password change event listeners
    this.elements.changePasswordButton.addEventListener('click', () => this.handlePasswordUpdate());
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
   * Setup tab functionality without Bootstrap
   */
  setupTabs() {
    const tabButtons = document.querySelectorAll('#profileTab .nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });
        tabPanes.forEach(pane => {
          pane.classList.remove('show', 'active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        
        // Show corresponding pane
        const targetId = button.getAttribute('data-bs-target') || button.getAttribute('href');
        const targetPane = document.querySelector(targetId);
        if (targetPane) {
          targetPane.classList.add('show', 'active');
        }
      });
    });
  }

  /**
   * Load profile data from API
   */
  async loadProfile() {
    try {
      const response = await this.profileAPI.get();
      
      if (!response.success) {
        console.error('Error fetching profile:', response);
        messages.error(response.message || 'Failed to load profile', { toast: true });
        return;
      }

      // Extract profile data from the API response
      const profileData = response.data || {};
      
      // Populate form fields with profile data
      this.elements.publicName.value = profileData.public_name || '';
      this.elements.profilePictureUrl.value = profileData.profile_picture_url || '';
      this.elements.bio.value = profileData.bio || '';
      
      messages.success('Profile loaded successfully', { toast: true });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      messages.error('Network error occurred. Please try again.', { toast: true });
    }
  }

  /**
   * Save profile data to API
   */
  async saveProfile() {
    try {
      // Get form data
      const profileData = {
        public_name: this.elements.publicName.value.trim(),
        profile_picture_url: this.elements.profilePictureUrl.value.trim(),
        bio: this.elements.bio.value.trim()
      };
      
      loadingManager.setLoading(this.elements.saveButton, true, 'Saving...');
      
      const response = await this.profileAPI.update(profileData);
      
      if (response.success) {
        messages.success('Profile saved successfully', { toast: true });
        // Reload profile to show updated data
        await this.loadProfile();
      } else {
        messages.error(response.message || 'Failed to save profile', { toast: true });
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      messages.error('Network error occurred. Please try again.', { toast: true });
    } finally {
      loadingManager.setLoading(this.elements.saveButton, false);
    }
  }

  /**
   * Handle password update
   */
  async handlePasswordUpdate() {
    const currentPassword = this.elements.currentPassword.value;
    const newPassword = this.elements.newPassword.value;
    const confirmPassword = this.elements.confirmPassword.value;

    if (!this.validatePassword(newPassword, confirmPassword)) {
      return;
    }

    try {
      loadingManager.setLoading(this.elements.changePasswordButton, true, 'Updating...');
      
      const response = await this.profileAPI.updatePassword({
        currentPassword: currentPassword,
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
      loadingManager.setLoading(this.elements.changePasswordButton, false);
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
    this.elements.currentPassword.value = '';
    this.elements.newPassword.value = '';
    this.elements.confirmPassword.value = '';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ProfileController();
});
