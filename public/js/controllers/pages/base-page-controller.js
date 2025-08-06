class BasePageController {
    constructor(options = {}) {
        this.messageDiv = options.messageDiv || document.getElementById('messageDiv');
        this.isDestroyed = false;
        this.setupCommonHandlers();
    }

    setupCommonHandlers() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
    }

    handleAuthRedirect() {
    }

    async setMultipleLoading(elements, isLoading, loadingText = 'Loading...', type = 'spinner') {
        if (this.isDestroyed) return;
        
        const { LoadingState } = await import('../../components/loading-state.js');
        if (isLoading) {
            if (type === 'skeleton') {
                elements.forEach(element => LoadingState.showSkeleton(element));
            } else {
                LoadingState.showMultiple(elements, loadingText);
            }
        } else {
            LoadingState.hideMultiple(elements);
        }
    }

    handleApiResponse(response, successCallback = null, errorCallback = null) {
        if (this.isDestroyed) return;
        
        if (response.success) {
            if (successCallback) {
                successCallback(response.data);
            }
        } else {
            // Handle different types of errors
            if (response.status === 401) {
                this.handleSessionExpired();
            } else if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
                this.handleValidationErrors(response);
            } else {
                this.handleApiError(response);
            }
            
            if (errorCallback) {
                errorCallback(response);
            }
        }
    }

    async safeApiCall(apiCall, options = {}) {
        if (this.isDestroyed) {
            return {
                success: false,
                message: 'Component has been destroyed',
                errors: ['Component has been destroyed']
            };
        }
        
        const {
            loadingElements = [],
            loadingText = 'Loading...',
            loadingType = 'spinner', // 'spinner' or 'skeleton'
            successCallback = null,
            errorCallback = null,
        } = options;

        try {
            await this.setMultipleLoading(loadingElements, true, loadingText, loadingType);

            const response = await apiCall();

            if (!this.isDestroyed) {
                this.handleApiResponse(response, successCallback, errorCallback);
            }

            return response;

        } catch (error) {
            if (this.isDestroyed) return;
            
            console.error('API call error:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.handleNetworkError();
            } else {
                this.handleNetworkErrorMessage(error);
            }

            return {
                success: false,
                message: error.message || 'Network error occurred. Please check your connection and try again.',
                errors: [error.message || 'Network error occurred']
            };

        } finally {
            if (!this.isDestroyed) {
                await this.setMultipleLoading(loadingElements, false);
            }
        }
    }

    handleError(error) {
        console.error('An unexpected error occurred. Please refresh the page.');
    }

    handleSuccess(response) {
    }

    handleSessionExpired() {
        if (this.isDestroyed) return;
        // Redirect to login or show session expired message
        console.warn('Session expired. Redirecting to login.');
        // Use the AuthAPI logout function instead of direct redirect
        import('../../core/api-client.js').then(({ AuthAPI }) => {
            AuthAPI.logout();
        });
    }

    handleValidationErrors(response) {
        // Display validation errors to user
        if (response.errors && Array.isArray(response.errors)) {
            console.error('Validation errors:', response.errors.join(', '));
            // This should be implemented in specific controllers to show user-friendly messages
        }
    }

    handleApiError(response) {
        // Handle general API errors with user-friendly messages
        const message = response.message || 'An unexpected error occurred. Please try again.';
        console.error(message);
        // This should be implemented in specific controllers to show user-friendly messages
    }

    handleNetworkError() {
        console.error('Unable to connect to the server. Please check your internet connection and try again.');
        // This should be implemented in specific controllers to show user-friendly messages
    }

    handleNetworkErrorMessage(error) {
        const message = error.message || 'Network error occurred. Please try again.';
        console.error(message);
        // This should be implemented in specific controllers to show user-friendly messages
    }

    static parseHashQuery() {
        const hash = window.location.hash || '';
        const [tab, query] = hash.replace(/^#/, '').split('?');
        const params = new URLSearchParams(query || '');
        return { tab, params };
    }
    
    // Component lifecycle management
    destroy() {
        this.isDestroyed = true;
        // Clean up any event listeners or resources here
        // This method should be overridden in subclasses if needed
    }
    
    // Check if component is still active
    isActive() {
        return !this.isDestroyed;
    }
}

export { BasePageController };
