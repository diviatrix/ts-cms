/**
 * Centralized API Client for ts-cms Frontend
 * Handles standardized backend responses and provides consistent error handling
 */

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
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.timeout = API_CONFIG.timeout;
        this.retryAttempts = API_CONFIG.retryAttempts;
        this.retryDelay = API_CONFIG.retryDelay;
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
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Handle HTTP errors and convert to standard format
     */
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let data;

        // Handle JSON responses
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Handle non-JSON responses
            const text = await response.text();
            data = {
                success: false,
                message: `Unexpected response format: ${text}`,
                errors: [`HTTP ${response.status}: ${response.statusText}`]
            };
        }

        // Ensure response follows our standard format
        if (!data.hasOwnProperty('success')) {
            data = {
                success: response.ok,
                data: data,
                message: response.ok ? 'Request successful' : 'Request failed',
                errors: response.ok ? [] : [`HTTP ${response.status}: ${response.statusText}`]
            };
        }

        return data;
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(url, options = {}, attempt = 1) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        
        try {
            // Add timeout to request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(fullUrl, {
                ...options,
                signal: controller.signal,
                headers: {
                    ...this.getHeaders(options.includeAuth !== false),
                    ...options.headers
                }
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
                    return this.makeRequest(url, options, attempt + 1);
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
                return this.makeRequest(url, options, attempt + 1);
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
        
        return this.makeRequest(fullUrl, {
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(url, data = {}, includeAuth = true) {
        return this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(data),
            includeAuth
        });
    }

    /**
     * PUT request
     */
    async put(url, data = {}) {
        return this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(url) {
        return this.makeRequest(url, {
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
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(response) {
        if (response && (response.status === 401 || response.errors?.some(err => err.includes('Unauthorized')))) {
            this.setAuthToken(null);
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            return true;
        }
        return false;
    }

    /**
     * Logout user
     */
    logout() {
        this.setAuthToken(null);
        window.location.href = '/login';
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

    async register(login, email, password_hash) {
        return apiClient.post('/register', { login, email, password_hash }, false);
    },

    logout() {
        apiClient.logout();
    },

    isAuthenticated() {
        return apiClient.isAuthenticated();
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
 * Export for use in other scripts
 */
export { apiClient, AuthAPI, RecordsAPI, AdminAPI, ProfileAPI, ApiResponse };
