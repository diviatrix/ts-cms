/**
 * Base Admin Controller (Simplified)
 * Common functionality for all admin panel modules
 */

import { getThemeColors } from '../../js/utils/theme-system.js'; // Use theme-system.js instead
import { AuthAPI } from '../../js/api-client.js';
import { renderEmptyState, renderErrorState } from '../../js/shared-components/ui-snippets.js';

/**
 * Base Admin Controller
 * Provides common functionality for admin modules
 */
export class BaseAdminController {
    constructor({ elements = {}, messageDiv, apiClient } = {}) {
        this.elements = elements;
        this.apiClient = apiClient;
        this.currentItem = null;
        this.items = [];
        this.setupCommonHandlers();
    }

    getThemedCardStyles() {
        // Use only design system classes, not inline styles
        return '';
    }

    getThemedSecondaryStyles() {
        return `color:${getThemeColors().secondaryColor};font-size:0.9em;`;
    }

    setupCommonHandlers() {
        this.handleAuthRedirect();
        window.addEventListener('unhandledrejection', e => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }

    setupEventHandlers() {
        // Override in subclasses
    }

    bindEvent(element, eventType, handler, options = {}) {
        if (!element) return;
        element.addEventListener(eventType, async event => {
            try { await handler.call(this, event); }
            catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error);
            }
        }, options);
    }

    bindEvents(config) {
        Object.entries(config).forEach(([selector, events]) => {
            const element = this.elements[selector] || document.querySelector(selector);
            Object.entries(events).forEach(([eventType, handler]) => {
                this.bindEvent(element, eventType, handler);
            });
        });
    }

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

    bindEventsBySelector(selector, eventType, handler) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            this.bindEvent(element, eventType, handler);
        });
    }

    setupDelegatedEvents(container, eventConfig) {
        if (!container) return;
        Object.entries(eventConfig).forEach(([selector, events]) => {
            Object.entries(events).forEach(([eventType, handler]) => {
                container.addEventListener(eventType, event => {
                    const target = event.target.closest(selector);
                    if (target) handler.call(this, event, target);
                });
            });
        });
    }

    removeEventListeners(element, eventType, handler) {
        if (element && handler) {
            element.removeEventListener(eventType, handler);
        }
    }

    handleAuthRedirect() {
        // Override in subclasses if needed
    }

    checkAuthentication() {
        if (!AuthAPI.isAuthenticated()) {
            console.warn('Not authenticated. Please log in.');
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    showContainerLoading(container, message = 'Loading...') {
        if (container) {
            container.innerHTML = `<div>${message}</div>`;
        }
    }

    showContainerEmpty(container, message = 'No items found') {
        if (container) {
            renderEmptyState(container, message);
        }
    }

    showContainerError(container, message = 'Failed to load data') {
        if (container) {
            renderErrorState(container, message);
        }
    }

    showContainerState(container, message, type = 'info') {
        if (!container) return;
        container.innerHTML = `<div>${message}</div>`;
    }

    async safeApiCall(apiCall, { successCallback, errorCallback} = {}) {
        try {
            const response = await apiCall();

            if (response.success) {
                successCallback?.(response.data);
                return response;
            } else {
                console.error(response.errors?.join(', ') || response.message || 'Operation failed');
                errorCallback?.(response);
                return response;
            }
        } catch (error) {
            console.error('An unexpected error occurred: ' + (error?.message || error?.toString()));
            return { success: false, message: error.message || 'Network error occurred', errors: [error.message || 'Network error occurred'] };
        } 
    }

    displayItemForEdit(item, { editTabSelector, formFields = {}} = {}) {
        if (editTabSelector) {
            const editTab = document.querySelector(editTabSelector);
            if (editTab) editTab.classList.remove('d-none');
        }
        Object.keys(formFields).forEach(fieldName => {
            const element = this.elements[fieldName];
            if (element) {
                const value = item[formFields[fieldName]] || '';
                if (element.type === 'checkbox') element.checked = Boolean(value);
                else element.value = value;
            }
        });
        this.currentItem = item;
    }

    handleNewItem({ editTabSelector, formFields = {}} = {}) {
        if (editTabSelector) {
            const editTab = document.querySelector(editTabSelector);
            if (editTab) editTab.classList.remove('d-none');
        }
        Object.keys(formFields).forEach(fieldName => {
            const element = this.elements[fieldName];
            if (element) {
                if (element.type === 'checkbox') element.checked = false;
                else element.value = '';
            }
        });
        this.currentItem = null;
    }

    setupConfirmationButtons(buttonSelector, { confirmClass = 'btn-danger', defaultClass = 'btn-secondary', confirmTitle = 'Click again to confirm', defaultTitle = 'Click again to confirm deletion', onConfirm = null } = {}) {
        document.querySelectorAll(buttonSelector).forEach(btn => {
            btn.classList.remove(confirmClass);
            btn.classList.add(defaultClass);
            btn.setAttribute('title', defaultTitle);
            btn.dataset.confirming = 'false';
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                document.querySelectorAll(buttonSelector).forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.classList.remove(confirmClass);
                        otherBtn.classList.add(defaultClass);
                        otherBtn.setAttribute('title', defaultTitle);
                        otherBtn.dataset.confirming = 'false';
                    }
                });
                if (btn.dataset.confirming === 'true') {
                    btn.classList.remove(confirmClass);
                    btn.classList.add(defaultClass);
                    btn.setAttribute('title', defaultTitle);
                    btn.dataset.confirming = 'false';
                    if (onConfirm) await onConfirm(btn);
                } else {
                    btn.classList.remove(defaultClass);
                    btn.classList.add(confirmClass);
                    btn.setAttribute('title', confirmTitle);
                    btn.dataset.confirming = 'true';
                }
            });
        });
        document.addEventListener('click', e => {
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

    handleApiResponse(response, successCallback = null, errorCallback = null) {
        if (response && response.success) {
            console.log(response.message || 'Operation completed successfully');
            if (successCallback) successCallback(response.data);
        } else {
            if (response && response.status === 401) {
                console.warn('Your session has expired. Please log in again.');
            } else if (response && response.errors && response.errors.length > 0) {
                console.error(response.errors.join(', '));
            } else {
                console.error((response && response.message) || 'An unexpected error occurred. Please try again.');
            }
            if (errorCallback) errorCallback(response);
        }
    }
}