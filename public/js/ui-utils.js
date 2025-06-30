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
     * Handle network errors
     */
    static handleNetworkError(error, messageDisplay) {
        console.error('Network Error:', error);
        messageDisplay.showError('Unable to connect to the server. Please check your internet connection and try again.');
    }
}

/**
 * Create global instances
 */
const loadingManager = new LoadingManager();

/**
 * Export utilities
 */
export { 
    MessageDisplay, 
    LoadingManager, 
    FormValidator, 
    ErrorHandler,
    loadingManager 
};
