export class Validation {
    static rules = {
        required: (value) => value !== undefined && value !== null && value.toString().trim() !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        minLength: (min) => (value) => value.length >= min,
        maxLength: (max) => (value) => value.length <= max,
        pattern: (regex) => (value) => regex.test(value),
        numeric: (value) => !isNaN(value) && !isNaN(parseFloat(value)),
        url: (value) => {
            // Allow empty values
            if (!value) return true;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }
    };

    static validate(value, rules) {
        const errors = [];
        
        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            const ruleFunction = this.rules[ruleName];
            if (ruleFunction) {
                // Special handling for required rule with empty strings
                if (ruleName === 'required' && value === '') {
                    errors.push(this.getErrorMessage(ruleName, ruleValue));
                    continue;
                }
                
                // Skip validation for empty optional fields
                if (!value && ruleName !== 'required') {
                    continue;
                }
                
                const isValid = typeof ruleValue === 'object' || typeof ruleValue === 'function' 
                    ? ruleFunction(ruleValue)(value) 
                    : ruleFunction(value);
                
                if (!isValid) {
                    errors.push(this.getErrorMessage(ruleName, ruleValue));
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static getErrorMessage(ruleName, ruleValue) {
        const messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            minLength: `Minimum length is ${ruleValue} characters`,
            maxLength: `Maximum length is ${ruleValue} characters`,
            numeric: 'Please enter a valid number',
            url: 'Please enter a valid URL (including http:// or https://)'
        };
        
        return messages[ruleName] || 'Invalid value';
    }

    static validateForm(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        const errors = {};
        let isValid = true;

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Check for validation attributes
        const inputs = formElement.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const fieldName = input.name;
            if (!fieldName) return;

            const fieldRules = this.getFieldRules(input);
            if (Object.keys(fieldRules).length > 0) {
                const fieldValue = data[fieldName];
                const validation = this.validate(fieldValue, fieldRules);
                
                if (!validation.isValid) {
                    errors[fieldName] = validation.errors;
                    isValid = false;
                }
            }
        });

        return {
            isValid,
            data,
            errors
        };
    }

    static getFieldRules(input) {
        const rules = {};
        
        if (input.hasAttribute('required')) {
            rules.required = true;
        }
        
        if (input.type === 'email') {
            rules.email = true;
        }
        
        const minLength = input.getAttribute('minlength');
        if (minLength) {
            rules.minLength = parseInt(minLength);
        }
        
        const maxLength = input.getAttribute('maxlength');
        if (maxLength) {
            rules.maxLength = parseInt(maxLength);
        }
        
        const pattern = input.getAttribute('pattern');
        if (pattern) {
            try {
                rules.pattern = new RegExp(pattern);
            } catch (e) {
                console.warn('Invalid pattern attribute:', pattern);
            }
        }
        
        if (input.type === 'url') {
            rules.url = true;
        }
        
        return rules;
    }

    static displayErrors(formElement, errors) {
        // Clear previous errors
        const errorElements = formElement.querySelectorAll('.field-error');
        errorElements.forEach(el => el.remove());
        
        // Display new errors
        for (const [fieldName, fieldErrors] of Object.entries(errors)) {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.textContent = fieldErrors[0]; // Show first error
                errorDiv.setAttribute('data-error-field', fieldName);
                
                // Insert error after the field
                field.parentNode.insertBefore(errorDiv, field.nextSibling);
                
                // Add error styling to the field
                field.classList.add('field-error-input');
            }
        }
    }

    static clearErrors(formElement) {
        const errorElements = formElement.querySelectorAll('.field-error');
        errorElements.forEach(el => el.remove());
        
        // Remove error styling from fields
        const errorFields = formElement.querySelectorAll('.field-error-input');
        errorFields.forEach(field => field.classList.remove('field-error-input'));
    }
}