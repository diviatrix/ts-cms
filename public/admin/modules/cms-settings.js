/**
 * CMS Settings Management Module
 * Handles CMS settings form and theme management
 */

import { apiFetch } from '../../js/api-client.js';
import { cmsIntegration } from '../../js/utils/cms-integration.js';
import { BaseAdminController } from './base-admin-controller.js';
import { applyThemeFromAPI } from '../../js/utils/theme-system.js';

export class CMSSettings extends BaseAdminController {
    constructor() {
        super({
            apiClient: {
                get: (url) => apiFetch(url),
                post: (url, data) => apiFetch(url, { method: 'POST', data }),
                put: (url, data) => apiFetch(url, { method: 'PUT', data }),
                delete: (url) => apiFetch(url, { method: 'DELETE' })
            }
        });
        this.availableThemes = [];
        this.currentTheme = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDownloadSettingsButton();
        this.loadCMSSettings(); // Always load settings/themes on init
    }

    setupEventListeners() {
        document.addEventListener('shown.bs.tab', (event) => {
            if (event.target.id === 'cms-settings-tab') {
                this.loadSettings();
                this.loadAvailableThemes();
            }
        });
        // Add event listener for Apply Theme button
        const applyBtn = document.getElementById('applyWebsiteTheme');
        const themeSelect = document.getElementById('activeThemeSelect');
        
        if (applyBtn && themeSelect) {
            applyBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const selectedThemeId = themeSelect.value;
                if (!selectedThemeId) return;
                applyBtn.setAttribute('aria-disabled', 'true');
                applyBtn.classList.add('disabled');
                try {
                    const response = await this.apiClient.put('/api/cms/active-theme', { theme_id: selectedThemeId });
                    if (response.success) {
                        console.log('Theme applied successfully!');
                        // Optionally reload the theme system
                        await applyThemeFromAPI();
                        this.loadCurrentWebsiteTheme();
                    } else {
                        console.error('Failed to apply theme: ' + response.message);
                    }
                } catch (error) {
                    console.error('Error applying theme: ' + (error?.message || error));
                } finally {
                    applyBtn.removeAttribute('aria-disabled');
                    applyBtn.classList.remove('disabled');
                }
            });
            // Enable/disable button on theme selection
            themeSelect.addEventListener('change', () => {
                if (themeSelect.value) {
                    applyBtn.removeAttribute('aria-disabled');
                    applyBtn.classList.remove('disabled');
                } else {
                    applyBtn.setAttribute('aria-disabled', 'true');
                    applyBtn.classList.add('disabled');
                }
            });
        }
    }

    setupDownloadSettingsButton() {
        const btn = document.getElementById('downloadSettingsJsonButton');
        if (btn) {
            btn.addEventListener('click', () => this.downloadSettings());
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
            console.error('Error loading CMS settings: ' + error.message);
        }
    }

    async loadSettings() {
        try {
            const response = await this.safeApiCall(
                () => this.apiClient.get('/api/cms/settings'),
                {
                    operationName: 'Load CMS Settings',
                    successCallback: (data) => {
                            this.populateSettingsForm(data);
                    }
                }
            );

            if (!response.success) { console.error('Failed to load settings: ' + response.message); }
        } catch (error) { console.error('Error loading settings:', error);}
    }

    populateSettingsForm(settings) {
        const fields = ['siteName', 'siteDescription', 'defaultUserRole'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && settings[field] !== undefined) { element.value = settings[field]; }
        });

        // Handle checkboxes
        const checkboxes = ['maintenanceMode', 'allowRegistration'];
        checkboxes.forEach(field => {
            const element = document.getElementById(field);
            if (element && settings[field] !== undefined) { element.checked = settings[field]; }
        });
    }

    async loadAvailableThemes() {
        try {
            const response = await this.safeApiCall(() => this.apiClient.get('/api/themes'), {
                operationName: 'Load Themes',
                successCallback: (data) => {
                    this.availableThemes = data || [];
                    this.populateThemeSelector();
                }
            });

            if (!response.success) { console.error('Failed to load themes: ' + response.message); }
        } catch (error) { console.error('Error loading themes:', error); }
    }

    populateThemeSelector() {
        const themeSelect = document.getElementById('activeThemeSelect');
        if (!themeSelect) return;

        // Clear existing options
        themeSelect.innerHTML = '<option value="">Select a theme...</option>';
        
        // Add theme options
        this.availableThemes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.name;
            themeSelect.appendChild(option);
        });
    }

    async loadCurrentWebsiteTheme() {
        const response = await this.safeApiCall(() => this.apiClient.get('/api/cms/active-theme'), {
            operationName: 'Load Current Website Theme',
            successCallback: (data) => {
                if (data) {
                    this.currentTheme = data;
                    this.updateCurrentThemeDisplay();
                    const themeSelect = document.getElementById('activeThemeSelect');
                    if (themeSelect) {
                        themeSelect.value = this.currentTheme.id;
                    }
                }
            }
        });

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
                            console.log(operationName + 'Default theme applied successfully');
                            this.currentTheme = defaultTheme;
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

        if (this.currentTheme && themeInfoElement && themeNameElement && themeDescElement) {
            themeNameElement.textContent = this.currentTheme.name;
            themeDescElement.textContent = this.currentTheme.description || 'No description available';
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

    async saveSettings() {
        try {
            const formData = this.getFormData();
            const response = await this.safeApiCall(
                () => this.apiClient.post('/api/cms/settings', formData),
                {
                    operationName: 'Save CMS Settings',
                    loadingElement: document.getElementById('saveGeneralSettings'),
                    loadingText: 'Saving...'
                }
            );
            if (response.success) {
                console.log('Settings saved successfully!');
                // Optionally, reload the settings or provide user feedback
                this.loadSettings();
            } else {
                console.error('Failed to save settings: ' + response.message);
            }
        } catch (error) {
            console.error('Error saving settings: ' + (error?.message || error));
        }
    }

    getFormData() {
        const fields = ['siteName', 'siteDescription', 'defaultUserRole'];
        const formData = {};
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) { formData[field] = element.value.trim(); }
        });

        // Handle checkboxes
        const checkboxes = ['maintenanceMode', 'allowRegistration'];
        checkboxes.forEach(field => {
            const element = document.getElementById(field);
            if (element) { formData[field] = element.checked; }
        });

        return formData;
    }

    async downloadSettings() {
        try {
            const response = await this.apiClient.get('/api/cms/settings/download');
            if (response && response.url) {
                // Create a link element to trigger the download
                const link = document.createElement('a');
                link.href = response.url;
                link.download = 'cms_settings.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error('Invalid response from server:', response);
            }
        } catch (error) {
            console.error('Error downloading settings:', error);
        }
    }
}
