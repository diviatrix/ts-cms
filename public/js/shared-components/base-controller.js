/**
 * Base Page Controller
 * Common functionality for all pages
 */

import { loadingManager, messages } from '../ui-utils.js';

/**
 * Base Page Controller
 * Common functionality for all pages
 */
class BasePageController {
    constructor(options = {}) {
        this.messageDiv = options.messageDiv || document.getElementById('messageDiv');
        this.loadingManager = loadingManager;
        
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
            messages.error('An unexpected error occurred. Please refresh the page.', { toast: true });
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
            messages.success(response.message || 'Operation completed successfully', { toast: true });
            if (successCallback) {
                successCallback(response.data);
            }
        } else {
            // Handle different types of API errors
            if (response.status === 401) {
                messages.error('Your session has expired. Please log in again.', { toast: true });
            } else if (response.errors && response.errors.length > 0) {
                messages.error(response.errors.join(', '), { toast: true });
            } else {
                messages.error(response.message || 'An unexpected error occurred. Please try again.', { toast: true });
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
            
            // Handle network errors with unified messages
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                messages.error('Unable to connect to the server. Please check your internet connection and try again.', { toast: true });
            } else {
                messages.error(error.message || 'Network error occurred. Please try again.', { toast: true });
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
