import { BasePageController } from '../controllers/base-page-controller.js';

class AuthPageController extends BasePageController {
    constructor(options = {}) {
        super(options);
        this.authAPI = options.authAPI;
    }

    handleAuthRedirect() {
        AuthPageController.handleAuthRedirect(this.authAPI);
    }

    handleAuthSuccess(redirectTo = '/') {
        console.log('Login successful!');
        window.location.href = redirectTo;
    }

    handleAuthFailure(response) {
        if (response.status === 401) {
            console.error('Invalid login credentials. Please try again.');
        } else if (response.errors && response.errors.length > 0) {
            console.error(response.errors.join(', '));
        } else {
            console.error(response.message || 'Authentication failed. Please try again.');
        }
    }

    static handleAuthError(response) {
        if (response.status === 401) {
            console.warn('Authentication error: Session expired or unauthorized. Logging out.');
            this.logout();
            return true;
        }
        return false;
    }

    static handleAuthRedirect(authAPI, requiredRole, requiredRoles) {
        if (!authAPI?.isAuthenticated()) {
            window.location.href = '/';
            return;
        }
        if (requiredRole || requiredRoles) {
            const rolesToCheck = requiredRoles || [requiredRole];
            const userRoles = authAPI.getUserRoles();
            const hasRequiredRole = rolesToCheck.some(role => userRoles.includes(role));
            if (!hasRequiredRole) {
                window.location.href = '/';
                return;
            }
        }
    }
}

class ProtectedPageController extends BasePageController {
    constructor(options = {}) {
        super(options);
        this.authAPI = options.authAPI;
        this.requiredRole = options.requiredRole;
        this.requiredRoles = options.requiredRoles; // Support multiple roles
    }

    async handleAuthRedirect() {
        AuthPageController.handleAuthRedirect(this.authAPI, this.requiredRole, this.requiredRoles);
    }
}

export { AuthPageController, ProtectedPageController };
