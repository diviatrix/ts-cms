/**
 * Shared UI Components for ts-cms Frontend
 * Reusable components to reduce code duplication
 */

import { MessageDisplay, ErrorHandler, loadingManager, errorHandler } from './ui-utils.js';

/**
 * Base Page Controller
 * Common functionality for all pages
 */
class BasePageController {
    constructor(options = {}) {
        this.messageDiv = options.messageDiv || document.getElementById('messageDiv');
        this.message = this.messageDiv ? new MessageDisplay(this.messageDiv) : null;
        this.loadingManager = loadingManager;
        this.errorHandler = errorHandler;
        
        // Make error handler globally available
        window.errorHandler = this.errorHandler;
        
        // Set up common event handlers
        this.setupCommonHandlers();
    }

    /**
     * Set up common event handlers
     */
    setupCommonHandlers() {
        // Handle authentication redirects
        this.handleAuthRedirect();
        
        // Set up global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (this.message) {
                this.message.showError('An unexpected error occurred. Please refresh the page.');
            }
        });
    }

    /**
     * Handle authentication redirect logic
     */
    handleAuthRedirect() {
        // Override in subclasses
    }

    /**
     * Show loading state for multiple elements
     */
    setMultipleLoading(elements, isLoading, loadingText = 'Loading...') {
        elements.forEach(element => {
            if (element) {
                this.loadingManager.setLoading(element, isLoading, loadingText);
            }
        });
    }

    /**
     * Handle API response with consistent error handling
     */
    handleApiResponse(response, successCallback = null, errorCallback = null) {
        if (response.success) {
            if (this.message) {
                this.message.showSuccess(response.message || 'Operation completed successfully');
            }
            if (successCallback) {
                successCallback(response.data);
            }
        } else {
            if (this.message) {
                ErrorHandler.handleApiError(response, this.message);
            }
            if (errorCallback) {
                errorCallback(response);
            }
        }
    }

    /**
     * Safe API call with error handling
     */
    async safeApiCall(apiCall, options = {}) {
        const {
            loadingElements = [],
            loadingText = 'Loading...',
            successCallback = null,
            errorCallback = null,
            retryCallback = null,
            operationKey = null
        } = options;

        try {
            // Set loading state
            this.setMultipleLoading(loadingElements, true, loadingText);

            // Make API call
            const response = await apiCall();

            // Handle response
            this.handleApiResponse(response, successCallback, errorCallback);

            return response;

        } catch (error) {
            console.error('API call error:', error);
            
            // Use enhanced error handler with retry logic
            if (retryCallback && operationKey) {
                this.errorHandler.handleNetworkError(error, this.message, retryCallback, operationKey);
            } else {
                ErrorHandler.handleNetworkError(error, this.message);
            }

            return {
                success: false,
                message: error.message || 'Network error occurred',
                errors: [error.message || 'Network error occurred']
            };

        } finally {
            // Clear loading state
            this.setMultipleLoading(loadingElements, false);
        }
    }
}

/**
 * Authentication Page Controller
 * For login, register, and password reset pages
 */
class AuthPageController extends BasePageController {
    constructor(options = {}) {
        super(options);
        this.authAPI = options.authAPI;
    }

    /**
     * Handle authentication redirect logic
     */
    handleAuthRedirect() {
        // Check if already authenticated and redirect if needed
        if (this.authAPI && this.authAPI.isAuthenticated()) {
            const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
            window.location.href = redirectTo;
        }
    }

    /**
     * Handle successful authentication
     */
    handleAuthSuccess(redirectTo = '/') {
        ErrorHandler.showToast('Login successful!', 'success');
        window.location.href = redirectTo;
    }

    /**
     * Handle authentication failure
     */
    handleAuthFailure(response) {
        if (this.message) {
            ErrorHandler.handleApiError(response, this.message);
        }
    }
}

/**
 * Protected Page Controller
 * For pages that require authentication
 */
class ProtectedPageController extends BasePageController {
    constructor(options = {}) {
        super(options);
        this.authAPI = options.authAPI;
        this.requiredRole = options.requiredRole;
    }

