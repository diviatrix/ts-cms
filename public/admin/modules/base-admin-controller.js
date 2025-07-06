/**
 * Base Admin Controller
 * Common functionality for all admin panel modules
 */

import { MessageDisplay, loadingManager, ErrorHandler, errorHandler, messages } from '../../js/ui-utils.js';
import { getThemeColors } from '../../js/utils/theme-api.js';
import { AuthAPI } from '../../js/api-client.js';

/**
 * Base Admin Controller
 * Provides common functionality for admin modules
 */
export class BaseAdminController {
    constructor(options = {}) {
        this.elements = options.elements || {};
        this.responseLog = options.responseLog;
        this.messageDisplay = new MessageDisplay(options.messageDiv);
        this.apiClient = options.apiClient;
        
        // Common state
        this.currentItem = null;
        this.items = [];
        
        // Initialize common functionality
        this.setupCommonHandlers();
    }

    /**
     * Get themed card styles using theme API
     */
    getThemedCardStyles() {
        const colors = getThemeColors();
        return `border-radius: 10px; margin-bottom: 1em; padding: 1em; background: ${colors.surfaceColor}; color: ${colors.textColor}; border: 1px solid ${colors.borderColor}; min-height: 3.5em;`;
    }

    /**
     * Get themed secondary text styles using theme API
     */
    getThemedSecondaryStyles() {
        const colors = getThemeColors();
        return `color: ${colors.secondaryColor}; font-size: 0.9em;`;
    }

