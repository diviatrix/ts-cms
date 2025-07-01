/**
 * Base Page Controller
 * Common functionality for all pages
 */

import { MessageDisplay, ErrorHandler, loadingManager, errorHandler } from '../ui-utils.js';

/**
 * Base Page Controller
 * Common functionality for all pages
 */
class BasePageController {
    constructor(options = {}) {
        this.messageDiv = options.messageDiv || document.getElementById('messageDiv');
        this.message = this.messageDiv ? new MessageDisplay(this.messageDiv) : null;
        this.loadingManager = loadingManager;
        this.errorHandler = errorHandler;
        
        // Make error handler globally available
        window.errorHandler = this.errorHandler;
        
        // Set up common event handlers
        this.setupCommonHandlers();
    }

    /**
     * Set up common event handlers
     */
    setupCommonHandlers() {
        // Handle authentication redirects
        this.handleAuthRedirect();
        
        // Set up global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (this.message) {
                this.message.showError('An unexpected error occurred. Please refresh the page.');
            }
        });
    }

    /**
     * Handle authentication redirect logic
     */
    handleAuthRedirect() {
        // Override in subclasses
    }

    /**
     * Show loading state for multiple elements
     */
    setMultipleLoading(elements, isLoading, loadingText = 'Loading...') {
        elements.forEach(element => {
            if (element) {
                this.loadingManager.setLoading(element, isLoading, loadingText);
            }
        });
    }

    /**
     * Handle API response with consistent error handling
     */
    handleApiResponse(response, successCallback = null, errorCallback = null) {
        if (response.success) {
            if (this.message) {
                this.message.showSuccess(response.message || 'Operation completed successfully');
            }
            if (successCallback) {
                successCallback(response.data);
            }
        } else {
            if (this.message) {
                ErrorHandler.handleApiError(response, this.message);
            }
            if (errorCallback) {
                errorCallback(response);
            }
        }
    }

    /**
     * Safe API call with error handling
     */
    async safeApiCall(apiCall, options = {}) {
        const {
            loadingElements = [],
            loadingText = 'Loading...',
            successCallback = null,
            errorCallback = null,
            retryCallback = null,
            operationKey = null
        } = options;

        try {
            // Set loading state
            this.setMultipleLoading(loadingElements, true, loadingText);

            // Make API call
            const response = await apiCall();

            // Handle response
            this.handleApiResponse(response, successCallback, errorCallback);

            return response;

        } catch (error) {
            console.error('API call error:', error);
            
            // Use enhanced error handler with retry logic
            if (retryCallback && operationKey) {
                this.errorHandler.handleNetworkError(error, this.message, retryCallback, operationKey);
            } else {
                ErrorHandler.handleNetworkError(error, this.message);
            }

            return {
                success: false,
                message: error.message || 'Network error occurred',
                errors: [error.message || 'Network error occurred']
            };

        } finally {
            // Clear loading state
            this.setMultipleLoading(loadingElements, false);
        }
    }
}

export { BasePageController };
