/**
 * Optimized Theme System - Lazy Loaded Version
 * Reduced bundle size with essential functionality only
 */

// Lazy load heavy dependencies
let apiClient = null;
let getThemeColors = null;

const loadDependencies = async () => {
    if (!apiClient) {
        const module = await import('../api-client.js');
        apiClient = module.apiClient;
    }
    if (!getThemeColors) {
        const module = await import('./theme-api.js');
        getThemeColors = module.getThemeColors;
    }
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
        font_family: "'Share Tech Mono', monospace"
    }
};

class OptimizedThemeSystem {
    constructor() {
        this.currentTheme = null;
        this.styleElement = null;
        this.loadPromise = null;
        this.init();
    }

    init() {
        this.loadTheme();
        document.addEventListener('themeChanged', () => {
            this.loadPromise = null;
            this.loadTheme();
        });
    }

    async loadTheme() {
        if (this.loadPromise) return this.loadPromise;
        this.loadPromise = this.loadThemeInternal();
        return this.loadPromise;
    }

    async loadThemeInternal() {
        try {
            await loadDependencies();
            const result = await apiClient.get('/cms/active-theme');
            
            if (result.success && result.data) {
                const themeResult = await apiClient.get(`/themes/${result.data.id}`);
                if (themeResult.success && themeResult.data) {
                    this.currentTheme = themeResult.data;
                    await this.applyTheme(themeResult.data);
                } else {
                    this.applyFallback();
                }
            } else {
                this.applyFallback();
            }
        } catch (error) {
            console.error('[ThemeSystem] Error:', error);
            this.applyFallback();
        } finally {
            this.loadPromise = null;
        }
    }

    async applyTheme(themeData) {
        let settings = themeData.settings;
        
        if (Array.isArray(settings)) {
            settings = settings.reduce((obj, setting) => {
                obj[setting.setting_key] = setting.setting_value;
                return obj;
            }, {});
        }
        
        if (settings && Object.keys(settings).length > 0) {
            this.injectCSS(settings);
            this.applyElements(settings);
        } else {
            this.applyFallback();
        }
    }

    applyFallback() {
        this.currentTheme = DEFAULT_THEME;
        this.injectCSS(DEFAULT_THEME.settings);
    }

    injectCSS(settings) {
        const css = this.generateCSS(settings);
        
        const existing = document.getElementById('optimized-theme-styles');
        if (existing) existing.remove();
        
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'optimized-theme-styles';
        this.styleElement.textContent = css;
        document.head.appendChild(this.styleElement);
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
            :root {
                --primary-color: ${primary_color};
                --secondary-color: ${secondary_color};
                --background-color: ${background_color};
                --surface-color: ${surface_color};
                --text-color: ${text_color};
                --border-color: ${border_color};
                --font-family: ${font_family};
            }
            
            body {
                background-color: var(--background-color);
                color: var(--text-color);
                font-family: var(--font-family);
            }
            
            .card, .btn, .form-control {
                background-color: var(--surface-color);
                border-color: var(--border-color);
                color: var(--text-color);
            }
            
            .btn-primary {
                background-color: var(--primary-color);
                border-color: var(--primary-color);
            }
            
            .btn-secondary {
                background-color: var(--secondary-color);
                border-color: var(--secondary-color);
            }
            
            ${custom_css}
        `;
    }

    applyElements(settings) {
        // Apply theme to specific elements
        const elements = document.querySelectorAll('[data-theme-element]');
        elements.forEach(el => {
            const elementType = el.getAttribute('data-theme-element');
            if (elementType === 'background') {
                el.style.backgroundColor = settings.background_color;
            } else if (elementType === 'text') {
                el.style.color = settings.text_color;
            }
        });
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Export singleton instance
export const optimizedThemeSystem = new OptimizedThemeSystem(); 