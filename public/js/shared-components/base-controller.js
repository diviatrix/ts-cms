/**
 * Base Page Controller
 * Common functionality for all pages
 */

import { loadingManager, messages } from '../ui-utils.js';
import { ErrorHandler } from '../../js/utils/error-handling.js';

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
            messages.showError('An unexpected error occurred. Please refresh the page.');
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
            messages.showSuccess(response.message || 'Operation completed successfully');
            if (successCallback) {
                successCallback(response.data);
            }
        } else {
            // Handle different types of API errors
            if (response.status === 401) {
                messages.showError('Your session has expired. Please log in again.');
            } else if (response.errors && response.errors.length > 0) {
                messages.showError(response.errors.join(', '));
            } else {
                messages.showError(response.message || 'An unexpected error occurred. Please try again.');
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
                messages.showError('Unable to connect to the server. Please check your internet connection and try again.');
            } else {
                messages.showError(error.message || 'Network error occurred. Please try again.');
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

    handleError(error) {
        messages.showError('An unexpected error occurred. Please refresh the page.');
    }

    handleSuccess(response) {
        messages.showSuccess(response.message || 'Operation completed successfully');
    }

    handleSessionExpired() {
        messages.showError('Your session has expired. Please log in again.');
    }

    handleValidationErrors(response) {
        messages.showError(response.errors.join(', '));
    }

    handleApiError(response) {
        messages.showError(response.message || 'An unexpected error occurred. Please try again.');
    }

    handleNetworkError() {
        messages.showError('Unable to connect to the server. Please check your internet connection and try again.');
    }

    handleNetworkErrorMessage(error) {
        messages.showError(error.message || 'Network error occurred. Please try again.');
    }
}

export { BasePageController };
