/**
 * Optimized Message System - Lightweight Version
 * Essential message handling with reduced bundle size
 */

const MESSAGE_TYPES = {
    SUCCESS: { type: 'success', icon: '✓', duration: 4000 },
    INFO: { type: 'info', icon: 'ℹ', duration: 5000 },
    WARNING: { type: 'warning', icon: '⚠', duration: 7000 },
    ERROR: { type: 'error', icon: '✗', duration: 10000 }
};

class OptimizedMessageSystem {
    constructor() {
        this.messageQueue = [];
        this.activeMessages = new Map();
        this.init();
    }

    init() {
        this.createMessageContainer();
        this.setupGlobalErrorHandling();
    }

    createMessageContainer() {
        let container = document.getElementById('optimized-message-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'optimized-message-container';
            container.className = 'optimized-message-container';
            container.innerHTML = `
                <div class="message-area" id="optimized-message-area"></div>
                <div class="toast-area" id="optimized-toast-area"></div>
            `;
            document.body.appendChild(container);
        }
        
        this.messageArea = document.getElementById('optimized-message-area');
        this.toastArea = document.getElementById('optimized-toast-area');
        this.addStylesheet();
    }

    addStylesheet() {
        if (document.getElementById('optimized-message-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'optimized-message-styles';
        style.textContent = `
            .optimized-message-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
            }
            
            .optimized-message-container .message-area {
                margin-bottom: 10px;
            }
            
            .optimized-message-container .toast-area {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .optimized-message {
                background: #333;
                color: #fff;
                padding: 12px 16px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                margin-bottom: 8px;
                pointer-events: auto;
                max-width: 400px;
                word-wrap: break-word;
                animation: slideIn 0.3s ease-out;
            }
            
            .optimized-message.success { border-left: 4px solid #28a745; }
            .optimized-message.info { border-left: 4px solid #17a2b8; }
            .optimized-message.warning { border-left: 4px solid #ffc107; }
            .optimized-message.error { border-left: 4px solid #dc3545; }
            
            .optimized-message .message-content {
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }
            
            .optimized-message .message-icon {
                font-size: 16px;
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .optimized-message .message-text {
                flex-grow: 1;
                line-height: 1.4;
            }
            
            .optimized-message .message-close {
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                margin-left: 8px;
                opacity: 0.7;
            }
            
            .optimized-message .message-close:hover {
                opacity: 1;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .optimized-message.removing {
                animation: slideOut 0.3s ease-in forwards;
            }
        `;
        document.head.appendChild(style);
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.showError('An unexpected error occurred: ' + event.error?.message || event.message);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.showError('Promise rejected: ' + event.reason);
        });
    }

    show(type, message, options = {}) {
        const messageId = this.generateMessageId();
        const messageType = MESSAGE_TYPES[type.toUpperCase()] || MESSAGE_TYPES.INFO;
        
        const messageData = {
            id: messageId,
            type: messageType.type,
            icon: messageType.icon,
            message: message,
            duration: options.duration || messageType.duration,
            dismissible: options.dismissible !== false,
            persistent: options.persistent || false
        };

        this.activeMessages.set(messageId, messageData);
        this.renderMessage(messageData);

        if (messageData.duration > 0 && !messageData.persistent) {
            setTimeout(() => this.dismiss(messageId), messageData.duration);
        }

        return messageId;
    }

    showSuccess(message, options = {}) {
        return this.show('SUCCESS', message, options);
    }

    showInfo(message, options = {}) {
        return this.show('INFO', message, options);
    }

    showWarning(message, options = {}) {
        return this.show('WARNING', message, options);
    }

    showError(message, options = {}) {
        return this.show('ERROR', message, { ...options, persistent: true });
    }

    renderMessage(messageData) {
        const messageElement = document.createElement('div');
        messageElement.className = `optimized-message ${messageData.type}`;
        messageElement.id = `message-${messageData.id}`;
        
        messageElement.innerHTML = `
            <div class="message-content">
                <span class="message-icon">${messageData.icon}</span>
                <span class="message-text">${messageData.message}</span>
                ${messageData.dismissible ? '<button class="message-close" onclick="window.optimizedMessageSystem.dismiss(\'' + messageData.id + '\')">&times;</button>' : ''}
            </div>
        `;

        this.toastArea.appendChild(messageElement);
    }

    dismiss(messageId) {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.classList.add('removing');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
                this.activeMessages.delete(messageId);
            }, 300);
        }
    }

    clearAll() {
        this.activeMessages.forEach((messageData, messageId) => {
            this.dismiss(messageId);
        });
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    handleApiResponse(response, options = {}) {
        if (response.success) {
            if (response.message && options.showSuccess !== false) {
                this.showSuccess(response.message, options);
            }
        } else {
            this.showError(response.message || 'Operation failed', options);
        }
        return response;
    }

    handleNetworkError(error, options = {}) {
        const message = error.message || 'Network error occurred';
        this.showError(message, options);
    }
}

// Export singleton instance
export const optimizedMessageSystem = new OptimizedMessageSystem();

// Global access for backward compatibility
window.optimizedMessageSystem = optimizedMessageSystem; 