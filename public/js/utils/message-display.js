/**
 * Message Display Utility
 * Provides consistent message display functionality
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

export { MessageDisplay };
