/**
 * UI Utilities for ts-cms Frontend
 * Provides consistent message display and loading states
 */

/**
 * Message Display Utility
 */
class MessageDisplay {
    constructor(element) {
        this.element = element;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.element.textContent = message;
        this.element.className = 'alert alert-success';
        this.element.style.display = 'block';
    }

    /**
     * Show error message
     */
    showError(message) {
        this.element.textContent = message;
        this.element.className = 'alert alert-danger';
        this.element.style.display = 'block';
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        this.element.textContent = message;
        this.element.className = 'alert alert-warning';
        this.element.style.display = 'block';
    }

    /**
     * Show info message
     */
    showInfo(message) {
        this.element.textContent = message;
        this.element.className = 'alert alert-info';
        this.element.style.display = 'block';
    }

    /**
     * Hide message
     */
    hide() {
        this.element.style.display = 'none';
        this.element.textContent = '';
    }

    /**
     * Show API response message
     */
    showApiResponse(response) {
        if (response.success) {
            this.showSuccess(response.message || 'Operation completed successfully');
        } else {
            // Handle validation errors
            if (response.errors && response.errors.length > 0) {
                this.showError(response.errors.join(', '));
            } else {
                this.showError(response.message || 'An error occurred');
            }
        }
    }
}

/**
 * Loading State Manager
 */
