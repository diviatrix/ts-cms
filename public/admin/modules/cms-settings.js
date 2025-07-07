/**
 * CMS Settings Management Module
 * Handles CMS settings form and theme management
 */

import { apiClient } from '../../js/api-core.js';
import { messages } from '../../js/utils/index.js';
import { cmsIntegration } from '../../js/utils/cms-integration.js';
import { BaseAdminController } from './base-admin-controller.js';
import { ConfirmationDialog } from '../../js/utils/dialogs.js';

export class CMSSettings extends BaseAdminController {
    constructor() {
        super({
            apiClient
        });
        this.availableThemes = [];
        this.currentTheme = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDownloadSettingsButton();
        this.setupMessageRenderer();
        this.loadCMSSettings(); // Always load settings/themes on init
    }

    setupEventListeners() {
        document.addEventListener('shown.bs.tab', (event) => {
            if (event.target.id === 'cms-settings-tab') {
                this.loadSettings();
                this.loadAvailableThemes();
            }
        });
    }

    setupDownloadSettingsButton() {
        const btn = document.getElementById('downloadSettingsJsonButton');
        if (btn) {
            btn.addEventListener('click', () => this.downloadSettings());
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
        try {
            const response = await this.safeApiCall(
                () => this.apiClient.get('/cms/settings'),
                {
                    operationName: 'Load CMS Settings',
                    successCallback: (data) => {
                        this.populateSettingsForm(data);
                    }
                }
            );

            if (!response.success) {
                messages.showError('Failed to load settings: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    populateSettingsForm(settings) {
        const fields = ['siteName', 'siteDescription', 'defaultUserRole'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && settings[field] !== undefined) {
                element.value = settings[field];
            }
        });

        // Handle checkboxes
        const checkboxes = ['maintenanceMode', 'allowRegistration'];
        checkboxes.forEach(field => {
            const element = document.getElementById(field);
            if (element && settings[field] !== undefined) {
                element.checked = settings[field];
            }
        });
    }

    async loadAvailableThemes() {
        try {
            const response = await this.safeApiCall(
                () => this.apiClient.get('/themes'),
                {
                    operationName: 'Load Themes',
                    successCallback: (data) => {
                        this.availableThemes = data || [];
                        this.populateThemeSelector();
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
        const response = await this.safeApiCall(
            () => this.apiClient.get('/cms/active-theme'),
            {
                operationName: 'Load Current Website Theme',
                successCallback: (data) => {
                    if (data) {
                        this.currentTheme = data;
                        this.updateCurrentThemeDisplay();
                        
                        // Update theme selector
                        const themeSelect = document.getElementById('activeThemeSelect');
                        if (themeSelect) {
                            themeSelect.value = this.currentTheme.id;
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
                () => this.apiClient.post('/cms/settings', formData),
                {
                    operationName: 'Save CMS Settings',
                    loadingElement: document.getElementById('saveGeneralSettings'),
                    loadingText: 'Saving...'
                }
            );
            if (response.success) {
                messages.showSuccess('Settings saved successfully');
                await this.loadSettings();
                await cmsIntegration.refresh();
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            messages.showError('Failed to save settings');
        }
    }

    getFormData() {
        const data = {};
        const fields = ['siteName', 'siteDescription', 'defaultUserRole'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                data[field] = element.value;
            }
        });

        const checkboxes = ['maintenanceMode', 'allowRegistration'];
        checkboxes.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                data[field] = element.checked;
            }
        });

        return data;
    }

    downloadSettings() {
        try {
            const data = this.getFormData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cms-settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading settings:', error);
            messages.showError('Failed to download settings');
        }
    }
}
