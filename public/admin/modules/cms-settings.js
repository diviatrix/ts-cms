/**
 * CMS Settings Management Module for Admin Panel
 */

import { apiClient } from '/js/api-client.js';
import { MessageDisplay, ErrorHandler } from '/js/ui-utils.js';

export class CMSSettings {
    constructor() {
        this.apiClient = apiClient;
        this.messageDisplay = new MessageDisplay();
        this.currentSettings = {};
        this.availableThemes = [];
        this.currentWebsiteTheme = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        // Don't load settings immediately - wait for tab activation
    }

    bindEvents() {
        // Save general settings button
        document.getElementById('saveGeneralSettings')?.addEventListener('click', () => {
            this.saveGeneralSettings();
        });

        // Preview theme button
        document.getElementById('previewSelectedTheme')?.addEventListener('click', () => {
            this.previewSelectedTheme();
        });

        // Apply website theme button
        document.getElementById('applyWebsiteTheme')?.addEventListener('click', () => {
            this.applyWebsiteTheme();
        });

        // Listen for CMS settings tab activation
        document.getElementById('cms-settings-tab')?.addEventListener('shown.bs.tab', () => {
            this.loadCMSSettings();
        });

        // Theme selection change
        document.getElementById('activeThemeSelect')?.addEventListener('change', (e) => {
            this.onThemeSelectionChange(e.target.value);
        });
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
            this.messageDisplay.showError('Error loading CMS settings: ' + error.message, 'cmsSettingsMessageDiv');
        }
    }

    async loadSettings() {
        try {
            const result = await this.apiClient.get('/cms/settings');
            if (result.success) {
                this.currentSettings = {};
                
                // Convert array to object for easier access
                result.data.forEach(setting => {
                    this.currentSettings[setting.setting_key] = setting;
                });

                this.populateSettingsForm();
            } else {
                this.messageDisplay.showError('Failed to load settings: ' + result.message, 'cmsSettingsMessageDiv');
            }
        } catch (error) {
            this.messageDisplay.showError('Error loading settings: ' + error.message, 'cmsSettingsMessageDiv');
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

        const maintenanceElement = document.getElementById('maintenanceMode');
        if (maintenanceElement && this.currentSettings.maintenance_mode) {
            maintenanceElement.checked = this.currentSettings.maintenance_mode.setting_value === 'true';
        }

        const registrationElement = document.getElementById('allowRegistration');
        if (registrationElement && this.currentSettings.allow_registration) {
            registrationElement.checked = this.currentSettings.allow_registration.setting_value === 'true';
        }
    }

    async loadAvailableThemes() {
        try {
            const result = await this.apiClient.get('/themes');
            if (result.success) {
                this.availableThemes = result.data;
                this.populateThemeSelector();
            } else {
                this.messageDisplay.showError('Failed to load themes: ' + result.message, 'cmsSettingsMessageDiv');
            }
        } catch (error) {
            this.messageDisplay.showError('Error loading themes: ' + error.message, 'cmsSettingsMessageDiv');
        }
    }

    populateThemeSelector() {
        const themeSelect = document.getElementById('activeThemeSelect');
        if (!themeSelect) return;

        themeSelect.innerHTML = '<option value="">Select a theme...</option>';

        this.availableThemes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = `${theme.name}${theme.is_active ? ' (Currently Active)' : ''}`;
            themeSelect.appendChild(option);
        });

        // Set current website theme as selected
        if (this.currentWebsiteTheme) {
            themeSelect.value = this.currentWebsiteTheme.id;
        }
    }

    async loadCurrentWebsiteTheme() {
        try {
            const result = await this.apiClient.get('/cms/active-theme');
            if (result.success && result.data) {
                this.currentWebsiteTheme = result.data;
                this.updateCurrentThemeDisplay();
                
                // Update theme selector
                const themeSelect = document.getElementById('activeThemeSelect');
                if (themeSelect) {
                    themeSelect.value = this.currentWebsiteTheme.id;
                }
            }
        } catch (error) {
            console.warn('No website theme set or error loading theme:', error);
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
        
        // Enable/disable action buttons
        const previewBtn = document.getElementById('previewSelectedTheme');
        const applyBtn = document.getElementById('applyWebsiteTheme');
        
        if (selectedTheme) {
            if (previewBtn) previewBtn.disabled = false;
            if (applyBtn) applyBtn.disabled = false;
        } else {
            if (previewBtn) previewBtn.disabled = true;
            if (applyBtn) applyBtn.disabled = true;
        }
    }

    async saveGeneralSettings() {
        try {
            const settings = {
                site_name: document.getElementById('siteName').value,
                site_description: document.getElementById('siteDescription').value,
                maintenance_mode: document.getElementById('maintenanceMode').checked.toString(),
                allow_registration: document.getElementById('allowRegistration').checked.toString()
            };

            let allSuccessful = true;
            const errors = [];

            // Save each setting individually
            for (const [key, value] of Object.entries(settings)) {
                try {
                    const type = (key === 'maintenance_mode' || key === 'allow_registration') ? 'boolean' : 'string';
                    const result = await this.apiClient.put(`/cms/settings/${key}`, { value, type });
                    
                    if (!result.success) {
                        allSuccessful = false;
                        errors.push(`Failed to save ${key}: ${result.message}`);
                    }
                } catch (error) {
                    allSuccessful = false;
                    errors.push(`Error saving ${key}: ${error.message}`);
                }
            }

            if (allSuccessful) {
                this.messageDisplay.showSuccess('General settings saved successfully', 'cmsSettingsMessageDiv');
                // Reload settings to reflect changes
                await this.loadSettings();
            } else {
                this.messageDisplay.showError('Some settings failed to save: ' + errors.join(', '), 'cmsSettingsMessageDiv');
            }

        } catch (error) {
            this.messageDisplay.showError('Error saving general settings: ' + error.message, 'cmsSettingsMessageDiv');
        }
    }

    async previewSelectedTheme() {
        const themeSelect = document.getElementById('activeThemeSelect');
        if (!themeSelect || !themeSelect.value) {
            this.messageDisplay.showWarning('Please select a theme to preview', 'cmsSettingsMessageDiv');
            return;
        }

        const selectedTheme = this.availableThemes.find(theme => theme.id === themeSelect.value);
        if (!selectedTheme) {
            this.messageDisplay.showError('Selected theme not found', 'cmsSettingsMessageDiv');
            return;
        }

        try {
            // Get the theme manager from global scope
            if (window.themeManager && window.themeManager.previewTheme) {
                const result = await window.themeManager.previewTheme(selectedTheme.id);
                if (result.success) {
                    this.messageDisplay.showInfo(`Theme "${selectedTheme.name}" preview applied. It will auto-revert in 10 seconds or refresh the page to revert manually.`, 'cmsSettingsMessageDiv');
                } else {
                    this.messageDisplay.showError('Failed to preview theme: ' + result.message, 'cmsSettingsMessageDiv');
                }
            } else {
                this.messageDisplay.showWarning('Theme manager not available for preview', 'cmsSettingsMessageDiv');
            }
        } catch (error) {
            this.messageDisplay.showError('Error previewing theme: ' + error.message, 'cmsSettingsMessageDiv');
        }
    }

    async applyWebsiteTheme() {
        const themeSelect = document.getElementById('activeThemeSelect');
        if (!themeSelect || !themeSelect.value) {
            this.messageDisplay.showWarning('Please select a theme to apply', 'cmsSettingsMessageDiv');
            return;
        }

        const selectedTheme = this.availableThemes.find(theme => theme.id === themeSelect.value);
        if (!selectedTheme) {
            this.messageDisplay.showError('Selected theme not found', 'cmsSettingsMessageDiv');
            return;
        }

        if (this.currentWebsiteTheme && this.currentWebsiteTheme.id === selectedTheme.id) {
            this.messageDisplay.showInfo('This theme is already the active website theme', 'cmsSettingsMessageDiv');
            return;
        }

        if (!confirm(`Are you sure you want to set "${selectedTheme.name}" as the website theme? This will change the appearance for all visitors.`)) {
            return;
        }

        try {
            const result = await this.apiClient.put('/cms/active-theme', { theme_id: selectedTheme.id });
            
            if (result.success) {
                this.messageDisplay.showSuccess(`Website theme set to "${selectedTheme.name}" successfully`, 'cmsSettingsMessageDiv');
                
                // Update current theme info
                this.currentWebsiteTheme = selectedTheme;
                this.updateCurrentThemeDisplay();
                
                // Dispatch theme change event for immediate UI update
                document.dispatchEvent(new CustomEvent('themeChanged', { 
                    detail: { themeId: selectedTheme.id } 
                }));
                
            } else {
                this.messageDisplay.showError('Failed to set website theme: ' + result.message, 'cmsSettingsMessageDiv');
            }
        } catch (error) {
            this.messageDisplay.showError('Error setting website theme: ' + error.message, 'cmsSettingsMessageDiv');
        }
    }
}
