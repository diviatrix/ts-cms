// Core API logic extracted from api-client.js

/**
 * Standard API response wrapper.
 * @class
 */
class ApiResponse {
    /**
     * @param {boolean} [success=false]
     * @param {any} [data=null]
     * @param {string} [message='']
     * @param {Array} [errors=[]]
     */
    constructor(success = false, data = null, message = '', errors = []) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.errors = errors;
        this.timestamp = new Date().toISOString();
    }
}

const API_CONFIG = {
    baseURL: '/api',
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
};

/**
 * Core API client for HTTP requests.
 * @class
 */
class ApiClient {
    /**
     * @param {object} [config={}]
     */
    constructor(config = {}) {
        this.baseURL = config.baseURL || API_CONFIG.baseURL;
        this.timeout = config.timeout || API_CONFIG.timeout;
        this.retryAttempts = config.retryAttempts || API_CONFIG.retryAttempts;
        this.retryDelay = config.retryDelay || API_CONFIG.retryDelay;
    }

    /**
     * Get headers for a request.
     * @param {boolean} [auth=true]
     * @returns {object}
     */
    getHeaders(auth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (auth && this.getAuthToken && this.getAuthToken()) {
            headers['Authorization'] = `Bearer ${this.getAuthToken()}`;
        }
        return headers;
    }

    /**
     * Make an HTTP request with retry and timeout.
     * @param {string} url
     * @param {object} [opts]
     * @param {number} [attempt=1]
     * @returns {Promise<object>}
     */
    async request(url, { method = 'GET', data, auth = true, ...opts } = {}, attempt = 1) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        try {
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
            // handleResponse should be imported and used here for consistency
            if (typeof this.handleResponse === 'function') {
                return await this.handleResponse(response);
            }
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                const timeoutError = {
                    success: false,
                    message: 'Request timeout',
                    errors: ['The request took too long to complete']
                };
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                    return this.request(url, { method, data, auth, ...opts }, attempt + 1);
                }
                return timeoutError;
            }
            const networkError = {
                success: false,
                message: 'Network error occurred',
                errors: [error.message || 'Failed to connect to server']
            };
            if (attempt < this.retryAttempts) {
                await this.delay(this.retryDelay * attempt);
                return this.request(url, { method, data, auth, ...opts }, attempt + 1);
            }
            return networkError;
        }
    }

    /**
     * Delay helper.
     * @param {number} ms
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * GET request with query params.
     * @param {string} url
     * @param {object} [params={}]
     * @returns {Promise<object>}
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    }

    /**
     * GET request for HTML content.
     * @param {string} url
     * @param {object} [params={}]
     * @returns {Promise<object>}
     */
    async getHtml(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        try {
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
            // handleHtmlResponse should be imported and used here for consistency
            if (typeof this.handleHtmlResponse === 'function') {
                return await this.handleHtmlResponse(response);
            }
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout',
                    errors: ['The request took too long to complete']
                };
            }
            return {
                success: false,
                message: 'Network error occurred',
                errors: [error.message || 'Failed to connect to server']
            };
        }
    }

    /**
     * POST request.
     * @param {string} url
     * @param {object} [data={}]
     * @param {boolean} [includeAuth=true]
     * @returns {Promise<object>}
     */
    async post(url, data = {}, includeAuth = true) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            auth: includeAuth
        });
    }

    /**
     * PUT request.
     * @param {string} url
     * @param {object} [data={}]
     * @returns {Promise<object>}
     */
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request.
     * @param {string} url
     * @returns {Promise<object>}
     */
    async delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    }
}

const apiClient = new ApiClient();

import { handleHtmlResponse, handleResponse } from './api-error.js';
import { getAuthToken } from './api-auth.js';
apiClient.handleHtmlResponse = handleHtmlResponse;
apiClient.handleResponse = handleResponse;
apiClient.getAuthToken = getAuthToken;

/**
 * Records API group.
 */
const RecordsAPI = {
    /** Get all records. */
    async getAll(params = {}) {
        return apiClient.get('/records', params);
    },
    /** Get a record by ID. */
    async getById(id) {
        return apiClient.get(`/records/${id}`);
    },
    /** Create a new record. */
    async create(recordData) {
        return apiClient.post('/records', recordData);
    },
    /** Update a record by ID. */
    async update(id, recordData) {
        return apiClient.put(`/records/${id}`, recordData);
    },
    /** Delete a record by ID. */
    async delete(id) {
        return apiClient.delete(`/records/${id}`);
    }
};

/**
 * Admin API group.
 */
const AdminAPI = {
    /** Get all users. */
    async getUsers() {
        return apiClient.get('/admin/users');
    },
    /** Get a user profile by user ID. */
    async getUserProfile(userId) {
        return apiClient.get(`/profile/${userId}`);
    }
};

/**
 * Profile API group.
 */
const ProfileAPI = {
    /** Get the current user's profile. */
    async get() {
        return apiClient.get('/profile');
    },
    /** Update the current user's profile. */
    async update(profileData) {
        return apiClient.post('/profile', profileData);
    },
    /** Update the current user's password. */
    async updatePassword(passwordData) {
        return apiClient.post('/profile/password/set', passwordData);
    }
};

/**
 * Utility API group.
 */
const UtilityAPI = {
    /** Get HTML content from a URL. */
    async getHtml(url, params = {}) {
        return apiClient.getHtml(url, params);
    }
};

export { apiClient, RecordsAPI, AdminAPI, ProfileAPI, UtilityAPI, ApiResponse }; 