    /**
     * Setup common event handlers
     */
    setupCommonHandlers() {
        // Handle authentication redirects
        this.handleAuthRedirect();
        
        // Set up global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            messages.error('An unexpected error occurred. Please refresh the page.', { toast: true });
        });
    }

    /**
     * Standardized event binding system
     */
    setupEventHandlers() {
        // Override in subclasses
    }

    /**
     * Bind a single event handler with error handling
     */
    bindEvent(element, eventType, handler, options = {}) {
        if (!element) {
            console.warn(`Element not found for event binding: ${eventType}`);
            return;
        }

        const wrappedHandler = async (event) => {
            try {
                await handler.call(this, event);
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error);
                messages.error('An error occurred while processing your request.', { toast: true });
            }
        };

        element.addEventListener(eventType, wrappedHandler, options);
        return wrappedHandler;
    }

    /**
     * Bind multiple events from a configuration object
     */
    bindEventConfig(eventConfig) {
        Object.keys(eventConfig).forEach(selector => {
            const element = this.elements[selector] || document.querySelector(selector);
            const events = eventConfig[selector];
            
            Object.keys(events).forEach(eventType => {
                const handler = events[eventType];
                this.bindEvent(element, eventType, handler);
            });
        });
    }

    /**
     * Bind events to elements by data attributes
     */
    bindDataEvents(container, eventMap) {
        if (!container) return;

        Object.keys(eventMap).forEach(dataAttribute => {
            const elements = container.querySelectorAll(`[data-${dataAttribute}]`);
            const handler = eventMap[dataAttribute];
            
            elements.forEach(element => {
                this.bindEvent(element, 'click', handler);
            });
        });
    }

    /**
     * Bind events to elements by selector
     */
    bindEventsBySelector(selector, eventType, handler) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            this.bindEvent(element, eventType, handler);
        });
    }

    /**
     * Setup delegated event handling for dynamic content
     */
    setupDelegatedEvents(container, eventConfig) {
        if (!container) return;

        Object.keys(eventConfig).forEach(selector => {
            const events = eventConfig[selector];
            
            Object.keys(events).forEach(eventType => {
                const handler = events[eventType];
                
                container.addEventListener(eventType, (event) => {
                    const target = event.target.closest(selector);
                    if (target) {
                        handler.call(this, event, target);
                    }
                });
            });
        });
    }

    /**
     * Remove event listeners (for cleanup)
     */
    removeEventListeners(element, eventType, handler) {
        if (element && handler) {
            element.removeEventListener(eventType, handler);
        }
    }

    /**
     * Handle authentication redirect logic
     */
    handleAuthRedirect() {
        // Override in subclasses if needed
    }

    /**
     * Check authentication and redirect if needed
     */
    checkAuthentication() {
        if (!AuthAPI.isAuthenticated()) {
            messages.error('Not authenticated. Please log in.', { toast: true });
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    /**
     * Show loading state for container
     */
    showContainerLoading(container, message = 'Loading...') {
        if (container) {
            container.innerHTML = `<div class="themed" style="padding:1em;">${message}</div>`;
        }
    }

    /**
     * Show empty state for container
     */
    showContainerEmpty(container, message = 'No items found') {
        if (container) {
            container.innerHTML = `<div class="themed" style="padding:1em;">${message}</div>`;
        }
    }

    /**
     * Show error state for container
     */
    showContainerError(container, message = 'Failed to load data') {
        if (container) {
            container.innerHTML = `<div class="text-danger themed" style="padding:1em;">${message}</div>`;
        }
    }

    /**
     * Safe API call with error handling and response logging
     */
    async safeApiCall(apiCall, options = {}) {
        const {
            loadingElements = [],
            loadingText = 'Loading...',
            successCallback = null,
            errorCallback = null,
            operationName = 'API Operation',
            requestData = null
        } = options;

        try {
            // Set loading state
            if (loadingElements.length > 0) {
                loadingElements.forEach(element => {
                    loadingManager.setLoading(element, true, loadingText);
                });
            }

            // Make API call
            const response = await apiCall();

            // Log the response
            if (this.responseLog) {
                this.responseLog.addResponse(response, operationName, requestData);
            }

            // Handle response
            if (response.success) {
                if (successCallback) {
                    successCallback(response.data);
                }
                return response;
            } else {
                // Handle API errors
                if (response.errors && response.errors.length > 0) {
                    messages.error(response.errors.join(', '), { toast: true });
                } else {
                    messages.error(response.message || 'Operation failed', { toast: true });
                }
                errorHandler.handleApiError(response, this.messageDisplay);
                
                if (errorCallback) {
                    errorCallback(response);
                }
                return response;
            }

        } catch (error) {
            console.error('API call error:', error);
            
            // Handle network errors with unified messages
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                messages.error('Unable to connect to the server. Please check your internet connection and try again.', { toast: true });
            } else {
                messages.error(error.message || 'Network error occurred. Please try again.', { toast: true });
            }

            errorHandler.handleNetworkError(error, this.messageDisplay);

            return {
                success: false,
                message: error.message || 'Network error occurred',
                errors: [error.message || 'Network error occurred']
            };

        } finally {
            // Clear loading state
            if (loadingElements.length > 0) {
                loadingElements.forEach(element => {
                    loadingManager.setLoading(element, false);
                });
            }
        }
    }

    /**
     * Handle item display for editing
     */
    displayItemForEdit(item, options = {}) {
        const {
            editTabSelector,
            formFields = {},
            hideMessage = true
        } = options;

        // Show edit tab
        if (editTabSelector) {
            const editTab = document.querySelector(editTabSelector);
            if (editTab) {
                editTab.classList.remove('d-none');
            }
        }

        // Populate form fields
        Object.keys(formFields).forEach(fieldName => {
            const element = this.elements[fieldName];
            if (element) {
                const value = item[formFields[fieldName]] || '';
                if (element.type === 'checkbox') {
                    element.checked = Boolean(value);
                } else {
                    element.value = value;
                }
            }
        });

        // Store current item
        this.currentItem = item;

        // Hide message if requested
        if (hideMessage) {
            this.messageDisplay.hide();
        }
    }

    /**
     * Handle new item creation
     */
    handleNewItem(options = {}) {
        const {
            editTabSelector,
            formFields = {},
            hideMessage = true
        } = options;

        // Show edit tab
        if (editTabSelector) {
            const editTab = document.querySelector(editTabSelector);
            if (editTab) {
                editTab.classList.remove('d-none');
            }
        }

        // Clear form fields
        Object.keys(formFields).forEach(fieldName => {
            const element = this.elements[fieldName];
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = false;
                } else {
                    element.value = '';
                }
            }
        });

        // Clear current item
        this.currentItem = null;

        // Hide message if requested
        if (hideMessage) {
            this.messageDisplay.hide();
        }
    }

    /**
     * Setup confirmation buttons with double-click logic
     */
    setupConfirmationButtons(buttonSelector, options = {}) {
        const {
            confirmClass = 'btn-danger',
            defaultClass = 'btn-secondary',
            confirmTitle = 'Click again to confirm',
            defaultTitle = 'Click again to confirm deletion',
            onConfirm = null
        } = options;

        document.querySelectorAll(buttonSelector).forEach(btn => {
            btn.classList.remove(confirmClass);
            btn.classList.add(defaultClass);
            btn.setAttribute('title', defaultTitle);
            btn.dataset.confirming = 'false';
            
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                // Reset other buttons
                document.querySelectorAll(buttonSelector).forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.classList.remove(confirmClass);
                        otherBtn.classList.add(defaultClass);
                        otherBtn.setAttribute('title', defaultTitle);
                        otherBtn.dataset.confirming = 'false';
                    }
                });

                if (btn.dataset.confirming === 'true') {
                    // Execute confirmation
                    btn.classList.remove(confirmClass);
                    btn.classList.add(defaultClass);
                    btn.setAttribute('title', defaultTitle);
                    btn.dataset.confirming = 'false';
                    
                    if (onConfirm) {
                        const itemId = btn.getAttribute('data-item-id');
                        await onConfirm(itemId, btn);
                    }
                } else {
                    // Set confirmation state
                    btn.classList.remove(defaultClass);
                    btn.classList.add(confirmClass);
                    btn.setAttribute('title', confirmTitle);
                    btn.dataset.confirming = 'true';
                }
            });
        });

        // Reset confirmation states when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.matches(buttonSelector)) {
                document.querySelectorAll(buttonSelector).forEach(btn => {
                    btn.classList.remove(confirmClass);
                    btn.classList.add(defaultClass);
                    btn.setAttribute('title', defaultTitle);
                    btn.dataset.confirming = 'false';
                });
            }
        });
    }

    /**
     * Refresh data after successful operation
     */
    refreshData(callback, delay = 1000) {
        setTimeout(() => {
            if (callback) {
                callback();
            }
        }, delay);
    }
} 