    /**
     * Handle authentication redirect logic
     */
    handleAuthRedirect() {
        if (!this.authAPI || !this.authAPI.isAuthenticated()) {
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            return false;
        }

        // Check role requirements if specified
        if (this.requiredRole) {
            const userRoles = this.authAPI.getUserRole ? this.authAPI.getUserRole() : [];
            
            if (!userRoles.includes(this.requiredRole)) {
                if (this.message) {
                    this.message.showError('You do not have permission to access this page.');
                }
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
                return false;
            }
        }

        return true;
    }
}

/**
 * Form Handler
 * Reusable form validation and submission logic
 */
class FormHandler {
    constructor(form, options = {}) {
        this.form = form;
        this.messageDisplay = options.messageDisplay;
        this.validationRules = options.validationRules || {};
        this.submitCallback = options.submitCallback;
        this.loadingElements = options.loadingElements || [];
        
        this.setupFormHandlers();
    }

    /**
     * Set up form event handlers
     */
    setupFormHandlers() {
        if (this.form) {
            this.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleSubmit();
            });

            // Add real-time validation if specified
            if (this.validationRules) {
                this.setupRealTimeValidation();
            }
        }
    }

    /**
     * Set up real-time validation
     */
    setupRealTimeValidation() {
        Object.keys(this.validationRules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(fieldName);
                });
            }
        });
    }

    /**
     * Validate a single field
     */
    validateField(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const rules = this.validationRules[fieldName] || [];
        
        if (!field || !rules.length) return true;

        // Clear previous errors
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Validate field
        const value = field.value?.trim();
        let isValid = true;

        for (const rule of rules) {
            if (rule.type === 'required' && !value) {
                ErrorHandler.addFieldError(field, rule.message || `${fieldName} is required`);
                isValid = false;
                break;
            } else if (rule.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                ErrorHandler.addFieldError(field, rule.message || 'Please enter a valid email address');
                isValid = false;
                break;
            } else if (rule.type === 'minLength' && value && value.length < rule.value) {
                ErrorHandler.addFieldError(field, rule.message || `Must be at least ${rule.value} characters long`);
                isValid = false;
                break;
            }
        }

        // Update field styling
        if (isValid && value) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else if (!isValid) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
        }

        return isValid;
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        if (!this.submitCallback) return;

        // Validate all fields
        const isValid = this.validateForm();
        if (!isValid) return;

        // Set loading state
        const loadingElements = this.loadingElements.length > 0 
            ? this.loadingElements 
            : [this.form.querySelector('button[type="submit"]')].filter(Boolean);

        loadingElements.forEach(element => {
            loadingManager.setLoading(element, true, 'Submitting...');
        });

        try {
            await this.submitCallback(this.getFormData());
        } finally {
            loadingElements.forEach(element => {
                loadingManager.setLoading(element, false);
            });
        }
    }

    /**
     * Validate entire form
     */
    validateForm() {
        let isValid = true;

        Object.keys(this.validationRules).forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });

        if (!isValid && this.messageDisplay) {
            this.messageDisplay.showError('Please correct the errors below');
        }

        return isValid;
    }

    /**
     * Get form data as object
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
}

/**
 * Data Table Component
 * Reusable table with sorting, filtering, and pagination
 */
class DataTable {
    constructor(container, options = {}) {
        this.container = container;
        this.data = options.data || [];
        this.columns = options.columns || [];
        this.sortable = options.sortable !== false;
        this.filterable = options.filterable !== false;
        this.pagination = options.pagination || { enabled: false, pageSize: 10 };
        
        this.currentSort = { column: null, direction: 'asc' };
        this.currentFilter = '';
        this.currentPage = 1;
        
        this.render();
    }

