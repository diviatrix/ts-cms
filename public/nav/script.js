import { AuthAPI } from '../js/api-client.js';
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
    
    // Also try to initialize immediately if navigation is already loaded
    if (document.getElementById('navPlaceholder') && document.getElementById('navPlaceholder').innerHTML.trim() !== '') {
      setTimeout(() => this.init(), 0);
    }
  }

  /**
   * Get all navigation elements (called after navigation HTML is loaded)
   */
  getNavigationElements() {
    return {
      signOutButton: document.getElementById('signOutButton'),
      profileLink: document.getElementById('profileLink'),
      adminLink: document.getElementById('adminLink'),
      loginLink: document.getElementById('loginLink')
    };
  }

  /**
   * Initialize navigation
   */
  init() {
    // Get elements after navigation HTML is loaded
    this.elements = this.getNavigationElements();
    
    if (this.authAPI.isAuthenticated()) {
      this.setupAuthenticatedNavigation();
    } else {
      this.setupUnauthenticatedNavigation();
    }
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
      this.elements.signOutButton.addEventListener('click', () => {
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
   * Show element by removing d-none class
   */
  showElement(element) {
    if (element) {
      element.classList.remove('d-none');
    } else {
      console.warn('Attempted to show null element');
    }
  }

  /**
   * Hide element by adding d-none class
   */
  hideElement(element) {
    if (element) {
      element.classList.add('d-none');
    } else {
      console.warn('Attempted to hide null element');
    }
  }
}

// Initialize navigation controller
const navController = new NavigationController();

// Also try to initialize immediately in case navigation is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (document.getElementById('signOutButton')) {
        console.log('Navigation elements found after DOM loaded, initializing...');
        navController.init();
      }
    }, 100);
  });
} else {
  // DOM is already loaded
  setTimeout(() => {
    if (document.getElementById('signOutButton')) {
      console.log('Navigation elements found immediately, initializing...');
      navController.init();
    }
  }, 100);
}
