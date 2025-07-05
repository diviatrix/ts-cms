/**
 * Theme Management Module for Admin Panel
 */

import { apiClient } from '/js/api-client.js';
import { MessageDisplay, ErrorHandler, messages } from '/js/ui-utils.js';
import { getThemeColors } from '/js/utils/theme-api.js';

export class ThemeManagement {
    constructor() {
        this.apiClient = apiClient;
        this.messageDisplay = new MessageDisplay();
        this.currentTheme = null;
        this.themes = [];
        
        this.init();
    }

    /**
     * Get themed card styles using theme API
     */
    getThemedCardStyles() {
        const colors = getThemeColors();
        return `border-radius: 10px; margin-bottom: 1em; padding: 1em; background: ${colors.surfaceColor}; color: ${colors.textColor}; border: 1px solid ${colors.borderColor}; min-height: 3.5em;`;
    }

    /**
     * Get themed secondary text styles using theme API
     */
    getThemedSecondaryStyles() {
        const colors = getThemeColors();
        return `color: ${colors.secondaryColor}; font-size: 0.9em;`;
    }

    init() {
        this.bindEvents();
        // Don't load themes immediately - wait for tab activation
    }

    bindEvents() {
        // New theme button
        document.getElementById('newThemeButton')?.addEventListener('click', () => {
            this.showNewThemeForm();
        });

        // Save theme button
        document.getElementById('themeSaveButton')?.addEventListener('click', () => {
            this.saveTheme();
        });

        // Delete theme button
        document.getElementById('themeDeleteButton')?.addEventListener('click', () => {
            this.deleteTheme();
        });

        // Preview theme button
        document.getElementById('themePreviewButton')?.addEventListener('click', () => {
            this.previewTheme();
        });

        // Active theme checkbox
        document.getElementById('themeIsActive')?.addEventListener('change', (e) => {
            if (e.target.checked && this.currentTheme) {
                this.setActiveTheme(this.currentTheme.id);
            }
        });
    }

    async loadThemes() {
        try {
            const result = await this.apiClient.get('/themes');
            if (result.success) {
                this.themes = result.data;
                this.renderThemeList();
            } else {
                messages.error('Failed to load themes: ' + result.message, { toast: true });
            }
        } catch (error) {
            messages.error('Error loading themes: ' + error.message, { toast: true });
        }
    }

    renderThemeList() {
        const themeList = document.getElementById('themeList');
        if (!themeList) return;
        themeList.innerHTML = '';
        this.themes.forEach(theme => {
            const card = document.createElement('div');
            card.className = 'admin-card themed';
            card.style = this.getThemedCardStyles();
            card.innerHTML = `
                <div class="admin-card-title" style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em; cursor: pointer;">
                    ${theme.name}
                </div>
                <div class="admin-card-meta" style="display: flex; align-items: center; gap: 1em;">
                    <span class="theme-id" style="${this.getThemedSecondaryStyles()}">ID: ${theme.id}</span>
                    <span class="badge ${theme.is_active ? 'bg-success' : 'bg-secondary'}">${theme.is_active ? 'Active' : 'Inactive'}</span>
                    <span style="flex: 1"></span>
                    <button class="icon-btn edit-theme-btn btn btn-sm btn-primary" data-theme-id="${theme.id}" title="Edit">✏️</button>
                    <button class="icon-btn delete-theme-btn btn btn-sm btn-secondary" data-theme-id="${theme.id}" title="Delete">🗑️</button>
                </div>
            `;
            themeList.appendChild(card);
        });
        this.setupThemeActions();
    }

