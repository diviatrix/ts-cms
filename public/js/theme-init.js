/**
 * Global Theme Initialization
 * This script initializes the unified theme system on all pages
 */

import { unifiedThemeSystem } from './utils/theme-system.js';

// The unified theme system auto-initializes, but we can add global handlers
document.addEventListener('DOMContentLoaded', setupThemeHandlers);
setupThemeHandlers();

function setupThemeHandlers() {
    // Add global error handler for theme events
    document.addEventListener('themeFallbackApplied', (event) => {
        console.warn('[ThemeInit] Fallback theme was applied:', event.detail);
    });

    document.addEventListener('themeChanged', (event) => {
        // Theme changed event handled silently for performance
    });

    // Ensure global access (already set by theme-system.js)
    if (!window.themeManager) {
        window.themeManager = unifiedThemeSystem;
    }
}
