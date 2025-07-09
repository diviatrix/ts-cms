/**
 * Unified Theme System - Simplified
 * Lightweight, maintainable theme management with all current features
 */

import { messageSystem } from './message-system.js';

let apiClient = null;
const loadDependencies = async () => {
    if (!apiClient) {
        const module = await import('../api-client.js');
        apiClient = module.apiClient;
    }
};

const THEME_STATES = {
    LOADING: 'loading',
    LOADED: 'loaded',
    ERROR: 'error',
    FALLBACK: 'fallback'
};

const DEFAULT_THEME = {
    name: 'Default Dark',
    settings: {
        primary_color: '#00FF00',
        secondary_color: '#FFD700',
        background_color: '#222222',
        surface_color: '#444444',
        text_color: '#E0E0E0',
        border_color: '#00FF00',
        font_family: "'Share Tech Mono', monospace",
        custom_css: ''
    }
};

function normalizeSettings(settings) {
    if (Array.isArray(settings)) {
        const obj = {};
        settings.forEach(s => { obj[s.setting_key] = s.setting_value; });
        return obj;
    }
    return settings || {};
}

// --- Minimal functional theme system ---

async function fetchThemeSettings() {
    await loadDependencies();
    try {
            const result = await apiClient.get('/cms/active-theme');
            if (result.success && result.data) {
                const themeResult = await apiClient.get(`/themes/${result.data.id}`);
                if (themeResult.success && themeResult.data) {
                return normalizeSettings(themeResult.data.settings);
            }
        }
        throw new Error('No theme data');
    } catch (e) {
        messageSystem.showError('Theme error: ' + (e?.message || e?.toString()));
        return DEFAULT_THEME.settings;
        }
    }

function buildThemeCSS(settings, template = null) {
    const vars = {
        PRIMARY_COLOR: settings.primary_color || '#00FF00',
        SECONDARY_COLOR: settings.secondary_color || '#FFD700',
        BACKGROUND_COLOR: settings.background_color || '#222222',
        SURFACE_COLOR: settings.surface_color || '#444444',
        TEXT_COLOR: settings.text_color || '#E0E0E0',
        TEXT_SECONDARY: settings.text_secondary || '#C0C0C0',
        TEXT_MUTED: settings.text_muted || '#A0A0A0',
        BORDER_COLOR: settings.border_color || '#00FF00',
        FONT_FAMILY: settings.font_family || "'Share Tech Mono', monospace",
        CUSTOM_CSS: settings.custom_css || ''
    };
    if (template) {
            return template
            .replace(/{{PRIMARY_COLOR}}/g, vars.PRIMARY_COLOR)
            .replace(/{{SECONDARY_COLOR}}/g, vars.SECONDARY_COLOR)
            .replace(/{{BACKGROUND_COLOR}}/g, vars.BACKGROUND_COLOR)
            .replace(/{{SURFACE_COLOR}}/g, vars.SURFACE_COLOR)
            .replace(/{{TEXT_COLOR}}/g, vars.TEXT_COLOR)
            .replace(/{{TEXT_SECONDARY}}/g, vars.TEXT_SECONDARY)
            .replace(/{{TEXT_MUTED}}/g, vars.TEXT_MUTED)
            .replace(/{{BORDER_COLOR}}/g, vars.BORDER_COLOR)
            .replace(/{{FONT_FAMILY}}/g, vars.FONT_FAMILY)
            .replace(/\/\* {{CUSTOM_CSS}} \*\//g, vars.CUSTOM_CSS);
    }
    // Fallback/minimal template
        return `
            :root {
            --theme-primary-color: ${vars.PRIMARY_COLOR};
            --theme-secondary-color: ${vars.SECONDARY_COLOR};
            --theme-background-color: ${vars.BACKGROUND_COLOR};
            --theme-surface-color: ${vars.SURFACE_COLOR};
            --theme-text-color: ${vars.TEXT_COLOR};
            --theme-border-color: ${vars.BORDER_COLOR};
            --theme-font-family: ${vars.FONT_FAMILY};
            }
        body { background-color: var(--theme-background-color); color: var(--theme-text-color); font-family: var(--theme-font-family); }
        .card, .card-body, .box { background-color: var(--theme-surface-color); border-color: var(--theme-border-color); color: var(--theme-text-color); }
        .navbar { background-color: var(--theme-surface-color); }
        .btn, .btn-primary { background-color: var(--theme-primary-color); border-color: var(--theme-primary-color); color: #181a1f; }
        .btn-secondary { background-color: var(--theme-secondary-color); border-color: var(--theme-secondary-color); color: #181a1f; }
        ${vars.CUSTOM_CSS}
    `;
            }

function applyTheme(settings, template = null) {
    const css = buildThemeCSS(settings, template);
    const existing = document.getElementById('unified-theme-system');
    if (existing) existing.remove();
    const styleElement = document.createElement('style');
    styleElement.id = 'unified-theme-system';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    // Optionally update favicon/footer/menu here if needed
}

export async function applyThemeFromAPI() {
    const settings = await fetchThemeSettings();
    applyTheme(settings);
}
