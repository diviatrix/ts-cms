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
    
    console.log('NavigationController constructor called');
    
    // Listen for navigation loaded event
    document.addEventListener('navigationLoaded', () => this.init());
    
    // Also try to initialize immediately if navigation is already loaded
    if (document.getElementById('navPlaceholder') && document.getElementById('navPlaceholder').innerHTML.trim() !== '') {
      console.log('Navigation already loaded, initializing immediately');
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
    console.log('Navigation controller initializing...');
    console.log('AuthAPI available:', !!this.authAPI);
    console.log('Is authenticated?', this.authAPI.isAuthenticated());
    
    // Get elements after navigation HTML is loaded
    this.elements = this.getNavigationElements();
    
    // Debug: log which elements were found
    console.log('Navigation elements found:', {
      signOutButton: !!this.elements.signOutButton,
      profileLink: !!this.elements.profileLink,
      adminLink: !!this.elements.adminLink,
      loginLink: !!this.elements.loginLink
    });
    
    if (this.authAPI.isAuthenticated()) {
      this.setupAuthenticatedNavigation();
    } else {
      this.setupUnauthenticatedNavigation();
    }
    
    console.log('Navigation controller initialized.');
  }

  /**
   * Setup navigation for authenticated users
   */
  setupAuthenticatedNavigation() {
    console.log('Setting up authenticated navigation...');
    const userRoles = this.getUserRoles();
    console.log('User roles:', userRoles);
    
    // Hide login link, show user-specific links
    this.hideElement(this.elements.loginLink);
    this.showElement(this.elements.profileLink);
    
    // Show admin link only for admin users
    if (userRoles.includes('admin')) {
      console.log('Showing admin link for admin user');
      this.showElement(this.elements.adminLink);
    } else {
      console.log('Hiding admin link for non-admin user');
      this.hideElement(this.elements.adminLink);
    }
    
    // Setup sign out functionality
    this.setupSignOutButton();
    console.log('Authenticated navigation setup complete');
  }

  /**
   * Setup navigation for unauthenticated users
   */
  setupUnauthenticatedNavigation() {
    console.log('Setting up unauthenticated navigation...');
    // Show login link, hide user-specific links
    this.showElement(this.elements.loginLink);
    this.hideElement(this.elements.profileLink);
    this.hideElement(this.elements.adminLink);
    this.hideElement(this.elements.signOutButton);
    console.log('Unauthenticated navigation setup complete');
  }

  /**
   * Get user roles from JWT token
   */
  getUserRoles() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in localStorage');
        return [];
      }
      
      console.log('Token found, decoding...');
      const decodedToken = jwtDecode(token);
      console.log('Decoded token:', decodedToken);
      
      const roles = decodedToken?.roles || decodedToken?.groups || [];
      console.log('Extracted roles:', roles);
      
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
    console.log('Setting up sign out button...');
    if (!this.elements.signOutButton) {
      console.error('Sign out button element not found!');
      return;
    }
    
    console.log('Sign out button found, making it visible...');
    this.showElement(this.elements.signOutButton);
    
    // Add click event listener (check if already has listener to avoid duplicates)
    if (!this.elements.signOutButton.hasAttribute('data-listener-added')) {
      console.log('Adding click listener to sign out button...');
      this.elements.signOutButton.addEventListener('click', () => {
        this.handleSignOut();
      });
      this.elements.signOutButton.setAttribute('data-listener-added', 'true');
      console.log('Sign out button setup complete');
    } else {
      console.log('Sign out button already has listener');
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
      console.log('Showing element:', element.id);
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
      console.log('Hiding element:', element.id);
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
