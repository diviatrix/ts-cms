import { AuthAPI } from '../core/api-client.js';
import { notifications } from '../modules/notifications.js';

export class AuthDropdown {
    constructor() {
        this.dropdownElement = null;
        this.isOpen = false;
    }

    async init() {
        await this.injectDropdown();
        this.setupEventListeners();
        this.registrationMode = 'OPEN'; // Default value
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
                    
                    // Ensure dropdown is hidden initially
                    if (this.dropdownElement) {
                        this.dropdownElement.classList.remove('show');
                    }
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

        // Add keyboard navigation for tabs
        const tabContainer = document.getElementById('tabContainer');
        if (tabContainer) {
            tabContainer.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const activeTab = tabContainer.querySelector('.tab-button.active');
                    if (activeTab === loginTabBtn && (e.key === 'ArrowRight')) {
                        this.switchToRegisterTab();
                        registerTabBtn?.focus();
                    } else if (activeTab === registerTabBtn && (e.key === 'ArrowLeft')) {
                        this.switchToLoginTab();
                        loginTabBtn?.focus();
                    }
                }
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
        const tabContainer = document.getElementById('tabContainer');

        // Update button states
        loginTabBtn?.classList.add('active');
        registerTabBtn?.classList.remove('active');
        
        // Update ARIA attributes
        loginTabBtn?.setAttribute('aria-selected', 'true');
        loginTabBtn?.setAttribute('tabindex', '0');
        registerTabBtn?.setAttribute('aria-selected', 'false');
        registerTabBtn?.setAttribute('tabindex', '-1');
        
        // Update form visibility
        loginForm?.classList.remove('hidden');
        registerForm?.classList.add('hidden');
        
        // Update container state for sliding indicator (works with both old and new structure)
        tabContainer?.classList.remove('register-active');
        
        // Clear any messages when switching tabs
        notifications.clear();
        
        // Focus first input for better UX
        const loginInput = document.getElementById('loginInput');
        if (loginInput) {
            loginInput.focus();
        }
    }

    async switchToRegisterTab() {
        const loginTabBtn = document.getElementById('loginTabBtn');
        const registerTabBtn = document.getElementById('registerTabBtn');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabContainer = document.getElementById('tabContainer');

        // Check registration mode before showing registration form
        await this.checkRegistrationMode();

        // Update button states
        loginTabBtn?.classList.remove('active');
        registerTabBtn?.classList.add('active');
        
        // Update ARIA attributes
        registerTabBtn?.setAttribute('aria-selected', 'true');
        registerTabBtn?.setAttribute('tabindex', '0');
        loginTabBtn?.setAttribute('aria-selected', 'false');
        loginTabBtn?.setAttribute('tabindex', '-1');
        
        // Update form visibility
        loginForm?.classList.add('hidden');
        registerForm?.classList.remove('hidden');
        
        // Update container state for sliding indicator (works with both old and new structure)
        tabContainer?.classList.add('register-active');
        
        // Clear any messages when switching tabs
        notifications.clear();
        
        // Show/hide invite code field based on registration mode
        this.updateInviteCodeField();
        
        // Focus first input for better UX
        const registerInput = document.getElementById('registerLoginInput');
        if (registerInput) {
            registerInput.focus();
        }
    }

    async checkRegistrationMode() {
        try {
            const response = await AuthAPI.getRegistrationMode();
            if (response.success && response.data) {
                this.registrationMode = response.data.registration_mode;
            }
        } catch (error) {
            console.error('Error checking registration mode:', error);
            // Use default mode if check fails
        }
    }

