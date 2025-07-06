/**
 * Unified Theme System - Optimized Version
 * Lightweight theme management with lazy loading and essential functionality
 */

// Lazy load heavy dependencies
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
const THEME_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const THEME_LAST_APPLIED_KEY = 'unifiedThemeLastApplied';

function getCachedThemeSettings() {
    try {
        const cache = JSON.parse(localStorage.getItem(THEME_CACHE_KEY));
        if (!cache) return null;
        if (Date.now() - cache.timestamp > THEME_CACHE_TTL) {
            localStorage.removeItem(THEME_CACHE_KEY);
            return null;
        }
        return cache.settings;
    } catch {
        return null;
    }
}

function setCachedThemeSettings(settings) {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({
        settings,
        timestamp: Date.now()
    }));
}

function getLastAppliedThemeSettings() {
    try {
        return JSON.parse(localStorage.getItem(THEME_LAST_APPLIED_KEY));
    } catch {
        return null;
    }
}

function setLastAppliedThemeSettings(settings) {
    localStorage.setItem(THEME_LAST_APPLIED_KEY, JSON.stringify(settings));
}

function invalidateThemeCache() {
    localStorage.removeItem(THEME_CACHE_KEY);
    localStorage.removeItem(THEME_LAST_APPLIED_KEY);
}

class UnifiedThemeSystem {
    constructor() {
        this.currentTheme = null;
        this.themeState = THEME_STATES.LOADING;
        this.styleElement = null;
        this.loadPromise = null;
        this.retryAttempts = 0;
        this.lastAppliedSettings = null;
        
        this.init();
    }

    init() {
        console.log('[theme-system] Initializing simplified theme system...');
        // Invalidate cache on themeChanged
        document.addEventListener('themeChanged', () => {
            console.log('[theme-system] Theme change detected, invalidating cache and reloading...');
            invalidateThemeCache();
            this.loadPromise = null; // Reset cache
            this.loadTheme();
        });
        this.loadTheme(); // Apply theme immediately
    }

    setupStyles() {
        // Remove existing styles (both unified and preview styles)
        const existing = document.getElementById('unified-theme-styles');
        if (existing) existing.remove();
        
        const previewStyles = document.getElementById('theme-preview-styles');
        if (previewStyles) previewStyles.remove();

        // Create style element and append at the end of head for maximum specificity
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'unified-theme-styles';
        this.styleElement.type = 'text/css';
        document.head.appendChild(this.styleElement);
        
        console.log('[theme-system] Style element created and positioned');
    }

    async loadTheme() {
        if (this.loadPromise) return this.loadPromise;
        this.loadPromise = this.loadThemeInternal();
        return this.loadPromise;
    }

    async loadThemeInternal() {
        this.themeState = THEME_STATES.LOADING;
        // Try cache first
        const cachedSettings = getCachedThemeSettings();
        const lastApplied = getLastAppliedThemeSettings();
        if (cachedSettings) {
            console.log('[theme-system] Using cached theme settings');
            await this.injectCSS(cachedSettings);
            this.applyElements(cachedSettings);
            if (!lastApplied || JSON.stringify(cachedSettings) !== JSON.stringify(lastApplied)) {
                setLastAppliedThemeSettings(cachedSettings);
                this.forceRefresh();
            } else {
                console.log('[theme-system] Cached settings unchanged, skipping force refresh');
            }
            this.themeState = THEME_STATES.LOADED;
            return;
        }
        try {
            console.log('[theme-system] Loading active theme...');
            await loadDependencies();
            const result = await apiClient.get('/cms/active-theme');
            if (result.success && result.data) {
                console.log('[theme-system] Website theme loaded:', result.data.name);
                // Fetch the full theme data with settings
                const themeResult = await apiClient.get(`/themes/${result.data.id}`);
                if (themeResult.success && themeResult.data) {
                    this.currentTheme = themeResult.data;
                    this.themeState = THEME_STATES.LOADED;
                    this.retryAttempts = 0;
                    // Only cache the settings used for CSS injection
                    let settings = themeResult.data.settings;
                    if (Array.isArray(settings)) {
                        const settingsObj = {};
                        settings.forEach(setting => {
                            settingsObj[setting.setting_key] = setting.setting_value;
                        });
                        settings = settingsObj;
                    }
                    setCachedThemeSettings(settings);
                    await this.applyTheme(themeResult.data);
                    setLastAppliedThemeSettings(settings);
                    this.forceRefresh();
                    console.log('[theme-system] Theme applied successfully');
                } else {
                    throw new Error('Failed to load theme details');
                }
            } else {
                throw new Error(result.message || 'Failed to load website theme');
            }
        } catch (error) {
            console.error('[theme-system] Theme loading failed:', error);
            this.retryAttempts++;
            if (this.retryAttempts < 3) {
                setTimeout(() => {
                    this.loadPromise = null;
                    this.loadTheme();
                }, 1000 * this.retryAttempts);
            } else {
                this.applyFallback();
            }
        } finally {
            this.loadPromise = null;
        }
    }

