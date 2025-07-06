/**
 * Theme Management Module for Admin Panel
 */

import { apiClient } from '/js/api-client.js';
import { messages } from '/js/ui-utils.js';
import { BaseAdminController } from './base-admin-controller.js';

export class ThemeManagement extends BaseAdminController {
    constructor(responseLog) {
        super({
            responseLog,
            apiClient
        });
        
        this.currentTheme = null;
        this.themes = [];
        
        this.init();
    }

    init() {
        this.setupEventHandlers();
        // Don't load themes immediately - wait for tab activation
    }

    setupEventHandlers() {
        // Bind direct element events
        this.bindEventConfig({
            '#newThemeButton': {
                click: () => this.showNewThemeForm()
            },
            '#themeSaveButton': {
                click: () => this.saveTheme()
            },
            '#themeDeleteButton': {
                click: () => this.deleteTheme()
            },
            '#themePreviewButton': {
                click: () => this.previewTheme()
            },
            '#themeIsActive': {
                change: (e) => {
                    // This checkbox only controls the theme's is_active property
                    // The actual website theme is controlled by CMS settings
                    if (e.target.checked && this.currentTheme) {
                        this.setThemeAsActive(this.currentTheme.id);
                    } else if (!e.target.checked && this.currentTheme) {
                        this.setThemeAsInactive(this.currentTheme.id);
                    }
                }
            }
        });
    }

    async loadThemes() {
        const themeList = document.getElementById('themeList');
        this.showContainerLoading(themeList, 'Loading themes...');
        
        const response = await this.safeApiCall(
            () => this.apiClient.get('/themes'),
            {
                operationName: 'Load Themes',
                successCallback: (data) => {
                    this.themes = data;
                    this.renderThemeList();
                }
            }
        );

        if (!response.success) {
            this.showContainerError(themeList, 'Failed to load themes: ' + response.message);
        }
    }

    renderThemeList() {
        const themeList = document.getElementById('themeList');
        if (!themeList) return;
        themeList.innerHTML = '';
        
        if (this.themes.length === 0) {
            themeList.innerHTML = '<div class="text-muted p-3">No themes found. Create your first theme!</div>';
            return;
        }
        
        this.themes.forEach(theme => {
            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.style = this.getThemedCardStyles();
            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title mb-1">${theme.name}</h5>
                            <p class="card-text text-muted mb-2">${theme.description || 'No description'}</p>
                            <small class="text-muted">ID: ${theme.id}</small>
                        </div>
                        <div class="d-flex flex-column align-items-end gap-2">
                            <span class="badge ${theme.is_active ? 'bg-success' : 'bg-secondary'}">${theme.is_active ? 'Active' : 'Inactive'}</span>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-primary edit-theme-btn" data-theme-id="${theme.id}" title="Edit">✏️</button>
                                <button class="btn btn-secondary delete-theme-btn" data-theme-id="${theme.id}" title="Delete">🗑️</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            themeList.appendChild(card);
        });
        this.setupThemeActions();
    }

    setupThemeActions() {
        // Bind edit buttons
        this.bindEventsBySelector('.edit-theme-btn', 'click', (event) => {
            const btn = event.target;
            const themeId = btn.getAttribute('data-theme-id');
            const theme = this.themes.find(t => t.id === themeId);
            if (theme) this.editTheme(theme);
        });

        // Setup double-click-to-confirm delete logic
        this.setupConfirmationButtons('.delete-theme-btn', {
            onConfirm: (btn) => {
                const themeId = btn.getAttribute('data-theme-id');
                this.deleteThemeById(themeId);
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

        // Check if this theme is the current website theme and gray out checkbox if so
        try {
            const currentThemeResult = await this.apiClient.get('/cms/active-theme');
            const isCurrentWebsiteTheme = currentThemeResult.success && currentThemeResult.data && currentThemeResult.data.id === theme.id;
            
            const activeCheckbox = document.getElementById('themeIsActive');
            if (isCurrentWebsiteTheme) {
                activeCheckbox.disabled = true;
                activeCheckbox.title = 'Cannot modify: This theme is currently the active website theme';
            } else {
                activeCheckbox.disabled = false;
                activeCheckbox.title = 'Set as Active Theme';
            }
        } catch (error) {
            // If we can't get the current theme, just enable the checkbox
            document.getElementById('themeIsActive').disabled = false;
        }

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
        const saveBtn = document.getElementById('themeSaveBtn');
        const name = document.getElementById('themeName').value.trim();
        const description = document.getElementById('themeDescription').value.trim();
        const isActive = document.getElementById('themeIsActive').checked;

        if (!name) {
            this.showError('Theme name is required');
            return;
        }

        const themeData = {
            name,
            description,
            is_active: isActive
        };

        const apiCall = this.currentTheme 
            ? () => this.apiClient.put(`/themes/${this.currentTheme.id}`, themeData)
            : () => this.apiClient.post('/themes', themeData);

        const response = await this.safeApiCall(
            apiCall,
            {
                operationName: this.currentTheme ? 'Update Theme' : 'Create Theme',
                loadingElement: saveBtn,
                loadingText: 'Saving...',
                successCallback: async (data) => {
                    // Save theme settings
                    const themeId = this.currentTheme ? this.currentTheme.id : data.id;
                    await this.saveThemeSettings(themeId);
                    
                    this.loadThemes();
                    this.hideThemeForm();
                    
                    // Dispatch theme change event if this theme was set as active
                    if (isActive) {
                        document.dispatchEvent(new CustomEvent('themeChanged', { 
                            detail: { themeId: themeId } 
                        }));
                    }
                }
            }
        );

        if (!response.success) {
            this.showError('Failed to save theme: ' + response.message);
        }
    }

    async saveThemeSettings(themeId) {
        const applyBtn = document.getElementById('themeApplyBtn');
        if (applyBtn) loadingManager.setLoading(applyBtn, true, 'Applying...');
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
        } finally {
            if (applyBtn) loadingManager.setLoading(applyBtn, false);
        }
    }

    async deleteTheme() {
        if (!this.currentTheme) return;

        if (!confirm(`Are you sure you want to delete the theme "${this.currentTheme.name}"?`)) {
            return;
        }

        const deleteBtn = document.querySelector('.delete-theme-btn.btn-danger');
        const response = await this.safeApiCall(
            () => this.apiClient.delete(`/themes/${this.currentTheme.id}`),
            {
                operationName: 'Delete Theme',
                loadingElement: deleteBtn,
                loadingText: 'Deleting...',
                successCallback: () => {
                    this.loadThemes();
                    this.hideThemeForm();
                }
            }
        );

        if (!response.success) {
            this.showError('Failed to delete theme: ' + response.message);
        }
    }

    async setThemeAsActive(themeId) {
        const activeBtn = document.getElementById('themeIsActive');
        const response = await this.safeApiCall(
            () => this.apiClient.put(`/themes/${themeId}`, { is_active: true }),
            {
                operationName: 'Set Theme as Active',
                loadingElement: activeBtn,
                loadingText: 'Setting as Active...',
                successCallback: () => {
                    this.loadThemes();
                }
            }
        );

        if (!response.success) {
            this.showError('Failed to set theme as active: ' + response.message);
        }
    }

    async setThemeAsInactive(themeId) {
        const response = await this.safeApiCall(
            () => this.apiClient.put(`/themes/${themeId}`, { is_active: false }),
            {
                operationName: 'Set Theme as Inactive',
                successCallback: () => {
                    this.loadThemes();
                }
            }
        );

        if (!response.success) {
            this.showError('Failed to set theme as inactive: ' + response.message);
            document.getElementById('themeIsActive').checked = true;
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
