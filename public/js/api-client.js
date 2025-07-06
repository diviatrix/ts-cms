/**
 * Centralized API Client for ts-cms Frontend (Simplified)
 * Handles standardized backend responses and provides consistent error handling
 */

import { jwtDecode } from './jwt-decode.js';

/**
 * Standard API Response interface matching backend
 */
class ApiResponse {
    constructor(success = false, data = null, message = '', errors = []) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.errors = errors;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * API Client Configuration
 */
const API_CONFIG = {
    baseURL: '/api',
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
};

/**
 * Centralized API Client
 */
class ApiClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || API_CONFIG.baseURL;
        this.timeout = config.timeout || API_CONFIG.timeout;
        this.retryAttempts = config.retryAttempts || API_CONFIG.retryAttempts;
        this.retryDelay = config.retryDelay || API_CONFIG.retryDelay;
    }

    /**
     * Get authorization token from localStorage
     */
    getAuthToken() {
        return localStorage.getItem('token');
    }

    /**
     * Set authorization token in localStorage
     */
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    /**
     * Create request headers with authentication
     */
    getHeaders(auth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (auth && this.getAuthToken()) {
            headers['Authorization'] = `Bearer ${this.getAuthToken()}`;
        }

        return headers;
    }

    /**
     * Handle HTTP errors and convert to standard format
     */
    async handleResponse(response) {
        if (response.status === 204) {
            // No Content: treat as success
            return {
                success: true,
                message: 'Operation successful',
                data: null,
                errors: []
            };
        }
        
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = {
                success: false,
                message: `Unexpected response format: ${text}`,
                errors: [`HTTP ${response.status}: ${response.statusText}`]
            };
        }
        
        if (!data.hasOwnProperty('success')) {
            data = {
                success: response.ok,
                data: data,
                message: response.ok ? 'Request successful' : 'Request failed',
                errors: response.ok ? [] : [`HTTP ${response.status}: ${response.statusText}`]
            };
        }
        
        // Auto-handle unauthorized responses
        if (response.status === 401) {
            this.handleAuthError(data);
        }
        
        return data;
    }

    /**
     * Handle HTML response (for non-API endpoints)
     */
    async handleHtmlResponse(response) {
        if (response.status === 204) {
            return {
                success: true,
                message: 'Operation successful',
                data: null,
                errors: []
            };
        }
        
        if (!response.ok) {
            return {
                success: false,
                message: `HTTP ${response.status}: ${response.statusText}`,
                data: null,
                errors: [`HTTP ${response.status}: ${response.statusText}`]
            };
        }
        
        const html = await response.text();
        return {
            success: true,
            message: 'HTML content retrieved successfully',
            data: html,
            errors: []
        };
    }

    /**
     * Make HTTP request with retry logic
     */
    async request(url, { method = 'GET', data, auth = true, ...opts } = {}, attempt = 1) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        
        try {
            // Add timeout to request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(fullUrl, {
                method,
                body: data && method !== 'GET' ? JSON.stringify(data) : undefined,
                headers: this.getHeaders(auth),
                signal: controller.signal,
                ...opts
            });

            clearTimeout(timeoutId);
            return await this.handleResponse(response);

        } catch (error) {
            // Handle network errors, timeouts, etc.
            if (error.name === 'AbortError') {
                const timeoutError = {
                    success: false,
                    message: 'Request timeout',
                    errors: ['The request took too long to complete']
                };

                // Retry on timeout
                if (attempt < this.retryAttempts) {
                    console.warn(`Request timeout, retrying... (${attempt}/${this.retryAttempts})`);
                    await this.delay(this.retryDelay * attempt);
                    return this.request(url, { method, data, auth, ...opts }, attempt + 1);
                }

                return timeoutError;
            }

            // Handle other network errors
            const networkError = {
                success: false,
                message: 'Network error occurred',
                errors: [error.message || 'Failed to connect to server']
            };

            // Retry on network error
            if (attempt < this.retryAttempts) {
                console.warn(`Network error, retrying... (${attempt}/${this.retryAttempts})`);
                await this.delay(this.retryDelay * attempt);
                return this.request(url, { method, data, auth, ...opts }, attempt + 1);
            }

            return networkError;
        }
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * GET request
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        return this.request(fullUrl, {
            method: 'GET'
        });
    }

    /**
     * GET HTML request (for non-API endpoints)
     */
    async getHtml(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        try {
            // Add timeout to request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(fullUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            clearTimeout(timeoutId);
            return await this.handleHtmlResponse(response);

        } catch (error) {
            // Handle network errors, timeouts, etc.
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout',
                    errors: ['The request took too long to complete']
                };
            }

            // Handle other network errors
            return {
                success: false,
                message: 'Network error occurred',
                errors: [error.message || 'Failed to connect to server']
            };
        }
    }

    /**
     * POST request
     */
    async post(url, data = {}, includeAuth = true) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            auth: includeAuth
        });
    }

    /**
     * PUT request
     */
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getAuthToken();
        if (!token) return false;

        try {
            // Basic JWT validation (check if it's not expired)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp * 1000 <= Date.now();
            
            // Auto-clear expired tokens
            if (isExpired) {
                console.log('[ApiClient] Token expired, clearing...');
                this.setAuthToken(null);
                
                // Show message only if not on login page
                if (!window.location.pathname.includes('/login') && window.messages) {
                    window.messages.warning('Your session has expired.');
                }
                return false;
            }
            
            return true;
        } catch (error) {
            // Clear invalid tokens
            console.error('[ApiClient] Invalid token format, clearing...', error);
            this.setAuthToken(null);
            
            // Show message only if not on login page
            if (!window.location.pathname.includes('/login') && window.messages) {
                window.messages.warning('Invalid session detected.');
            }
            return false;
        }
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(response) {
        // Clear the invalid token
        this.setAuthToken(null);

        // If already on login page or about to redirect, do not show a warning or log
        const isOnLoginPage = window.location.pathname.includes('/login');
        const isRedirecting = typeof this.isRedirectingToLogin === 'function' && this.isRedirectingToLogin();
        if (isOnLoginPage || isRedirecting) {
            // Silently handle 401: do not log anything to the browser console
            return true;
        }

        // Show user-friendly message only if not redirecting
        if (window.messages) {
            window.messages.warning('Your session has expired.');
        }
        return true;
    }

    /**
     * Logout user
     */
    logout() {
        this.setAuthToken(null);
        window.location.href = '/';
    }

    /**
     * Make HTTP request with enhanced error handling
     */
    async makeRequestWithErrorHandling(url, options = {}, messageDisplay = null, retryCallback = null) {
        const operationKey = `${options.method || 'GET'}_${url}`;
        
        try {
            const response = await this.request(url, options);
            
            // Clear retry count on success
            if (window.errorHandler) {
                window.errorHandler.clearRetries(operationKey);
            }
            
            return response;
            
        } catch (error) {
            console.error('API Request Error:', error);
            
            // Use enhanced error handler if available
            if (window.errorHandler && messageDisplay) {
                window.errorHandler.handleNetworkError(error, messageDisplay, retryCallback, operationKey);
            } else if (messageDisplay) {
                // Fallback error handling
                messageDisplay.showError('Network error occurred. Please try again.');
            }
            
            // Return error response format
            return {
                success: false,
                message: error.message || 'Network error occurred',
                errors: [error.message || 'Network error occurred']
            };
        }
    }
}