    /**
     * Render the table
     */
    render() {
        if (!this.container) return;

        const filteredData = this.getFilteredData();
        const sortedData = this.getSortedData(filteredData);
        const paginatedData = this.getPaginatedData(sortedData);

        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    ${this.renderHeader()}
                    ${this.renderBody(paginatedData)}
                </table>
            </div>
            ${this.pagination.enabled ? this.renderPagination(filteredData.length) : ''}
        `;

        this.attachEventListeners();
    }

    /**
     * Render filter input
     */
    renderFilter() {
        return `
            <div class="mb-3">
                <input type="text" class="form-control" id="tableFilter" 
                       placeholder="Filter data..." value="${this.currentFilter}">
            </div>
        `;
    }

    /**
     * Render table header
     */
    renderHeader() {
        const headers = this.columns.map(column => {
            const sortIcon = this.currentSort.column === column.key 
                ? (this.currentSort.direction === 'asc' ? '↑' : '↓')
                : '';
                
            const sortClass = this.sortable ? 'sortable' : '';
            
            return `
                <th class="${sortClass}" data-sort="${column.key}">
                    ${column.title} ${sortIcon}
                </th>
            `;
        }).join('');

        return `<thead><tr>${headers}</tr></thead>`;
    }

    /**
     * Render table body
     */
    renderBody(data) {
        if (data.length === 0) {
            return `
                <tbody>
                    <tr>
                        <td colspan="${this.columns.length}" class="text-center text-muted">
                            No data available
                        </td>
                    </tr>
                </tbody>
            `;
        }

        const rows = data.map(row => {
            const cells = this.columns.map(column => {
                const value = row[column.key];
                const displayValue = column.render ? column.render(value, row) : value;
                return `<td>${displayValue || ''}</td>`;
            }).join('');

            return `<tr>${cells}</tr>`;
        }).join('');

        return `<tbody>${rows}</tbody>`;
    }

    /**
     * Render pagination
     */
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pagination.pageSize);
        if (totalPages <= 1) return '';

        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            const active = i === this.currentPage ? 'active' : '';
            pages.push(`
                <li class="page-item ${active}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }

        return `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div>
                    Showing ${((this.currentPage - 1) * this.pagination.pageSize) + 1} to 
                    ${Math.min(this.currentPage * this.pagination.pageSize, totalItems)} of ${totalItems} entries
                </div>
                <nav>
                    <ul class="pagination mb-0">
                        ${pages.join('')}
                    </ul>
                </nav>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Filter functionality
        const filterInput = this.container.querySelector('#tableFilter');
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.currentFilter = e.target.value;
                this.currentPage = 1;
                this.render();
            });
        }

        // Sort functionality
        if (this.sortable) {
            this.container.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.dataset.sort;
                    if (this.currentSort.column === column) {
                        this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.currentSort.column = column;
                        this.currentSort.direction = 'asc';
                    }
                    this.render();
                });
            });
        }

        // Pagination functionality
        this.container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = parseInt(e.target.dataset.page);
                this.render();
            });
        });
    }

    /**
     * Get filtered data
     */
    getFilteredData() {
        if (!this.currentFilter) return this.data;

        return this.data.filter(item => {
            return this.columns.some(column => {
                const value = item[column.key];
                return value && value.toString().toLowerCase().includes(this.currentFilter.toLowerCase());
            });
        });
    }

    /**
     * Get sorted data
     */
    getSortedData(data) {
        if (!this.currentSort.column) return data;

        return [...data].sort((a, b) => {
            const aVal = a[this.currentSort.column];
            const bVal = b[this.currentSort.column];

            if (aVal === bVal) return 0;

            const comparison = aVal < bVal ? -1 : 1;
            return this.currentSort.direction === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * Get paginated data
     */
    getPaginatedData(data) {
        if (!this.pagination.enabled) return data;

        const startIndex = (this.currentPage - 1) * this.pagination.pageSize;
        const endIndex = startIndex + this.pagination.pageSize;
        return data.slice(startIndex, endIndex);
    }

    /**
     * Update table data
     */
    updateData(newData) {
        this.data = newData;
        this.currentPage = 1;
        this.render();
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading data...') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped">
                    ${this.renderHeader()}
                    <tbody>
                        <tr>
                            <td colspan="${this.columns.length}" class="text-center py-4">
                                <div class="d-flex align-items-center justify-content-center">
                                    <div class="spinner-border spinner-border-sm me-2" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span class="text-muted">${message}</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Show empty state
     */
    showEmpty(message = 'No data available') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped">
                    ${this.renderHeader()}
                    <tbody>
                        <tr>
                            <td colspan="${this.columns.length}" class="text-center py-4 text-muted">
                                <i class="bi bi-inbox me-2"></i>
                                ${message}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showError(message = 'Failed to load data') {
        if (!this.container) return;
        
        this.container.innerHTML = `
            ${this.filterable ? this.renderFilter() : ''}
            <div class="table-responsive">
                <table class="table table-striped">
                    ${this.renderHeader()}
                    <tbody>
                        <tr>
                            <td colspan="${this.columns.length}" class="text-center py-4">
                                <div class="text-danger">
                                    <i class="bi bi-exclamation-circle me-2"></i>
                                    ${message}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
}

/**
 * Breadcrumb Navigation Component
 */
class BreadcrumbNav {
    constructor(container) {
        this.container = container;
        this.breadcrumbs = [];
        this.render();
    }

