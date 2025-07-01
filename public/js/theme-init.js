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
    try {
        themeManager = new ThemeManager();
        console.log('Theme manager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize theme manager:', error);
    }
}

// Export for global access if needed
window.themeManager = themeManager;
