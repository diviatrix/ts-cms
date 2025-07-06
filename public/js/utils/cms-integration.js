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
        }
    }

    /**
     * Load CMS settings from static JSON file
     */
    async loadSettings() {
        try {
            const response = await fetch(SETTINGS_JSON_URL, { cache: 'reload' });
            if (!response.ok) throw new Error('Failed to fetch cms-settings.json');
            const data = await response.json();
            this.settings = data || {};
        } catch (error) {
            this.settings = {};
            console.warn('Error loading CMS settings from JSON:', error);
        }
    }

    /**
     * Apply CMS settings to the current page
     */
    applySettings() {
        this.updatePageTitle();
        this.updateMetaTags();
        this.updateNavigation();
        this.updatePageContent();
    }

    /**
     * Apply settings after navigation is loaded
     */
    applySettingsAfterNavigation() {
        this.updateNavigation();
        this.updatePageContent();
    }

    /**
     * Update page title with site name
     */
    updatePageTitle() {
        const siteName = this.settings.site_name;
        if (!siteName) return;

        const currentTitle = document.title;
        const pageName = this.getPageName();
        
        // Update title format: "Page Name - Site Name"
        if (pageName && pageName !== siteName) {
            document.title = `${pageName} - ${siteName}`;
        } else {
            document.title = siteName;
        }
    }

    /**
     * Update meta tags with site description
     */
    updateMetaTags() {
        const siteDescription = this.settings.site_description;
        if (!siteDescription) return;

        // Update or create meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = siteDescription;

        // Update or create Open Graph description
        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription) {
            ogDescription = document.createElement('meta');
            ogDescription.setAttribute('property', 'og:description');
            document.head.appendChild(ogDescription);
        }
        ogDescription.content = siteDescription;

        // Update or create Open Graph title
        const siteName = this.settings.site_name;
        if (siteName) {
            let ogTitle = document.querySelector('meta[property="og:title"]');
            if (!ogTitle) {
                ogTitle = document.createElement('meta');
                ogTitle.setAttribute('property', 'og:title');
                document.head.appendChild(ogTitle);
            }
            ogTitle.content = siteName;
        }
    }

    /**
     * Update navigation with site name
     */
    updateNavigation() {
        const siteName = this.settings.site_name;
        if (!siteName) return;

        // Update navbar brand
        const navbarBrand = document.querySelector('.navbar-brand .logo');
        if (navbarBrand) {
            navbarBrand.textContent = siteName;
        }

        // Update footer copyright
        const footerCopyright = document.querySelector('footer p.mb-0');
        if (footerCopyright) {
            const currentYear = new Date().getFullYear();
            footerCopyright.innerHTML = `&copy; ${currentYear} ${siteName}. All rights reserved.`;
        }
    }

    /**
     * Update page content with site description
     */
    updatePageContent() {
        const siteDescription = this.settings.site_description;
        if (!siteDescription) return;

        // Update frontpage welcome message
        const welcomeHeading = document.querySelector('h1.mt-4');
        if (welcomeHeading && welcomeHeading.textContent.includes('Welcome to the Frontpage')) {
            welcomeHeading.textContent = siteDescription;
        }

        // Update other potential welcome messages
        const welcomeElements = document.querySelectorAll('h1, h2, h3');
        welcomeElements.forEach(element => {
            if (element.textContent.includes('Welcome to the Frontpage')) {
                element.textContent = siteDescription;
            }
        });
    }

    /**
     * Get the current page name for title formatting
     */
    getPageName() {
        const path = window.location.pathname;
        
        // Map paths to page names
        const pageNames = {
            '/': 'Home',
            '/login': 'Login',
            '/admin': 'Admin Panel',
            '/profile': 'Profile',
            '/record': 'Records',
            '/password': 'Password',
            '/nav': 'Navigation'
        };

        return pageNames[path] || this.getPageNameFromTitle();
    }

    /**
     * Extract page name from current document title
     */
    getPageNameFromTitle() {
        const currentTitle = document.title;
        if (!currentTitle) return '';

        // Remove common suffixes
        return currentTitle
            .replace(/\s*-\s*Admin\s*Panel\s*$/, '')
            .replace(/\s*-\s*TypeScript\s*CMS\s*$/, '')
            .trim();
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
document.addEventListener('navigationLoaded', () => {
    cmsIntegration.applySettingsAfterNavigation();
}); 