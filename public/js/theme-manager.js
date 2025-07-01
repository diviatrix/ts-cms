/**
 * Theme Application System
 * Handles dynamic theme loading and CSS variable injection
 */

import { apiClient } from './api-client.js';

export class ThemeManager {
    constructor() {
        this.currentTheme = null;
        this.themeStyleElement = null;
        this.init();
    }

    async init() {
        // Load the active theme on page load
        await this.loadActiveTheme();
        
        // Listen for theme changes
        document.addEventListener('themeChanged', () => {
            this.loadActiveTheme();
        });
    }

    async loadActiveTheme() {
        try {
            const result = await apiClient.get('/themes/active');
            if (result.success && result.data) {
                await this.applyTheme(result.data);
            }
        } catch (error) {
            console.warn('Failed to load active theme:', error);
        }
    }

    async applyTheme(theme) {
        this.currentTheme = theme;
        
        // Load theme settings
        try {
            const settings = await apiClient.get(`/themes/${theme.id}/settings`);
            if (settings.success) {
                this.injectThemeCSS(settings.data);
                this.applyFavicon(settings.data.favicon_url);
                this.applyLogo(settings.data.logo_url);
                this.applyFooter(settings.data.footer_text, settings.data.footer_links);
                this.applyMenuLinks(settings.data.menu_links);
            }
        } catch (error) {
            console.error('Error loading theme settings:', error);
        }
    }

    injectThemeCSS(settings) {
        // Remove existing theme styles
        if (this.themeStyleElement) {
            this.themeStyleElement.remove();
        }

        // Create new style element
        this.themeStyleElement = document.createElement('style');
        this.themeStyleElement.id = 'dynamic-theme-styles';
        
        // Generate CSS from settings
        const css = this.generateThemeCSS(settings);
        this.themeStyleElement.textContent = css;
        
        // Inject into document head
        document.head.appendChild(this.themeStyleElement);
        
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
        if (!fontFamily || !fontFamily.includes('Google Font')) return;
        
        // Extract font name from selections like "'Roboto', sans-serif"
        const fontName = fontFamily.match(/'([^']+)'/);
        if (!fontName) return;
        
        const fontId = `google-font-${fontName[1].toLowerCase().replace(/\s+/g, '-')}`;
        
        // Check if font is already loaded
        if (document.getElementById(fontId)) return;
        
        // Create and inject Google Fonts link
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName[1].replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
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
        try {
            const result = await apiClient.post('/themes/active', { theme_id: themeId });
            if (result.success) {
                await this.loadActiveTheme();
                // Dispatch theme change event
                document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeId } }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error switching theme:', error);
            return false;
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Create global instance
const themeManager = new ThemeManager();

// Export for use in other modules
export { themeManager };
export default themeManager;
