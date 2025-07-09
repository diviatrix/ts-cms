/**
 * Unified Message System - No Toasts
 * Centralized, intelligent error and message handling (single area)
 */

// Lazy load heavy dependencies
let apiClient = null;

const loadDependencies = async () => {
    if (!apiClient) {
        const module = await import('../api-auth.js');
        apiClient = module.apiClient;
    }
};

/**
 * Message types and their configurations
 */
const MESSAGE_TYPES = {
    success: { icon: '✓', class: 'success', duration: 4000 },
    info:    { icon: 'ℹ', class: 'info', duration: 5000 },
    warning: { icon: '⚠', class: 'warning', duration: 7000 },
    error:   { icon: '✗', class: 'error', duration: 10000 },
    critical:{ icon: '🚨', class: 'critical', duration: 0 }
};

/**
 * Error categories with user-friendly messages and recovery suggestions
 */
const ERROR_CATEGORIES = {
    NETWORK: {
        title: 'Connection Problem',
        defaultMessage: 'Unable to connect to the server',
        suggestions: [
            'Check your internet connection',
            'Try refreshing the page',
            'The server might be temporarily unavailable'
        ],
        retryable: true
    },
    AUTHENTICATION: {
        title: 'Authentication Required',
        defaultMessage: 'Your session has expired',
        suggestions: [
            'Please log in again to continue',
            'Your session may have timed out for security'
        ],
        retryable: false,
        redirectTo: '/login'
    },
    VALIDATION: {
        title: 'Input Error',
        defaultMessage: 'Please check your input',
        suggestions: [
            'Review the highlighted fields',
            'Make sure all required fields are filled'
        ],
        retryable: false
    },
    PERMISSION: {
        title: 'Access Denied',
        defaultMessage: 'You don\'t have permission for this action',
        suggestions: [
            'Contact your administrator if you believe this is an error',
            'Try logging out and back in'
        ],
        retryable: false
    },
    NOT_FOUND: {
        title: 'Not Found',
        defaultMessage: 'The requested item could not be found',
        suggestions: [
            'Check if the item still exists',
            'Try refreshing the list'
        ],
        retryable: true
    },
    SERVER_ERROR: {
        title: 'Server Error',
        defaultMessage: 'Something went wrong on our end',
        suggestions: [
            'Try again in a few moments',
            'Contact support if the problem persists'
        ],
        retryable: true
    },
    CLIENT_ERROR: {
        title: 'Application Error',
        defaultMessage: 'An unexpected error occurred',
        suggestions: [
            'Try refreshing the page',
            'Clear your browser cache if problems persist'
        ],
        retryable: true
    }
};

/**
 * Context-aware error patterns for smarter categorization
 */
const ERROR_PATTERNS = [
    // Network related
    { pattern: /network|connection|timeout|offline/i, category: 'NETWORK' },
    
    // Authentication related  
    { pattern: /unauthorized|invalid.?token|session.?expired|login.?required/i, category: 'AUTHENTICATION' },
    
    // Validation related
    { pattern: /validation|invalid.?input|required.?field|format/i, category: 'VALIDATION' },
    
    // Permission related
    { pattern: /permission|access.?denied|forbidden|not.?allowed/i, category: 'PERMISSION' },
    
    // Not found related
    { pattern: /not.?found|does.?not.?exist|missing/i, category: 'NOT_FOUND' },
    
    // Server errors
    { pattern: /server.?error|internal.?error|500|502|503|504/i, category: 'SERVER_ERROR' }
];

// Remove all DOM, style, and rendering logic. Only manage message state and provide logic methods.

class MessageSystemLogicOnly {
    constructor() {
        this.messages = [];
        this.listeners = [];
    }

    // Subscribe to message changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.messages));
    }

    addMessage({ type, text, title = '', suggestions = [], actions = [], duration = 5000 }) {
        const id = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        const msg = { id, type, text, title, suggestions, actions, duration };
        this.messages.push(msg);
        this.notify();
        if (duration > 0) setTimeout(() => this.removeMessage(id), duration);
        return id;
    }

    removeMessage(id) {
        this.messages = this.messages.filter(m => m.id !== id);
        this.notify();
    }

    clearAll() {
        this.messages = [];
        this.notify();
    }

    // Convenience methods
    showSuccess(text, opts = {}) { return this.addMessage({ type: 'success', text, ...opts }); }
    showInfo(text, opts = {})    { return this.addMessage({ type: 'info', text, ...opts }); }
    showWarning(text, opts = {}) { return this.addMessage({ type: 'warning', text, ...opts }); }
    showError(text, opts = {})   { return this.addMessage({ type: 'error', text, ...opts }); }

    // Optionally, add error categorization logic here if needed (logic only)
}

const messageSystem = new MessageSystemLogicOnly();

export { messageSystem };
