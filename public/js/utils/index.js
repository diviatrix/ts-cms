/**
 * UI Utils Index
 * Main export file for all utility modules
 */

// Import all utilities
import { LoadingManager, loadingManager } from './loading-manager.js';
import { FormValidator, REGEX_PATTERNS } from './form-validation.js';
import { ErrorHandler, errorHandler } from './error-handling.js';
import { AutoLogoutManager, autoLogoutManager } from './auto-logout.js';
import { ConfirmationDialog } from './dialogs.js';

// Import new unified message system
import { UnifiedMessageSystem, unifiedMessageSystem } from './message-system.js';

// Import new unified theme system
import { UnifiedThemeSystem, unifiedThemeSystem } from './theme-system.js';
import { SimpleThemeAPI, theme, withTheme, themedElement, applyTheme, getThemeColors, themeClass } from './theme-api.js';

// Import CMS integration
import { cmsIntegration } from './cms-integration.js';

// Re-export all utilities
export {
    // Legacy utilities (kept for backward compatibility)
    LoadingManager,
    FormValidator,
    ErrorHandler,
    AutoLogoutManager,
    ConfirmationDialog,
    REGEX_PATTERNS,
    
    // New unified message system
    UnifiedMessageSystem,
    
    // New unified theme system
    UnifiedThemeSystem,
    SimpleThemeAPI,
    theme,
    withTheme,
    themedElement,
    applyTheme,
    getThemeColors,
    themeClass,
    
    // Global instances
    loadingManager,
    errorHandler,
    autoLogoutManager,
    unifiedMessageSystem,
    unifiedThemeSystem,
    cmsIntegration
};
export const messages = unifiedMessageSystem;

// Minimal legacy compatibility for MessageDisplay
export class MessageDisplay {
    constructor(container) {
        this.container = container;
    }
    showError(msg) {
        if (this.container) {
            this.container.innerHTML = `<div class='text-danger'>${msg}</div>`;
        }
    }
    showApiResponse(response) {
        if (this.container) {
            const cls = response.success ? 'text-success' : 'text-danger';
            this.container.innerHTML = `<div class='${cls}'>${response.message}</div>`;
        }
    }
    hide() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