    updateInviteCodeField() {
        const inviteCodeGroup = document.getElementById('inviteCodeGroup');
        const inviteCodeInput = document.getElementById('inviteCodeInput');
        
        if (this.registrationMode === 'CLOSED') {
            // Hide the entire registration form if registration is closed
            const registerForm = document.getElementById('registerForm');
            const registerTabPane = document.getElementById('registerTabPane');
            if (registerTabPane) {
                registerTabPane.innerHTML = `
                    <div class="text-center" style="padding: 2rem;">
                        <h3 style="color: var(--muted); margin-bottom: 1rem;">Registration Closed</h3>
                        <p style="color: var(--muted);">New account registration is currently disabled.</p>
                        <p style="color: var(--muted); margin-top: 1rem;">Please contact an administrator for access.</p>
                    </div>
                `;
            }
        } else if (this.registrationMode === 'INVITE_ONLY') {
            // Show invite code field and make it required
            if (inviteCodeGroup) {
                inviteCodeGroup.style.display = 'block';
            }
            if (inviteCodeInput) {
                inviteCodeInput.required = true;
                inviteCodeInput.setAttribute('aria-required', 'true');
            }
        } else {
            // OPEN mode - hide invite code field
            if (inviteCodeGroup) {
                inviteCodeGroup.style.display = 'none';
            }
            if (inviteCodeInput) {
                inviteCodeInput.required = false;
                inviteCodeInput.removeAttribute('aria-required');
                inviteCodeInput.value = ''; // Clear any existing value
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const login = document.getElementById('loginInput').value.trim();
        const password = document.getElementById('passwordInput').value;

        if (!login || !password) {
            notifications.error('Please fill in all fields.');
            return;
        }

        // Add loading state to button
        const submitBtn = document.getElementById('loginSubmitBtn');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            // Hide icon during loading
            const btnIcon = submitBtn.querySelector('.btn-icon');
            if (btnIcon) {
                btnIcon.style.display = 'none';
            }
        }
        
        notifications.info('Signing in...');
        const response = await AuthAPI.login(login, password);

        // Remove loading state
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            
            // Show icon after loading
            const btnIcon = submitBtn.querySelector('.btn-icon');
            if (btnIcon) {
                btnIcon.style.display = '';
            }
        }

        if (response.success && response.data.token) {
            notifications.success('Welcome back!');
            document.dispatchEvent(new CustomEvent('authSuccess', { 
                detail: { token: response.data.token } 
            }));
            this.close();
        } else {
            notifications.error(response.message || 'Invalid credentials. Please try again.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        // Check if registration is closed
        if (this.registrationMode === 'CLOSED') {
            notifications.error('Registration is currently closed.');
            return;
        }

        const login = document.getElementById('registerLoginInput').value.trim();
        const email = document.getElementById('registerEmailInput').value.trim();
        const password = document.getElementById('registerPasswordInput').value;
        const inviteCode = document.getElementById('inviteCodeInput')?.value.trim();

        if (!login || !email || !password) {
            notifications.error('Please fill in all fields.');
            return;
        }

        // Check invite code requirement
        if (this.registrationMode === 'INVITE_ONLY' && !inviteCode) {
            notifications.error('Please enter your invite code.');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            notifications.error('Please enter a valid email address.');
            return;
        }

        // Password strength check
        if (password.length < 8) {
            notifications.error('Password must be at least 8 characters long.');
            return;
        }

        // Add loading state to button
        const submitBtn = document.getElementById('registerSubmitBtn');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            // Hide icon during loading
            const btnIcon = submitBtn.querySelector('.btn-icon');
            if (btnIcon) {
                btnIcon.style.display = 'none';
            }
        }
        
        notifications.info('Creating your account...');
        const response = await AuthAPI.register(login, email, password, inviteCode);

        // Remove loading state
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            
            // Show icon after loading
            const btnIcon = submitBtn.querySelector('.btn-icon');
            if (btnIcon) {
                btnIcon.style.display = '';
            }
        }

        if (response.success) {
            notifications.success('Account created successfully! You can now sign in.');
            this.switchToLoginTab();
        } else {
            notifications.error(response.message || 'Registration failed. Please try again.');
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
            this.dropdownElement.classList.add('show');
            this.isOpen = true;
            
            // Focus first input after opening
            const activeTab = document.querySelector('.tab-button.active');
            const firstInput = activeTab?.getAttribute('aria-controls') === 'loginTabPane' 
                ? document.getElementById('loginInput')
                : document.getElementById('registerLoginInput');
            firstInput?.focus();
        }
    }

    close() {
        if (this.dropdownElement) {
            this.dropdownElement.classList.remove('show');
            this.isOpen = false;
        }
    }

    destroy() {
        this.dropdownElement?.remove();
    }
}