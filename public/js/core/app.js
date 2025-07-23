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
            this.initComponents()
        ]);
        
        this.updateAuthState();
        this.setupEventListeners();
        
        await this.router.init();
        this.router.route();
    }
    
    async validateTokenWithServer() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Check if token contains only valid characters for HTTP headers
        try {
            // Try to encode the token - if it contains invalid characters, this will help detect it
            const encoder = new TextEncoder();
            encoder.encode(token);
            
            // Check if token contains only ASCII characters
            if (!/^[\x00-\x7F]*$/.test(token)) {
                console.log('Token contains invalid characters, removing...');
                localStorage.removeItem('token');
                document.dispatchEvent(new CustomEvent('authChange'));
                return;
            }
            
            // Make a simple authenticated request to validate token
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                console.log('Token invalid on server, removing...');
                localStorage.removeItem('token');
                document.dispatchEvent(new CustomEvent('authChange'));
            }
        } catch (error) {
            console.error('Token validation error:', error);
            // If any error occurs (including header encoding), remove the token
            localStorage.removeItem('token');
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
        document.addEventListener('authSuccess', (e) => this.authManager.handleAuthSuccess(e));
    }

    updateAuthState() {
        // Check authentication first
        this.user.isAuthenticated = isAuthenticated();
        
        // Only get roles if still authenticated (token wasn't removed)
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