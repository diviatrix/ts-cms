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
        
        const [themeResult] = await Promise.allSettled([
            applyThemeFromConfig(),
            this.initComponents()
        ]);
        
        this.updateAuthState();
        this.setupEventListeners();
        
        await this.router.init();
        this.router.route();
    }

    async initComponents() {
        this.navBar = new NavBar(this);
        await this.navBar.init();
        
        this.authDropdown = new AuthDropdown();
        await this.authDropdown.init();
    }

    setupEventListeners() {
        document.addEventListener('authChange', () => this.updateAuthState());
        document.addEventListener('authSuccess', (e) => this.authManager.handleAuthSuccess(e));
    }

    updateAuthState() {
        this.user.isAuthenticated = isAuthenticated();
        this.user.roles = getUserRoles();
        document.dispatchEvent(new CustomEvent('navShouldUpdate', { detail: this.user }));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});