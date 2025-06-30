/**
 * Login/Register Page - Refactored with Shared Components
 * Uses FormHandler and AuthPageController for cleaner code
 */

import { AuthAPI } from '../js/api-client.js';
import { AuthPageController, FormHandler } from '../js/shared-components.js';
import { MessageDisplay, ErrorHandler } from '../js/ui-utils.js';

/**
 * Login Page Controller
 * Manages login and registration functionality
 */
class LoginPageController extends AuthPageController {
    constructor() {
        super({
            authAPI: AuthAPI,
            messageDiv: document.getElementById('messageDiv')
        });

        this.initializeElements();
        this.setupFormHandlers();
        this.setupInputValidation();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.loginInput = document.getElementById('loginInput');
        this.passwordInput = document.getElementById('passwordInput');
        this.emailInput = document.getElementById('emailInput');
        this.loginButton = document.getElementById('loginButton');
        this.registerButton = document.getElementById('registerButton');

        // Initially disable buttons
        this.loginButton.disabled = true;
        this.registerButton.disabled = true;
    }

    /**
     * Set up form handlers using shared FormHandler component
     */
    setupFormHandlers() {
        // Create virtual forms for login and register
        const loginForm = this.createVirtualForm(['login', 'password']);
        const registerForm = this.createVirtualForm(['login', 'password', 'email']);

        // Login form handler
        this.loginFormHandler = new FormHandler(loginForm, {
            messageDisplay: this.message,
            validationRules: {
                login: [
                    { type: 'required', message: 'Login is required' }
                ],
                password: [
                    { type: 'required', message: 'Password is required' }
                ]
            },
            loadingElements: [this.loginButton],
            submitCallback: this.handleLogin.bind(this)
        });

        // Register form handler
        this.registerFormHandler = new FormHandler(registerForm, {
            messageDisplay: this.message,
            validationRules: {
                login: [
                    { type: 'required', message: 'Login is required' },
                    { type: 'minLength', value: 3, message: 'Login must be at least 3 characters long' },
                    { type: 'maxLength', value: 50, message: 'Login must be no more than 50 characters long' }
                ],
                password: [
                    { type: 'required', message: 'Password is required' },
                    { type: 'minLength', value: 6, message: 'Password must be at least 6 characters long' }
                ],
                email: [
                    { type: 'required', message: 'Email is required' },
                    { type: 'email', message: 'Please enter a valid email address' }
                ]
            },
            loadingElements: [this.registerButton],
            submitCallback: this.handleRegister.bind(this)
        });

        // Set up button event listeners
        this.loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.loginFormHandler.handleSubmit();
        });

        this.registerButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.registerFormHandler.handleSubmit();
        });
    }

    /**
     * Create virtual form element for FormHandler
     */
    createVirtualForm(fields) {
        const form = document.createElement('form');
        fields.forEach(fieldName => {
            const input = document.getElementById(`${fieldName}Input`);
            if (input) {
                input.setAttribute('name', fieldName);
                form.appendChild(input.cloneNode(true));
            }
        });
        return form;
    }

    /**
     * Set up input validation and button state management
     */
    setupInputValidation() {
        const updateButtonStates = () => {
            const loginValue = this.loginInput.value.trim();
            const passwordValue = this.passwordInput.value.trim();
            const emailValue = this.emailInput.value.trim();

            this.loginButton.disabled = !(loginValue && passwordValue);
            this.registerButton.disabled = !(loginValue && passwordValue && emailValue);
        };

        // Add event listeners for real-time validation
        [this.loginInput, this.passwordInput, this.emailInput].forEach(input => {
            if (input) {
                input.addEventListener('input', updateButtonStates);
                input.addEventListener('blur', () => {
                    // Trigger field validation on blur
                    if (input.name) {
                        this.validateField(input);
                    }
                });
            }
        });
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        // Clear existing errors
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Basic validation based on field type
        const value = field.value.trim();
        let error = null;

        switch (field.name) {
            case 'login':
                if (!value) {
                    error = 'Login is required';
                } else if (value.length < 3) {
                    error = 'Login must be at least 3 characters long';
                }
                break;
            case 'password':
                if (!value) {
                    error = 'Password is required';
                } else if (value.length < 6) {
                    error = 'Password must be at least 6 characters long';
                }
                break;
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Please enter a valid email address';
                }
                break;
        }

        if (error) {
            ErrorHandler.addFieldError(field, error);
            field.classList.add('is-invalid');
        } else if (value) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    }

    /**
     * Handle login submission
     */
    async handleLogin(formData) {
        const attemptLogin = async () => {
            const response = await AuthAPI.login(formData.login, formData.password);
            
            if (response.success) {
                this.handleAuthSuccess();
            } else {
                this.handleAuthFailure(response);
            }
        };

        return this.safeApiCall(attemptLogin, {
            retryCallback: attemptLogin,
            operationKey: 'login_attempt'
        });
    }

    /**
     * Handle registration submission
     */
    async handleRegister(formData) {
        const response = await AuthAPI.register(formData.login, formData.email, formData.password);
        
        if (response.success) {
            this.message.showSuccess(response.message || 'Account created successfully! You can now log in.');
            ErrorHandler.showToast('Registration successful!', 'success');
            
            // Clear form
            this.clearForm();
        } else {
            this.handleAuthFailure(response);
        }

        return response;
    }

    /**
     * Clear form inputs
     */
    clearForm() {
        [this.loginInput, this.passwordInput, this.emailInput].forEach(input => {
            if (input) {
                input.value = '';
                input.classList.remove('is-valid', 'is-invalid');
            }
        });

        // Clear field errors
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        
        // Update button states
        this.loginButton.disabled = true;
        this.registerButton.disabled = true;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginPageController();
});
