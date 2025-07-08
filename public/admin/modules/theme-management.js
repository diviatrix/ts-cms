/**
 * Theme Management Module for Admin Panel
 */

import { apiClient } from '../../js/api-core.js';
import { messages } from '../../js/ui-utils.js';
import { BaseAdminController } from './base-admin-controller.js';
import { ConfirmationDialog } from '../../js/utils/dialogs.js';
import { renderCardTitle, renderMetaRow, renderEditButton, renderDeleteButton, renderEmptyState, renderErrorState } from '../../js/shared-components/ui-snippets.js';

export class ThemeManagement extends BaseAdminController {
    constructor() {
        super({
            apiClient
        });
        
        this.currentTheme = null;
        this.themes = [];
        
        this.init();
    }

    init() {
        this.setupEventHandlers();
        this.loadThemes(); // Load themes immediately when initialized
    }

    setupEventHandlers() {
        // Bind direct element events (only those always present)
        this.bindEvents({
            '#newThemeButton': {
                click: () => this.showNewThemeForm()
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
        try {
            const response = await this.safeApiCall(
                () => this.apiClient.get('/themes'),
                {
                    operationName: 'Load Themes',
                    successCallback: (data) => {
                        this.themes = data || [];
                        this.renderThemeList();
                    }
                }
            );
            if (!response.success) {
                messages.showError('Failed to load themes: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading themes:', error);
        }
    }

    renderThemeList() {
        const themeList = document.getElementById('themeList');
        if (!themeList) return;
        themeList.innerHTML = '';
        
        if (this.themes.length === 0) {
            themeList.innerHTML = '<div class="empty-state">No themes found. Create your first theme!</div>';
            return;
        }
        
        this.themes.forEach(theme => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-body">
                    <div>
                        <div>
                            <h5 class="card-title">${theme.name}</h5>
                            <p class="card-text">${theme.description || 'No description'}</p>
                            <small>ID: ${theme.id}</small>
                        </div>
                        <div>
                            <span>${theme.is_active ? 'Active' : 'Inactive'}</span>
                            <div>
                                <button class="btn edit-theme-btn" data-theme-id="${theme.id}" title="Edit">✏️</button>
                                <button class="btn delete-theme-btn" data-theme-id="${theme.id}" title="Delete">🗑️</button>
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
        this.showThemeForm();
        this.populateThemeForm(theme);
    }

    showThemeForm() {
        const editTab = document.getElementById('themeEditTab');
        if (editTab) {
            editTab.classList.remove('d-none');
            // Bind form button events only when form is shown
            this.bindEvents({
                '#themeSaveButton': {
                    click: () => this.saveTheme()
                },
                '#themeDeleteButton': {
                    click: () => this.deleteTheme()
                },
                '#themePreviewButton': {
                    click: () => this.previewTheme()
                }
            });
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
                const setValue = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.value = value;
                    else console.warn(`[ThemeManagement] Element #${id} not found when populating theme form.`);
                };
                setValue('primaryColor', settingsData.primary_color || '#00FF00');
                setValue('secondaryColor', settingsData.secondary_color || '#FFD700');
                setValue('backgroundColor', settingsData.background_color || '#222222');
                setValue('surfaceColor', settingsData.surface_color || '#444444');
                setValue('textColor', settingsData.text_color || '#E0E0E0');
                setValue('textSecondary', settingsData.text_secondary || '#C0C0C0');
                setValue('textMuted', settingsData.text_muted || '#A0A0A0');
                setValue('borderColor', settingsData.border_color || '#00FF00');
                setValue('fontFamily', settingsData.font_family || "'Share Tech Mono', monospace");
                setValue('faviconUrl', settingsData.favicon_url || '');
                setValue('logoUrl', settingsData.logo_url || '');
                setValue('footerText', settingsData.footer_text || '');
                setValue('footerLinks', settingsData.footer_links || '');
                setValue('menuLinks', settingsData.menu_links || '');
                setValue('customCss', settingsData.custom_css || '');
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

        const isUpdate = Boolean(this.currentTheme);
        const apiCall = isUpdate
            ? () => this.apiClient.put(`/themes/${this.currentTheme.id}`, themeData)
            : () => this.apiClient.post('/themes', themeData);

        const response = await this.safeApiCall(
            apiCall,
            {
                operationName: isUpdate ? 'Update Theme' : 'Create Theme',
                loadingElement: saveBtn,
                loadingText: 'Saving...',
                successCallback: async (data) => {
                    // Save theme settings
                    const themeId = isUpdate ? this.currentTheme.id : data.id;
                    await this.saveThemeSettings(themeId);
                    // If creating, refresh theme list but keep form open for further edits
                    if (!isUpdate) {
                        await this.loadThemes();
                        // Set currentTheme to the newly created theme for further edits
                        this.currentTheme = { ...themeData, id: data.id };
                        // Optionally, re-populate the form with the new theme data
                        this.populateThemeForm(this.currentTheme);
                    }
                    // Only dispatch themeChanged if set as active
                    if (isActive) {
                        document.dispatchEvent(new CustomEvent('themeChanged', { 
                            detail: { themeId: themeId } 
                        }));
                    }
                }
            }
        );

        this.handleApiResponse(response);
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

        const confirmed = await ConfirmationDialog.show({
            title: 'Delete Theme',
            message: `Are you sure you want to delete the theme "${this.currentTheme.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmBtnClass: 'btn-danger'
        });
        if (!confirmed) return;

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

        this.handleApiResponse(response);
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

        this.handleApiResponse(response);
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

        this.handleApiResponse(response, null, () => {
            document.getElementById('themeIsActive').checked = true;
        });
    }

    previewTheme() {
        if (!this.currentTheme) return;

        // Generate CSS from current form values
        const css = this.generateThemeCSS();
        
        // Apply preview styles
        this.applyPreviewStyles(css);
        
        // Preview favicon and logo
        this.previewFaviconAndLogo();
        
        messages.showInfo('Theme preview applied. Refresh page to revert.');
    }

    generateThemeCSS() {
        const primaryColor = document.getElementById('primaryColor').value;
        const secondaryColor = document.getElementById('secondaryColor').value;
        const backgroundColor = document.getElementById('backgroundColor').value;
        const surfaceColor = document.getElementById('surfaceColor').value;
        const textColor = document.getElementById('textColor').value;
        const borderColor = document.getElementById('borderColor').value;
        const fontFamily = document.getElementById('fontFamily').value;
        const customCss = document.getElementById('customCss').value;

        return `
            :root {
                --theme-primary-color: ${primaryColor};
                --theme-secondary-color: ${secondaryColor};
                --theme-background-color: ${backgroundColor};
                --theme-surface-color: ${surfaceColor};
                --theme-text-color: ${textColor};
                --theme-border-color: ${borderColor};
                --theme-font-family: ${fontFamily};
            }
            body {
                background-color: ${backgroundColor} !important;
                color: ${textColor} !important;
                font-family: ${fontFamily} !important;
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
