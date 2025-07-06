/**
 * CMS Settings Management Module for Admin Panel
 */

import { apiClient } from '/js/api-client.js';
import { messages } from '/js/ui-utils.js';
import { cmsIntegration } from '/js/utils/cms-integration.js';
import { BaseAdminController } from './base-admin-controller.js';
import { ConfirmationDialog } from '../../js/utils/dialogs.js';

export class CMSSettings extends BaseAdminController {
    constructor(responseLog) {
        super({
            responseLog,
            apiClient
        });
        
        this.currentSettings = {};
        this.availableThemes = [];
        this.currentWebsiteTheme = null;
        
        this.init();
    }

    init() {
        this.setupEventHandlers();
        this.setupCharacterCounters();
        this.setupDownloadSettingsButton();
        // Don't load settings immediately - wait for tab activation
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
                'shown.bs.tab': () => this.loadCMSSettings()
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
            messages.error('Error loading CMS settings: ' + error.message);
        }
    }

    async loadSettings() {
        const response = await this.safeApiCall(
            () => this.apiClient.get('/cms/settings'),
            {
                operationName: 'Load CMS Settings',
                successCallback: (data) => {
                    this.currentSettings = {};
                    
                    // Convert array to object for easier access
                    data.forEach(setting => {
                        this.currentSettings[setting.setting_key] = setting;
                    });

                    this.populateSettingsForm();
                }
            }
        );

        if (!response.success) {
            this.showError('Failed to load settings: ' + response.message);
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

        // Populate raw JSON view
        const cmsSettingsTextarea = document.getElementById('cmsSettingsTextarea');
        if (cmsSettingsTextarea) {
            cmsSettingsTextarea.value = JSON.stringify(this.currentSettings, null, 2);
        }
    }

    async loadAvailableThemes() {
        const response = await this.safeApiCall(
            () => this.apiClient.get('/themes'),
            {
                operationName: 'Load Available Themes',
                successCallback: (data) => {
                    this.availableThemes = data;
                    this.populateThemeSelector();
                }
            }
        );

        if (!response.success) {
            this.showError('Failed to load themes: ' + response.message);
        }
    }

    populateThemeSelector() {
        const themeSelect = document.getElementById('activeThemeSelect');
        if (!themeSelect) return;

        themeSelect.innerHTML = '<option value="">Select a theme...</option>';

        // Filter themes: show only active themes, or default theme if none are active
        const activeThemes = this.availableThemes.filter(theme => theme.is_active);
        const defaultTheme = this.availableThemes.find(theme => theme.is_default);
        
        let themesToShow = activeThemes;
        
        // If no active themes, include the default theme regardless of its active status
        if (activeThemes.length === 0 && defaultTheme) {
            themesToShow = [defaultTheme];
        }

        themesToShow.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            let label = theme.name;
            
            // Add status indicators
            if (theme.is_active) {
                label += ' (Active)';
            } else if (theme.is_default) {
                label += ' (Default)';
            }
            
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

        // Validation
        const errors = [];
        if (!siteName) {
            errors.push('Site name is required');
        } else if (siteName.length > 100) {
            errors.push('Site name must be 100 characters or less');
        }
        
        if (siteDescription.length > 500) {
            errors.push('Site description must be 500 characters or less');
        }

        if (errors.length > 0) {
            this.showError('Validation errors: ' + errors.join(', '));
            return;
        }

        const settings = {
            site_name: siteName,
            site_description: siteDescription
        };

        // Disable apply button during save
        if (applyButton) {
            applyButton.disabled = true;
        }

        let allSuccessful = true;
        const saveErrors = [];

        // Save each setting individually
        for (const [key, value] of Object.entries(settings)) {
            const response = await this.safeApiCall(
                () => this.apiClient.put(`/cms/settings/${key}`, { value, type: 'string' }),
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
            messages.success('General settings saved successfully');
            // Reload settings to reflect changes
            await this.loadSettings();
            // Refresh CMS integration across all pages
            await cmsIntegration.refresh();
            // Download JSON after save
            this.downloadSettingsJson();
        } else {
            this.showError('Some settings failed to save: ' + saveErrors.join(', '));
        }

        // Re-enable apply button
        if (applyButton) {
            applyButton.disabled = false;
        }
    }

    async applyWebsiteTheme() {
        const themeSelect = document.getElementById('activeThemeSelect');
        const applyButton = document.getElementById('applyWebsiteTheme');
        const saveButton = document.getElementById('saveGeneralSettings');
        
        if (!themeSelect || !themeSelect.value) {
            this.showWarning('Please select a theme to apply');
            return;
        }

        const selectedTheme = this.availableThemes.find(theme => theme.id === themeSelect.value);
        if (!selectedTheme) {
            this.showError('Selected theme not found');
            return;
        }

        if (this.currentWebsiteTheme && this.currentWebsiteTheme.id === selectedTheme.id) {
            this.showInfo('This theme is already the active website theme');
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
            this.showError('Failed to set website theme: ' + response.message);
        }

        // Re-enable save button
        if (saveButton) {
            saveButton.disabled = false;
        }
    }

    setupCharacterCounters() {
        const siteNameInput = document.getElementById('siteName');
        const siteNameCounter = document.getElementById('siteNameCounter');
        const siteDescInput = document.getElementById('siteDescription');
        const siteDescCounter = document.getElementById('siteDescriptionCounter');

        if (siteNameInput && siteNameCounter) {
            const updateSiteNameCounter = () => {
                siteNameCounter.textContent = siteNameInput.value.length;
            };
            siteNameInput.addEventListener('input', updateSiteNameCounter);
            updateSiteNameCounter(); // Initial count
        }

        if (siteDescInput && siteDescCounter) {
            const updateSiteDescCounter = () => {
                siteDescCounter.textContent = siteDescInput.value.length;
            };
            siteDescInput.addEventListener('input', updateSiteDescCounter);
            updateSiteDescCounter(); // Initial count
        }
    }
}