    async applyTheme(themeData) {
        console.log('[theme-system] ApplyTheme called with:', themeData);
        let settings = themeData.settings;
        
        // Handle different response structures
        if (!settings && themeData.theme) {
            settings = themeData.theme.settings;
        }
        
        // Convert array of settings to object if needed
        if (Array.isArray(settings)) {
            const settingsObj = {};
            settings.forEach(setting => {
                settingsObj[setting.setting_key] = setting.setting_value;
            });
            settings = settingsObj;
            console.log('[theme-system] Converted array settings to object:', settings);
        }
        
        console.log('[theme-system] Final settings to apply:', settings);
        
        // Fetch settings if not provided
        if (!settings && themeData.id) {
            try {
                console.log('[theme-system] Fetching settings for theme:', themeData.id);
                const { apiClient } = await import('../api-client.js');
                const result = await apiClient.get(`/themes/${themeData.id}/settings`);
                if (result.success) {
                    settings = result.data;
                    console.log('[theme-system] Fetched settings:', settings);
                }
            } catch (error) {
                console.error('[theme-system] Failed to fetch theme settings:', error);
            }
        }
        
        if (settings && Object.keys(settings).length > 0) {
            console.log('[theme-system] About to inject CSS with settings:', settings);
            await this.injectCSS(settings);
            this.applyElements(settings);
            this.forceRefresh();
        } else {
            console.error('[theme-system] No valid settings available to apply!');
        }
    }

    applyFallback() {
        console.log('[theme-system] Applying fallback theme');
        this.currentTheme = DEFAULT_THEME;
        this.themeState = THEME_STATES.FALLBACK;
        this.injectCSS(DEFAULT_THEME.settings);
    }

    async injectCSS(settings) {
        const css = await this.generateCSS(settings);
        
        // Remove any existing theme styles
        const existing = document.getElementById('unified-theme-system');
        if (existing) existing.remove();
        
        // Create and inject new theme styles
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'unified-theme-system';
        this.styleElement.textContent = css;
        document.head.appendChild(this.styleElement);
        
        console.log('[theme-system] Theme CSS applied');
    }