class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
    }

    /**
     * Set loading state for an element
     */
    setLoading(element, isLoading, loadingText = 'Loading...') {
        const elementId = element.id || Math.random().toString(36);
        
        if (isLoading) {
            // Store original state
            this.loadingStates.set(elementId, {
                disabled: element.disabled,
                textContent: element.textContent,
                innerHTML: element.innerHTML
            });

            // Set loading state
            element.disabled = true;
            
            if (element.tagName === 'BUTTON') {
                element.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${loadingText}`;
            } else {
                element.textContent = loadingText;
            }
        } else {
            // Restore original state
            const originalState = this.loadingStates.get(elementId);
            if (originalState) {
                element.disabled = originalState.disabled;
                if (originalState.innerHTML) {
                    element.innerHTML = originalState.innerHTML;
                } else {
                    element.textContent = originalState.textContent;
                }
                this.loadingStates.delete(elementId);
            }
        }
    }
}

/**
 * Form Validation Helper
 */
class FormValidator {
    /**
     * Validate required fields
     */
    static validateRequired(fields) {
        const errors = [];
        
        fields.forEach(field => {
            const { element, name } = field;
            const value = element.value?.trim();
            
            if (!value) {
                errors.push(`${name} is required`);
                this.addErrorClass(element);
            } else {
                this.removeErrorClass(element);
            }
        });

        return errors;
    }

    /**
     * Validate email format
     */
    static validateEmail(emailElement) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const email = emailElement.value?.trim();

        if (email && !emailRegex.test(email)) {
            this.addErrorClass(emailElement);
            return ['Please enter a valid email address'];
        } else {
            this.removeErrorClass(emailElement);
            return [];
        }
    }

    /**
     * Validate password strength
     */
    static validatePassword(passwordElement, minLength = 8) {
        const password = passwordElement.value;
        const errors = [];

        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }

        if (errors.length > 0) {
            this.addErrorClass(passwordElement);
        } else {
            this.removeErrorClass(passwordElement);
        }

        return errors;
    }

    /**
     * Add error styling to field
     */
    static addErrorClass(element) {
        element.classList.add('is-invalid');
        element.classList.remove('is-valid');
    }

    /**
     * Remove error styling from field
     */
    static removeErrorClass(element) {
        element.classList.remove('is-invalid');
        element.classList.add('is-valid');
    }

    /**
     * Clear all validation states
     */
    static clearValidation(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    }
}

/**
 * Error Handler Utility
 */
class ErrorHandler {
    constructor() {
        this.retryCount = new Map();
        this.maxRetries = 3;
    }

    /**
     * Handle API errors with user-friendly messages
     */
    static handleApiError(response, messageDisplay) {
        console.error('API Error:', response);

        // Handle authentication errors
        if (response.errors?.some(err => err.includes('Unauthorized') || err.includes('Invalid token'))) {
            messageDisplay.showError('Your session has expired. Please log in again.');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        // Handle validation errors
        if (response.errors && response.errors.length > 0) {
            messageDisplay.showError(response.errors.join(', '));
            return;
        }

        // Handle generic errors
        messageDisplay.showError(response.message || 'An unexpected error occurred. Please try again.');
    }

    /**
     * Handle network errors with retry logic
     */
    handleNetworkError(error, messageDisplay, retryCallback = null, operationKey = null) {
        console.error('Network Error:', error);
        
        if (retryCallback && operationKey) {
            const currentRetries = this.retryCount.get(operationKey) || 0;
            
            if (currentRetries < this.maxRetries) {
                this.retryCount.set(operationKey, currentRetries + 1);
                const retryDelay = Math.min(1000 * Math.pow(2, currentRetries), 5000); // Exponential backoff
                
                messageDisplay.showWarning(`Connection failed. Retrying in ${retryDelay / 1000} seconds... (${currentRetries + 1}/${this.maxRetries})`);
                
                setTimeout(() => {
                    retryCallback();
                }, retryDelay);
                return;
            } else {
                this.retryCount.delete(operationKey);
            }
        }
        
        messageDisplay.showError('Unable to connect to the server. Please check your internet connection and try again.');
    }

    /**
     * Handle field-specific validation errors
     */
    static handleFieldErrors(response, form) {
        if (!response.errors || !form) return;

        // Clear previous field errors
        const errorElements = form.querySelectorAll('.field-error');
        errorElements.forEach(el => el.remove());

        response.errors.forEach(error => {
            // Try to match error to specific field
            const fieldMatch = error.match(/^(\w+):/);
            if (fieldMatch) {
                const fieldName = fieldMatch[1];
                const fieldElement = form.querySelector(`[name="${fieldName}"]`);
                
                if (fieldElement) {
                    FormValidator.addErrorClass(fieldElement);
                    this.addFieldError(fieldElement, error.replace(/^\w+:\s*/, ''));
                }
            }
        });
    }

    /**
     * Add error message below a specific field
     */
    static addFieldError(fieldElement, message) {
        // Remove existing error for this field
        const existingError = fieldElement.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-danger small mt-1';
        errorElement.textContent = message;

        // Insert after the field
        fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
    }

    /**
     * Show toast notification
     */
    static showToast(message, type = 'info', duration = 5000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${this.getBootstrapColor(type)} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Initialize Bootstrap toast (if available)
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: duration });
            bsToast.show();
        } else {
            // Fallback: show and hide manually
            toast.style.display = 'block';
            setTimeout(() => {
                toast.remove();
            }, duration);
        }
    }

    /**
     * Get Bootstrap color class for message type
     */
    static getBootstrapColor(type) {
        const colorMap = {
            success: 'success',
            error: 'danger',
            warning: 'warning',
            info: 'info'
        };
        return colorMap[type] || 'info';
    }

    /**
     * Clear retry count for operation
     */
    clearRetries(operationKey) {
        this.retryCount.delete(operationKey);
    }
}

/**
 * Advanced Form Validation Helper
 */
class AdvancedFormValidator extends FormValidator {
    /**
     * Validate form with comprehensive error handling
     */
    static validateForm(form, rules = {}) {
        const errors = [];
        const fieldErrors = {};

        // Clear previous validation states
        this.clearValidation(form);

        // Validate each field based on rules
        Object.entries(rules).forEach(([fieldName, fieldRules]) => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const fieldErrors = [];
            const value = field.value?.trim();

            // Check each rule for the field
            fieldRules.forEach(rule => {
                if (rule.type === 'required' && !value) {
                    fieldErrors.push(rule.message || `${fieldName} is required`);
                } else if (rule.type === 'email' && value && !this.isValidEmail(value)) {
                    fieldErrors.push(rule.message || 'Please enter a valid email address');
                } else if (rule.type === 'minLength' && value && value.length < rule.value) {
                    fieldErrors.push(rule.message || `${fieldName} must be at least ${rule.value} characters long`);
                } else if (rule.type === 'maxLength' && value && value.length > rule.value) {
                    fieldErrors.push(rule.message || `${fieldName} must be no more than ${rule.value} characters long`);
                } else if (rule.type === 'pattern' && value && !rule.value.test(value)) {
                    fieldErrors.push(rule.message || `${fieldName} format is invalid`);
                } else if (rule.type === 'custom' && rule.validator && !rule.validator(value, field)) {
                    fieldErrors.push(rule.message || `${fieldName} is invalid`);
                }
            });

            // Add field errors
            if (fieldErrors.length > 0) {
                this.addErrorClass(field);
                fieldErrors.forEach(error => {
                    ErrorHandler.addFieldError(field, error);
                });
                errors.push(...fieldErrors);
            } else if (value) {
                this.removeErrorClass(field);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            fieldErrors
        };
    }

    /**
     * Check if email is valid
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

/**
 * Keyboard Shortcuts Manager
 */
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.setupGlobalListeners();
    }

    /**
     * Register a keyboard shortcut
     * @param {string} key - Key combination (e.g., 'ctrl+s', 'alt+n')
     * @param {Function} callback - Function to execute
     * @param {string} description - Description for help text
     */
    register(key, callback, description = '') {
        this.shortcuts.set(key.toLowerCase(), { callback, description });
    }

    /**
     * Setup global keyboard listeners
     */
    setupGlobalListeners() {
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyString(e);
            const shortcut = this.shortcuts.get(key);
            
            if (shortcut && !this.isInputFocused()) {
                e.preventDefault();
                shortcut.callback(e);
            }
        });
    }

    /**
     * Get key string from event
     */
    getKeyString(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.key) {
            parts.push(e.key.toLowerCase());
        }
        return parts.join('+');
    }

    /**
     * Check if an input element is focused
     */
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );
    }

    /**
     * Show help overlay with available shortcuts
     */
    showHelp() {
        if (document.getElementById('shortcutsHelp')) return;

        const overlay = document.createElement('div');
        overlay.id = 'shortcutsHelp';
        overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '9999';

        const helpContent = document.createElement('div');
        helpContent.className = 'bg-white p-4 rounded shadow-lg';
        helpContent.style.maxWidth = '500px';
        helpContent.style.maxHeight = '70vh';
        helpContent.style.overflowY = 'auto';

        let helpHTML = '<h5 class="mb-3">Keyboard Shortcuts</h5>';
        this.shortcuts.forEach((shortcut, key) => {
            if (shortcut.description) {
                helpHTML += `<div class="mb-2"><kbd>${key}</kbd> - ${shortcut.description}</div>`;
            }
        });
        helpHTML += '<div class="mt-3 text-center"><small class="text-muted">Press ESC to close</small></div>';

        helpContent.innerHTML = helpHTML;
        overlay.appendChild(helpContent);
        document.body.appendChild(overlay);

        // Close on ESC or click outside
        const closeHelp = () => {
            overlay.remove();
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeHelp();
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeHelp();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
}

/**
 * Auto-logout Manager
 */
class AutoLogoutManager {
    constructor(timeoutMinutes = 30) {
        this.timeoutMinutes = timeoutMinutes;
        this.timeoutId = null;
        this.warningId = null;
        this.setupActivityListeners();
        this.resetTimer();
    }

    setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => this.resetTimer(), true);
        });
    }

    resetTimer() {
        // Clear existing timers
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.warningId) clearTimeout(this.warningId);

        // Show warning 5 minutes before logout
        this.warningId = setTimeout(() => {
            this.showLogoutWarning();
        }, (this.timeoutMinutes - 5) * 60 * 1000);

        // Auto logout
        this.timeoutId = setTimeout(() => {
            this.performLogout();
        }, this.timeoutMinutes * 60 * 1000);
    }

    showLogoutWarning() {
        if (document.getElementById('logoutWarning')) return;

        const warning = document.createElement('div');
        warning.id = 'logoutWarning';
        warning.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
        warning.style.backgroundColor = 'rgba(0,0,0,0.8)';
        warning.style.zIndex = '9999';

        warning.innerHTML = `
            <div class="bg-warning text-dark p-4 rounded shadow-lg text-center">
                <h5><i class="fas fa-exclamation-triangle"></i> Session Expiring</h5>
                <p>Your session will expire in 5 minutes due to inactivity.</p>
                <button class="btn btn-primary me-2" onclick="this.parentElement.parentElement.remove()">
                    Stay Logged In
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='/login'">
                    Logout Now
                </button>
            </div>
        `;

        document.body.appendChild(warning);

        // Auto-remove warning after 30 seconds if no action
        setTimeout(() => {
            if (document.getElementById('logoutWarning')) {
                warning.remove();
            }
        }, 30000);
    }

    performLogout() {
        // Clear token and redirect
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login?reason=timeout';
    }
}

/**
 * Confirmation Dialog Utility
 */
class ConfirmationDialog {
    static show(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'btn-primary',
            cancelClass = 'btn-secondary'
        } = options;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '9999';

            overlay.innerHTML = `
                <div class="bg-white p-4 rounded shadow-lg" style="max-width: 400px;">
                    <h5 class="mb-3">${title}</h5>
                    <p class="mb-4">${message}</p>
                    <div class="text-end">
                        <button class="btn ${cancelClass} me-2" data-action="cancel">${cancelText}</button>
                        <button class="btn ${confirmClass}" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    resolve(true);
                    overlay.remove();
                } else if (action === 'cancel' || e.target === overlay) {
                    resolve(false);
                    overlay.remove();
                }
            });

            // Focus confirm button
            overlay.querySelector('[data-action="confirm"]').focus();
        });
    }
}

// Create global instances
const loadingManager = new LoadingManager();
const errorHandler = new ErrorHandler();
const keyboardShortcuts = new KeyboardShortcuts();
const autoLogoutManager = new AutoLogoutManager();

// Export utilities
export { 
    MessageDisplay, 
    LoadingManager, 
    FormValidator, 
    ErrorHandler,
    AdvancedFormValidator,
    loadingManager,
    errorHandler,
    keyboardShortcuts,
    autoLogoutManager,
    ConfirmationDialog
};
