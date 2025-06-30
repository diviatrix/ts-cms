import { ProfileAPI, AuthAPI } from '../js/api-client.js';
import { MessageDisplay, FormValidator, loadingManager } from '../js/ui-utils.js';
import { ProtectedPageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';

/**
 * Password Reset Page Controller
 * Handles password updates for authenticated users
 */
class PasswordResetController extends ProtectedPageController {
  constructor() {
    const messageDiv = document.getElementById('passwordMessage');
    
    super({ 
      messageDiv,
      authAPI: AuthAPI,
      requiredRole: null // Any authenticated user can access
    });
    
    this.newPasswordInput = document.getElementById('newPassword');
    this.savePasswordButton = document.getElementById('savePasswordButton');
    this.profileAPI = ProfileAPI;
    
    this.targetUserId = this.determineTargetUserId();
    this.setupEventListeners();
  }

  /**
   * Determine which user's password to update
   */
  determineTargetUserId() {
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const authenticatedUserId = decodedToken?.id;
    const isAdmin = decodedToken?.roles?.includes('admin') || false;
    
    // Check if admin is updating another user's password
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('userId');
    
    if (isAdmin && userIdFromUrl) {
      return userIdFromUrl;
    }
    
    return authenticatedUserId;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.savePasswordButton.addEventListener('click', () => this.handlePasswordUpdate());
    
    // Handle Enter key in password field
    this.newPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handlePasswordUpdate();
      }
    });
  }

  /**
   * Handle password update
   */
  async handlePasswordUpdate() {
    const newPassword = this.newPasswordInput.value;

    if (!this.validatePassword(newPassword)) {
      return;
    }

    try {
      this.loadingManager.setLoading(this.savePasswordButton, true, 'Saving...');
      
      const response = await this.profileAPI.updatePassword({
        userId: this.targetUserId,
        newPassword: newPassword
      });

      this.message.showApiResponse(response);
      
      if (response.success) {
        this.clearForm();
      }
    } catch (error) {
      console.error('Error changing password:', error);
      this.errorHandler.handleNetworkError(error, this.message);
    } finally {
      this.loadingManager.setLoading(this.savePasswordButton, false);
    }
  }

  /**
   * Validate password input
   */
  validatePassword(password) {
    const requiredErrors = FormValidator.validateRequired([
      { element: this.newPasswordInput, name: 'Password' }
    ]);
    
    const passwordErrors = FormValidator.validatePassword(this.newPasswordInput);
    const allErrors = [...requiredErrors, ...passwordErrors];
    
    if (allErrors.length > 0) {
      this.message.showError(allErrors.join(', '));
      return false;
    }
    
    return true;
  }

  /**
   * Clear form after successful update
   */
  clearForm() {
    this.newPasswordInput.value = '';
    FormValidator.removeErrorClass(this.newPasswordInput);
  }
}

// Initialize the password reset controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PasswordResetController();
});