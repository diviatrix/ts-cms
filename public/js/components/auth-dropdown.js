import { AuthAPI } from '../core/api-client.js';

export class AuthDropdown {
    constructor() {
        this.dropdownElement = null;
        this.messageElement = null;
        this.isOpen = false;
    }

    async init() {
        await this.injectDropdown();
        this.setupEventListeners();
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
                    this.dropdownElement = document.getElementById('loginDropdownMenu');
                    this.messageElement = document.getElementById('loginDropdownMessage');
                }
            }
        } catch (error) {
            console.error('Error injecting dropdown:', error);
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loginTabBtn = document.getElementById('loginTabBtn');
        const registerTabBtn = document.getElementById('registerTabBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        if (loginTabBtn) {
            loginTabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToLoginTab();
            });
        }

        if (registerTabBtn) {
            registerTabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToRegisterTab();
            });
        }

        document.addEventListener('click', (e) => {
            const loginDropdownToggle = document.getElementById('loginDropdownToggle');
            if (this.dropdownElement && 
                !this.dropdownElement.contains(e.target) && 
                e.target !== loginDropdownToggle) {
                this.close();
            }
        });

        document.getElementById('loginDropdownToggle')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
    }

    switchToLoginTab() {
        const loginTabBtn = document.getElementById('loginTabBtn');
        const registerTabBtn = document.getElementById('registerTabBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        loginTabBtn?.classList.add('active');
        registerTabBtn?.classList.remove('active');
        if (loginForm) loginForm.style.display = '';
        if (registerForm) registerForm.style.display = 'none';
    }

    switchToRegisterTab() {
        const loginTabBtn = document.getElementById('loginTabBtn');
        const registerTabBtn = document.getElementById('registerTabBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        loginTabBtn?.classList.remove('active');
        registerTabBtn?.classList.add('active');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = '';
    }

    async handleLogin(e) {
        e.preventDefault();
        const login = document.getElementById('loginInput').value.trim();
        const password = document.getElementById('passwordInput').value;

        if (!login || !password) {
            this.showMessage('Please enter login and password.');
            return;
        }

        this.showMessage('Logging in...');
        const response = await AuthAPI.login(login, password);

        if (response.success && response.data.token) {
            this.showMessage('Login successful!');
            document.dispatchEvent(new CustomEvent('authSuccess', { 
                detail: { token: response.data.token } 
            }));
            setTimeout(() => this.close(), 1000);
        } else {
            this.showMessage(response.message || 'Login failed.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const login = document.getElementById('registerLoginInput').value.trim();
        const email = document.getElementById('registerEmailInput').value.trim();
        const password = document.getElementById('registerPasswordInput').value;

        if (!login || !email || !password) {
            this.showMessage('Please fill all fields.');
            return;
        }

        this.showMessage('Registering...');
        const response = await AuthAPI.register(login, email, password);

        if (response.success) {
            this.showMessage('Registration successful! You can now log in.');
            this.switchToLoginTab();
        } else {
            this.showMessage(response.message || 'Registration failed.');
        }
    }

    showMessage(message) {
        if (this.messageElement) {
            this.messageElement.textContent = message;
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.dropdownElement) {
            this.dropdownElement.style.display = 'block';
            this.isOpen = true;
        }
    }

    close() {
        if (this.dropdownElement) {
            this.dropdownElement.style.display = 'none';
            this.isOpen = false;
        }
    }

    destroy() {
        this.dropdownElement?.remove();
    }
}