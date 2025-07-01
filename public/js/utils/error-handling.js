/**
 * Error Handling Utilities
 * Provides comprehensive error handling and user feedback
 */

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
                    // Note: FormValidator.addErrorClass will be imported when needed
                    fieldElement.classList.add('is-invalid');
                    fieldElement.classList.remove('is-valid');
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

// Create global instance
const errorHandler = new ErrorHandler();

export { ErrorHandler, errorHandler };
