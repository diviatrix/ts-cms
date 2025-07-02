/**
 * Unified Theme System - Simplified Version
 * Lightweight theme management with essential functionality only
 */

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
        console.log('[UnifiedTheme] Initializing simplified theme system...');
        this.loadTheme(); // Apply theme immediately
        
        // Listen for theme changes from CMS settings
        document.addEventListener('themeChanged', () => {
            console.log('[UnifiedTheme] Theme change detected, reloading...');
            this.loadPromise = null; // Reset cache
            this.loadTheme();
        });
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
        
        console.log('[UnifiedTheme] Style element created and positioned');
    }

    async loadTheme() {
        if (this.loadPromise) return this.loadPromise;
        
        this.loadPromise = this.loadThemeInternal();
        return this.loadPromise;
    }

    async loadThemeInternal() {
        this.themeState = THEME_STATES.LOADING;
        
        try {
            console.log('[UnifiedTheme] Loading active theme...');
            const { apiClient } = await import('../api-client.js');
            const result = await apiClient.get('/cms/active-theme'); // Use CMS website theme, not themes.is_active
            
            if (result.success && result.data) {
                console.log('[UnifiedTheme] Website theme loaded:', result.data.name);
                
                // Fetch the full theme data with settings
                const themeResult = await apiClient.get(`/themes/${result.data.id}`);
                if (themeResult.success && themeResult.data) {
                    this.currentTheme = themeResult.data;
                    this.themeState = THEME_STATES.LOADED;
                    this.retryAttempts = 0;
                    
                    await this.applyTheme(themeResult.data);
                    console.log('[UnifiedTheme] Theme applied successfully');
                } else {
                    throw new Error('Failed to load theme details');
                }
            } else {
                throw new Error(result.message || 'Failed to load website theme');
            }
        } catch (error) {
            console.error('[UnifiedTheme] Theme loading failed:', error);
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
        console.log('[UnifiedTheme] ApplyTheme called with:', themeData);
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
            console.log('[UnifiedTheme] Converted array settings to object:', settings);
        }
        
        console.log('[UnifiedTheme] Final settings to apply:', settings);
        
        // Fetch settings if not provided
        if (!settings && themeData.id) {
            try {
                console.log('[UnifiedTheme] Fetching settings for theme:', themeData.id);
                const { apiClient } = await import('../api-client.js');
                const result = await apiClient.get(`/themes/${themeData.id}/settings`);
                if (result.success) {
                    settings = result.data;
                    console.log('[UnifiedTheme] Fetched settings:', settings);
                }
            } catch (error) {
                console.error('[UnifiedTheme] Failed to fetch theme settings:', error);
            }
        }
        
        if (settings && Object.keys(settings).length > 0) {
            console.log('[UnifiedTheme] About to inject CSS with settings:', settings);
            this.injectCSS(settings);
            this.applyElements(settings);
            this.forceRefresh();
        } else {
            console.error('[UnifiedTheme] No valid settings available to apply!');
        }
    }

    applyFallback() {
        console.log('[UnifiedTheme] Applying fallback theme');
        this.currentTheme = DEFAULT_THEME;
        this.themeState = THEME_STATES.FALLBACK;
        this.injectCSS(DEFAULT_THEME.settings);
    }

    injectCSS(settings) {
        const css = this.generateCSS(settings);
        
        // Remove any existing theme styles
        const existing = document.getElementById('unified-theme-system');
        if (existing) existing.remove();
        
        // Create and inject new theme styles
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'unified-theme-system';
        this.styleElement.textContent = css;
        document.head.appendChild(this.styleElement);
        
        console.log('[UnifiedTheme] Theme CSS applied');
    }

    generateCSS(settings) {
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
            /* Unified Theme System CSS - Generated ${new Date().toISOString()} */
            :root {
                --bs-primary: ${primary_color} !important;
                --bs-secondary: ${secondary_color} !important;
                --bs-body-bg: ${background_color} !important;
                --bs-body-color: ${text_color} !important;
                --bs-font-sans-serif: ${font_family} !important;
                
                --theme-primary: ${primary_color} !important;
                --theme-secondary: ${secondary_color} !important;
                --theme-background: ${background_color} !important;
                --theme-surface: ${surface_color} !important;
                --theme-text: ${text_color} !important;
                --theme-border: ${border_color} !important;
                --theme-font: ${font_family} !important;
            }
            
            /* Force high specificity for body styles */
            html body, body {
                background-color: ${background_color} !important;
                color: ${text_color} !important;
                font-family: ${font_family} !important;
                transition: all 0.3s ease !important;
            }
            
            /* Cards with high specificity */
            .card, div.card, .card-body {
                background-color: ${surface_color} !important;
                border: 1px solid ${border_color} !important;
                color: ${text_color} !important;
            }
            
            .card-header {
                background-color: ${background_color} !important;
                color: ${primary_color} !important;
                border-bottom: 1px solid ${border_color} !important;
            }
            
            /* Navigation with high specificity */
            .navbar, #menuBlock, nav.navbar {
                background-color: ${surface_color} !important;
                border: 1px solid ${border_color} !important;
            }
            
            .navbar-brand, .nav-link, .navbar .nav-link {
                color: ${text_color} !important;
            }
            
            .nav-link:hover, .navbar .nav-link:hover {
                color: ${primary_color} !important;
            }
            
            /* Buttons with high specificity */
            .btn-primary, button.btn-primary {
                background-color: ${primary_color} !important;
                border-color: ${primary_color} !important;
                color: #000 !important;
            }
            
            .btn-primary:hover, button.btn-primary:hover {
                background-color: ${primary_color} !important;
                border-color: ${primary_color} !important;
                opacity: 0.8 !important;
            }
            
            .btn-secondary, button.btn-secondary {
                background-color: ${secondary_color} !important;
                border-color: ${secondary_color} !important;
                color: #000 !important;
            }
            
            /* Forms with high specificity */
            .form-control, .form-select, input.form-control, select.form-select {
                background-color: ${surface_color} !important;
                border-color: ${border_color} !important;
                color: ${text_color} !important;
            }
            
            .form-control:focus, .form-select:focus, 
            input.form-control:focus, select.form-select:focus {
                background-color: ${surface_color} !important;
                border-color: ${primary_color} !important;
                color: ${text_color} !important;
                box-shadow: 0 0 0 0.2rem rgba(${this.hexToRgb(primary_color)}, 0.25) !important;
            }
            
            .form-label, label.form-label {
                color: ${text_color} !important;
            }
            
            /* Tables */
            .table, table.table {
                color: ${text_color} !important;
            }
            
            .table thead th, table.table thead th {
                border-color: ${border_color} !important;
                color: ${primary_color} !important;
            }
            
            .table tbody td, table.table tbody td {
                border-color: ${border_color} !important;
                color: ${text_color} !important;
            }
            
            /* Text colors */
            h1, h2, h3, h4, h5, h6 {
                color: ${text_color} !important;
            }
            
            p, span, div {
                color: ${text_color} !important;
            }
            
            /* Links */
            a {
                color: ${primary_color} !important;
            }
            
            a:hover {
                color: ${secondary_color} !important;
            }
            
            /* Custom CSS from theme settings */
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
                    console.log('[UnifiedTheme] Applied footer links:', footerLinks.length);
                }
            } catch (error) {
                console.error('[UnifiedTheme] Failed to parse footer_links JSON:', error);
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
                    console.log('[UnifiedTheme] Applied menu links:', menuLinks.length);
                }
            } catch (error) {
                console.error('[UnifiedTheme] Failed to parse menu_links JSON:', error);
            }
        }
    }

    forceRefresh() {
        console.log('[UnifiedTheme] Starting force refresh...');
        
        // Update CSS custom property to trigger recalculation
        document.documentElement.style.setProperty('--theme-refresh', Date.now().toString());
        
        // Force immediate reflow
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        // Force recalculation of CSS variables
        const computedStyle = getComputedStyle(document.documentElement);
        const primaryColor = computedStyle.getPropertyValue('--theme-primary');
        console.log('[UnifiedTheme] After refresh, --theme-primary:', primaryColor);
        
        // Trigger a repaint by changing a harmless property
        document.body.classList.add('theme-refreshing');
        requestAnimationFrame(() => {
            document.body.classList.remove('theme-refreshing');
            console.log('[UnifiedTheme] Force refresh completed');
        });
    }

    // Legacy compatibility methods
    async switchTheme(themeId) {
        console.log(`[UnifiedTheme] Switching to theme: ${themeId}`);
        
        try {
            const { apiClient } = await import('../api-client.js');
            
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
            console.error('[UnifiedTheme] Switch failed:', error);
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
        console.log(`[UnifiedTheme] Previewing theme: ${themeId}`);
        
        try {
            const { apiClient } = await import('../api-client.js');
            const result = await apiClient.get(`/themes/${themeId}`);
            
            if (result.success && result.data) {
                // Store original theme for restoration
                const originalTheme = this.currentTheme;
                
                // Apply preview using a separate style element (like theme editor)
                this.applyPreviewStyles(result.data);
                
                // Auto-restore after 10 seconds
                setTimeout(() => {
                    console.log('[UnifiedTheme] Auto-restoring original theme after preview');
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
            console.error('[UnifiedTheme] Preview failed:', error);
            return { success: false, message: error.message };
        }
    }

    applyPreviewStyles(themeData) {
        console.log('[UnifiedTheme] Applying preview styles for:', themeData.theme?.name);
        
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
        
        console.log('[UnifiedTheme] Preview styles applied');
        console.log('[UnifiedTheme] Preview CSS length:', css.length);
        console.log('[UnifiedTheme] Preview CSS first 200 chars:', css.substring(0, 200));
        
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
            console.log('[UnifiedTheme] Preview styles removed');
            
            // Force refresh after removal
            document.body.offsetHeight;
        }
    }

    // Public API methods
    async reloadTheme() {
        console.log('[UnifiedTheme] Reloading theme...');
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
