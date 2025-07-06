/**
 * Unified Message System - Optimized Version
 * Centralized, intelligent error and message handling with lazy loading
 */

// Lazy load heavy dependencies
let apiClient = null;

const loadDependencies = async () => {
    if (!apiClient) {
        const module = await import('../api-client.js');
        apiClient = module.apiClient;
    }
};

/**
 * Message types and their configurations
 */
const MESSAGE_TYPES = {
    SUCCESS: {
        type: 'success',
        icon: '✓',
        duration: 4000,
        dismissible: true,
        persistent: false
    },
    INFO: {
        type: 'info', 
        icon: 'ℹ',
        duration: 5000,
        dismissible: true,
        persistent: false
    },
    WARNING: {
        type: 'warning',
        icon: '⚠',
        duration: 7000,
        dismissible: true,
        persistent: false
    },
    ERROR: {
        type: 'error',
        icon: '✗',
        duration: 10000,
        dismissible: true,
        persistent: true
    },
    CRITICAL: {
        type: 'critical',
        icon: '🚨',
        duration: 0, // Never auto-dismiss
        dismissible: true,
        persistent: true
    }
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

/**
 * Unified Message System Class
 */
class UnifiedMessageSystem {
    constructor() {
        this.messageQueue = [];
        this.activeMessages = new Map();
        this.retryCallbacks = new Map();
        this.context = {
            currentPage: this.getCurrentPageContext(),
            userAction: null,
            formContext: null
        };
        
        this.initialize();
    }

    /**
     * Initialize the message system
     */
    initialize() {
        this.createMessageContainer();
        this.setupGlobalErrorHandling();
        this.setupFormContextTracking();
    }

    /**
     * Create the message container if it doesn't exist
     */
    createMessageContainer() {
        let container = document.getElementById('unified-message-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'unified-message-container';
            container.className = 'unified-message-container';
            container.innerHTML = `
                <div class="message-area" id="message-area"></div>
                <div class="toast-area" id="toast-area"></div>
            `;
            document.body.appendChild(container);
        }
        
        this.messageArea = document.getElementById('message-area');
        this.toastArea = document.getElementById('toast-area');
        
        // Add CSS if not present
        this.addStylesheet();
    }

    /**
     * Add required CSS styles
     */
    addStylesheet() {
        if (document.getElementById('unified-message-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'unified-message-styles';
        style.textContent = `
            .unified-message-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10000;
                pointer-events: none;
            }
            
            .message-area {
                padding: 10px 20px 0;
            }
            
            .toast-area {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
            }
            
            .unified-message {
                pointer-events: auto;
                margin-bottom: 10px;
                border-radius: 6px;
                padding: 12px 16px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                animation: slideDown 0.3s ease-out;
            }
            
            .unified-message.toast {
                max-width: 100%;
                animation: slideInRight 0.3s ease-out;
            }
            
            .unified-message--success {
                background: #d4edda;
                border-left: 4px solid #28a745;
                color: #155724;
            }
            
            .unified-message--info {
                background: #d1ecf1;
                border-left: 4px solid #17a2b8;
                color: #0c5460;
            }
            
            .unified-message--warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                color: #856404;
            }
            
            .unified-message--error {
                background: #f8d7da;
                border-left: 4px solid #dc3545;
                color: #721c24;
            }
            
            .unified-message--critical {
                background: #f8d7da;
                border-left: 4px solid #dc3545;
                color: #721c24;
                box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
            }
            
            .message-icon {
                font-size: 18px;
                font-weight: bold;
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .message-content {
                flex: 1;
            }
            
            .message-title {
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .message-text {
                margin-bottom: 8px;
                line-height: 1.4;
            }
            
            .message-suggestions {
                font-size: 0.9em;
                opacity: 0.8;
                margin-top: 8px;
            }
            
            .message-suggestions ul {
                margin: 4px 0 0 16px;
                padding: 0;
            }
            
            .message-suggestions li {
                margin-bottom: 2px;
            }
            
            .message-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            
            .message-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s;
            }
            
            .message-btn--primary {
                background: #007bff;
                color: white;
            }
            
            .message-btn--primary:hover {
                background: #0056b3;
            }
            
            .message-btn--secondary {
                background: #6c757d;
                color: white;
            }
            
            .message-btn--secondary:hover {
                background: #545b62;
            }
            
            .message-close {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                opacity: 0.6;
                padding: 0;
                margin-left: 8px;
                flex-shrink: 0;
            }
            
            .message-close:hover {
                opacity: 1;
            }
            
            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.95);
                }
            }
            
            .unified-message.removing {
                animation: fadeOut 0.3s ease-out forwards;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Catch unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.showError('CLIENT_ERROR', {
                message: 'An unexpected error occurred',
                technical: event.error?.message || event.message,
                context: 'JavaScript Error'
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.showError('CLIENT_ERROR', {
                message: 'An operation failed unexpectedly',
                technical: event.reason?.message || String(event.reason),
                context: 'Promise Rejection'
            });
        });
    }

    /**
     * Setup form context tracking
     */
    setupFormContextTracking() {
        document.addEventListener('focusin', (event) => {
            if (event.target.form) {
                this.context.formContext = {
                    form: event.target.form,
                    formId: event.target.form.id || 'unnamed-form',
                    fieldName: event.target.name || event.target.id
                };
            }
        });
    }

    /**
     * Get current page context for better error categorization
     */
    getCurrentPageContext() {
        const path = window.location.pathname;
        const contexts = {
            '/login': 'authentication',
            '/admin': 'administration', 
            '/profile': 'profile',
            '/record': 'content',
            '/': 'homepage'
        };
        
        for (const [route, context] of Object.entries(contexts)) {
            if (path.includes(route)) return context;
        }
        return 'general';
    }

    /**
     * Smart error categorization based on error content and context
     */
    categorizeError(error, context = {}) {
        // Check for explicit category
        if (context.category && ERROR_CATEGORIES[context.category]) {
            return context.category;
        }

        // Pattern matching on error message
        const errorText = (error.message || error || '').toString();
        
        for (const errorPattern of ERROR_PATTERNS) {
            if (errorPattern.pattern.test(errorText)) {
                return errorPattern.category;
            }
        }

        // Context-based categorization
        if (this.context.currentPage === 'authentication') {
            return 'AUTHENTICATION';
        }

        if (this.context.formContext) {
            return 'VALIDATION';
        }

        // Default to client error
        return 'CLIENT_ERROR';
    }

    /**
     * Main method to show any type of message
     */
    show(type, message, options = {}) {
        const messageConfig = MESSAGE_TYPES[type] || MESSAGE_TYPES.INFO;
        const messageId = this.generateMessageId();
        
        const messageData = {
            id: messageId,
            type: messageConfig.type,
            icon: messageConfig.icon,
            title: options.title || '',
            message: typeof message === 'string' ? message : message.message || 'An error occurred',
            suggestions: options.suggestions || [],
            actions: options.actions || [],
            technical: options.technical || '',
            context: options.context || '',
            isToast: options.toast !== false && !messageConfig.persistent,
            duration: options.duration !== undefined ? options.duration : messageConfig.duration,
            dismissible: options.dismissible !== undefined ? options.dismissible : messageConfig.dismissible,
            onRetry: options.onRetry,
            onDismiss: options.onDismiss
        };

        this.renderMessage(messageData);
        this.activeMessages.set(messageId, messageData);

        // Auto-dismiss if duration > 0
        if (messageData.duration > 0) {
            setTimeout(() => {
                this.dismiss(messageId);
            }, messageData.duration);
        }

        return messageId;
    }

    /**
     * Show success message
     */
    showSuccess(message, options = {}) {
        return this.show('SUCCESS', message, { ...options, toast: true });
    }

    /**
     * Show info message  
     */
    showInfo(message, options = {}) {
        return this.show('INFO', message, options);
    }

    /**
     * Show warning message
     */
    showWarning(message, options = {}) {
        return this.show('WARNING', message, options);
    }

    /**
     * Show error message with smart categorization
     */
    showError(error, options = {}) {
        const category = this.categorizeError(error, options);
        const categoryConfig = ERROR_CATEGORIES[category];
        
        const errorOptions = {
            title: options.title || categoryConfig.title,
            suggestions: options.suggestions || categoryConfig.suggestions,
            technical: options.technical || (typeof error === 'object' ? error.technical : ''),
            context: options.context || category,
            ...options
        };

        // Add retry functionality for retryable errors
        if (categoryConfig.retryable && options.onRetry) {
            errorOptions.actions = [
                {
                    text: 'Retry',
                    type: 'primary',
                    onClick: options.onRetry
                },
                ...(errorOptions.actions || [])
            ];
        }

        // Handle authentication redirects
        if (category === 'AUTHENTICATION' && categoryConfig.redirectTo) {
            errorOptions.actions = [
                {
                    text: 'Log In',
                    type: 'primary', 
                    onClick: () => window.location.href = categoryConfig.redirectTo
                }
            ];
        }

        const messageType = category === 'CRITICAL' ? 'CRITICAL' : 'ERROR';
        const message = options.message || error.message || categoryConfig.defaultMessage;
        
        return this.show(messageType, message, errorOptions);
    }

    /**
     * Handle API response with smart error processing
     */
    handleApiResponse(response, options = {}) {
        if (response.success) {
            if (options.showSuccess !== false) {
                return this.showSuccess(response.message || 'Operation completed successfully', {
                    toast: true,
                    ...options.successOptions
                });
            }
            return null;
        } else {
            // Handle validation errors specially
            if (response.errors && Array.isArray(response.errors)) {
                return this.showError({
                    message: response.errors.join(', '),
                    category: 'VALIDATION'
                }, {
                    title: 'Please check your input',
                    ...options.errorOptions
                });
            }

            return this.showError(response, {
                message: response.message,
                technical: response.technical,
                ...options.errorOptions
            });
        }
    }

    /**
     * Handle network errors with retry logic
     */
    handleNetworkError(error, options = {}) {
        const operationKey = options.operationKey || 'network-operation';
        const maxRetries = options.maxRetries || 3;
        const currentRetries = this.retryCallbacks.get(operationKey)?.count || 0;

        if (options.onRetry && currentRetries < maxRetries) {
            this.retryCallbacks.set(operationKey, {
                callback: options.onRetry,
                count: currentRetries + 1
            });

            const retryDelay = Math.min(1000 * Math.pow(2, currentRetries), 5000);
            
            return this.showWarning(`Connection failed. Retrying in ${retryDelay / 1000} seconds... (${currentRetries + 1}/${maxRetries})`, {
                duration: retryDelay,
                onDismiss: () => {
                    setTimeout(() => {
                        const retryData = this.retryCallbacks.get(operationKey);
                        if (retryData) {
                            retryData.callback();
                        }
                    }, retryDelay);
                }
            });
        } else {
            // Max retries reached or no retry callback
            this.retryCallbacks.delete(operationKey);
            return this.showError('NETWORK', {
                message: 'Unable to connect to the server',
                onRetry: options.onRetry ? () => {
                    this.retryCallbacks.delete(operationKey);
                    options.onRetry();
                } : undefined,
                ...options
            });
        }
    }

    /**
     * Dismiss a specific message
     */
    dismiss(messageId) {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.classList.add('removing');
            setTimeout(() => {
                messageElement.remove();
                this.activeMessages.delete(messageId);
            }, 300);
        }
    }

    /**
     * Clear all messages
     */
    clearAll() {
        this.activeMessages.forEach((_, messageId) => {
            this.dismiss(messageId);
        });
    }

    /**
     * Render a message in the UI
     */
    renderMessage(messageData) {
        const messageElement = document.createElement('div');
        messageElement.id = `message-${messageData.id}`;
        messageElement.className = `unified-message unified-message--${messageData.type}${messageData.isToast ? ' toast' : ''}`;

        const actionsHtml = messageData.actions.length > 0 ? `
            <div class="message-actions">
                ${messageData.actions.map(action => `
                    <button class="message-btn message-btn--${action.type || 'secondary'}" 
                            onclick="unifiedMessageSystem.handleAction('${messageData.id}', '${action.text}')">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        ` : '';

        const suggestionsHtml = messageData.suggestions.length > 0 ? `
            <div class="message-suggestions">
                <strong>What you can do:</strong>
                <ul>
                    ${messageData.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        messageElement.innerHTML = `
            <div class="message-icon">${messageData.icon}</div>
            <div class="message-content">
                ${messageData.title ? `<div class="message-title">${messageData.title}</div>` : ''}
                <div class="message-text">${messageData.message}</div>
                ${suggestionsHtml}
                ${actionsHtml}
                ${messageData.technical ? `<details class="mt-2"><summary>Technical Details</summary><pre>${messageData.technical}</pre></details>` : ''}
            </div>
            ${messageData.dismissible ? `<button class="message-close" onclick="unifiedMessageSystem.dismiss('${messageData.id}')">&times;</button>` : ''}
        `;

        // Store action callbacks
        messageData.actions.forEach(action => {
            this.actionCallbacks = this.actionCallbacks || {};
            this.actionCallbacks[`${messageData.id}-${action.text}`] = action.onClick;
        });

        // Append to appropriate container
        const container = messageData.isToast ? this.toastArea : this.messageArea;
        container.appendChild(messageElement);
    }

    /**
     * Handle action button clicks
     */
    handleAction(messageId, actionText) {
        const callbackKey = `${messageId}-${actionText}`;
        const callback = this.actionCallbacks?.[callbackKey];
        
        if (callback) {
            callback();
        }
        
        // Auto-dismiss message after action (unless it's a retry)
        if (actionText.toLowerCase() !== 'retry') {
            this.dismiss(messageId);
        }
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Update user action context (for better error categorization)
     */
    setUserAction(action) {
        this.context.userAction = action;
    }

    /**
     * Legacy compatibility methods
     */
    showApiResponse(response) {
        return this.handleApiResponse(response);
    }

    hide() {
        this.clearAll();
    }
}

// Create and export global instance
const unifiedMessageSystem = new UnifiedMessageSystem();

// Make it globally available for onclick handlers
window.unifiedMessageSystem = unifiedMessageSystem;

export { UnifiedMessageSystem, unifiedMessageSystem, MESSAGE_TYPES, ERROR_CATEGORIES };
