/**
 * Message API - Compatibility Layer
 * Provides backward compatibility for legacy message API
 * Uses the message system under the hood
 */

import { unifiedMessageSystem } from './message-system.js';

/**
 * Compatibility wrapper for the old messages API
 */
export const messages = {
    /**
     * Show success message
     */
    success: (message, options = {}) => {
        return unifiedMessageSystem.showSuccess(message, options);
    },

    /**
     * Show info message
     */
    info: (message, options = {}) => {
        return unifiedMessageSystem.showInfo(message, options);
    },

    /**
     * Show warning message
     */
    warning: (message, options = {}) => {
        return unifiedMessageSystem.showWarning(message, options);
    },

    /**
     * Show error message
     */
    error: (message, options = {}) => {
        return unifiedMessageSystem.showError(message, options);
    },

    /**
     * Show validation error
     */
    validationError: (message, options = {}) => {
        return unifiedMessageSystem.showError(message, { 
            category: 'FORM_VALIDATION',
            ...options 
        });
    },

    /**
     * Show loading message
     */
    loading: (message, timeout = 30000) => {
        return unifiedMessageSystem.show('info', message, { 
            duration: timeout,
            persistent: true,
            dismissible: false,
            loading: true
        });
    },

    /**
     * Dismiss message by ID
     */
    dismiss: (messageId) => {
        return unifiedMessageSystem.dismiss(messageId);
    },

    /**
     * Handle API response
     */
    apiResponse: (response) => {
        return unifiedMessageSystem.handleApiResponse(response);
    },

    /**
     * Set context for better error handling
     */
    setContext: (context) => {
        unifiedMessageSystem.context.currentPage = context;
        unifiedMessageSystem.context.userAction = context;
    },

    /**
     * Clear all messages
     */
    clear: () => {
        return unifiedMessageSystem.clearAll();
    }
};

/**
 * Simple Message API class for compatibility
 */
export class SimpleMessageAPI {
    static success = messages.success;
    static info = messages.info;
    static warning = messages.warning;
    static error = messages.error;
    static loading = messages.loading;
    static dismiss = messages.dismiss;
    static apiResponse = messages.apiResponse;
    static setContext = messages.setContext;
    static clear = messages.clear;
}

/**
 * Error handling wrapper
 */
export const withErrorHandling = (fn, context = {}) => {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            unifiedMessageSystem.showError(error, {
                context,
                userAction: context.action || 'unknown'
            });
            throw error;
        }
    };
};

/**
 * Form response handler
 */
export const handleFormResponse = (response, options = {}) => {
    return unifiedMessageSystem.handleApiResponse(response, options);
};

// Make globally available for backward compatibility
if (typeof window !== 'undefined') {
    window.messages = messages;
    window.SimpleMessageAPI = SimpleMessageAPI;
}
