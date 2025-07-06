/**
 * Unified Message System - No Toasts
 * Centralized, intelligent error and message handling (single area)
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

/**
 * Unified Message System Class
 */
class UnifiedMessageSystem {
    constructor() {
        this.activeMessages = new Map();
        this.actionCallbacks = new Map();
        this.ensureContainer();
    }

    ensureContainer() {
        if (!document.getElementById('unified-message-container')) {
            const container = document.createElement('div');
            container.id = 'unified-message-container';
            container.innerHTML = `<div id="message-area"></div>`;
            document.body.appendChild(container);
            // Add styles here if needed
            if (!document.getElementById('unified-message-styles')) {
                const style = document.createElement('style');
                style.id = 'unified-message-styles';
                style.textContent = `
                    .unified-message-container { position: fixed; top: 0; left: 0; right: 0; z-index: 10000; pointer-events: none; }
                    .message-area { padding: 10px 20px 0; }
                    .unified-message { pointer-events: auto; margin-bottom: 10px; border-radius: 6px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); animation: slideDown 0.3s ease-out; }
                    .unified-message--success { background: #d4edda; border-left: 4px solid #28a745; color: #155724; }
                    .unified-message--info { background: #d1ecf1; border-left: 4px solid #17a2b8; color: #0c5460; }
                    .unified-message--warning { background: #fff3cd; border-left: 4px solid #ffc107; color: #856404; }
                    .unified-message--error { background: #f8d7da; border-left: 4px solid #dc3545; color: #721c24; }
                    .unified-message--critical { background: #f8d7da; border-left: 4px solid #dc3545; color: #721c24; box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3); }
                    .message-icon { font-size: 18px; font-weight: bold; flex-shrink: 0; margin-top: 2px; }
                    .message-content { flex: 1; }
                    .message-title { font-weight: 600; margin-bottom: 4px; }
                    .message-text { margin-bottom: 8px; line-height: 1.4; }
                    .message-suggestions { font-size: 0.9em; opacity: 0.8; margin-top: 8px; }
                    .message-suggestions ul { margin: 4px 0 0 16px; padding: 0; }
                    .message-suggestions li { margin-bottom: 2px; }
                    .message-actions { display: flex; gap: 8px; margin-top: 12px; }
                    .message-btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: all 0.2s; }
                    .message-btn--primary { background: #007bff; color: white; }
                    .message-btn--primary:hover { background: #0056b3; }
                    .message-btn--secondary { background: #6c757d; color: white; }
                    .message-btn--secondary:hover { background: #545b62; }
                    .message-close { background: none; border: none; cursor: pointer; font-size: 18px; opacity: 0.6; padding: 0; margin-left: 8px; flex-shrink: 0; }
                    .message-close:hover { opacity: 1; }
                    @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes fadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
                    .unified-message.removing { animation: fadeOut 0.3s ease-out forwards; }
                `;
                document.head.appendChild(style);
            }
        }
        this.messageArea = document.getElementById('message-area');
    }

    show(type, message, { title = '', suggestions = [], actions = [], duration, onRetry, onDismiss } = {}) {
        const config = MESSAGE_TYPES[type] || MESSAGE_TYPES.info;
        const id = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        const msgData = { id, type, icon: config.icon, title, message, suggestions, actions, duration: duration ?? config.duration, onRetry, onDismiss };
        this.renderMessage(msgData);
        this.activeMessages.set(id, msgData);
        if (msgData.duration > 0) setTimeout(() => this.dismiss(id), msgData.duration);
        return id;
    }

    showSuccess(msg, opts) { return this.show('success', msg, opts); }
    showInfo(msg, opts)    { return this.show('info', msg, opts); }
    showWarning(msg, opts) { return this.show('warning', msg, opts); }
    showError(error, opts = {}) {
        const category = this.categorizeError(error, opts);
        const catCfg = ERROR_CATEGORIES[category];
        const errorOpts = {
            title: opts.title || catCfg.title,
            suggestions: opts.suggestions || catCfg.suggestions,
            ...opts
        };
        if (catCfg.retryable && opts.onRetry) {
            errorOpts.actions = [{ text: 'Retry', type: 'primary', onClick: opts.onRetry }];
        }
        if (category === 'AUTHENTICATION' && catCfg.redirectTo) {
            errorOpts.actions = [{ text: 'Log In', type: 'primary', onClick: () => window.location.href = catCfg.redirectTo }];
        }
        return this.show(category === 'CRITICAL' ? 'critical' : 'error', error.message || catCfg.defaultMessage, errorOpts);
    }

    handleApiResponse(response, opts = {}) {
        if (response.success) {
            if (opts.showSuccess !== false) return this.showSuccess(response.message || 'Operation completed', { ...opts.successOptions });
            return null;
        } else {
            if (response.errors && Array.isArray(response.errors)) {
                return this.showError({ message: response.errors.join(', '), category: 'VALIDATION' }, { ...opts.errorOptions });
            }
            return this.showError(response, { ...opts.errorOptions });
        }
    }

    dismiss(id) {
        const el = document.getElementById(`message-${id}`);
        if (el) {
            el.classList.add('removing');
            setTimeout(() => { el.remove(); this.activeMessages.delete(id); }, 300);
        }
    }

    clearAll() {
        this.activeMessages.forEach((_, id) => this.dismiss(id));
    }

    renderMessage({ id, type, icon, title, message, suggestions, actions, duration }) {
        const el = document.createElement('div');
        el.id = `message-${id}`;
        el.className = `unified-message unified-message--${type}`;
        el.innerHTML = `
            <div class="message-icon">${icon}</div>
            <div class="message-content">
                ${title ? `<div class="message-title">${title}</div>` : ''}
                <div class="message-text">${message}</div>
                ${suggestions.length ? `<div class="message-suggestions"><ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
                ${actions.length ? `<div class="message-actions">${actions.map((a, i) => `<button class="message-btn message-btn--${a.type || 'secondary'}" data-action="${id}-${i}">${a.text}</button>`).join('')}</div>` : ''}
            </div>
            <button class="message-close" data-close="${id}">&times;</button>
        `;
        this.messageArea.appendChild(el);

        // Action handlers
        actions.forEach((a, i) => {
            this.actionCallbacks.set(`${id}-${i}`, a.onClick);
            el.querySelector(`[data-action="${id}-${i}"]`).onclick = () => { a.onClick(); this.dismiss(id); };
        });
        el.querySelector(`[data-close="${id}"]`).onclick = () => this.dismiss(id);
    }

    categorizeError(error, opts = {}) {
        if (opts.category && ERROR_CATEGORIES[opts.category]) return opts.category;
        const text = (error.message || error || '').toString();
        for (const { pattern, category } of ERROR_PATTERNS) if (pattern.test(text)) return category;
        return 'CLIENT_ERROR';
    }
}

// Create and export global instance
const unifiedMessageSystem = new UnifiedMessageSystem();

// Make it globally available for onclick handlers
window.unifiedMessageSystem = unifiedMessageSystem;

export { UnifiedMessageSystem, unifiedMessageSystem, MESSAGE_TYPES, ERROR_CATEGORIES };
