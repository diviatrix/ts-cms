import { isAuthenticated, getUserRoles, setAuthToken } from './api-client.js';
import { Router } from './router.js';
import { NavBar } from '../controllers/components/nav-bar.js';
import { applyThemeFromConfig } from '../modules/theme-system.js';

class App {
    constructor() {
        this.user = {
            isAuthenticated: false,
            roles: []
        };
        this.router = new Router(this);
        this.navBar = null;
    }

    async init() {
        const [themeResult] = await Promise.allSettled([
            applyThemeFromConfig(),
            this.initNavBar()
        ]);
        
        this.updateAuthState();
        document.addEventListener('authChange', () => this.updateAuthState());
        this.router.route();
    }

    async initNavBar() {
        this.navBar = new NavBar(this);
        await this.navBar.init();
    }

    updateAuthState() {
        this.user.isAuthenticated = isAuthenticated();
        this.user.roles = getUserRoles();
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

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});