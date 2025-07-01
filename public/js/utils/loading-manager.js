/**
 * Loading State Manager
 * Manages loading states for UI elements
 */

/**
 * Loading State Manager
 */
class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
    }

    /**
     * Set loading state for an element
     */
    setLoading(element, isLoading, loadingText = 'Loading...') {
        const elementId = element.id || Math.random().toString(36);
        
        if (isLoading) {
            // Store original state
            this.loadingStates.set(elementId, {
                disabled: element.disabled,
                textContent: element.textContent,
                innerHTML: element.innerHTML
            });

            // Set loading state
            element.disabled = true;
            
            if (element.tagName === 'BUTTON') {
                element.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${loadingText}`;
            } else {
                element.textContent = loadingText;
            }
        } else {
            // Restore original state
            const originalState = this.loadingStates.get(elementId);
            if (originalState) {
                element.disabled = originalState.disabled;
                if (originalState.innerHTML) {
                    element.innerHTML = originalState.innerHTML;
                } else {
                    element.textContent = originalState.textContent;
                }
                this.loadingStates.delete(elementId);
            }
        }
    }
}

// Create global instance
const loadingManager = new LoadingManager();

export { LoadingManager, loadingManager };
