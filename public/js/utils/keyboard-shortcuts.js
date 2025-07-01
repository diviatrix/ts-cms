/**
 * Keyboard Shortcuts Manager
 * Provides keyboard shortcut functionality and help overlay
 */

/**
 * Keyboard Shortcuts Manager
 */
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.setupGlobalListeners();
    }

    /**
     * Register a keyboard shortcut
     * @param {string} key - Key combination (e.g., 'ctrl+s', 'alt+n')
     * @param {Function} callback - Function to execute
     * @param {string} description - Description for help text
     */
    register(key, callback, description = '') {
        this.shortcuts.set(key.toLowerCase(), { callback, description });
    }

    /**
     * Setup global keyboard listeners
     */
    setupGlobalListeners() {
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyString(e);
            const shortcut = this.shortcuts.get(key);
            
            if (shortcut && !this.isInputFocused()) {
                e.preventDefault();
                shortcut.callback(e);
            }
        });
    }

    /**
     * Get key string from event
     */
    getKeyString(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.key) {
            parts.push(e.key.toLowerCase());
        }
        return parts.join('+');
    }

    /**
     * Check if an input element is focused
     */
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );
    }

    /**
     * Show help overlay with available shortcuts
     */
    showHelp() {
        if (document.getElementById('shortcutsHelp')) return;

        const overlay = document.createElement('div');
        overlay.id = 'shortcutsHelp';
        overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '9999';

        const helpContent = document.createElement('div');
        helpContent.className = 'bg-white p-4 rounded shadow-lg';
        helpContent.style.maxWidth = '500px';
        helpContent.style.maxHeight = '70vh';
        helpContent.style.overflowY = 'auto';

        let helpHTML = '<h5 class="mb-3">Keyboard Shortcuts</h5>';
        this.shortcuts.forEach((shortcut, key) => {
            if (shortcut.description) {
                helpHTML += `<div class="mb-2"><kbd>${key}</kbd> - ${shortcut.description}</div>`;
            }
        });
        helpHTML += '<div class="mt-3 text-center"><small class="text-muted">Press ESC to close</small></div>';

        helpContent.innerHTML = helpHTML;
        overlay.appendChild(helpContent);
        document.body.appendChild(overlay);

        // Close on ESC or click outside
        const closeHelp = () => {
            overlay.remove();
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeHelp();
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeHelp();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
}

// Create global instance
const keyboardShortcuts = new KeyboardShortcuts();

export { KeyboardShortcuts, keyboardShortcuts };
