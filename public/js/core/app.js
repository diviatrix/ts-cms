import { isAuthenticated, getUserRoles } from './api-client.js';
import { Router } from './router.js';
import { NavBar } from '../controllers/components/nav-bar.js';
import { AuthDropdown } from '../components/auth-dropdown.js';
import { AuthManager } from '../services/auth-manager.js';
import { applyThemeFromConfig } from '../modules/theme-system.js';

class App {
  constructor() {
    this.user = {
      isAuthenticated: false,
      roles: []
    };
    this.router = new Router(this);
    this.navBar = null;
    this.authDropdown = null;
    this.authManager = new AuthManager(this);
  }

  async init() {
    // Make app globally available for Layout
    window.app = this;
        
    // Validate token with server on app start
    await this.validateTokenWithServer();
        
    const [themeResult] = await Promise.allSettled([
      applyThemeFromConfig(),
      this.initComponents(),
      this.loadCMSSettings()
    ]);
        
    await this.updateAuthState();
    this.setupEventListeners();
        
    await this.router.init();
    this.router.route();
  }
    
  async loadCMSSettings() {
    try {
      // Load both site_name and site_description in parallel from public endpoints
      const [nameResponse, descResponse] = await Promise.all([
        fetch('/api/cms/public/site-name'),
        fetch('/api/cms/public/site-description')
      ]);
            
      if (nameResponse.ok) {
        const nameResult = await nameResponse.json();
        if (nameResult.success && nameResult.data) {
          this.updateSiteName(nameResult.data.setting_value);
        }
      }
            
      if (descResponse.ok) {
        const descResult = await descResponse.json();
        if (descResult.success && descResult.data) {
          this.updateFooterText(descResult.data.setting_value);
        }
      }
    } catch (error) {
    }
  }
    
  updateSiteName(siteName) {
    const navbarBrand = document.querySelector('.navbar-brand .logo');
    if (navbarBrand && siteName) {
      navbarBrand.textContent = siteName;
    }
  }
    
  updateFooterText(description) {
    const footerText = document.querySelector('.footer-text');
    if (footerText && description) {
      footerText.textContent = description;
    }
  }
    
  async validateTokenWithServer() {
    const token = localStorage.getItem('session_token');
    if (!token) return;
        
    try {
      const res = await fetch('https://auth.hole.icu/session', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
            
      if (res.status === 401) {
        localStorage.removeItem('session_token');
        document.dispatchEvent(new CustomEvent('authChange'));
      } else if (res.ok) {
        const userData = await res.json();
        this.user.roles = [userData.role];
      }
    } catch {
      localStorage.removeItem('session_token');
      document.dispatchEvent(new CustomEvent('authChange'));
    }
  }

  async initComponents() {
    this.navBar = new NavBar(this);
    await this.navBar.init();
        
    this.authDropdown = new AuthDropdown();
    await this.authDropdown.init();
  }

  setupEventListeners() {
    document.addEventListener('authChange', () => this.updateAuthState());
    document.addEventListener('authSuccess', () => this.updateAuthState());
  }

  async updateAuthState() {
    this.user.isAuthenticated = await isAuthenticated();
        
    if (this.user.isAuthenticated) {
      this.user.roles = getUserRoles();
    } else {
      this.user.roles = [];
    }
        
    document.dispatchEvent(new CustomEvent('navShouldUpdate', { detail: this.user }));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});