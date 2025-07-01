/**
 * Form Validation Utilities
 * Provides form validation functionality and helpers
 */

// Common regex patterns
const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

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
        const email = emailElement.value?.trim();

        if (email && !REGEX_PATTERNS.EMAIL.test(email)) {
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
                    // Note: ErrorHandler.addFieldError will be imported when needed
                    console.error(`Field error for ${fieldName}:`, error);
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
        return REGEX_PATTERNS.EMAIL.test(email);
    }
}

export { FormValidator, AdvancedFormValidator, REGEX_PATTERNS };
