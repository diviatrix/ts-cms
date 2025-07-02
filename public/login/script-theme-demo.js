/**
 * Login Page - Theme System Demo
 * Shows how to use the new unified theme system
 */

import { AuthAPI } from '../js/api-client.js';
import { messages, withErrorHandling } from '../js/utils/message-api.js';
import { theme, withTheme, themedElement, getThemeColors, themeClass } from '../js/utils/theme-api.js';

/**
 * Modern Login Controller with Unified Theme System
 */
class ModernLoginController {
    constructor() {
        console.log('[ModernLogin] Initializing with unified systems...');
        
        this.initializeElements();
        this.setupEventHandlers();
        this.setupThemeDemo();
        
        // Wait for theme to load, then initialize
        theme.onReady(() => {
            console.log('[ModernLogin] Theme ready, completing initialization');
            this.onThemeReady();
        });
    }

    initializeElements() {
        this.loginInput = document.getElementById('loginInput');
        this.passwordInput = document.getElementById('passwordInput');
        this.emailInput = document.getElementById('emailInput');
        this.loginButton = document.getElementById('loginButton');
        this.registerButton = document.getElementById('registerButton');
    }

    setupEventHandlers() {
        // Login button
        this.loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register button
        this.registerButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Input validation
        [this.loginInput, this.passwordInput, this.emailInput].forEach(input => {
            input.addEventListener('input', () => this.updateButtonStates());
        });
    }

    setupThemeDemo() {
        // Theme info button
        document.getElementById('themeInfoBtn')?.addEventListener('click', () => {
            this.showThemeInfo();
        });

        // Reload theme button
        document.getElementById('reloadThemeBtn')?.addEventListener('click', () => {
            this.reloadTheme();
        });

        // Add dynamic content button
        document.getElementById('addContentBtn')?.addEventListener('click', () => {
            this.addDynamicContent();
        });

        // Listen for theme changes
        theme.onThemeChange((event, data) => {
            console.log('[ModernLogin] Theme changed:', event, data);
            messages.info(`Theme ${event}: ${data?.theme?.name || 'Unknown'}`, { toast: true });
        });
    }

    onThemeReady() {
        console.log('[ModernLogin] Theme is ready!');
        
        // Apply theme-aware classes to form elements
        theme.themeElement(document.querySelector('.card'), 'card');
        
        // Show welcome message with theme info
        const themeInfo = theme.getCurrentTheme();
        messages.info(`Welcome! Theme "${themeInfo.theme?.theme?.name || 'Default'}" loaded successfully.`, {
            toast: true,
            duration: 3000
        });
    }

    updateButtonStates() {
        const loginValue = this.loginInput.value.trim();
        const passwordValue = this.passwordInput.value.trim();
        const emailValue = this.emailInput.value.trim();

        this.loginButton.disabled = !(loginValue && passwordValue);
        this.registerButton.disabled = !(loginValue && passwordValue && emailValue);
    }

    /**
     * Handle login with unified error handling
     */
    async handleLogin() {
        // Basic validation
        if (!this.loginInput.value.trim() || !this.passwordInput.value.trim()) {
            messages.validationError('Please fill in all required fields');
            return;
        }

        // Set context for better error categorization
        messages.setContext('login');

        // Disable button during processing
        this.loginButton.disabled = true;
        const loadingId = messages.loading('Signing you in...', 10000);

        try {
            // Use unified error handling wrapper
            const response = await withErrorHandling(
                () => AuthAPI.login(
                    this.loginInput.value.trim(),
                    this.passwordInput.value.trim()
                ),
                {
                    action: 'login',
                    operationKey: 'login_attempt',
                    retry: () => this.handleLogin(),
                    handleResponse: false // We'll handle manually
                }
            );

            messages.dismiss(loadingId);

            if (response?.success) {
                messages.success('Welcome back!', { toast: true });
                
                // Simulate redirect
                setTimeout(() => {
                    messages.info('Redirecting to dashboard...', { toast: true });
                }, 1000);
            } else {
                messages.apiResponse(response);
            }

        } catch (error) {
            messages.dismiss(loadingId);
            console.error('Login error:', error);
        } finally {
            this.loginButton.disabled = false;
        }
    }

