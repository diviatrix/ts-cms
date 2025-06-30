import { ProfileAPI, AuthAPI } from '../js/api-client.js';
import { MessageDisplay, loadingManager, errorHandler } from '../js/ui-utils.js';

/**
 * Profile Page Controller
 * Simple profile management for authenticated users
 */
class ProfileController {
  constructor() {
    this.profileAPI = ProfileAPI;
    this.authAPI = AuthAPI;
    
    // Create message display
    const messageDiv = document.getElementById('messageDiv');
    this.message = new MessageDisplay(messageDiv);
    
    // Get DOM elements
    this.elements = {
      // JSON editor elements
      profileData: document.getElementById('profileData'),
      fetchButton: document.getElementById('fetchButton'),
      saveButton: document.getElementById('saveButton'),
      jsonValidation: document.getElementById('jsonValidation')
    };
    
    this.init();
  }

  /**
   * Initialize the profile page
   */
  async init() {
    // Simple auth check - if not authenticated, redirect to login
    if (!this.authAPI.isAuthenticated()) {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
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
  }

  /**
   * Load profile data from API
   */
  async loadProfile() {
    try {
      this.message.hide();
      loadingManager.setLoading(this.elements.fetchButton, true, 'Loading...');
      
      const response = await this.profileAPI.get();
      
      if (!response.success) {
        console.error('Error fetching profile:', response);
        this.message.showApiResponse(response);
        this.elements.profileData.value = '';
        return;
      }

      // Extract only the actual profile data from the API response
      const profileData = response.data || {};
      
      // Populate JSON editor with only the data
      this.elements.profileData.value = JSON.stringify(profileData.data, null, 2);
      this.validateJson();
      this.message.showSuccess('Profile loaded successfully');
      
    } catch (error) {
      console.error('Error loading profile:', error);
      errorHandler.handleNetworkError(error, this.message);
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
      
      this.message.hide();
      loadingManager.setLoading(this.elements.saveButton, true, 'Saving...');
      
      // Send the user input as the profile data payload
      const payload = { profile: userInputData };
      
      const response = await this.profileAPI.update(payload);
      
      this.message.showApiResponse(response);
      
      if (response.success) {
        // Reload profile to show updated data
        await this.loadProfile();
      }
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.message.showError('Invalid JSON format. Please check the syntax and try again.');
      } else {
        console.error('Error saving profile:', error);
        errorHandler.handleNetworkError(error, this.message);
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ProfileController();
});
