export class BaseAdminController {
    constructor({ elements = {}, apiClient } = {}) {
        this.elements = elements;
        this.apiClient = apiClient;
        this.currentItem = null;
        this.items = [];
        this.setupCommonHandlers();
    }

    static getDOMElements(root = document) {
        return {
            // User management elements
            userListContainer: root.querySelector('#userListContainer'),
            profileEditTab: root.querySelector('#profileEditTab'),
            adminProfileInfo: root.querySelector('#adminProfileInfo'),
            adminMessageDiv: root.querySelector('#adminMessageDiv'),
            adminServerAnswerTextarea: root.querySelector('#adminServerAnswerTextarea'),
            adminSaveButton: root.querySelector('#adminSaveButton'),

            // Record management elements
            recordListContainer: root.querySelector('#recordListContainer'),
            recordEditTab: root.querySelector('#recordEditTab'),
            recordInfo: root.querySelector('#recordInfo'),
            recordTitle: root.querySelector('#recordTitle'),
            recordDescription: root.querySelector('#recordDescription'),
            recordImageUrl: root.querySelector('#recordImageUrl'),
            recordContent: root.querySelector('#recordContent'),
            recordTags: root.querySelector('#recordTags'),
            recordCategories: root.querySelector('#recordCategories'),
            recordIsPublished: root.querySelector('#recordIsPublished'),
            recordMessageDiv: root.querySelector('#recordMessageDiv'),
            newRecordButton: root.querySelector('#newRecordButton'),
            recordSaveButton: root.querySelector('#recordSaveButton'),
            recordDeleteButton: root.querySelector('#recordDeleteButton'),
            recordDownloadButton: root.querySelector('#recordDownloadButton'),

            // Tab elements (these are global, so still use document)
            usersTabBtn: document.getElementById('users-tab'),
            recordsTabBtn: document.getElementById('records-tab')
        };
    }

    getThemedCardStyles() {
        // Use only design system classes, not inline styles
        return '';
    }

    getThemedSecondaryStyles() {
        return `color:${getThemeColors().secondaryColor};font-size:0.9em;`;
    }

    setupCommonHandlers() {
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