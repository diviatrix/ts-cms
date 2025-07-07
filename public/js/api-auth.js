// Auth/token logic extracted from api-client.js
import { apiClient } from './api-core.js';
import { jwtDecode } from './jwt-decode.js';

/**
 * Get the current auth token from localStorage.
 * @returns {string|null}
 */
function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Set or remove the auth token in localStorage.
 * @param {string|null} token
 */
function setAuthToken(token) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

/**
 * Check if the user is authenticated (token exists and not expired).
 * @param {object} [messages] - Optional message system for notifications.
 * @returns {boolean}
 */
function isAuthenticated(messages) {
    const token = getAuthToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 <= Date.now();
        if (isExpired) {
            setAuthToken(null);
            if (messages) {
                messages.showWarning('Your session has expired.');
            }
            return false;
        }
        return true;
    } catch (error) {
        setAuthToken(null);
        if (messages) {
            messages.showWarning('Invalid session detected.');
        }
        return false;
    }
}

/**
 * Log out the user and redirect to home.
 */
function logout() {
    setAuthToken(null);
    window.location.href = '/';
}

/**
 * Get the user's roles from the JWT token.
 * @returns {string[]}
 */
function getUserRole() {
    const token = getAuthToken();
    if (!token) return [];
    try {
        const decoded = jwtDecode(token);
        const roles = decoded.roles || decoded.groups || [];
        return roles;
    } catch (error) {
        return [];
    }
}

/**
 * Auth API for login, register, logout, etc.
 */
const AuthAPI = {
    /**
     * Log in with username and password.
     * @param {string} login
     * @param {string} password
     * @param {object} [messages] - Optional message system for notifications.
     * @returns {Promise<object>}
     */
    async login(login, password, messages) {
        const response = await apiClient.post('/login', { login, password }, false);
        if (response.success && response.data?.token) {
            setAuthToken(response.data.token);
        } else if (messages && response.message) {
            messages.showError(response.message);
        }
        return response;
    },
    /**
     * Register a new user.
     * @param {string} login
     * @param {string} email
     * @param {string} password
     * @returns {Promise<object>}
     */
    async register(login, email, password) {
        return apiClient.post('/register', { login, email, password }, false);
    },
    logout,
    isAuthenticated,
    getUserRole
};

export { getAuthToken, setAuthToken, isAuthenticated, logout, getUserRole, AuthAPI }; 