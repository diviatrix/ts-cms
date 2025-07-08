import { unifiedThemeSystem } from './theme-system.js';

class SimpleThemeAPI {
    constructor() {
        this.themeSystem = unifiedThemeSystem;
    }

    static autoInit() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    new SimpleThemeAPI();
                });
            } else {
                new SimpleThemeAPI();
        }
    }

    getCurrentTheme() {
        return this.themeSystem.getCurrentTheme();
    }

    isReady() {
        return this.themeSystem.isReady();
    }

    async waitForTheme() {
        if (this.isReady()) return;
        return new Promise(resolve => {
            const onReady = () => {
                document.removeEventListener('themeReady', onReady);
                resolve();
            };
            document.addEventListener('themeReady', onReady);
        });
    }

    async reloadTheme() {
        return this.themeSystem.reloadTheme();
    }

    applyToElement(element) {
        // Force refresh since simplified system doesn't have per-element application
        this.refreshTheme();
    }

    onThemeChange(callback) {
        document.addEventListener('themeChanged', callback);
    }

    offThemeChange(callback) {
        document.removeEventListener('themeChanged', callback);
    }

    refreshTheme() {
        this.themeSystem.forceRefresh();
    }

    getThemeVariables() {
        const style = getComputedStyle(document.documentElement);
        return {
            primaryColor: style.getPropertyValue('--theme-primary-color').trim(),
            secondaryColor: style.getPropertyValue('--theme-secondary-color').trim(),
            backgroundColor: style.getPropertyValue('--theme-background-color').trim(),
            surfaceColor: style.getPropertyValue('--theme-surface-color').trim(),
            textColor: style.getPropertyValue('--theme-text-color').trim(),
            borderColor: style.getPropertyValue('--theme-border-color').trim(),
            fontFamily: style.getPropertyValue('--theme-font-family').trim(),
            textSecondary: style.getPropertyValue('--theme-text-secondary')?.trim() || undefined,
            textMuted: style.getPropertyValue('--theme-text-muted')?.trim() || undefined
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
