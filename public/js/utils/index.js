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

// Re-export all utilities
export {
    MessageDisplay,
    LoadingManager,
    FormValidator,
    AdvancedFormValidator,
    ErrorHandler,
    KeyboardShortcuts,
    AutoLogoutManager,
    ConfirmationDialog,
    REGEX_PATTERNS,
    // Global instances
    loadingManager,
    errorHandler,
    keyboardShortcuts,
    autoLogoutManager
};
