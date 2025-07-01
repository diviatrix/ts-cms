/**
 * Global Theme Initialization
 * This script initializes the theme manager on all pages
 */

import { ThemeManager } from './theme-manager.js';

// Initialize theme manager globally
let themeManager;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}

function initializeTheme() {
    console.log('[ThemeInit] Starting theme manager initialization...');
    try {
        themeManager = new ThemeManager();
        console.log('[ThemeInit] Theme manager initialized successfully');
        
        // Add global error handler for theme events
        document.addEventListener('themeFallbackApplied', (event) => {
            console.warn('[ThemeInit] Fallback theme was applied:', event.detail);
        });
        
    } catch (error) {
        console.error('[ThemeInit] Failed to initialize theme manager:', error);
        console.log('[ThemeInit] Site will continue with default browser styling');
    }
}

// Export for global access if needed
window.themeManager = themeManager;