    /**
     * Handle registration with theme-aware password strength
     */
    async handleRegister() {
        if (!this.loginInput.value.trim() || !this.passwordInput.value.trim() || !this.emailInput.value.trim()) {
            messages.validationError('Please fill in all fields for registration');
            return;
        }

        // Check password strength with theme-aware colors
        const password = this.passwordInput.value.trim();
        if (password.length < 6) {
            messages.warning('Your password is quite short. Consider making it longer for better security.', {
                suggestions: [
                    'Use at least 8 characters',
                    'Include numbers and special characters',
                    'Mix uppercase and lowercase letters'
                ]
            });
            return;
        }

        messages.setContext('registration');

        this.registerButton.disabled = true;
        const loadingId = messages.loading('Creating your account...', 15000);

        try {
            const response = await withErrorHandling(
                () => AuthAPI.register(
                    this.loginInput.value.trim(),
                    this.emailInput.value.trim(),
                    password
                ),
                {
                    action: 'register',
                    operationKey: 'register_attempt',
                    retry: () => this.handleRegister()
                }
            );

            messages.dismiss(loadingId);

            if (response?.success) {
                messages.success('Account created successfully! You can now log in.', {
                    duration: 6000
                });
                this.clearForm();
            }

        } catch (error) {
            messages.dismiss(loadingId);
            console.error('Registration error:', error);
        } finally {
            this.registerButton.disabled = false;
        }
    }

    clearForm() {
        [this.loginInput, this.passwordInput, this.emailInput].forEach(input => {
            input.value = '';
            input.classList.remove('is-valid', 'is-invalid');
        });
        
        this.updateButtonStates();
        messages.info('Form cleared', { toast: true, duration: 2000 });
    }

    /**
     * Theme demo methods
     */
    
    showThemeInfo() {
        const themeInfo = theme.getCurrentTheme();
        const variables = getThemeColors();
        const isDark = theme.isDarkTheme();
        
        const infoContainer = document.getElementById('themeInfo');
        infoContainer.innerHTML = `
            <div class="alert alert-info">
                <h6>Current Theme Information</h6>
                <p><strong>Theme:</strong> ${themeInfo.theme?.theme?.name || 'Default'}</p>
                <p><strong>State:</strong> ${themeInfo.state}</p>
                <p><strong>Type:</strong> ${isDark ? 'Dark' : 'Light'}</p>
                <p><strong>Primary Color:</strong> <span style="color: ${variables.primaryColor}">${variables.primaryColor}</span></p>
                <p><strong>Background:</strong> <span style="color: ${variables.backgroundColor}">${variables.backgroundColor}</span></p>
                <p><strong>Font:</strong> ${variables.fontFamily}</p>
            </div>
        `;
        
        // Apply theme to the new content
        theme.applyToElement(infoContainer);
    }

    async reloadTheme() {
        messages.info('Reloading theme...', { toast: true });
        
        try {
            await theme.reloadTheme();
            messages.success('Theme reloaded successfully!', { toast: true });
        } catch (error) {
            messages.error('Failed to reload theme', { toast: true });
        }
    }

    addDynamicContent() {
        const contentContainer = document.getElementById('dynamicContent');
        
        // Create themed elements using the new API
        const card = themedElement('div', 'card', `
            <div class="card-body">
                <h6 class="card-title">Dynamic Content</h6>
                <p class="card-text">This content was added dynamically and automatically themed!</p>
                <button class="btn btn-primary btn-sm">Themed Button</button>
            </div>
        `);
        
        // Add with theme-aware animation
        contentContainer.appendChild(card);
        
        // Animate with theme colors
        withTheme((colors) => {
            theme.animateWithTheme(card, [
                { opacity: 0, transform: 'translateY(20px)', backgroundColor: colors.backgroundColor },
                { opacity: 1, transform: 'translateY(0)', backgroundColor: colors.surfaceColor }
            ], {
                duration: 500,
                easing: 'ease-out'
            });
        });
        
        messages.success('Dynamic content added with automatic theming!', { toast: true });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ModernLoginController();
    
    // Show initial demo message
    setTimeout(() => {
        messages.info('This page demonstrates the unified theme system. Try the demo buttons below!', {
            duration: 5000
        });
    }, 1000);
});
