/**
 * Response Log Module
 * Handles logging and displaying API responses in the admin panel
 */
export class ResponseLog {
    constructor() {
        this.logs = [];
        this.maxLogs = 100; // Keep last 100 responses
        this.initializeElements();
        this.initializeEventHandlers();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            modal: document.getElementById('responseLogWindow'),
            content: document.getElementById('responseLogContent'),
            clearButton: document.getElementById('clearLogButton'),
            exportButton: document.getElementById('exportLogButton'),
            closeButton: document.getElementById('closeLogButton'),
            container: document.getElementById('responseLogContainer')
        };
    }

    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', () => this.clearLog());
        }
        
        if (this.elements.exportButton) {
            this.elements.exportButton.addEventListener('click', () => this.exportLog());
        }

        // Add close button handler
        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', () => this.hide());
        }

        // Add floating button handler
        const floatingButton = document.getElementById('responseLogButton');
        if (floatingButton) {
            floatingButton.addEventListener('click', () => this.show());
        }
    }

    /**
     * Add a response to the log
     * @param {Object} response - The API response object
     * @param {string} operation - The operation being performed
     * @param {Object} requestData - The request data (optional)
     */
    addResponse(response, operation, requestData = null) {
        const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            operation: operation,
            response: response,
            requestData: requestData,
            success: response?.success || false
        };

        // Add to logs array
        this.logs.unshift(logEntry); // Add to beginning

        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        // Update the display
        this.updateDisplay();

        // Auto-scroll to top
        if (this.elements.container) {
            this.elements.container.scrollTop = 0;
        }
    }

    /**
     * Update the log display
     */
    updateDisplay() {
        if (!this.elements.content) return;

        const html = this.logs.map(log => this.createLogEntryHTML(log)).join('');
        this.elements.content.innerHTML = html;
    }

    /**
     * Create HTML for a log entry
     * @param {Object} log - The log entry
     * @returns {string} HTML string
     */
    createLogEntryHTML(log) {
        const statusIcon = log.success ? '✓' : '✗';
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        const responseStr = JSON.stringify(log.response, null, 2);
        const requestStr = log.requestData ? JSON.stringify(log.requestData, null, 2) : '';
        const logId = `log-details-${String(log.id).replace(/\./g, '-')}`;

        return `
            <div class="d-flex align-items-center border-bottom py-1">
                <span class="text-muted me-2" style="min-width:70px;">[${timestamp}]</span>
                <span class="text-light me-2">${log.operation}</span>
                <span class="${log.success ? 'text-success' : 'text-danger'} me-2">${statusIcon}</span>
                <button class="btn btn-sm btn-link text-info p-0 ms-auto" type="button" data-bs-toggle="collapse" data-bs-target="#${logId}" aria-expanded="false" aria-controls="${logId}">Details</button>
            </div>
            <div class="collapse" id="${logId}">
                <div class="card card-body bg-black text-light p-2 mb-2">
                    ${requestStr ? `<div><span class='text-warning'>Request:</span><pre class='mb-2 small'>${this.escapeHtml(requestStr)}</pre></div>` : ''}
                    <div><span class='text-info'>Response:</span><pre class='small'>${this.escapeHtml(responseStr)}</pre></div>
                </div>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear the log
     */
    clearLog() {
        this.logs = [];
        this.updateDisplay();
    }

    /**
     * Export the log as JSON
     */
    exportLog() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `admin-response-log-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    /**
     * Get the latest response for a specific operation
     * @param {string} operation - The operation to search for
     * @returns {Object|null} The latest response or null
     */
    getLatestResponse(operation) {
        return this.logs.find(log => log.operation === operation) || null;
    }

    /**
     * Get all responses for a specific operation
     * @param {string} operation - The operation to search for
     * @returns {Array} Array of responses
     */
    getResponsesForOperation(operation) {
        return this.logs.filter(log => log.operation === operation);
    }

    /**
     * Show the log terminal
     */
    show() {
        if (this.elements.modal) {
            this.elements.modal.style.display = 'block';
            this.elements.modal.style.transform = 'translateY(0)';
            this.elements.modal.style.transition = 'transform 0.3s ease-out';
            this.elements.modal.focus();
        }
        // Hide the floating button
        const floatingButton = document.getElementById('responseLogButton');
        if (floatingButton) floatingButton.style.display = 'none';
    }

    /**
     * Hide the log terminal
     */
    hide() {
        if (this.elements.modal) {
            this.elements.modal.style.transform = 'translateY(100%)';
            this.elements.modal.style.transition = 'transform 0.3s ease-in';
            setTimeout(() => {
                this.elements.modal.style.display = 'none';
            }, 300);
        }
        // Show the floating button
        const floatingButton = document.getElementById('responseLogButton');
        if (floatingButton) floatingButton.style.display = '';
    }
} 