/**
 * CMS Settings Management Module for Admin Panel
 */

import { apiClient } from '../../js/api-core.js';
import { messages } from '../../js/ui-utils.js';
import { cmsIntegration } from '../../js/utils/cms-integration.js';
import { BaseAdminController } from './base-admin-controller.js';
import { ConfirmationDialog } from '../../js/utils/dialogs.js';

console.log('[CMSSettings] Module loaded');

export class CMSSettings extends BaseAdminController {
    constructor() {
        super({
            apiClient
        });
        console.log('[CMSSettings] Constructor called');
        this.currentSettings = {};
        this.availableThemes = [];
        this.currentWebsiteTheme = null;
        
        this.init();
    }

    init() {
        this.setupEventHandlers();
        this.setupDownloadSettingsButton();
        this.setupMessageRenderer();
        this.loadCMSSettings(); // Always load settings/themes on init
    }

    setupEventHandlers() {
        // Bind direct element events
        this.bindEvents({
            '#saveGeneralSettings': {
                click: () => this.saveGeneralSettings()
            },
            '#applyWebsiteTheme': {
                click: () => this.applyWebsiteTheme()
            },
            '#cms-settings-tab': {
                'shown.bs.tab': () => {
                    console.log('[CMSSettings] shown.bs.tab event fired');
                    this.loadCMSSettings();
                }
            },
            '#activeThemeSelect': {
                change: (e) => this.onThemeSelectionChange(e.target.value)
            }
        });
    }

    setupDownloadSettingsButton() {
        const btn = document.getElementById('downloadSettingsJsonButton');
        if (btn) {
            btn.addEventListener('click', () => this.downloadSettingsJson());
        }
    }

    setupMessageRenderer() {
        const div = document.getElementById('cmsSettingsMessageDiv');
        if (!div) return;
        messages.subscribe(msgs => {
            if (!msgs.length) {
                div.innerHTML = '';
                return;
            }
            const msg = msgs[msgs.length - 1];
            div.innerHTML = `<div class="alert alert-${msg.type}">${msg.text}</div>`;
        });
    }

