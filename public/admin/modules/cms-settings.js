/**
 * CMS Settings Management Module for Admin Panel
 */

import { apiClient } from '/js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler, errorHandler, messages } from '/js/ui-utils.js';
import { cmsIntegration } from '/js/utils/cms-integration.js';

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
        this.setupCharacterCounters();
        // Don't load settings immediately - wait for tab activation
    }

    bindEvents() {
        // Save general settings button
        document.getElementById('saveGeneralSettings')?.addEventListener('click', () => {
            this.saveGeneralSettings();
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
            messages.error('Error loading CMS settings: ' + error.message, { toast: true });
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
                messages.error('Failed to load settings: ' + result.message, { toast: true });
            }
        } catch (error) {
            messages.error('Error loading settings: ' + error.message, { toast: true });
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
        try {
            const result = await this.apiClient.get('/themes');
            if (result.success) {
                this.availableThemes = result.data;
                this.populateThemeSelector();
            } else {
                messages.error('Failed to load themes: ' + result.message, { toast: true });
            }
        } catch (error) {
            messages.error('Error loading themes: ' + error.message, { toast: true });
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
        
        try {
            // Set loading state
            if (saveButton) {
                loadingManager.setLoading(saveButton, true, 'Saving...');
            }
            if (applyButton) {
                applyButton.disabled = true;
            }

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
                messages.error('Validation errors: ' + errors.join(', '), { toast: true });
                return;
            }

            const settings = {
                site_name: siteName,
                site_description: siteDescription
            };

            let allSuccessful = true;
            const saveErrors = [];

            // Save each setting individually
            for (const [key, value] of Object.entries(settings)) {
                try {
                    const result = await this.apiClient.put(`/cms/settings/${key}`, { value, type: 'string' });
                    
                    if (!result.success) {
                        allSuccessful = false;
                        saveErrors.push(`Failed to save ${key}: ${result.message}`);
                    }
                } catch (error) {
                    allSuccessful = false;
                    saveErrors.push(`Error saving ${key}: ${error.message}`);
                }
            }

            if (allSuccessful) {
                messages.success('General settings saved successfully', { toast: true });
                // Reload settings to reflect changes
                await this.loadSettings();
                // Refresh CMS integration across all pages
                await cmsIntegration.refresh();
            } else {
                messages.error('Some settings failed to save: ' + saveErrors.join(', '), { toast: true });
            }

        } catch (error) {
            messages.error('Error saving general settings: ' + error.message, { toast: true });
        } finally {
            // Clear loading state
            if (saveButton) {
                loadingManager.setLoading(saveButton, false);
            }
            if (applyButton) {
                applyButton.disabled = false;
            }
        }
    }



    async applyWebsiteTheme() {
        const themeSelect = document.getElementById('activeThemeSelect');
        const applyButton = document.getElementById('applyWebsiteTheme');
        const saveButton = document.getElementById('saveGeneralSettings');
        
        if (!themeSelect || !themeSelect.value) {
            messages.warning('Please select a theme to apply', { toast: true });
            return;
        }

        const selectedTheme = this.availableThemes.find(theme => theme.id === themeSelect.value);
        if (!selectedTheme) {
            messages.error('Selected theme not found', { toast: true });
            return;
        }

        if (this.currentWebsiteTheme && this.currentWebsiteTheme.id === selectedTheme.id) {
            messages.info('This theme is already the active website theme', { toast: true });
            return;
        }

        if (!confirm(`Are you sure you want to set "${selectedTheme.name}" as the website theme? This will change the appearance for all visitors.`)) {
            return;
        }

        try {
            // Set loading state
            if (applyButton) {
                loadingManager.setLoading(applyButton, true, 'Applying...');
            }
            if (saveButton) {
                saveButton.disabled = true;
            }

            const result = await this.apiClient.put('/cms/active-theme', { theme_id: selectedTheme.id });
            
            if (result.success) {
                messages.success(`Website theme set to "${selectedTheme.name}" successfully`, { toast: true });
                
                // Update current theme info
                this.currentWebsiteTheme = selectedTheme;
                this.updateCurrentThemeDisplay();
                
                // Dispatch theme change event for immediate UI update
                document.dispatchEvent(new CustomEvent('themeChanged', { 
                    detail: { themeId: selectedTheme.id } 
                }));
                
            } else {
                messages.error('Failed to set website theme: ' + result.message, { toast: true });
            }
        } catch (error) {
            messages.error('Error setting website theme: ' + error.message, { toast: true });
        } finally {
            // Clear loading state
            if (applyButton) {
                loadingManager.setLoading(applyButton, false);
            }
            if (saveButton) {
                saveButton.disabled = false;
            }
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
