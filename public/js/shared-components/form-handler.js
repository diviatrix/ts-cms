/**
 * Form Handler Component
 * Reusable form validation and submission logic
 */

import { ErrorHandler, loadingManager } from '../ui-utils.js';
import { messages } from '../ui-utils.js';

// Common regex patterns
const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

/**
 * Form Handler
 * Reusable form validation and submission logic
 */
class FormHandler {
    constructor(form, options = {}) {
        this.form = form;
        this.messageDisplay = options.messageDisplay;
        this.validationRules = options.validationRules || {};
        this.submitCallback = options.submitCallback;
        this.loadingElements = options.loadingElements || [];
        
        this.setupFormHandlers();
    }

    /**
     * Set up form event handlers
     */
    setupFormHandlers() {
        if (this.form) {
            this.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleSubmit();
            });

            // Add real-time validation if specified
            if (this.validationRules) {
                this.setupRealTimeValidation();
            }
        }
    }

    /**
     * Set up real-time validation
     */
    setupRealTimeValidation() {
        Object.keys(this.validationRules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(fieldName);
                });
            }
        });
    }

    /**
     * Validate a single field
     */
    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const rules = this.validationRules[fieldName] || [];
        
        if (!field || !rules.length) return true;

        // Clear previous errors
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Validate field
        const value = field.value?.trim();
        let isValid = true;

        for (const rule of rules) {
            if (rule.type === 'required' && !value) {
                ErrorHandler.addFieldError(field, rule.message || `${fieldName} is required`);
                isValid = false;
                break;
            } else if (rule.type === 'email' && value && !REGEX_PATTERNS.EMAIL.test(value)) {
                ErrorHandler.addFieldError(field, rule.message || 'Please enter a valid email address');
                isValid = false;
                break;
            } else if (rule.type === 'minLength' && value && value.length < rule.value) {
                ErrorHandler.addFieldError(field, rule.message || `Must be at least ${rule.value} characters long`);
                isValid = false;
                break;
            }
        }

        // Update field styling
        if (isValid && value) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else if (!isValid) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
        }

        return isValid;
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        if (!this.submitCallback) return;

        // Validate all fields
        const isValid = this.validateForm();
        if (!isValid) return;

        // Set loading state
        const loadingElements = this.loadingElements.length > 0 
            ? this.loadingElements 
            : [this.form.querySelector('button[type="submit"]')].filter(Boolean);

        loadingElements.forEach(element => {
            loadingManager.setLoading(element, true, 'Submitting...');
        });

        try {
            await this.submitCallback(this.getFormData());
        } finally {
            loadingElements.forEach(element => {
                loadingManager.setLoading(element, false);
            });
        }
    }

    /**
     * Validate entire form
     */
    validateForm() {
        let isValid = true;

        Object.keys(this.validationRules).forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });

        if (!isValid && this.messageDisplay) {
            messages.error('Please correct the errors below', { toast: true });
        }

        return isValid;
    }

    /**
     * Get form data as object
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
}

export { FormHandler };
