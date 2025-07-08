import { AuthAPI } from '../js/api-auth.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';

/**
 * Navigation Controller
 * Handles dynamic navigation menu based on authentication state
 */
class NavigationController extends BasePageController {
  constructor() {
    super();
    
    this.authAPI = AuthAPI;
    this.elements = null; // Will be set after navigation loads
    
    // Listen for navigation loaded event
    document.addEventListener('navigationLoaded', () => this.init());
    // Always initialize on DOMContentLoaded, regardless of navPlaceholder
    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  /**
   * Get all navigation elements (called after navigation HTML is loaded)
   */
  getNavigationElements() {
    return {
      signOutButton: document.getElementById('signOutButton'),
      profileLink: document.getElementById('profileLink'),
      adminLink: document.getElementById('adminLink'),
      loginLink: document.getElementById('loginLink'),
      navbarToggle: document.getElementById('navbarToggle'),
      navbarNav: document.getElementById('navbarNav')
    };
  }

  /**
   * Initialize navigation
   */
  init() {
    // Get elements after navigation HTML is loaded
    this.elements = this.getNavigationElements();
    
    // Setup mobile navigation toggle
    this.setupMobileToggle();
    
    // Setup navigation based on authentication state
    if (this.authAPI?.isAuthenticated()) {
      this.setupAuthenticatedNavigation();
    } else {
      this.setupUnauthenticatedNavigation();
    }
  }

  /**
   * Setup mobile navigation toggle
   */
  setupMobileToggle() {
    if (!this.elements.navbarToggle || !this.elements.navbarNav) {
      return;
    }
    // Simple toggle for mobile nav
    this.elements.navbarToggle.addEventListener('click', () => {
      this.elements.navbarNav.classList.toggle('navmenu-visible');
    });
  }

  /**
   * Setup navigation for authenticated users
   */
  setupAuthenticatedNavigation() {
    const userRoles = this.getUserRoles();
    
    // Hide login link, show user-specific links
    this.hideElement(this.elements.loginLink);
    this.showElement(this.elements.profileLink);
    
    // Show admin link only for admin users
    if (userRoles.includes('admin')) {
      this.showElement(this.elements.adminLink);
    } else {
      this.hideElement(this.elements.adminLink);
    }
    
    // Setup sign out functionality
    this.setupSignOutButton();
  }

  /**
   * Setup navigation for unauthenticated users
   */
  setupUnauthenticatedNavigation() {
    // Show login link, hide user-specific links
    this.showElement(this.elements.loginLink);
    this.hideElement(this.elements.profileLink);
    this.hideElement(this.elements.adminLink);
    this.hideElement(this.elements.signOutButton);
  }

  /**
   * Get user roles from JWT token
   */
  getUserRoles() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return [];
      }
      
      const decodedToken = jwtDecode(token);
      const roles = decodedToken?.roles || decodedToken?.groups || [];
      
      return roles;
    } catch (error) {
      console.error('Error decoding token for role check:', error);
      return [];
    }
  }

  /**
   * Setup sign out button functionality
   */
  setupSignOutButton() {
    if (!this.elements.signOutButton) {
      console.error('Sign out button element not found!');
      return;
    }
    
    this.showElement(this.elements.signOutButton);
    
    // Add click event listener (check if already has listener to avoid duplicates)
    if (!this.elements.signOutButton.hasAttribute('data-listener-added')) {
      this.elements.signOutButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSignOut();
      });
      this.elements.signOutButton.setAttribute('data-listener-added', 'true');
    }
  }

  /**
   * Handle sign out action
   */
  handleSignOut() {
    try {
      this.authAPI.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if API call fails
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  }

  /**
   * Show element by removing hidden class
   */
  showElement(element) {
    if (element) {
      element.classList.remove('hidden');
    } else {
      console.warn('Attempted to show null element');
    }
  }

  /**
   * Hide element by adding hidden class
   */
  hideElement(element) {
    if (element) {
      element.classList.add('hidden');
    } else {
      console.warn('Attempted to hide null element');
    }
  }
}

// Create and export singleton instance
const navigationController = new NavigationController();

// Export for potential external use
export { NavigationController, navigationController };
