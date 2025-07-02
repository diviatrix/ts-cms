/**
 * Global Theme Initialization
 * This script initializes the unified theme system on all pages
 */

import { unifiedThemeSystem } from './utils/theme-system.js';

// The unified theme system auto-initializes, but we can add global handlers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeHandlers);
} else {
    setupThemeHandlers();
}

function setupThemeHandlers() {
    console.log('[ThemeInit] Setting up unified theme system handlers...');
    
    // Add global error handler for theme events
    document.addEventListener('themeFallbackApplied', (event) => {
        console.warn('[ThemeInit] Fallback theme was applied:', event.detail);
    });
    
    document.addEventListener('themeChanged', (event) => {
        console.log('[ThemeInit] Theme changed:', event.detail);
    });
    
    // Ensure global access (already set by theme-system.js)
    if (!window.themeManager) {
        window.themeManager = unifiedThemeSystem;
    }
    
    console.log('[ThemeInit] Unified theme system handlers setup complete');
}
