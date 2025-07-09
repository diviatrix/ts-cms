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

const THEME_CACHE_KEY = 'unifiedThemeSettingsCache';
const THEME_CACHE_TTL = 24 * 60 * 60 * 1000;
const THEME_LAST_APPLIED_KEY = 'unifiedThemeLastApplied';

function normalizeSettings(settings) {
    if (Array.isArray(settings)) {
        const obj = {};
        settings.forEach(s => { obj[s.setting_key] = s.setting_value; });
        return obj;
    }
    return settings || {};
}

// Streamlined cache logic
const cache = {
    get() {
        const raw = localStorage.getItem(THEME_CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        if (Date.now() - cache.timestamp > THEME_CACHE_TTL) {
            this.invalidate();
            return null;
        }
        return cache.settings;
    },
    set(settings) {
        localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ settings, timestamp: Date.now() }));
    },
    getLastApplied() {
        const raw = localStorage.getItem(THEME_LAST_APPLIED_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    setLastApplied(settings) {
        localStorage.setItem(THEME_LAST_APPLIED_KEY, JSON.stringify(settings));
    },
    invalidate() {
        localStorage.removeItem(THEME_CACHE_KEY);
        localStorage.removeItem(THEME_LAST_APPLIED_KEY);
    }
};

class UnifiedThemeSystem {
    constructor() {
        this.currentTheme = null;
        this.themeState = THEME_STATES.LOADING;
        this.styleElement = null;
        this.loadPromise = null;
        this.retryAttempts = 0;
        this.init();
    }

    init() {
        document.addEventListener('themeChanged', () => {
            cache.invalidate();
            this.loadPromise = null;
            this.loadTheme();
        });
        document.addEventListener('dynamicContentLoaded', () => {
            this.forceRefresh();
        });
        this.loadTheme();
    }

    async loadTheme() {
        if (this.loadPromise) return this.loadPromise;
        this.loadPromise = this._loadTheme();
        return this.loadPromise;
    }

    async _loadTheme() {
        this.themeState = THEME_STATES.LOADING;
        const cachedSettings = cache.get();
        const lastApplied = cache.getLastApplied();
        if (cachedSettings) {
            await this.applyTheme(cachedSettings);
            if (!lastApplied || JSON.stringify(cachedSettings) !== JSON.stringify(lastApplied)) {
                cache.setLastApplied(cachedSettings);
                this.forceRefresh();
            }
            this.themeState = THEME_STATES.LOADED;
            document.dispatchEvent(new CustomEvent('themeReady'));
            return;
        }
        try {
            await loadDependencies();
            const result = await apiClient.get('/cms/active-theme');
            if (result.success && result.data) {
                const themeResult = await apiClient.get(`/themes/${result.data.id}`);
                if (themeResult.success && themeResult.data) {
                    this.currentTheme = themeResult.data;
                    this.themeState = THEME_STATES.LOADED;
                    this.retryAttempts = 0;
                    let settings = normalizeSettings(themeResult.data.settings);
                    cache.set(settings);
                    await this.applyTheme(settings);
                    cache.setLastApplied(settings);
                    this.forceRefresh();
                    document.dispatchEvent(new CustomEvent('themeReady'));
                } else {
                    throw new Error('Failed to load theme details');
                }
            } else {
                throw new Error(result.message || 'Failed to load website theme');
            }
        } catch (error) {
            messageSystem.showError('Error: ' + (error?.message || error?.toString()));
            await this.applyFallback();
        } finally {
            this.loadPromise = null;
        }
    }

    // Centralized theme application
    async applyTheme(settings, template = null) {
        const css = this.buildThemeCSS(settings, template);
        const existing = document.getElementById('unified-theme-system');
        if (existing) existing.remove();
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'unified-theme-system';
        this.styleElement.textContent = css;
        document.head.appendChild(this.styleElement);
        this.applyElements(settings);
    }

    // Unified CSS builder for all theme modes
    buildThemeCSS(settings, template = null) {
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

    // Replace generateCSS, generateFallbackCSS, generateSimplePreviewCSS with unified usage
    async generateCSS(settings) {
        try {
            const response = await fetch('/css/design-system.css');
            if (!response.ok) throw new Error('Failed to load design system template');
            const template = await response.text();
            return this.buildThemeCSS(settings, template);
        } catch {
            return this.buildThemeCSS(settings);
        }
    }
    generateFallbackCSS(settings) {
        return this.buildThemeCSS(settings);
    }
    generateSimplePreviewCSS(settings) {
        return this.buildThemeCSS(settings);
    }

    applyElements(settings) {
        // Favicon
        if (settings.favicon_url) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = settings.favicon_url;
        }
        // Footer text
        if (settings.footer_text) {
            document.querySelectorAll('[data-theme-footer]').forEach(footer => { footer.innerHTML = settings.footer_text; });
        }
        // Footer links
        if (settings.footer_links) {
            try {
                const links = JSON.parse(settings.footer_links);
                const container = document.querySelector('[data-theme-footer-links]');
                if (container && Array.isArray(links)) {
                    container.innerHTML = '';
                    links.forEach(link => {
                        const a = document.createElement('a');
                        a.href = link.url;
                        a.textContent = link.text;
                        a.className = 'me-3 text-decoration-none';
                        if (link.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
                        container.appendChild(a);
                    });
                }
            } catch {}
        }
        // Menu links
        if (settings.menu_links) {
            try {
                const links = JSON.parse(settings.menu_links);
                const nav = document.querySelector('.navbar-nav');
                if (nav && Array.isArray(links)) {
                    nav.querySelectorAll('[data-theme-menu-item]').forEach(item => item.remove());
                    const signOut = nav.querySelector('#signOutButton')?.parentElement;
                    links.forEach(link => {
                        const li = document.createElement('li');
                        li.className = 'nav-item';
                        li.setAttribute('data-theme-menu-item', 'true');
                        const a = document.createElement('a');
                        a.className = 'nav-link';
                        a.href = link.url;
                        a.textContent = link.text;
                        if (link.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
                        li.appendChild(a);
                        if (signOut) nav.insertBefore(li, signOut); else nav.appendChild(li);
                    });
                }
            } catch {}
        }
    }

    forceRefresh() {
        document.documentElement.style.setProperty('--theme-refresh', Date.now().toString());
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
        document.body.classList.add('theme-refreshing');
        requestAnimationFrame(() => { document.body.classList.remove('theme-refreshing'); });
    }

    // Preview and legacy methods
    async switchTheme(themeId) {
        try {
            await loadDependencies();
            const result = await apiClient.post(`/themes/${themeId}/activate`);
            if (result.success) {
                this.loadPromise = null;
                this.retryAttempts = 0;
                await this.loadTheme();
                document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeId, source: 'switchTheme' } }));
                return { success: true, message: 'Theme switched successfully' };
            }
            throw new Error(result.message || 'Failed to switch theme');
        } catch (error) {
            messageSystem.showError('Error: ' + (error?.message || error?.toString()));
            let errorMessage = 'Failed to switch theme';
            if (error.message) {
                if (error.message.includes('Cannot POST')) errorMessage = 'API endpoint not found - please check server configuration';
                else if (error.message.includes('404')) errorMessage = 'Theme not found or endpoint unavailable';
                else errorMessage = error.message;
            }
            return { success: false, message: errorMessage };
        }
    }

    async previewTheme(themeId) {
        try {
            await loadDependencies();
            const result = await apiClient.get(`/themes/${themeId}`);
            if (result.success && result.data) {
                const originalTheme = this.currentTheme;
                this.applyPreviewStyles(result.data);
                setTimeout(() => {
                    this.removePreviewStyles();
                    if (originalTheme) this.applyTheme(normalizeSettings(originalTheme.settings));
                    else this.loadTheme();
                }, 10000);
                return { success: true, message: 'Theme preview applied successfully' };
            }
            throw new Error(result.message || 'Failed to fetch theme');
        } catch (error) {
            messageSystem.showError('Error: ' + (error?.message || error?.toString()));
            return { success: false, message: error.message };
        }
    }

    applyPreviewStyles(themeData) {
        const existingPreview = document.getElementById('theme-preview-styles');
        if (existingPreview) existingPreview.remove();
        let settings = normalizeSettings(themeData.settings || themeData.theme?.settings);
        const css = this.buildThemeCSS(settings);
        const previewStyle = document.createElement('style');
        previewStyle.id = 'theme-preview-styles';
        previewStyle.type = 'text/css';
        previewStyle.textContent = css;
        document.head.appendChild(previewStyle);
        this.applyElements(settings);
        document.body.offsetHeight;
    }

    removePreviewStyles() {
        const previewStyle = document.getElementById('theme-preview-styles');
        if (previewStyle) { previewStyle.remove(); document.body.offsetHeight; }
    }

    async applyFallback() {
        this.currentTheme = DEFAULT_THEME;
        this.themeState = THEME_STATES.FALLBACK;
        await this.applyTheme(DEFAULT_THEME.settings);
        document.dispatchEvent(new CustomEvent('themeReady'));
    }

    // Public API
    async reloadTheme() { this.loadPromise = null; this.retryAttempts = 0; return this.loadTheme(); }
    getCurrentTheme() { return { theme: this.currentTheme, state: this.themeState }; }
    isReady() { return this.themeState === THEME_STATES.LOADED || this.themeState === THEME_STATES.FALLBACK; }
}

const unifiedThemeSystem = new UnifiedThemeSystem();
window.unifiedThemeSystem = unifiedThemeSystem;
window.themeManager = unifiedThemeSystem;

export { UnifiedThemeSystem, unifiedThemeSystem, THEME_STATES };
