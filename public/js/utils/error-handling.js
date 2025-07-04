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
     * Clear retry count for operation
     */
    clearRetries(operationKey) {
        this.retryCount.delete(operationKey);
    }
}

// Create global instance
const errorHandler = new ErrorHandler();

export { ErrorHandler, errorHandler };
