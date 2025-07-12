import { isAuthenticated, getUserRoles, setAuthToken } from './api-client.js';
import { Router } from './router.js';
import { NavBar } from '../controllers/components/nav-bar.js';
import { applyThemeFromAPI } from '../modules/theme-system.js';

class App {
    constructor() {
        this.user = {
            isAuthenticated: false,
            roles: []
        };
        this.router = new Router(this);
        this.navBar = null;
        // The init method will be called once the DOM is ready.
    }

    async init() {
        console.log('App initialized');
        
        // Apply theme first to prevent flash of unstyled content
        await applyThemeFromAPI();

        this.navBar = new NavBar(this);
        await this.navBar.init(); // Ensure NavBar is fully initialized
        this.updateAuthState();
        document.addEventListener('authChange', () => this.updateAuthState());
        this.router.route();
    }

    updateAuthState() {
        this.user.isAuthenticated = isAuthenticated();
        this.user.roles = getUserRoles();
        console.log('Authentication state updated:', this.user);
        // Dispatch a custom event that the nav menu can listen for.
        document.dispatchEvent(new CustomEvent('navShouldUpdate', { detail: this.user }));
    }

    login(token) {
        setAuthToken(token);
    }

    logout() {
        setAuthToken(null);
        window.location.href = '/';
    }
}

// Wait for the DOM to be fully loaded before starting the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});