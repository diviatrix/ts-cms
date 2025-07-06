/**
 * Error Handling Utilities (Simplified)
 * Provides comprehensive error handling and user feedback
 */

class ErrorHandler {
    constructor() {
        this.retryCount = new Map();
        this.maxRetries = 3;
    }

    static showError(messageDisplay, msg) {
        if (messageDisplay && typeof messageDisplay.showError === 'function') {
            messageDisplay.showError(msg);
        } else {
            alert(msg); // fallback
        }
    }

    static handleApiError(response, messageDisplay) {
        console.error('API Error:', response);
        if (response.errors?.some(err => /Unauthorized|Invalid token/.test(err))) {
            this.showError(messageDisplay, 'Your session has expired. Please log in again.');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
            return;
        }
        if (response.errors?.length) {
            this.showError(messageDisplay, response.errors.join(', '));
            return;
        }
        this.showError(messageDisplay, response.message || 'An unexpected error occurred. Please try again.');
    }

    handleNetworkError(error, messageDisplay, retryCallback = null, operationKey = null) {
        console.error('Network Error:', error);
        if (retryCallback && operationKey) {
            const retries = this.retryCount.get(operationKey) || 0;
            if (retries < this.maxRetries) {
                this.retryCount.set(operationKey, retries + 1);
                const delay = Math.min(1000 * 2 ** retries, 5000);
                messageDisplay?.showWarning?.(`Connection failed. Retrying in ${delay / 1000}s... (${retries + 1}/${this.maxRetries})`);
                setTimeout(retryCallback, delay);
                return;
            }
            this.retryCount.delete(operationKey);
        }
        this.constructor.showError(messageDisplay, 'Unable to connect to the server. Please check your internet connection and try again.');
    }

    static handleFieldErrors(response, form) {
        if (!response.errors || !form) return;
        form.querySelectorAll('.field-error').forEach(el => el.remove());
        response.errors.forEach(error => {
            const match = error.match(/^([\w-]+):/);
            if (match) {
                const field = form.querySelector(`[name="${match[1]}"]`);
                if (field) {
                    field.classList.add('is-invalid');
                    field.classList.remove('is-valid');
                    this.addFieldError(field, error.replace(/^([\w-]+):\s*/, ''));
                }
            }
        });
    }

    static addFieldError(field, msg) {
        field.parentNode.querySelector('.field-error')?.remove();
        const el = document.createElement('div');
        el.className = 'field-error text-danger small mt-1';
        el.textContent = msg;
        field.parentNode.insertBefore(el, field.nextSibling);
    }

    clearRetries(operationKey) {
        this.retryCount.delete(operationKey);
    }
}

const errorHandler = new ErrorHandler();
export { ErrorHandler, errorHandler };