    downloadSettingsJson() {
        // Prepare a plain object with key-value pairs only
        const settingsObj = {};
        for (const [key, val] of Object.entries(this.currentSettings)) {
            settingsObj[key] = val.setting_value;
        }
        const json = JSON.stringify(settingsObj, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cms-settings.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        // Show message
        const msgDiv = document.getElementById('cmsSettingsMessageDiv');
        if (msgDiv) {
            msgDiv.innerHTML = '<span class="text-success">Downloaded <code>cms-settings.json</code>. Upload this file to your server\'s <code>public/</code> directory to update site settings for all users.</span>';
        }
    }

    async loadCMSSettings() {
        try {
            // Load CMS settings
            await this.loadSettings();
            
            // Load available themes
            await this.loadAvailableThemes();
            
            // Load current website theme
            await this.loadCurrentWebsiteTheme();

        } catch (error) {
            messages.showError('Error loading CMS settings: ' + error.message);
        }
    }

    async loadSettings() {
        const response = await this.safeApiCall(
            () => this.apiClient.get('/cms/settings'),
            {
                operationName: 'Load CMS Settings',
                successCallback: (data) => {
                    this.currentSettings = {};

                    // Robustly check if data is an array
                    if (!Array.isArray(data)) {
                        console.warn('Expected array from /cms/settings, got:', data);
                        messages.showWarning('Unexpected response from server. Please contact support.');
                        return;
                    }

                    // Convert array to object for easier access
                    data.forEach(setting => {
                        if (setting && setting.setting_key !== undefined) {
                            this.currentSettings[setting.setting_key] = setting;
                        }
                    });

                    this.populateSettingsForm();

                    // Show feedback to user
                    if (Object.keys(this.currentSettings).length > 0) {
                        messages.showSuccess('CMS settings loaded successfully.');
                    } else {
                        messages.showWarning('No CMS settings found.');
                    }
                }
            }
        );

        if (!response.success) {
            messages.showError('Failed to load settings: ' + response.message);
        }
    }

    populateSettingsForm() {
        // Populate general settings
        const siteNameElement = document.getElementById('siteName');
        if (siteNameElement && this.currentSettings.site_name) {
            siteNameElement.value = this.currentSettings.site_name.setting_value;
        }

        const siteDescElement = document.getElementById('siteDescription');
        if (siteDescElement && this.currentSettings.site_description) {
            siteDescElement.value = this.currentSettings.site_description.setting_value;
        }
    }

    async loadAvailableThemes() {
        console.log('[CMSSettings] loadAvailableThemes called');
        const response = await this.safeApiCall(
            () => this.apiClient.get('/themes'),
            {
                operationName: 'Load Available Themes',
                successCallback: (data) => {
                    console.log('[CMSSettings] /themes response:', data);
                    this.availableThemes = Array.isArray(data) ? data : [];
                    this.populateThemeSelector();
                }
            }
        );
        if (!response.success) {
            this.availableThemes = [];
            this.populateThemeSelector();
            messages.showError('Failed to load themes: ' + response.message);
        }
    }

    populateThemeSelector() {
        const themeSelect = document.getElementById('activeThemeSelect');
        if (!themeSelect) {
            console.log('[CMSSettings] themeSelect not found');
            return;
        }
        console.log('[CMSSettings] Populating theme selector with:', this.availableThemes);
        themeSelect.innerHTML = '';
        if (!this.availableThemes.length) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No themes available (failed to load or none exist)';
            themeSelect.appendChild(opt);
            messages.showWarning('No website themes found or failed to load themes. Raw: ' + JSON.stringify(this.availableThemes));
            return;
        }
        this.availableThemes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            let label = theme.name;
            if (theme.is_active) label += ' (Active)';
            if (theme.is_default) label += ' (Default)';
            option.textContent = label;
            themeSelect.appendChild(option);
        });
        // Set current website theme as selected if it's in the available options
        if (this.currentWebsiteTheme) {
            const currentThemeOption = Array.from(themeSelect.options).find(option => option.value === this.currentWebsiteTheme.id);
            if (currentThemeOption) {
                themeSelect.value = this.currentWebsiteTheme.id;
            }
        }
        console.log('[CMSSettings] Dropdown options:', Array.from(themeSelect.options).map(o => o.textContent));
    }

    async loadCurrentWebsiteTheme() {
        const response = await this.safeApiCall(
            () => this.apiClient.get('/cms/active-theme'),
            {
                operationName: 'Load Current Website Theme',
                successCallback: (data) => {
                    if (data) {
                        this.currentWebsiteTheme = data;
                        this.updateCurrentThemeDisplay();
                        
                        // Update theme selector
                        const themeSelect = document.getElementById('activeThemeSelect');
                        if (themeSelect) {
                            themeSelect.value = this.currentWebsiteTheme.id;
                        }
                    }
                }
            }
        );

        if (!response.success) {
            // If no active theme is set, apply the default theme first
            console.log('No website theme set, applying default theme...');
            const defaultTheme = this.availableThemes.find(theme => theme.is_default);
            if (defaultTheme) {
                const applyResponse = await this.safeApiCall(
                    () => this.apiClient.put('/cms/active-theme', { theme_id: defaultTheme.id }),
                    {
                        operationName: 'Apply Default Theme',
                        successCallback: () => {
                            console.log('Default theme applied successfully');
                            this.currentWebsiteTheme = defaultTheme;
                            this.updateCurrentThemeDisplay();
                            
                            // Update theme selector
                            const themeSelect = document.getElementById('activeThemeSelect');
                            if (themeSelect) {
                                themeSelect.value = defaultTheme.id;
                            }
                        }
                    }
                );

                if (!applyResponse.success) {
                    console.log('Failed to apply default theme:', applyResponse.message);
                }
            } else {
                console.log('No default theme found in available themes');
            }
        }
    }

    updateCurrentThemeDisplay() {
        const themeInfoElement = document.getElementById('currentThemeInfo');
        const themeNameElement = document.getElementById('currentThemeName');
        const themeDescElement = document.getElementById('currentThemeDescription');

        if (this.currentWebsiteTheme && themeInfoElement && themeNameElement && themeDescElement) {
            themeNameElement.textContent = this.currentWebsiteTheme.name;
            themeDescElement.textContent = this.currentWebsiteTheme.description || 'No description available';
            themeInfoElement.classList.remove('d-none');
        } else if (themeInfoElement) {
            themeInfoElement.classList.add('d-none');
        }
    }

    onThemeSelectionChange(themeId) {
        const selectedTheme = this.availableThemes.find(theme => theme.id === themeId);
        
        // Enable/disable apply button
        const applyBtn = document.getElementById('applyWebsiteTheme');
        
        if (selectedTheme) {
            if (applyBtn) applyBtn.disabled = false;
        } else {
            if (applyBtn) applyBtn.disabled = true;
        }
    }

    async saveGeneralSettings() {
        const saveButton = document.getElementById('saveGeneralSettings');
        const applyButton = document.getElementById('applyWebsiteTheme');
        const siteName = document.getElementById('siteName').value.trim();
        const siteDescription = document.getElementById('siteDescription').value.trim();
        const maintenanceMode = document.getElementById('maintenanceMode').checked ? 'true' : 'false';
        const allowRegistration = document.getElementById('allowRegistration').checked ? 'true' : 'false';
        const defaultUserRole = document.getElementById('defaultUserRole').value.trim();
        const errors = [];
        if (!siteName) errors.push('Site name is required');
        if (siteName.length > 100) errors.push('Site name must be 100 characters or less');
        if (siteDescription.length > 500) errors.push('Site description must be 500 characters or less');
        if (defaultUserRole && !/^\w+$/.test(defaultUserRole)) {
            messages.showWarning('Default user role should be a single word (no spaces or special characters).');
        }
        if (!defaultUserRole) {
            messages.showWarning('Default user role is empty. This may affect new user registration.');
        }
        if (errors.length > 0) { messages.showError('Validation errors: ' + errors.join(', ')); return; }
        const settings = [
            { key: 'site_name', value: siteName, type: 'string' },
            { key: 'site_description', value: siteDescription, type: 'string' },
            { key: 'maintenance_mode', value: maintenanceMode, type: 'boolean' },
            { key: 'allow_registration', value: allowRegistration, type: 'boolean' },
            { key: 'default_user_role', value: defaultUserRole, type: 'string' }
        ];
        if (applyButton) applyButton.disabled = true;
        let allSuccessful = true;
        const saveErrors = [];
        for (const { key, value, type } of settings) {
            console.debug(`[CMSSettings] Saving ${key}:`, value, type);
            const response = await this.safeApiCall(
                () => this.apiClient.put(`/cms/settings/${key}`, { value, type }),
                {
                    operationName: `Save CMS Setting: ${key}`,
                    loadingElement: saveButton,
                    loadingText: 'Saving...'
                }
            );
            if (!response.success) {
                allSuccessful = false;
                saveErrors.push(`Failed to save ${key}: ${response.message}`);
            }
        }
        if (allSuccessful) {
            this.handleApiResponse(response);
            await this.loadSettings();
            await cmsIntegration.refresh();
        } else {
            messages.showError('Some settings failed to save: ' + saveErrors.join(', '));
        }
        if (applyButton) applyButton.disabled = false;
    }

    async applyWebsiteTheme() {
        const themeSelect = document.getElementById('activeThemeSelect');
        const applyButton = document.getElementById('applyWebsiteTheme');
        const saveButton = document.getElementById('saveGeneralSettings');
        
        if (!themeSelect || !themeSelect.value) {
            messages.showWarning('Please select a theme to apply');
            return;
        }

        const selectedTheme = this.availableThemes.find(theme => theme.id === themeSelect.value);
        if (!selectedTheme) {
            messages.showError('Selected theme not found');
            return;
        }

        if (this.currentWebsiteTheme && this.currentWebsiteTheme.id === selectedTheme.id) {
            messages.showInfo('This theme is already the active website theme');
            return;
        }

        const confirmed = await ConfirmationDialog.show({
            title: 'Apply Website Theme',
            message: `Are you sure you want to set "${selectedTheme.name}" as the website theme? This will change the appearance for all visitors.`,
            confirmText: 'Apply',
            cancelText: 'Cancel',
            confirmBtnClass: 'btn-primary'
        });
        if (!confirmed) return;

        // Disable save button during apply
        if (saveButton) {
            saveButton.disabled = true;
        }

        const response = await this.safeApiCall(
            () => this.apiClient.put('/cms/active-theme', { theme_id: selectedTheme.id }),
            {
                operationName: 'Apply Website Theme',
                loadingElement: applyButton,
                loadingText: 'Applying...',
                successCallback: () => {
                    // Update current theme info
                    this.currentWebsiteTheme = selectedTheme;
                    this.updateCurrentThemeDisplay();
                    
                    // Dispatch theme change event for immediate UI update
                    document.dispatchEvent(new CustomEvent('themeChanged', { 
                        detail: { themeId: selectedTheme.id } 
                    }));
                }
            }
        );

        if (!response.success) {
            messages.showError('Failed to set website theme: ' + response.message);
        }

        // Re-enable save button
        if (saveButton) {
            saveButton.disabled = false;
        }
    }
}
