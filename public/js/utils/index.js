/**
 * UI Utils Index
 * Main export file for all utility modules
 */

// Import all utilities
import { MessageDisplay } from './message-display.js';
import { LoadingManager, loadingManager } from './loading-manager.js';
import { FormValidator, AdvancedFormValidator, REGEX_PATTERNS } from './form-validation.js';
import { ErrorHandler, errorHandler } from './error-handling.js';
import { KeyboardShortcuts, keyboardShortcuts } from './keyboard-shortcuts.js';
import { AutoLogoutManager, autoLogoutManager } from './auto-logout.js';
import { ConfirmationDialog } from './dialogs.js';

// Import new unified message system
import { UnifiedMessageSystem, unifiedMessageSystem } from './message-system.js';
import { SimpleMessageAPI, messages, handleFormResponse, withErrorHandling } from './message-api.js';

// Import new unified theme system
import { UnifiedThemeSystem, unifiedThemeSystem } from './theme-system.js';
import { SimpleThemeAPI, theme, withTheme, themedElement, applyTheme, getThemeColors, themeClass } from './theme-api.js';

// Re-export all utilities
export {
    // Legacy utilities (kept for backward compatibility)
    MessageDisplay,
    LoadingManager,
    FormValidator,
    AdvancedFormValidator,
    ErrorHandler,
    KeyboardShortcuts,
    AutoLogoutManager,
    ConfirmationDialog,
    REGEX_PATTERNS,
    
    // New unified message system
    UnifiedMessageSystem,
    SimpleMessageAPI,
    messages,
    handleFormResponse,
    withErrorHandling,
    
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
    keyboardShortcuts,
    autoLogoutManager,
    unifiedMessageSystem,
    unifiedThemeSystem
};
