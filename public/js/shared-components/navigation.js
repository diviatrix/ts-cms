/**
 * Navigation Components
 * Breadcrumb navigation and unsaved changes detection
 */

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

export { BreadcrumbNav, UnsavedChangesDetector };
