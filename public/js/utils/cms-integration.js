/**
 * CMS Integration Utility
 * Handles integration of CMS settings (site name, description) across frontend pages
 */

const SETTINGS_JSON_URL = '/cms-settings.json';

class CMSIntegration {
    constructor() {
        this.settings = {};
        this.isInitialized = false;
    }

    /**
     * Initialize CMS integration by loading settings
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadSettings();
            this.applySettings();
            this.isInitialized = true;
        } catch (error) {
            console.warn('Failed to load CMS settings:', error);
            messages.showError('Error: ' + (error?.message || error?.toString()));
        }
    }

    /**
     * Load CMS settings from static JSON file
     */
    async loadSettings() {
        try {
            const response = await fetch(SETTINGS_JSON_URL, { cache: 'reload' });
            if (!response.ok) throw new Error('Failed to fetch cms-settings.json');
            this.settings = await response.json() || {};
        } catch (error) {
            this.settings = {};
            console.warn('Error loading CMS settings from JSON:', error);
            messages.showError('Error: ' + (error?.message || error?.toString()));
        }
    }

    /**
     * Apply CMS settings to the current page
     */
    applySettings() {
        const { site_name, site_description } = this.settings;
        // Title
        if (site_name) {
            const pageName = this.getPageName();
            document.title = pageName && pageName !== site_name ? `${pageName} - ${site_name}` : site_name;
        }
        // Meta tags
        if (site_description) {
            this.setMeta('description', site_description);
            this.setMeta('og:description', site_description, 'property');
        }
        if (site_name) this.setMeta('og:title', site_name, 'property');
        // Navbar/brand
        const logo = document.querySelector('.navbar-brand .logo');
        if (logo && site_name) logo.textContent = site_name;
        // Footer
        const footer = document.querySelector('footer p.mb-0');
        if (footer && site_name) {
            footer.innerHTML = `&copy; ${new Date().getFullYear()} ${site_name}. All rights reserved.`;
        }
        // Welcome message
        if (site_description) {
            document.querySelectorAll('h1, h2, h3').forEach(el => {
                if (el.textContent.includes('Welcome to the Frontpage')) el.textContent = site_description;
            });
        }
    }

    setMeta(name, content, attr = 'name') {
        let meta = document.querySelector(`meta[${attr}="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attr, name);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    /**
     * Get the current page name for title formatting
     */
    getPageName() {
        const path = window.location.pathname;
        const pageNames = {
            '/': 'Home',
            '/login': 'Login',
            '/admin': 'Admin Panel',
            '/profile': 'Profile',
            '/record': 'Records',
            '/password': 'Password',
            '/nav': 'Navigation'
        };
        return pageNames[path] || document.title.replace(/\s*-\s*Admin\s*Panel\s*$/, '').replace(/\s*-\s*TypeScript\s*CMS\s*$/, '').trim();
    }

    /**
     * Refresh settings (useful when settings are updated)
     */
    async refresh() {
        this.isInitialized = false;
        await this.init();
    }
}

// Create singleton instance
export const cmsIntegration = new CMSIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => cmsIntegration.init());
} else {
    cmsIntegration.init();
}

// Listen for navigation loaded event
document.addEventListener('navigationLoaded', () => cmsIntegration.applySettings()); 