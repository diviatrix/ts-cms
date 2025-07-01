/**
 * Theme Application System
 * Handles dynamic theme loading and CSS variable injection
 */

import { apiClient } from './api-client.js';

export class ThemeManager {
    constructor() {
        this.currentTheme = null;
        this.themeStyleElement = null;
        this.fallbackTheme = this.getDefaultFallbackTheme();
        this.loadAttempts = 0;
        this.maxLoadAttempts = 3;
        this.retryDelay = 1000; // 1 second
        this.init();
    }

    async init() {
        // Load the active theme on page load
        await this.loadActiveTheme();
        
        // Listen for theme changes
        document.addEventListener('themeChanged', () => {
            this.loadActiveTheme();
        });

        // Listen for dynamic content loading
        document.addEventListener('dynamicContentLoaded', (event) => {
            console.log('Re-applying theme to dynamic content:', event.detail);
            this.reapplyThemeToElement(event.detail.element);
        });
    }

    async loadActiveTheme() {
        this.loadAttempts++;
        console.log(`[ThemeManager] Theme loading attempt ${this.loadAttempts}/${this.maxLoadAttempts}`);
        
        try {
            console.log('[ThemeManager] Fetching active theme from API...');
            const result = await apiClient.get('/themes/active');
            
            if (result.success && result.data) {
                console.log('[ThemeManager] Active theme fetched successfully:', result.data.theme?.name);
                await this.applyTheme(result.data);
                this.loadAttempts = 0; // Reset on success
                console.log('[ThemeManager] Theme application completed successfully');
            } else {
                console.warn('[ThemeManager] API returned unsuccessful result:', result);
                throw new Error(`API returned unsuccessful result: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`[ThemeManager] Theme loading failed (attempt ${this.loadAttempts}):`, error);
            
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`[ThemeManager] Retrying in ${this.retryDelay}ms...`);
                setTimeout(() => this.loadActiveTheme(), this.retryDelay);
                this.retryDelay *= 1.5; // Exponential backoff
            } else {
                console.warn('[ThemeManager] Max retry attempts reached, applying fallback theme');
                await this.applyFallbackTheme();
            }
        }
    }

    async applyTheme(theme) {
        console.log('[ThemeManager] Starting theme application:', theme.theme?.name || 'Unknown');
        this.currentTheme = theme;
        
        // Load theme settings
        try {
            let settings;
            if (theme.settings) {
                // Settings already provided (e.g., from active theme API)
                settings = { success: true, data: theme.settings };
                console.log('[ThemeManager] Using provided theme settings');
            } else {
                // Fetch settings separately
                console.log('[ThemeManager] Fetching theme settings from API...');
                settings = await apiClient.get(`/themes/${theme.theme.id}/settings`);
            }
            
            if (settings.success) {
                console.log('[ThemeManager] Theme settings loaded, applying styles...');
                this.injectThemeCSS(settings.data);
                
                console.log('[ThemeManager] Applying theme components...');
                this.applyFavicon(settings.data.favicon_url);
                this.applyLogo(settings.data.logo_url);
                this.applyFooter(settings.data.footer_text, settings.data.footer_links);
                this.applyMenuLinks(settings.data.menu_links);
                
                console.log('[ThemeManager] Theme application completed successfully');
            } else {
                throw new Error(`Failed to load theme settings: ${settings.message}`);
            }
        } catch (error) {
            console.error('[ThemeManager] Error during theme application:', error);
            throw error; // Re-throw to trigger fallback mechanism
        }
    }

    injectThemeCSS(settings) {
        console.log('[ThemeManager] Injecting theme CSS...');
        
        // Remove existing theme styles
        if (this.themeStyleElement) {
            this.themeStyleElement.remove();
            console.log('[ThemeManager] Removed existing theme styles');
        }

        // Create new style element
        this.themeStyleElement = document.createElement('style');
        this.themeStyleElement.id = 'dynamic-theme-styles';
        
        // Generate CSS from settings
        console.log('[ThemeManager] Generating CSS from theme settings...');
        const css = this.generateThemeCSS(settings);
        this.themeStyleElement.textContent = css;
        
        // Inject into document head
        document.head.appendChild(this.themeStyleElement);
        console.log('[ThemeManager] Theme CSS injected into document head');
        
        // Load Google Fonts if specified
        this.loadGoogleFonts(settings.font_family);
    }

    generateThemeCSS(settings) {
        const {
            primary_color = '#00FF00',           // Neon green (default from existing theme)
            secondary_color = '#FFD700',         // Warm yellow
            background_color = '#222222',        // Dark grey (main background)
            surface_color = '#444444',           // Grey (cards, surfaces)
            text_color = '#E0E0E0',             // Light grey (primary text)
            text_secondary = '#C0C0C0',          // Medium grey (secondary text)
            text_muted = '#A0A0A0',             // Darker grey (muted text)
            border_color = '#00FF00',           // Neon green (borders)
            font_family = "'Share Tech Mono', monospace",
            custom_css = ''
        } = settings;

        return `
            :root {
                /* Bootstrap override variables */
                --bs-primary: ${primary_color};
                --bs-primary-rgb: ${this.hexToRgb(primary_color)};
                --bs-secondary: ${secondary_color};
                --bs-secondary-rgb: ${this.hexToRgb(secondary_color)};
                --bs-body-bg: ${background_color};
                --bs-body-bg-rgb: ${this.hexToRgb(background_color)};
                --bs-body-color: ${text_color};
                --bs-body-color-rgb: ${this.hexToRgb(text_color)};
                --bs-font-sans-serif: ${font_family};
                
                /* Theme-specific variables (matching existing CSS) */
                --theme-primary: ${primary_color};
                --theme-secondary: ${secondary_color};
                --theme-background: ${background_color};
                --theme-surface: ${surface_color};
                --theme-text: ${text_color};
                --theme-text-secondary: ${text_secondary};
                --theme-text-muted: ${text_muted};
                --theme-border: ${border_color};
                --theme-font: ${font_family};
                
                /* Legacy variables for existing styles */
                --dark-grey: ${background_color};
                --grey: ${surface_color};
                --warm-yellow: ${secondary_color};
                --neon-green: ${primary_color};
            }
            
            /* Global body styling */
            body {
                background-color: var(--theme-background) !important;
                color: var(--theme-text) !important;
                font-family: var(--theme-font) !important;
            }
            
            /* Card styling to match existing theme */
            .card {
                background-color: var(--theme-surface) !important;
                border: 1px solid var(--theme-border) !important;
                box-shadow: 0 0 10px rgba(${this.hexToRgb(primary_color)}, 0.5) !important;
                color: var(--theme-text) !important;
            }
            
            .card-header {
                background-color: var(--theme-background) !important;
                color: var(--theme-primary) !important;
                border-bottom: 1px solid var(--theme-border) !important;
            }
            
            .card-title {
                color: var(--theme-primary) !important;
            }
            
            .card-text {
                color: var(--theme-text-secondary) !important;
            }
            
            .card-footer {
                background-color: var(--theme-background) !important;
                border-top: 1px solid var(--theme-border) !important;
                color: var(--theme-secondary) !important;
            }
            
            /* Navigation styling */
            #menuBlock {
                background-color: var(--theme-surface) !important;
                border: 1px solid var(--theme-border) !important;
                box-shadow: 0 0 10px rgba(${this.hexToRgb(primary_color)}, 0.5) !important;
            }
            
            .navbar {
                background-color: var(--theme-surface) !important;
            }
            
            .navbar-brand, .nav-link {
                color: var(--theme-text) !important;
            }
            
            .nav-link:hover {
                color: var(--theme-primary) !important;
            }
            
            /* Bootstrap component overrides */
            .btn-primary {
                --bs-btn-bg: var(--theme-primary);
                --bs-btn-border-color: var(--theme-primary);
                --bs-btn-hover-bg: ${this.darkenColor(primary_color, 10)};
                --bs-btn-hover-border-color: ${this.darkenColor(primary_color, 10)};
                --bs-btn-active-bg: ${this.darkenColor(primary_color, 20)};
                --bs-btn-active-border-color: ${this.darkenColor(primary_color, 20)};
            }
            
            .btn-secondary {
                --bs-btn-bg: var(--theme-secondary);
                --bs-btn-border-color: var(--theme-secondary);
                --bs-btn-hover-bg: ${this.darkenColor(secondary_color, 10)};
                --bs-btn-hover-border-color: ${this.darkenColor(secondary_color, 10)};
                --bs-btn-active-bg: ${this.darkenColor(secondary_color, 20)};
                --bs-btn-active-border-color: ${this.darkenColor(secondary_color, 20)};
            }
            
            /* Tab styling */
            .nav-tabs .nav-link.active {
                background-color: var(--theme-background);
                border-color: var(--theme-primary) var(--theme-primary) var(--theme-background);
                color: var(--theme-primary);
            }
            
            .nav-tabs .nav-link:hover {
                border-color: var(--theme-primary);
                color: var(--theme-primary);
            }
            
            /* Form styling */
            .form-control {
                background-color: var(--theme-surface);
                border-color: var(--theme-border);
                color: var(--theme-text);
            }
            
            .form-control:focus {
                background-color: var(--theme-surface);
                border-color: var(--theme-primary);
                box-shadow: 0 0 0 0.2rem rgba(${this.hexToRgb(primary_color)}, 0.25);
                color: var(--theme-text);
            }
            
            .form-control::placeholder {
                color: var(--theme-text-muted);
            }
            
            .form-select {
                background-color: var(--theme-surface);
                border-color: var(--theme-border);
                color: var(--theme-text);
            }
            
            .form-label {
                color: var(--theme-text);
            }
            
            /* List styling */
            .list-group-item {
                background-color: var(--theme-surface);
                border-color: var(--theme-border);
                color: var(--theme-text);
            }
            
            .list-group-item:hover {
                background-color: ${this.lightenColor(surface_color, 10)};
            }
            
            /* Table styling */
            .table {
                color: var(--theme-text);
            }
            
            .table th {
                border-color: var(--theme-border);
                color: var(--theme-primary);
            }
            
            .table td {
                border-color: var(--theme-border);
            }
            
            /* Modal styling */
            .modal-content {
                background-color: var(--theme-surface);
                color: var(--theme-text);
            }
            
            .modal-header {
                border-bottom-color: var(--theme-border);
            }
            
            .modal-footer {
                border-top-color: var(--theme-border);
            }
            
            /* Footer styling */
            .footer {
                background-color: var(--theme-surface) !important;
                border-top: 1px solid var(--theme-border) !important;
                color: var(--theme-text-secondary) !important;
            }
            
            .footer a {
                color: var(--theme-primary) !important;
            }
            
            .footer a:hover {
                color: var(--theme-secondary) !important;
            }
            
            /* Alert styling */
            .alert {
                background-color: var(--theme-surface);
                border-color: var(--theme-border);
                color: var(--theme-text);
            }
            
            /* Badge styling */
            .badge.bg-success {
                background-color: var(--theme-primary) !important;
            }
            
            .badge.bg-secondary {
                background-color: var(--theme-secondary) !important;
            }
            
            /* Text utilities */
            .text-muted {
                color: var(--theme-text-muted) !important;
            }
            
            /* Custom CSS from theme settings */
            ${custom_css}
        `;
    }

    loadGoogleFonts(fontFamily) {
        if (!fontFamily || !fontFamily.includes('Google Font')) {
            console.log('[ThemeManager] No Google Fonts to load');
            return;
        }
        
        console.log('[ThemeManager] Loading Google Font:', fontFamily);
        
        // Extract font name from selections like "'Roboto', sans-serif"
        const fontName = fontFamily.match(/'([^']+)'/);
        if (!fontName) {
            console.warn('[ThemeManager] Could not extract font name from:', fontFamily);
            return;
        }
        
        const fontId = `google-font-${fontName[1].toLowerCase().replace(/\s+/g, '-')}`;
        
        // Check if font is already loaded
        if (document.getElementById(fontId)) {
            console.log('[ThemeManager] Google Font already loaded:', fontName[1]);
            return;
        }
        
        // Create and inject Google Fonts link
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName[1].replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
        console.log('[ThemeManager] Google Font loaded:', fontName[1]);
    }

    applyFavicon(faviconUrl) {
        if (!faviconUrl) return;
        
        // Remove existing favicon
        const existingFavicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        if (existingFavicon) {
            existingFavicon.remove();
        }
        
        // Add new favicon
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/x-icon';
        favicon.href = faviconUrl;
        document.head.appendChild(favicon);
    }

    applyLogo(logoUrl) {
        if (!logoUrl) return;
        
        // Find logo elements and update them
        const logoElements = document.querySelectorAll('.navbar-brand img, .logo-img, [data-theme-logo]');
        logoElements.forEach(img => {
            img.src = logoUrl;
            img.alt = 'Site Logo';
        });
        
        // If no logo elements exist, create one in the navigation
        if (logoElements.length === 0) {
            const navBrand = document.querySelector('.navbar-brand');
            if (navBrand) {
                const logoImg = document.createElement('img');
                logoImg.src = logoUrl;
                logoImg.alt = 'Site Logo';
                logoImg.className = 'logo-img me-2';
                logoImg.style.height = '32px';
                logoImg.setAttribute('data-theme-logo', 'true');
                navBrand.prepend(logoImg);
            }
        }
    }

    applyFooter(footerText, footerLinksJson) {
        // Find or create footer element
        let footer = document.querySelector('footer, .footer, [data-theme-footer]');
        
        if (!footer) {
            // Create footer if it doesn't exist
            footer = document.createElement('footer');
            footer.className = 'footer mt-auto py-3 bg-light';
            footer.setAttribute('data-theme-footer', 'true');
            document.body.appendChild(footer);
        }

        // Clear existing content
        footer.innerHTML = '';

        // Create footer container
        const container = document.createElement('div');
        container.className = 'container text-center';

        // Add footer text
        if (footerText) {
            const textElement = document.createElement('p');
            textElement.className = 'mb-2';
            textElement.textContent = footerText;
            container.appendChild(textElement);
        }

        // Add footer links
        if (footerLinksJson) {
            try {
                const footerLinks = JSON.parse(footerLinksJson);
                if (Array.isArray(footerLinks) && footerLinks.length > 0) {
                    const linksContainer = document.createElement('div');
                    linksContainer.className = 'footer-links';

                    footerLinks.forEach((link, index) => {
                        const linkElement = document.createElement('a');
                        linkElement.href = link.url;
                        linkElement.textContent = link.text;
                        linkElement.className = 'text-decoration-none me-3';
                        
                        if (link.external) {
                            linkElement.target = '_blank';
                            linkElement.rel = 'noopener noreferrer';
                        }

                        linksContainer.appendChild(linkElement);
                    });

                    container.appendChild(linksContainer);
                }
            } catch (error) {
                console.warn('Invalid footer links JSON:', error);
            }
        }

        footer.appendChild(container);
    }

    applyMenuLinks(menuLinksJson) {
        if (!menuLinksJson) return;

        try {
            const menuLinks = JSON.parse(menuLinksJson);
            if (!Array.isArray(menuLinks) || menuLinks.length === 0) return;

            // Find navigation menu container
            const navMenu = document.querySelector('.navbar-nav, .nav, [data-theme-menu]');
            if (!navMenu) return;

            // Remove existing custom menu items
            const existingCustomItems = navMenu.querySelectorAll('[data-theme-menu-item]');
            existingCustomItems.forEach(item => item.remove());

            // Add new custom menu items
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

                // Handle role-based visibility
                if (link.roles && Array.isArray(link.roles)) {
                    linkElement.setAttribute('data-required-roles', link.roles.join(','));
                    // Check if user has required roles (simplified check)
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            const userRoles = payload.roles || [];
                            const hasRequiredRole = link.roles.some(role => userRoles.includes(role));
                            if (!hasRequiredRole) {
                                listItem.style.display = 'none';
                            }
                        } catch (e) {
                            console.warn('Error parsing token for role check:', e);
                        }
                    } else {
                        listItem.style.display = 'none';
                    }
                }

                listItem.appendChild(linkElement);
                navMenu.appendChild(listItem);
            });
        } catch (error) {
            console.warn('Invalid menu links JSON:', error);
        }
    }

    reapplyThemeToElement(element) {
        if (!element || !this.currentTheme) return;

        // Force refresh of theme styles on the specific element
        // This ensures dynamically loaded content gets proper styling
        const themeClasses = [
            'navbar', 'nav-link', 'navbar-brand', 'btn', 'card',
            'form-control', 'list-group-item', 'modal-content'
        ];

        themeClasses.forEach(className => {
            const elements = element.querySelectorAll(`.${className}`);
            elements.forEach(el => {
                // Trigger a style recalculation by briefly removing and re-adding a class
                el.classList.add('theme-refresh');
                setTimeout(() => el.classList.remove('theme-refresh'), 10);
            });
        });

        console.log('Theme styles reapplied to dynamic element');
    }

    async applyFallbackTheme() {
        console.log('[ThemeManager] Applying fallback theme');
        try {
            await this.applyTheme(this.fallbackTheme);
            console.log('[ThemeManager] Fallback theme applied successfully');
            
            // Dispatch fallback event for monitoring
            document.dispatchEvent(new CustomEvent('themeFallbackApplied', {
                detail: { reason: 'max_retries_exceeded' }
            }));
        } catch (error) {
            console.error('[ThemeManager] CRITICAL: Fallback theme application failed:', error);
            // Last resort - apply minimal CSS
            this.applyEmergencyStyles();
        }
    }

    applyEmergencyStyles() {
        console.log('[ThemeManager] Applying emergency styles');
        const emergencyCSS = `
            body { 
                background: #ffffff !important; 
                color: #000000 !important; 
                font-family: system-ui, sans-serif !important; 
            }
            .card { 
                border: 1px solid #ccc !important; 
                background: #f9f9f9 !important; 
            }
            .btn-primary { 
                background: #007bff !important; 
                border-color: #007bff !important; 
            }
        `;
        
        const emergencyStyle = document.createElement('style');
        emergencyStyle.id = 'emergency-theme-styles';
        emergencyStyle.textContent = emergencyCSS;
        document.head.appendChild(emergencyStyle);
        
        console.log('[ThemeManager] Emergency styles applied');
    }

    // Color utility functions
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '0, 0, 0';
    }

    hexToRgba(hex, alpha) {
        const rgb = this.hexToRgb(hex);
        return `rgba(${rgb}, ${alpha})`;
    }

    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    lightenColor(hex, percent) {
        return this.adjustBrightness(hex, percent);
    }

    // Public methods for theme switching
    async switchTheme(themeId) {
        console.log('[ThemeManager] Switching to theme:', themeId);
        try {
            const result = await apiClient.post('/themes/active', { theme_id: themeId });
            if (result.success) {
                console.log('[ThemeManager] Theme switch API call successful');
                await this.loadActiveTheme();
                // Dispatch theme change event
                document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeId } }));
                console.log('[ThemeManager] Theme switch completed successfully');
                return true;
            } else {
                console.error('[ThemeManager] Theme switch API call failed:', result.message);
                return false;
            }
        } catch (error) {
            console.error('[ThemeManager] Error switching theme:', error);
            return false;
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getDefaultFallbackTheme() {
        return {
            theme: {
                id: 'fallback',
                name: 'System Fallback Theme'
            },
            settings: {
                primary_color: '#007bff',
                secondary_color: '#6c757d', 
                background_color: '#ffffff',
                surface_color: '#f8f9fa',
                text_color: '#212529',
                text_secondary: '#6c757d',
                text_muted: '#adb5bd',
                border_color: '#dee2e6',
                font_family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                custom_css: ''
            }
        };
    }
}

// Create global instance
const themeManager = new ThemeManager();

// Export for use in other modules
export { themeManager };
export default themeManager;
