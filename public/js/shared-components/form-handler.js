/**
 * Form Handler Component
 * Reusable form validation and submission logic
 */

import { loadingManager, messages } from '../ui-utils.js';

// Common regex patterns
const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NO_SPACES: /^\S*$/
};

/**
 * Form Handler
 * Reusable form validation and submission logic
 */
class FormHandler {
    constructor(form, {
        messageDisplay = null,
        validationRules = {},
        submitCallback = null,
        loadingElements = []
    } = {}) {
        this.form = form;
        this.messageDisplay = messageDisplay;
        this.validationRules = validationRules;
        this.submitCallback = submitCallback;
        this.loadingElements = loadingElements;
        if (form) this.setup();
    }

    setup() {
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.handleSubmit();
        });
        Object.keys(this.validationRules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) field.addEventListener('blur', () => this.validateField(fieldName));
        });
    }

    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const rules = this.validationRules[fieldName] || [];
        if (!field || !rules.length) return true;
        this.clearFieldError(field);
        const value = field.value?.trim();
        let isValid = true;
        for (const rule of rules) {
            if (rule.type === 'required' && !value) {
                this.addFieldError(field, rule.message || `${fieldName} is required`);
                isValid = false; break;
            }
            if (rule.type === 'email' && value && !REGEX_PATTERNS.EMAIL.test(value)) {
                this.addFieldError(field, rule.message || 'Please enter a valid email address');
                isValid = false; break;
            }
            if (rule.type === 'minLength' && value && value.length < rule.value) {
                this.addFieldError(field, rule.message || `Must be at least ${rule.value} characters long`);
                isValid = false; break;
            }
            if (rule.type === 'noSpaces' && value && !REGEX_PATTERNS.NO_SPACES.test(value)) {
                this.addFieldError(field, rule.message || 'No spaces allowed');
                isValid = false; break;
            }
        }
        field.classList.toggle('is-invalid', !isValid);
        field.classList.toggle('is-valid', isValid && value);
        return isValid;
    }

    validateForm() {
        let isValid = true;
        Object.keys(this.validationRules).forEach(fieldName => {
            if (!this.validateField(fieldName)) isValid = false;
        });
        if (!isValid) messages.error('Please correct the errors below');
        return isValid;
    }

    async handleSubmit() {
        if (!this.submitCallback) return;
        if (!this.validateForm()) return;
        const loadingEls = this.loadingElements.length ? this.loadingElements : [this.form.querySelector('button[type="submit"]')].filter(Boolean);
        loadingEls.forEach(el => loadingManager.setLoading(el, true, 'Submitting...'));
        try {
            await this.submitCallback(this.getFormData());
        } finally {
            loadingEls.forEach(el => loadingManager.setLoading(el, false));
        }
    }

    addFieldError(field, message) {
        this.clearFieldError(field);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-danger small mt-1';
        errorDiv.textContent = message;
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    clearFieldError(field) {
        const existing = field.parentNode.querySelector('.field-error');
        if (existing) existing.remove();
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        for (const [key, value] of formData.entries()) data[key] = value;
        return data;
    }
}

export { FormHandler };
