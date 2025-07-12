import { AuthAPI } from '../../core/api-client.js';

export class NavBar {
    constructor(app) {
        this.app = app;
        // init() is now called externally by app.js
    }

    async init() {
        await this.injectDropdown();
        // Now that the dropdown is injected, we can safely set up listeners and update the UI.
        this.setupEventListeners();
        this.updateNavMenu(this.app.user);
    }

    async injectDropdown() {
        try {
            const response = await fetch('/partials/login-dropdown.html');
            if (!response.ok) throw new Error('Failed to load login dropdown partial.');
            const html = await response.text();
            const loginDropdownToggle = document.getElementById('loginDropdownToggle');
            if (loginDropdownToggle) {
                const li = loginDropdownToggle.closest('li');
                if (li) {
                    li.insertAdjacentHTML('beforeend', html);
                }
            }
        } catch (error) {
            console.error('Error injecting dropdown:', error);
        }
    }

    setupEventListeners() {
        // Listen for auth state changes from the main app
        document.addEventListener('navShouldUpdate', (e) => {
            this.updateNavMenu(e.detail);
        });

        // The rest of the listeners depend on the dropdown being injected.
        // We use event delegation on a parent element to handle events for
        // elements that may not exist when this code first runs.
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        navbar.addEventListener('click', (e) => {
            // Toggle Dropdown
            if (e.target.matches('#loginDropdownToggle')) {
                e.preventDefault();
                const loginDropdownMenu = document.getElementById('loginDropdownMenu');
                if (loginDropdownMenu) {
                    loginDropdownMenu.style.display = loginDropdownMenu.style.display === 'block' ? 'none' : 'block';
                }
            }

            // Sign Out
            if (e.target.matches('#signOutButton')) {
                e.preventDefault();
                this.app.logout();
            }

            // Tab Switching
            const loginTabBtn = document.getElementById('loginTabBtn');
            const registerTabBtn = document.getElementById('registerTabBtn');
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');

            if (e.target.matches('#loginTabBtn')) {
                e.preventDefault();
                loginTabBtn.classList.add('active');
                registerTabBtn.classList.remove('active');
                loginForm.style.display = '';
                registerForm.style.display = 'none';
            }

            if (e.target.matches('#registerTabBtn')) {
                e.preventDefault();
                loginTabBtn.classList.remove('active');
                registerTabBtn.classList.add('active');
                loginForm.style.display = 'none';
                registerForm.style.display = '';
            }
        });

        // Handle form submissions
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Hide dropdown if clicked outside
        document.addEventListener('click', (e) => {
            const loginDropdownMenu = document.getElementById('loginDropdownMenu');
            const loginDropdownToggle = document.getElementById('loginDropdownToggle');
            if (loginDropdownMenu && !loginDropdownMenu.contains(e.target) && e.target !== loginDropdownToggle) {
                loginDropdownMenu.style.display = 'none';
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const loginDropdownMessage = document.getElementById('loginDropdownMessage');
        const login = document.getElementById('loginInput').value.trim();
        const password = document.getElementById('passwordInput').value;
        if (!login || !password) {
            loginDropdownMessage.textContent = 'Please enter login and password.';
            return;
        }
        loginDropdownMessage.textContent = 'Logging in...';
        const response = await AuthAPI.login(login, password);
        if (response.success && response.data.token) {
            loginDropdownMessage.textContent = 'Login successful!';
            this.app.login(response.data.token); // Update app state
        } else {
            loginDropdownMessage.textContent = response.message || 'Login failed.';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const loginDropdownMessage = document.getElementById('loginDropdownMessage');
        const login = document.getElementById('registerLoginInput').value.trim();
        const email = document.getElementById('registerEmailInput').value.trim();
        const password = document.getElementById('registerPasswordInput').value;
        if (!login || !email || !password) {
            loginDropdownMessage.textContent = 'Please fill all fields.';
            return;
        }
        loginDropdownMessage.textContent = 'Registering...';
        const response = await AuthAPI.register(login, email, password);
        if (response.success) {
            loginDropdownMessage.textContent = 'Registration successful! You can now log in.';
            document.getElementById('loginTabBtn').click();
        } else {
            loginDropdownMessage.textContent = response.message || 'Registration failed.';
        }
    }

    updateNavMenu(user) {
        const { isAuthenticated, roles } = user;
        console.log('Updating nav menu with user state:', user);

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
