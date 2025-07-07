// Error handling logic extracted from api-client.js
import { setAuthToken } from './api-auth.js';

/**
 * Handle a fetch response, returning a normalized result object.
 * @param {Response} response
 * @param {object} [messages] - Optional message system for notifications.
 * @returns {Promise<object>}
 */
async function handleResponse(response, messages) {
    if (response.status === 204) {
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
    if (response.status === 401) {
        handleAuthError(data, messages);
    }
    return data;
}

/**
 * Handle a fetch response for HTML content.
 * @param {Response} response
 * @returns {Promise<object>}
 */
async function handleHtmlResponse(response) {
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
 * Handle authentication errors (401), clear token, and notify user.
 * @param {object} response
 * @param {object} [messages] - Optional message system for notifications.
 * @returns {boolean}
 */
function handleAuthError(response, messages) {
    setAuthToken(null);
    if (messages) {
        messages.showWarning('Your session has expired.');
    }
    return true;
}

/**
 * Make a request with error handling and optional retry logic.
 * @param {string} url
 * @param {object} options
 * @param {object} [messageDisplay] - Optional message system for notifications.
 * @param {function} [retryCallback]
 * @param {object} [apiClient] - Optional apiClient instance to use.
 * @returns {Promise<object>}
 */
async function makeRequestWithErrorHandling(url, options = {}, messageDisplay = null, retryCallback = null, apiClient = null) {
    const operationKey = `${options.method || 'GET'}_${url}`;
    try {
        if (!apiClient) throw new Error('apiClient is required');
        const response = await apiClient.request(url, options);
        return response;
    } catch (error) {
        if (messageDisplay) {
            messageDisplay.showError('Network error occurred. Please try again.');
        }
        return {
            success: false,
            message: error.message || 'Network error occurred',
            errors: [error.message || 'Network error occurred']
        };
    }
}

export { handleResponse, handleHtmlResponse, handleAuthError, makeRequestWithErrorHandling }; 