    setupThemeActions() {
        document.querySelectorAll('.edit-theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const themeId = btn.getAttribute('data-theme-id');
                const theme = this.themes.find(t => t.id === themeId);
                if (theme) this.editTheme(theme);
            });
        });
        // Double-click-to-confirm delete logic
        let confirmingBtn = null;
        document.querySelectorAll('.delete-theme-btn').forEach(btn => {
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-secondary');
            btn.setAttribute('title', 'Click again to confirm deletion');
            btn.dataset.confirming = 'false';
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                document.querySelectorAll('.delete-theme-btn').forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.classList.remove('btn-danger');
                        otherBtn.classList.add('btn-secondary');
                        otherBtn.setAttribute('title', 'Click again to confirm deletion');
                        otherBtn.dataset.confirming = 'false';
                    }
                });
                if (btn.dataset.confirming === 'true') {
                    btn.classList.remove('btn-danger');
                    btn.classList.add('btn-secondary');
                    btn.setAttribute('title', 'Click again to confirm deletion');
                    btn.dataset.confirming = 'false';
                    const themeId = btn.getAttribute('data-theme-id');
                    this.deleteThemeById(themeId);
                } else {
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-danger');
                    btn.setAttribute('title', 'Click again to permanently delete');
                    btn.dataset.confirming = 'true';
                    confirmingBtn = btn;
                }
            });
        });
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-theme-btn')) {
                document.querySelectorAll('.delete-theme-btn').forEach(btn => {
                    btn.classList.remove('btn-danger');
                    btn.classList.add('btn-secondary');
                    btn.setAttribute('title', 'Click again to confirm deletion');
                    btn.dataset.confirming = 'false';
                });
            }
        });
    }

    deleteThemeById(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        if (!theme) return;
        this.currentTheme = theme;
        this.deleteTheme();
    }

    showNewThemeForm() {
        this.currentTheme = null;
        this.clearThemeForm();
        this.showThemeForm();
    }

    editTheme(theme) {
        this.currentTheme = theme;
        this.populateThemeForm(theme);
        this.showThemeForm();
    }

    showThemeForm() {
        const editTab = document.getElementById('themeEditTab');
        if (editTab) {
            editTab.classList.remove('d-none');
        }
    }

    hideThemeForm() {
        const editTab = document.getElementById('themeEditTab');
        if (editTab) {
            editTab.classList.add('d-none');
        }
    }

    clearThemeForm() {
        document.getElementById('themeName').value = '';
        document.getElementById('themeDescription').value = '';
        document.getElementById('themeIsActive').checked = false;
        
        // Reset color fields to dark theme defaults
        document.getElementById('primaryColor').value = '#00FF00';
        document.getElementById('secondaryColor').value = '#FFD700';
        document.getElementById('backgroundColor').value = '#222222';
        document.getElementById('surfaceColor').value = '#444444';
        document.getElementById('textColor').value = '#E0E0E0';
        document.getElementById('textSecondary').value = '#C0C0C0';
        document.getElementById('textMuted').value = '#A0A0A0';
        document.getElementById('borderColor').value = '#00FF00';
        document.getElementById('fontFamily').value = "'Share Tech Mono', monospace";
        document.getElementById('faviconUrl').value = '';
        document.getElementById('logoUrl').value = '';
        document.getElementById('footerText').value = '';
        document.getElementById('footerLinks').value = '';
        document.getElementById('menuLinks').value = '';
        document.getElementById('customCss').value = '';
    }

    async populateThemeForm(theme) {
        if (!theme || !theme.id) {
            console.error('Cannot populate theme form: invalid theme object', theme);
            return;
        }
        
        document.getElementById('themeName').value = theme.name;
        document.getElementById('themeDescription').value = theme.description || '';
        document.getElementById('themeIsActive').checked = theme.is_active;

        // Load theme settings
        try {
            const settings = await this.apiClient.get(`/themes/${theme.id}/settings`);
            if (settings.success) {
                const settingsData = settings.data;
                
                // Populate color fields with dark theme defaults
                document.getElementById('primaryColor').value = settingsData.primary_color || '#00FF00';
                document.getElementById('secondaryColor').value = settingsData.secondary_color || '#FFD700';
                document.getElementById('backgroundColor').value = settingsData.background_color || '#222222';
                document.getElementById('surfaceColor').value = settingsData.surface_color || '#444444';
                document.getElementById('textColor').value = settingsData.text_color || '#E0E0E0';
                document.getElementById('textSecondary').value = settingsData.text_secondary || '#C0C0C0';
                document.getElementById('textMuted').value = settingsData.text_muted || '#A0A0A0';
                document.getElementById('borderColor').value = settingsData.border_color || '#00FF00';
                document.getElementById('fontFamily').value = settingsData.font_family || "'Share Tech Mono', monospace";
                document.getElementById('faviconUrl').value = settingsData.favicon_url || '';
                document.getElementById('logoUrl').value = settingsData.logo_url || '';
                document.getElementById('footerText').value = settingsData.footer_text || '';
                document.getElementById('footerLinks').value = settingsData.footer_links || '';
                document.getElementById('menuLinks').value = settingsData.menu_links || '';
                document.getElementById('customCss').value = settingsData.custom_css || '';
            }
        } catch (error) {
            console.error('Error loading theme settings:', error);
        }
    }

    async saveTheme() {
        const name = document.getElementById('themeName').value.trim();
        const description = document.getElementById('themeDescription').value.trim();
        const isActive = document.getElementById('themeIsActive').checked;

        if (!name) {
            messages.error('Theme name is required', { toast: true });
            return;
        }

        const themeData = {
            name,
            description,
            is_active: isActive
        };

        try {
            let result;
            if (this.currentTheme) {
                // Update existing theme
                result = await this.apiClient.put(`/themes/${this.currentTheme.id}`, themeData);
            } else {
                // Create new theme
                result = await this.apiClient.post('/themes', themeData);
            }

            if (result.success) {
                messages.success(
                    'Theme saved successfully! The theme is now available for use.',
                    { toast: true }
                );
                
                // Save theme settings
                const themeId = this.currentTheme ? this.currentTheme.id : result.data.id;
                await this.saveThemeSettings(themeId);
                
                this.loadThemes();
                this.hideThemeForm();
                
                // Dispatch theme change event if this theme was set as active
                if (isActive) {
                    document.dispatchEvent(new CustomEvent('themeChanged', { 
                        detail: { themeId: themeId } 
                    }));
                }
            } else {
                messages.error('Failed to save theme: ' + result.message, { toast: true });
            }
        } catch (error) {
            messages.error('Error saving theme: ' + error.message, { toast: true });
        }
    }

    async saveThemeSettings(themeId) {
        if (!themeId) {
            console.error('Cannot save theme settings: themeId is required');
            throw new Error('Theme ID is required');
        }
        
        const settings = {
            primary_color: document.getElementById('primaryColor').value,
            secondary_color: document.getElementById('secondaryColor').value,
            background_color: document.getElementById('backgroundColor').value,
            surface_color: document.getElementById('surfaceColor').value,
            text_color: document.getElementById('textColor').value,
            text_secondary: document.getElementById('textSecondary').value,
            text_muted: document.getElementById('textMuted').value,
            border_color: document.getElementById('borderColor').value,
            font_family: document.getElementById('fontFamily').value,
            favicon_url: document.getElementById('faviconUrl').value,
            logo_url: document.getElementById('logoUrl').value,
            footer_text: document.getElementById('footerText').value,
            footer_links: document.getElementById('footerLinks').value,
            menu_links: document.getElementById('menuLinks').value,
            custom_css: document.getElementById('customCss').value
        };

        try {
            for (const [key, value] of Object.entries(settings)) {
                // Only send non-empty values
                if (value !== undefined && value !== null && value.trim() !== '') {
                    await this.apiClient.post(`/themes/${themeId}/settings`, {
                        key: key,
                        value: value
                    });
                }
            }
        } catch (error) {
            console.error('Error saving theme settings:', error);
            throw error; // Re-throw to let the calling function handle it
        }
    }

    async deleteTheme() {
        if (!this.currentTheme) return;

        if (!confirm(`Are you sure you want to delete the theme "${this.currentTheme.name}"?`)) {
            return;
        }

        try {
            const result = await this.apiClient.delete(`/themes/${this.currentTheme.id}`);
            if (result.success) {
                messages.success('Theme deleted successfully', { toast: true });
                this.loadThemes();
                this.hideThemeForm();
            } else {
                messages.error('Failed to delete theme: ' + result.message, { toast: true });
            }
        } catch (error) {
            messages.error('Error deleting theme: ' + error.message, { toast: true });
        }
    }

    async setActiveTheme(themeId) {
        try {
            const result = await this.apiClient.post('/themes/active', { theme_id: themeId });
            if (result.success) {
                messages.success('Active theme updated', { toast: true });
                this.loadThemes();
                
                // Dispatch theme change event
                document.dispatchEvent(new CustomEvent('themeChanged', { 
                    detail: { themeId: themeId } 
                }));
            } else {
                messages.error('Failed to set active theme: ' + result.message, { toast: true });
            }
        } catch (error) {
            messages.error('Error setting active theme: ' + error.message, { toast: true });
        }
    }

    previewTheme() {
        if (!this.currentTheme) return;

        // Generate CSS from current form values
        const css = this.generateThemeCSS();
        
        // Apply preview styles
        this.applyPreviewStyles(css);
        
        // Preview favicon and logo
        this.previewFaviconAndLogo();
        
        messages.info('Theme preview applied. Refresh page to revert.', { toast: true });
    }

    generateThemeCSS() {
        const primaryColor = document.getElementById('primaryColor').value;
        const secondaryColor = document.getElementById('secondaryColor').value;
        const backgroundColor = document.getElementById('backgroundColor').value;
        const textColor = document.getElementById('textColor').value;
        const fontFamily = document.getElementById('fontFamily').value;
        const customCss = document.getElementById('customCss').value;

        return `
            :root {
                --bs-primary: ${primaryColor};
                --bs-secondary: ${secondaryColor};
                --bs-body-bg: ${backgroundColor};
                --bs-body-color: ${textColor};
                --bs-font-sans-serif: ${fontFamily};
            }
            
            body {
                background-color: ${backgroundColor} !important;
                color: ${textColor} !important;
                font-family: ${fontFamily} !important;
            }
            
            .btn-primary {
                background-color: ${primaryColor} !important;
                border-color: ${primaryColor} !important;
            }
            
            .btn-secondary {
                background-color: ${secondaryColor} !important;
                border-color: ${secondaryColor} !important;
            }
            
            ${customCss}
        `;
    }

    applyPreviewStyles(css) {
        // Remove existing preview styles
        const existingStyle = document.getElementById('theme-preview-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Add new preview styles
        const style = document.createElement('style');
        style.id = 'theme-preview-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    previewFaviconAndLogo() {
        const faviconUrl = document.getElementById('faviconUrl').value;
        const logoUrl = document.getElementById('logoUrl').value;
        
        // Preview favicon
        if (faviconUrl) {
            // Store original favicon
            const originalFavicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
            if (originalFavicon && !originalFavicon.hasAttribute('data-preview-backup')) {
                originalFavicon.setAttribute('data-preview-backup', originalFavicon.href);
            }
            
            // Apply preview favicon
            let previewFavicon = document.getElementById('preview-favicon');
            if (!previewFavicon) {
                previewFavicon = document.createElement('link');
                previewFavicon.id = 'preview-favicon';
                previewFavicon.rel = 'icon';
                previewFavicon.type = 'image/x-icon';
                document.head.appendChild(previewFavicon);
            }
            previewFavicon.href = faviconUrl;
        }
        
        // Preview logo
        if (logoUrl) {
            // Find logo elements and store original sources
            const logoElements = document.querySelectorAll('.navbar-brand img, .logo-img, [data-theme-logo]');
            logoElements.forEach(img => {
                if (!img.hasAttribute('data-preview-backup')) {
                    img.setAttribute('data-preview-backup', img.src);
                }
                img.src = logoUrl;
            });
            
            // If no logo elements exist, create a preview one
            if (logoElements.length === 0) {
                const navBrand = document.querySelector('.navbar-brand');
                if (navBrand) {
                    let previewLogo = document.getElementById('preview-logo');
                    if (!previewLogo) {
                        previewLogo = document.createElement('img');
                        previewLogo.id = 'preview-logo';
                        previewLogo.alt = 'Preview Logo';
                        previewLogo.className = 'logo-img me-2';
                        previewLogo.style.height = '32px';
                        navBrand.prepend(previewLogo);
                    }
                    previewLogo.src = logoUrl;
                }
            }
        }
    }
}
