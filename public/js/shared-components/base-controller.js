class BasePageController {
    constructor(options = {}) {
        this.messageDiv = options.messageDiv || document.getElementById('messageDiv');
        this.setupCommonHandlers();
    }

    setupCommonHandlers() {
        // Handle authentication redirects
        this.handleAuthRedirect();
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
    }

    handleAuthRedirect() {   // Override in subclasses
    }

    setMultipleLoading(elements, isLoading, loadingText = 'Loading...') {
        elements.forEach(element => {
            // todo: Implement loading state call
        });
    }

    handleApiResponse(response, successCallback = null, errorCallback = null) {
        if (response.success) {
            console.log(response.message || 'Operation completed successfully');
            if (successCallback) {
                successCallback(response.data);
            }
        } else {
            if (response.status === 401) {
                console.warn('Your session has expired. Please log in again.');
            } else if (response.errors && response.errors.length > 0) {
                console.error(response.errors.join(', '));
            } else {
                console.error(response.message || 'An unexpected error occurred. Please try again.');
            }
            if (errorCallback) {
                errorCallback(response);
            }
        }
    }

    async safeApiCall(apiCall, options = {}) {
        const {
            loadingElements = [],
            loadingText = 'Loading...',
            successCallback = null,
            errorCallback = null,
        } = options;

        try {
            this.setMultipleLoading(loadingElements, true, loadingText);

            const response = await apiCall();

            this.handleApiResponse(response, successCallback, errorCallback);

            return response;

        } catch (error) {
            console.error('API call error:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('Unable to connect to the server. Please check your internet connection and try again.');
            } else {
                console.error(error.message || 'Network error occurred. Please try again.');
            }

            return {
                success: false,
                message: error.message || 'Network error occurred',
                errors: [error.message || 'Network error occurred']
            };

        } finally {
            this.setMultipleLoading(loadingElements, false);
        }
    }

    handleError(error) {
        console.error('An unexpected error occurred. Please refresh the page.');
    }

    handleSuccess(response) {
        console.log(response.message || 'Operation completed successfully');
    }

    handleSessionExpired() {
        console.warn('Your session has expired. Please log in again.');
    }

    handleValidationErrors(response) {
        console.error(response.errors.join(', '));
    }

    handleApiError(response) {
        console.error(response.message || 'An unexpected error occurred. Please try again.');
    }

    handleNetworkError() {
        console.error('Unable to connect to the server. Please check your internet connection and try again.');
    }

    handleNetworkErrorMessage(error) {
        console.error(error.message || 'Network error occurred. Please try again.');
    }

    // Simple hash/query parser for all frontend and admin use
    static parseHashQuery() {
        const hash = window.location.hash || '';
        // Example: #records?editRecordId=123
        const [tab, query] = hash.replace(/^#/, '').split('?');
        const params = new URLSearchParams(query || '');
        return { tab, params };
    }
}

export { BasePageController };
