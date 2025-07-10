/**
 * Authentication Controllers
 * Controllers for authentication and protected pages
 */

import { BasePageController } from './base-controller.js';

/**
 * Authentication Page Controller
 * For login, register, and password reset pages
 */
class AuthPageController extends BasePageController {
    constructor(options = {}) {
        super(options);
        this.authAPI = options.authAPI;
    }

    /**
     * Handle authentication redirect logic
     */
    handleAuthRedirect() {
        // Check if already authenticated and redirect if needed
        if (this.authAPI && this.authAPI.isAuthenticated()) {
            const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
            window.location.href = redirectTo;
        }
    }

    /**
     * Handle successful authentication
     */
    handleAuthSuccess(redirectTo = '/') {
        console.log('Login successful!');
        window.location.href = redirectTo;
    }

    /**
     * Handle authentication failure
     */
    handleAuthFailure(response) {
        // Handle different types of authentication errors
        if (response.status === 401) {
            console.error('Invalid login credentials. Please try again.');
        } else if (response.errors && response.errors.length > 0) {
            console.error(response.errors.join(', '));
        } else {
            console.error(response.message || 'Authentication failed. Please try again.');
        }
    }
}

/**
 * Protected Page Controller
 * For pages that require authentication
 */
class ProtectedPageController extends BasePageController {
    constructor(options = {}) {
        super(options);
        this.authAPI = options.authAPI;
        this.requiredRole = options.requiredRole;
        this.requiredRoles = options.requiredRoles; // Support multiple roles
    }

    /**
     * Handle authentication redirect logic
     */
    async handleAuthRedirect() {
        if (!this.authAPI?.isAuthenticated()) {
            window.location.href = '/frontpage/';
            return;
        }

        if (this.requiredRole || this.requiredRoles) {
            const rolesToCheck = this.requiredRoles || [this.requiredRole];
            const userRoles = this.authAPI.getUserRoles();
            const hasRequiredRole = rolesToCheck.some(role => userRoles.includes(role));
            
            if (!hasRequiredRole) {
                window.location.href = '/frontpage/';
                return;
            }
        }
    }
}

export { AuthPageController, ProtectedPageController };
