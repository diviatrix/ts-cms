import { unifiedThemeSystem } from './theme-system.js';

// Minimal, stable theme API wrapper
class SimpleThemeAPI {
    getCurrentTheme() {
        return unifiedThemeSystem.getCurrentTheme();
    }
    isReady() {
        return unifiedThemeSystem.isReady();
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
        return unifiedThemeSystem.reloadTheme();
    }
    refreshTheme() {
        unifiedThemeSystem.forceRefresh();
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

const simpleThemeAPI = new SimpleThemeAPI();

// Main theme API export
export const theme = {
    get current() { return simpleThemeAPI.getCurrentTheme(); },
    get isReady() { return simpleThemeAPI.isReady(); },
    reload: () => simpleThemeAPI.reloadTheme(),
    refresh: () => simpleThemeAPI.refreshTheme(),
    getColors: () => simpleThemeAPI.getThemeVariables()
};

// Utility: run callback with theme variables when ready
export function withTheme(callback) {
    if (simpleThemeAPI.isReady()) {
        callback(simpleThemeAPI.getThemeVariables());
    } else {
        simpleThemeAPI.waitForTheme().then(() => {
            callback(simpleThemeAPI.getThemeVariables());
        });
    }
}

// Utility: get theme variables directly
export function getThemeColors() {
    return simpleThemeAPI.getThemeVariables();
}
