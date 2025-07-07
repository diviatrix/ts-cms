/**
 * UI Utils Index
 * Main export file for all utility modules
 */

// Import all utilities
import { LoadingManager, loadingManager } from './loading-manager.js';
// import { FormValidator, REGEX_PATTERNS } from './form-validation.js'; // Removed: file deleted
import { AutoLogoutManager, autoLogoutManager } from './auto-logout.js';
import { ConfirmationDialog } from './dialogs.js';

// Import new unified message system
import { messageSystem } from './message-system.js';

// Import new unified theme system
import { UnifiedThemeSystem, unifiedThemeSystem } from './theme-system.js';
import { SimpleThemeAPI, theme, withTheme, themedElement, applyTheme, getThemeColors, themeClass } from './theme-api.js';

// Import CMS integration
import { cmsIntegration } from './cms-integration.js';

// Re-export all utilities
export {
    // Legacy utilities (kept for backward compatibility)
    LoadingManager,
    // import { FormValidator, REGEX_PATTERNS } from './form-validation.js'; // Removed: file deleted
    AutoLogoutManager,
    ConfirmationDialog,
    
    // New unified message system
    messageSystem,
    
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
    autoLogoutManager,
    unifiedThemeSystem,
    cmsIntegration
};
export const messages = messageSystem;

// Remove all legacy compatibility and references to deleted modules
