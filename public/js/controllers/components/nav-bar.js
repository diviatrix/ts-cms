export class NavBar {
    constructor(app) {
        this.app = app;
    }

    async init() {
        await this.injectNavbar();
        this.setupEventListeners();
        this.updateNavMenu(this.app.user);
    }

    async injectNavbar() {
        try {
            const existingNav = document.querySelector('.navbar');
            if (!existingNav) {
                const response = await fetch('/partials/navbar.html');
                if (!response.ok) throw new Error('Failed to load navbar partial.');
                const html = await response.text();
                document.body.insertAdjacentHTML('afterbegin', html);
            }
        } catch (error) {
            console.error('Error injecting navbar:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('navShouldUpdate', (e) => {
            this.updateNavMenu(e.detail);
        });

        const signOutButton = document.getElementById('signOutButton');
        if (signOutButton) {
            signOutButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.app.authManager.logout();
            });
        }
    }

    updateNavMenu(user) {
        const { isAuthenticated, roles } = user;

        const loginDropdownToggle = document.getElementById('loginDropdownToggle');
        const profileLink = document.getElementById('profileLink');
        const signOutButton = document.getElementById('signOutButton');
        const adminLink = document.getElementById('adminLink');

        if (loginDropdownToggle) loginDropdownToggle.parentElement.classList.toggle('hidden', isAuthenticated);
        if (profileLink) profileLink.parentElement.classList.toggle('hidden', !isAuthenticated);
        if (signOutButton) signOutButton.parentElement.classList.toggle('hidden', !isAuthenticated);
        if (adminLink) adminLink.parentElement.classList.toggle('hidden', !(isAuthenticated && roles.includes('admin')));
    }
}