/**
 * Create singleton instance
 */
const apiClient = new ApiClient();

/**
 * Authentication API methods
 */
const AuthAPI = {
    async login(login, password) {
        const response = await apiClient.post('/login', { login, password }, false);
        if (response.success && response.data?.token) {
            apiClient.setAuthToken(response.data.token);
        }
        return response;
    },

    async register(login, email, password) {
        return apiClient.post('/register', { login, email, password }, false);
    },

    logout() {
        apiClient.logout();
    },

    isAuthenticated() {
        return apiClient.isAuthenticated();
    },

    getUserRole() {
        const token = apiClient.getAuthToken();
        if (!token) return [];
        
        try {
            const decoded = jwtDecode(token);
            console.log('getUserRole: decoded token:', decoded);
            console.log('getUserRole: roles field:', decoded.roles);
            console.log('getUserRole: groups field:', decoded.groups);
            // Check both 'roles' and 'groups' fields for compatibility
            const roles = decoded.roles || decoded.groups || [];
            console.log('getUserRole: returning roles:', roles);
            return roles;
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            return [];
        }
    }
};

/**
 * Records API methods
 */
const RecordsAPI = {
    async getAll(params = {}) {
        return apiClient.get('/records', params);
    },

    async getById(id) {
        return apiClient.get(`/records/${id}`);
    },

    async create(recordData) {
        return apiClient.post('/records', recordData);
    },

    async update(id, recordData) {
        return apiClient.put(`/records/${id}`, recordData);
    },

    async delete(id) {
        return apiClient.delete(`/records/${id}`);
    }
};

/**
 * Admin API methods
 */
const AdminAPI = {
    async getUsers() {
        return apiClient.get('/admin/users');
    },

    async getUserProfile(userId) {
        return apiClient.get(`/profile/${userId}`);
    }
};

/**
 * Profile API methods
 */
const ProfileAPI = {
    async get() {
        return apiClient.get('/profile');
    },

    async update(profileData) {
        return apiClient.post('/profile', profileData);
    },

    async updatePassword(passwordData) {
        return apiClient.post('/profile/password/set', passwordData);
    }
};

/**
 * Utility API methods (for non-API endpoints)
 */
const UtilityAPI = {
    async getHtml(url, params = {}) {
        return apiClient.getHtml(url, params);
    }
};

/**
 * Export for use in other scripts
 */
export { apiClient, AuthAPI, RecordsAPI, AdminAPI, ProfileAPI, UtilityAPI, ApiResponse };

if (window.AuthAPI?.isAuthenticated?.() === true) {
  // Only fetch settings if authenticated
  apiClient.get('/api/cms/settings');
}
