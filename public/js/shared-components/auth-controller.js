/**
 * Authentication Controllers
 * Controllers for authentication and protected pages
 */

import { BasePageController } from './base-controller.js';
import { messages } from '../ui-utils.js';

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
        messages.showSuccess('Login successful!');
        window.location.href = redirectTo;
    }

    /**
     * Handle authentication failure
     */
    handleAuthFailure(response) {
        // Handle different types of authentication errors
        if (response.status === 401) {
            messages.showError('Invalid login credentials. Please try again.');
        } else if (response.errors && response.errors.length > 0) {
            messages.showError(response.errors.join(', '));
        } else {
            messages.showError(response.message || 'Authentication failed. Please try again.');
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
    handleAuthRedirect() {
        console.log('ProtectedPageController: handleAuthRedirect called');
        console.log('ProtectedPageController: authAPI exists:', !!this.authAPI);
        console.log('ProtectedPageController: isAuthenticated:', this.authAPI?.isAuthenticated());
        console.log('ProtectedPageController: requiredRole:', this.requiredRole);
        console.log('ProtectedPageController: requiredRoles:', this.requiredRoles);
        
        if (!this.authAPI || !this.authAPI.isAuthenticated()) {
            console.log('ProtectedPageController: User not authenticated, redirecting to frontpage');
            window.location.href = '/';
            return false;
        }

        // Check role requirements if specified
        const rolesToCheck = this.requiredRoles || (this.requiredRole ? [this.requiredRole] : null);
        
        if (rolesToCheck) {
            console.log('ProtectedPageController: Checking role requirements for:', rolesToCheck);
            const userRoles = this.authAPI.getUserRole ? this.authAPI.getUserRole() : [];
            console.log('ProtectedPageController: User roles:', userRoles);
            
            // Check if user has any of the required roles
            const hasRequiredRole = rolesToCheck.some(role => userRoles.includes(role));
            console.log('ProtectedPageController: Has required role:', hasRequiredRole);
            
            if (!hasRequiredRole) {
                console.log('ProtectedPageController: User does not have required role, redirecting');
                messages.showError('You do not have permission to access this page.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
                return false;
            }
        }

        console.log('ProtectedPageController: Authentication check passed');
        return true;
    }
}

export { AuthPageController, ProtectedPageController };