    async generateCSS(settings) {
        const {
            primary_color = '#00FF00',
            secondary_color = '#FFD700',
            background_color = '#222222',
            surface_color = '#444444',
            text_color = '#E0E0E0',
            text_secondary = '#C0C0C0',
            text_muted = '#A0A0A0',
            border_color = '#00FF00',
            font_family = "'Share Tech Mono', monospace",
            custom_css = ''
        } = settings;

        try {
            // Load design system template and replace placeholders
            const template = await this.loadDesignSystemTemplate();
            return template
                .replace(/{{PRIMARY_COLOR}}/g, primary_color)
                .replace(/{{SECONDARY_COLOR}}/g, secondary_color)
                .replace(/{{BACKGROUND_COLOR}}/g, background_color)
                .replace(/{{SURFACE_COLOR}}/g, surface_color)
                .replace(/{{TEXT_COLOR}}/g, text_color)
                .replace(/{{TEXT_SECONDARY}}/g, text_secondary)
                .replace(/{{TEXT_MUTED}}/g, text_muted)
                .replace(/{{BORDER_COLOR}}/g, border_color)
                .replace(/{{FONT_FAMILY}}/g, font_family)
                .replace(/\/\* {{CUSTOM_CSS}} \*\//g, custom_css);
        } catch (error) {
            console.error('[theme-system] Failed to load design system template:', error);
            // Fallback to simple CSS generation
            return this.generateFallbackCSS(settings);
        }
    }

    async loadDesignSystemTemplate() {
        try {
            const response = await fetch('/css/design-system.css');
            if (!response.ok) throw new Error('Failed to load design system template');
            return await response.text();
        } catch (error) {
            throw new Error('Design system template not found');
        }
    }

    generateFallbackCSS(settings) {
        const {
            primary_color = '#00FF00',
            secondary_color = '#FFD700',
            background_color = '#222222',
            surface_color = '#444444',
            text_color = '#E0E0E0',
            border_color = '#00FF00',
            font_family = "'Share Tech Mono', monospace",
            custom_css = ''
        } = settings;

        return `
            /* Fallback CSS - Generated ${new Date().toISOString()} */
            :root {
                --bs-primary: ${primary_color};
                --bs-secondary: ${secondary_color};
                --bs-body-bg: ${background_color};
                --bs-body-color: ${text_color};
                --bs-font-sans-serif: ${font_family};
            }
            
            body {
                background-color: ${background_color};
                color: ${text_color};
                font-family: ${font_family};
            }
            
            .card, .card-body {
                background-color: ${surface_color};
                border-color: ${border_color};
                color: ${text_color};
            }
            
            .navbar {
                background-color: ${surface_color};
            }
            
            .btn-primary {
                background-color: ${primary_color};
                border-color: ${primary_color};
            }
            
            .btn-secondary {
                background-color: ${secondary_color};
                border-color: ${secondary_color};
            }
            
            ${custom_css}
        `;
    }

    // Utility function to convert hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `${r}, ${g}, ${b}`;
        }
        return '0, 0, 0';
    }

    applyElements(settings) {
        // Apply favicon
        if (settings.favicon_url) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = settings.favicon_url;
        }

        // Apply footer text
        if (settings.footer_text) {
            const footers = document.querySelectorAll('[data-theme-footer]');
            footers.forEach(footer => {
                footer.innerHTML = settings.footer_text;
            });
        }

        // Apply footer links
        if (settings.footer_links) {
            try {
                const footerLinks = JSON.parse(settings.footer_links);
                const footerContainer = document.querySelector('[data-theme-footer-links]');
                if (footerContainer && Array.isArray(footerLinks)) {
                    footerContainer.innerHTML = '';
                    footerLinks.forEach(link => {
                        const linkElement = document.createElement('a');
                        linkElement.href = link.url;
                        linkElement.textContent = link.text;
                        linkElement.className = 'me-3 text-decoration-none';
                        if (link.external) {
                            linkElement.target = '_blank';
                            linkElement.rel = 'noopener noreferrer';
                        }
                        footerContainer.appendChild(linkElement);
                    });
                    console.log('[theme-system] Applied footer links:', footerLinks.length);
                }
            } catch (error) {
                console.error('[theme-system] Failed to parse footer_links JSON:', error);
            }
        }

        // Apply menu links
        if (settings.menu_links) {
            try {
                const menuLinks = JSON.parse(settings.menu_links);
                const navContainer = document.querySelector('.navbar-nav');
                if (navContainer && Array.isArray(menuLinks)) {
                    // Remove existing theme menu items
                    const existingThemeItems = navContainer.querySelectorAll('[data-theme-menu-item]');
                    existingThemeItems.forEach(item => item.remove());
                    
                    // Add new theme menu items before the last items (Profile, Admin, Sign Out)
                    const signOutButton = navContainer.querySelector('#signOutButton')?.parentElement;
                    menuLinks.forEach(link => {
                        const listItem = document.createElement('li');
                        listItem.className = 'nav-item';
                        listItem.setAttribute('data-theme-menu-item', 'true');
                        
                        const linkElement = document.createElement('a');
                        linkElement.className = 'nav-link';
                        linkElement.href = link.url;
                        linkElement.textContent = link.text;
                        if (link.external) {
                            linkElement.target = '_blank';
                            linkElement.rel = 'noopener noreferrer';
                        }
                        
                        listItem.appendChild(linkElement);
                        
                        if (signOutButton) {
                            navContainer.insertBefore(listItem, signOutButton);
                        } else {
                            navContainer.appendChild(listItem);
                        }
                    });
                    console.log('[theme-system] Applied menu links:', menuLinks.length);
                }
            } catch (error) {
                console.error('[theme-system] Failed to parse menu_links JSON:', error);
            }
        }
    }

    forceRefresh() {
        console.log('[theme-system] Starting force refresh...');
        
        // Update CSS custom property to trigger recalculation
        document.documentElement.style.setProperty('--theme-refresh', Date.now().toString());
        
        // Force immediate reflow
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        // Force recalculation of CSS variables
        const computedStyle = getComputedStyle(document.documentElement);
        const primaryColor = computedStyle.getPropertyValue('--theme-primary');
        console.log('[theme-system] After refresh, --theme-primary:', primaryColor);
        
        // Trigger a repaint by changing a harmless property
        document.body.classList.add('theme-refreshing');
        requestAnimationFrame(() => {
            document.body.classList.remove('theme-refreshing');
            console.log('[theme-system] Force refresh completed');
        });
    }

    // Legacy compatibility methods
    async switchTheme(themeId) {
        console.log(`[theme-system] Switching to theme: ${themeId}`);
        
        try {
            await loadDependencies();
            
            // Use the correct theme activation endpoint
            const result = await apiClient.post(`/themes/${themeId}/activate`);
            
            if (result.success) {
                this.loadPromise = null;
                this.retryAttempts = 0;
                await this.loadTheme();
                
                document.dispatchEvent(new CustomEvent('themeChanged', {
                    detail: { themeId, source: 'switchTheme' }
                }));
                
                return { success: true, message: 'Theme switched successfully' };
            }
            throw new Error(result.message || 'Failed to switch theme');
        } catch (error) {
            console.error('[theme-system] Switch failed:', error);
            // Better error message handling
            let errorMessage = 'Failed to switch theme';
            if (error.message) {
                // Extract meaningful error from HTML responses
                if (error.message.includes('Cannot POST')) {
                    errorMessage = 'API endpoint not found - please check server configuration';
                } else if (error.message.includes('404')) {
                    errorMessage = 'Theme not found or endpoint unavailable';
                } else {
                    errorMessage = error.message;
                }
            }
            return { success: false, message: errorMessage };
        }
    }

    async previewTheme(themeId) {
        console.log(`[theme-system] Previewing theme: ${themeId}`);
        
        try {
            await loadDependencies();
            const result = await apiClient.get(`/themes/${themeId}`);
            
            if (result.success && result.data) {
                // Store original theme for restoration
                const originalTheme = this.currentTheme;
                
                // Apply preview using a separate style element (like theme editor)
                this.applyPreviewStyles(result.data);
                
                // Auto-restore after 10 seconds
                setTimeout(() => {
                    console.log('[theme-system] Auto-restoring original theme after preview');
                    this.removePreviewStyles();
                    if (originalTheme) {
                        this.applyTheme(originalTheme);
                    } else {
                        this.loadTheme();
                    }
                }, 10000);
                
                return { success: true, message: 'Theme preview applied successfully' };
            }
            throw new Error(result.message || 'Failed to fetch theme');
        } catch (error) {
            console.error('[theme-system] Preview failed:', error);
            return { success: false, message: error.message };
        }
    }

    applyPreviewStyles(themeData) {
        console.log('[theme-system] Applying preview styles for:', themeData.theme?.name);
        
        // Remove existing preview styles
        const existingPreview = document.getElementById('theme-preview-styles');
        if (existingPreview) {
            existingPreview.remove();
        }

        // Get settings from the theme data
        let settings = themeData.settings || themeData.theme?.settings || {};
        
        // Convert array of settings to object if needed
        if (Array.isArray(settings)) {
            const settingsObj = {};
            settings.forEach(setting => {
                settingsObj[setting.setting_key] = setting.setting_value;
            });
            settings = settingsObj;
        }
        
        // Generate simple preview CSS (similar to theme editor approach)
        const css = this.generateSimplePreviewCSS(settings);
        
        // Create preview style element (separate from main styles)
        const previewStyle = document.createElement('style');
        previewStyle.id = 'theme-preview-styles';
        previewStyle.type = 'text/css';
        previewStyle.textContent = css;
        
        // Append at the very end of head for maximum specificity
        document.head.appendChild(previewStyle);
        
        // Also apply elements for preview
        this.applyElements(settings);
        
        console.log('[theme-system] Preview styles applied');
        console.log('[theme-system] Preview CSS length:', css.length);
        console.log('[theme-system] Preview CSS first 200 chars:', css.substring(0, 200));
        
        // Force immediate visual update (no fancy tricks, just basic reflow)
        document.body.offsetHeight;
    }

    generateSimplePreviewCSS(settings) {
        const {
            primary_color = '#00FF00',
            secondary_color = '#FFD700',
            background_color = '#222222',
            surface_color = '#444444',
            text_color = '#E0E0E0',
            border_color = '#00FF00',
            font_family = "'Share Tech Mono', monospace",
            custom_css = ''
        } = settings;

        // Simple CSS similar to theme editor's approach
        return `
            /* Theme Preview - Simple Approach */
            :root {
                --bs-primary: ${primary_color} !important;
                --bs-secondary: ${secondary_color} !important;
                --bs-body-bg: ${background_color} !important;
                --bs-body-color: ${text_color} !important;
                --bs-font-sans-serif: ${font_family} !important;
            }
            
            body {
                background-color: ${background_color} !important;
                color: ${text_color} !important;
                font-family: ${font_family} !important;
            }
            
            .btn-primary {
                background-color: ${primary_color} !important;
                border-color: ${primary_color} !important;
            }
            
            .btn-secondary {
                background-color: ${secondary_color} !important;
                border-color: ${secondary_color} !important;
            }
            
            .card, .card-body {
                background-color: ${surface_color} !important;
                border: 1px solid ${border_color} !important;
                color: ${text_color} !important;
            }
            
            .navbar {
                background-color: ${surface_color} !important;
            }
            
            .navbar-brand, .nav-link {
                color: ${text_color} !important;
            }
            
            ${custom_css}
        `;
    }

    removePreviewStyles() {
        const previewStyle = document.getElementById('theme-preview-styles');
        if (previewStyle) {
            previewStyle.remove();
            console.log('[theme-system] Preview styles removed');
            
            // Force refresh after removal
            document.body.offsetHeight;
        }
    }

    // Public API methods
    async reloadTheme() {
        console.log('[theme-system] Reloading theme...');
        this.loadPromise = null;
        this.retryAttempts = 0;
        return this.loadTheme();
    }

    getCurrentTheme() {
        return { theme: this.currentTheme, state: this.themeState };
    }

    isReady() {
        return this.themeState === THEME_STATES.LOADED || this.themeState === THEME_STATES.FALLBACK;
    }
}

// Create and export global instance
const unifiedThemeSystem = new UnifiedThemeSystem();

// Make it globally available
window.unifiedThemeSystem = unifiedThemeSystem;
window.themeManager = unifiedThemeSystem;

export { UnifiedThemeSystem, unifiedThemeSystem, THEME_STATES };