    /**
     * Set breadcrumb items
     * @param {Array} items - Array of {text, href?, active?} objects
     */
    setBreadcrumbs(items) {
        this.breadcrumbs = items;
        this.render();
    }

    /**
     * Add a breadcrumb item
     * @param {string} text - Breadcrumb text
     * @param {string} href - Optional link
     * @param {boolean} active - Is active item
     */
    addBreadcrumb(text, href = null, active = false) {
        // Remove active from all existing items
        this.breadcrumbs.forEach(item => item.active = false);
        
        this.breadcrumbs.push({ text, href, active });
        this.render();
    }

    /**
     * Remove last breadcrumb item
     */
    popBreadcrumb() {
        if (this.breadcrumbs.length > 1) {
            this.breadcrumbs.pop();
            if (this.breadcrumbs.length > 0) {
                this.breadcrumbs[this.breadcrumbs.length - 1].active = true;
            }
            this.render();
        }
    }

    /**
     * Render breadcrumb navigation
     */
    render() {
        if (!this.container || this.breadcrumbs.length === 0) return;

        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'breadcrumb');
        
        const ol = document.createElement('ol');
        ol.className = 'breadcrumb';

        this.breadcrumbs.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `breadcrumb-item${item.active ? ' active' : ''}`;
            
            if (item.active) {
                li.setAttribute('aria-current', 'page');
                li.textContent = item.text;
            } else if (item.href) {
                const a = document.createElement('a');
                a.href = item.href;
                a.textContent = item.text;
                li.appendChild(a);
            } else {
                li.textContent = item.text;
            }
            
            ol.appendChild(li);
        });

        nav.appendChild(ol);
        this.container.innerHTML = '';
        this.container.appendChild(nav);
    }
}

/**
 * Unsaved Changes Detector
 */
class UnsavedChangesDetector {
    constructor(forms = []) {
        this.forms = forms;
        this.hasUnsavedChanges = false;
        this.originalData = new Map();
        this.setupListeners();
    }

    /**
     * Add form to monitor
     */
    addForm(form) {
        this.forms.push(form);
        this.captureOriginalData(form);
        this.setupFormListeners(form);
    }

    /**
     * Setup listeners for forms and page navigation
     */
    setupListeners() {
        // Monitor page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Monitor each form
        this.forms.forEach(form => {
            this.captureOriginalData(form);
            this.setupFormListeners(form);
        });
    }

    /**
     * Setup listeners for a specific form
     */
    setupFormListeners(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.checkForChanges());
            input.addEventListener('change', () => this.checkForChanges());
        });
    }

    /**
     * Capture original form data
     */
    captureOriginalData(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        this.originalData.set(form, data);
    }

    /**
     * Check if forms have changes
     */
    checkForChanges() {
        let hasChanges = false;

        this.forms.forEach(form => {
            const originalData = this.originalData.get(form);
            const currentData = new FormData(form);
            
            for (let [key, value] of currentData.entries()) {
                if (originalData[key] !== value) {
                    hasChanges = true;
                    break;
                }
            }
        });

        this.hasUnsavedChanges = hasChanges;
        this.updateUI();
    }

    /**
     * Mark changes as saved
     */
    markAsSaved() {
        this.hasUnsavedChanges = false;
        this.forms.forEach(form => this.captureOriginalData(form));
        this.updateUI();
    }

    /**
     * Update UI based on unsaved changes
     */
    updateUI() {
        // Add visual indicator for unsaved changes
        const indicators = document.querySelectorAll('[data-unsaved-indicator]');
        indicators.forEach(indicator => {
            indicator.style.display = this.hasUnsavedChanges ? 'inline' : 'none';
        });

        // Update save buttons
        const saveButtons = document.querySelectorAll('[data-save-button]');
        saveButtons.forEach(button => {
            button.classList.toggle('btn-warning', this.hasUnsavedChanges);
            button.classList.toggle('btn-primary', !this.hasUnsavedChanges);
        });
    }
}

// Export components
export {
    BasePageController,
    AuthPageController,
    ProtectedPageController,
    FormHandler,
    DataTable,
    BreadcrumbNav,
    UnsavedChangesDetector
};
