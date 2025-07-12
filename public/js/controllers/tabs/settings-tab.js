import { CmsSettingsAPI, ThemesAPI, isAuthenticated } from '../../core/api-client.js';
import { BaseTabController } from './base-tab-controller.js';
import { applyThemeFromAPI } from '../../modules/theme-system.js';

export class SettingsTab extends BaseTabController {
    constructor(container) {
        super(container, '/partials/settings-tab.html');
        this.elements = {};
        this.availableThemes = [];
    }

    init() {
        this.cacheDOMElements();
        this.setupEventListeners();
        this.loadInitialData();
    }

    cacheDOMElements() {
        const form = this.container.querySelector('#cmsSettingsForm');
        this.elements = {
            form,
            activeThemeSelect: form.querySelector('#activeThemeSelect'),
            currentThemeInfo: form.querySelector('#currentThemeInfo'),
            currentThemeName: form.querySelector('#currentThemeName'),
            currentThemeDescription: form.querySelector('#currentThemeDescription'),
            messageDiv: form.querySelector('#settingsMessageDiv'),
        };
    }

    setupEventListeners() {
        this.elements.form.addEventListener('click', (e) => {
            const targetId = e.target.id;
            if (targetId === 'applyWebsiteTheme') this.applyTheme();
            else if (targetId === 'saveGeneralSettings') this.saveSettings();
            else if (targetId === 'downloadSettingsJsonButton') this.downloadSettings();
        });

        this.elements.activeThemeSelect.addEventListener('change', () => {
            this.updateCurrentThemeDisplay(this.elements.activeThemeSelect.value);
        });
    }

    async loadInitialData() {
        if (!isAuthenticated()) return;
        const settingsPromise = CmsSettingsAPI.getAll();
        const themesPromise = ThemesAPI.getAll();
        const [settingsResponse, themesResponse] = await Promise.all([settingsPromise, themesPromise]);

        if (themesResponse.success) {
            this.availableThemes = themesResponse.data || [];
            this.populateThemeSelector();
        }

        if (settingsResponse.success) {
            this.populateSettingsForm(settingsResponse.data);
        } else {
            this.showMessage('Failed to load CMS settings.', false);
        }
    }

    populateSettingsForm(settings) {
        const form = this.elements.form;
        form.siteName.value = settings.siteName || '';
        form.siteDescription.value = settings.siteDescription || '';
        form.maintenanceMode.checked = settings.maintenanceMode || false;
        form.allowRegistration.checked = settings.allowRegistration || false;
        form.defaultUserRole.value = settings.defaultUserRole || 'user';
        if (settings.activeTheme) {
            form.activeThemeSelect.value = settings.activeTheme;
            this.updateCurrentThemeDisplay(settings.activeTheme);
        }
    }

    populateThemeSelector() {
        this.elements.activeThemeSelect.innerHTML = '<option value="">Select a theme</option>';
        this.availableThemes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.name;
            this.elements.activeThemeSelect.appendChild(option);
        });
    }

    updateCurrentThemeDisplay(themeId) {
        const theme = this.availableThemes.find(t => t.id === parseInt(themeId));
        if (theme) {
            this.elements.currentThemeName.textContent = theme.name;
            this.elements.currentThemeDescription.textContent = theme.description || 'No description.';
            this.elements.currentThemeInfo.style.display = 'block';
        } else {
            this.elements.currentThemeInfo.style.display = 'none';
        }
    }

    async applyTheme() {
        const themeId = this.elements.activeThemeSelect.value;
        if (!themeId) return;
        
        const response = await ThemesAPI.setActive(themeId);
        if (response.success) {
            await applyThemeFromAPI();
            this.updateCurrentThemeDisplay(themeId);
            this.showMessage('Theme applied successfully.', true);
        } else {
            this.showMessage('Failed to apply theme.', false);
        }
    }

    async saveSettings() {
        const formData = new FormData(this.elements.form);
        const settings = {
            siteName: formData.get('siteName'),
            siteDescription: formData.get('siteDescription'),
            maintenanceMode: this.elements.form.maintenanceMode.checked,
            allowRegistration: this.elements.form.allowRegistration.checked,
            defaultUserRole: formData.get('defaultUserRole'),
            activeTheme: formData.get('activeTheme'),
        };

        const responses = await Promise.all(
            Object.entries(settings).map(([key, value]) => CmsSettingsAPI.update(key, value))
        );

        if (responses.every(r => r.success)) {
            this.showMessage('Settings saved successfully.', true);
        } else {
            this.showMessage('An error occurred while saving settings.', false);
        }
    }

    async downloadSettings() {
        const response = await CmsSettingsAPI.getAll();
        if (response.success) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "cms-settings.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    }

    showMessage(message, isSuccess) {
        this.elements.messageDiv.textContent = message;
        this.elements.messageDiv.className = isSuccess ? 'message success' : 'message error';
        setTimeout(() => this.elements.messageDiv.textContent = '', 3000);
   }

    // Cleanup method for tab switching
    destroy() {
        // Remove all event listeners from this.container
        this.container.replaceWith(this.container.cloneNode(true));
        this.elements = {};
    }
}