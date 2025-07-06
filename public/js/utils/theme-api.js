/**
 * Simple Theme API - Simplified Version
 * Easy-to-use wrapper for the unified theme system
 */

import { unifiedThemeSystem } from './theme-system.js';

/**
 * Simple theme API that provides a clean interface for common theme operations
 */
class SimpleThemeAPI {
    constructor() {
        this.themeSystem = unifiedThemeSystem;
    }

    /**
     * Initialize theme system automatically when imported
     */
    static autoInit() {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('[theme-api] Auto-initializing theme system');
                    new SimpleThemeAPI();
                });
            } else {
                console.log('[theme-api] Auto-initializing theme system');
                new SimpleThemeAPI();
            }
        }
    }

    /**
     * Get current theme information
     */
    getCurrentTheme() {
        return this.themeSystem.getCurrentTheme();
    }

    /**
     * Check if theme system is ready
     */
    isReady() {
        return this.themeSystem.isReady();
    }

    /**
     * Wait for theme to be loaded and applied
     */
    async waitForTheme() {
        // Simple polling since we don't have waitForReady in simplified system
        return new Promise((resolve) => {
            const check = () => {
                if (this.isReady()) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    /**
     * Reload the current theme
     */
    async reloadTheme() {
        return this.themeSystem.reloadTheme();
    }

    /**
     * Apply theme to a specific element (simplified)
     */
    applyToElement(element) {
        // Force refresh since simplified system doesn't have per-element application
        this.themeSystem.forceRefresh();
    }

    /**
     * Listen for theme changes (simplified)
     */
    onThemeChange(callback) {
        document.addEventListener('themeChanged', callback);
    }

    /**
     * Remove theme change listener (simplified)
     */
    offThemeChange(callback) {
        document.removeEventListener('themeChanged', callback);
    }

    /**
     * Manually trigger theme refresh
     */
    refreshTheme() {
        this.themeSystem.forceRefresh();
    }

    /**
     * Get theme CSS variables for use in JavaScript
     */
    getThemeVariables() {
        const style = getComputedStyle(document.documentElement);
        return {
            primaryColor: style.getPropertyValue('--theme-primary').trim(),
            secondaryColor: style.getPropertyValue('--theme-secondary').trim(),
            backgroundColor: style.getPropertyValue('--theme-background').trim(),
            surfaceColor: style.getPropertyValue('--theme-surface').trim(),
            textColor: style.getPropertyValue('--theme-text').trim(),
            borderColor: style.getPropertyValue('--theme-border').trim(),
            fontFamily: style.getPropertyValue('--theme-font').trim()
        };
    }
}

// Auto-initialize the theme system
SimpleThemeAPI.autoInit();

// Create instance for export
const simpleThemeAPI = new SimpleThemeAPI();

// Theme helper functions
export const theme = {
    get current() { return simpleThemeAPI.getCurrentTheme(); },
    get isReady() { return simpleThemeAPI.isReady(); },
    reload: () => simpleThemeAPI.reloadTheme(),
    refresh: () => simpleThemeAPI.refreshTheme(),
    getColors: () => simpleThemeAPI.getThemeVariables()
};

// Utility functions for easier theme integration
export function withTheme(callback) {
    if (simpleThemeAPI.isReady()) {
        callback(simpleThemeAPI.getThemeVariables());
    } else {
        simpleThemeAPI.waitForTheme().then(() => {
            callback(simpleThemeAPI.getThemeVariables());
        });
    }
}

export function themedElement(element, themeClass = 'themed') {
    if (element) {
        element.classList.add(themeClass);
        simpleThemeAPI.applyToElement(element);
    }
    return element;
}

export function getThemeColors() {
    return simpleThemeAPI.getThemeVariables();
}

export function themeClass(baseClass, themeAware = true) {
    return themeAware ? `${baseClass} themed` : baseClass;
}

export function applyTheme(element) {
    return simpleThemeAPI.applyToElement(element);
}

export { SimpleThemeAPI, simpleThemeAPI };
