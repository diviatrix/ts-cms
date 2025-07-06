/**
 * Form Validation Utilities (Unified)
 * Provides form validation functionality and helpers
 */

const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME: /^[a-zA-Z0-9_-]+$/
};

const VALIDATION_CONSTANTS = {
    USERNAME_MIN_LENGTH: 4,
    USERNAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 100,
    DISPLAY_NAME_MAX_LENGTH: 100,
    BIO_MAX_LENGTH: 500
};

class FormValidator {
    /**
     * Validate a form using a rules object
     * @param {HTMLFormElement} form
     * @param {Object} rules - { fieldName: [ {type, value?, message?, validator?}, ... ] }
     * @returns {Object} { isValid, errors, fieldErrors }
     */
    static validate(form, rules) {
        this.clearValidation(form);
        const errors = [];
        const fieldErrors = {};

        Object.entries(rules).forEach(([fieldName, fieldRules]) => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;
            const value = field.value?.trim();
            const errs = this.validateField(value, fieldRules, fieldName, field);
            if (errs.length) {
                this.addErrorClass(field);
                fieldErrors[fieldName] = errs;
                errors.push(...errs);
            } else {
                this.removeErrorClass(field);
            }
        });

        return { isValid: errors.length === 0, errors, fieldErrors };
    }

    /**
     * Validate a single field value against rules
     */
    static validateField(value, rules, fieldName, field) {
        const errors = [];
        rules.forEach(rule => {
            switch (rule.type) {
                case 'required':
                    if (!value) errors.push(rule.message || `${fieldName} is required`);
                    break;
                case 'email':
                    if (value && !REGEX_PATTERNS.EMAIL.test(value))
                        errors.push(rule.message || 'Please enter a valid email address');
                    break;
                case 'username':
                    if (value && !REGEX_PATTERNS.USERNAME.test(value))
                        errors.push(rule.message || 'Username can only contain letters, numbers, underscores, and hyphens');
                    if (value && value.length < VALIDATION_CONSTANTS.USERNAME_MIN_LENGTH)
                        errors.push(rule.message || `Username must be at least ${VALIDATION_CONSTANTS.USERNAME_MIN_LENGTH} characters long`);
                    if (value && value.length > VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH)
                        errors.push(rule.message || `Username must be no more than ${VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH} characters long`);
                    break;
                case 'password':
                    if (value && value.length < VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH)
                        errors.push(rule.message || `Password must be at least ${VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH} characters long`);
                    if (value && value.length > VALIDATION_CONSTANTS.PASSWORD_MAX_LENGTH)
                        errors.push(rule.message || `Password must be no more than ${VALIDATION_CONSTANTS.PASSWORD_MAX_LENGTH} characters long`);
                    break;
                case 'minLength':
                    if (value && value.length < rule.value)
                        errors.push(rule.message || `${fieldName} must be at least ${rule.value} characters long`);
                    break;
                case 'maxLength':
                    if (value && value.length > rule.value)
                        errors.push(rule.message || `${fieldName} must be no more than ${rule.value} characters long`);
                    break;
                case 'pattern':
                    if (value && !rule.value.test(value))
                        errors.push(rule.message || `${fieldName} format is invalid`);
                    break;
                case 'custom':
                    if (rule.validator && !rule.validator(value, field))
                        errors.push(rule.message || `${fieldName} is invalid`);
                    break;
            }
        });
        return errors;
    }

    static addErrorClass(element) {
        element.classList.add('is-invalid');
        element.classList.remove('is-valid');
    }

    static removeErrorClass(element) {
        element.classList.remove('is-invalid');
        element.classList.add('is-valid');
    }

    static clearValidation(form) {
        form.querySelectorAll('input, textarea, select').forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    }
}

export { FormValidator, REGEX_PATTERNS, VALIDATION_CONSTANTS };
