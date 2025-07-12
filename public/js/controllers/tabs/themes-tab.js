import { ThemesAPI, isAuthenticated } from '../../core/api-client.js';
import { BaseTabController } from './base-tab-controller.js';
import { TabManager } from '../../components/tab-manager.js';
import { showConfirmationDialog } from '../../utils/dialogs.js';
import { applyThemeFromAPI } from '../../modules/theme-system.js';

export class ThemesTab extends BaseTabController {
    constructor(container) {
        super(container, '/partials/themes-tab.html');
        this.themes = [];
        this.elements = {};
        this.tabManager = null;
    }

    async init() {
        this.setupTabManager();
        this.addEventListeners();
        await this.loadThemes();
    }

    setupTabManager() {
        const tabContainer = this.container.querySelector('#theme-management-tabs');
        const tabConfig = {
            initialTab: 'list',
            tabs: [
                {
                    id: 'list',
                    label: 'Theme List',
                    loader: (panel) => this.renderThemeList(panel)
                },
                {
                    id: 'edit',
                    label: 'Edit Theme',
                    loader: (panel) => this.renderEditForm(panel)
                }
            ]
        };
        this.tabManager = new TabManager(tabContainer, tabConfig);
        this.tabManager.navContainer.querySelector('[data-tab-id="edit"]').style.display = 'none';
    }

    addEventListeners() {
        this.container.addEventListener('click', async (e) => {
            const newBtn = e.target.closest('#newThemeButton');
            const editBtn = e.target.closest('.edit-theme-btn');
            const saveBtn = e.target.closest('#themeSaveButton');
            const deleteBtn = e.target.closest('#themeDeleteButton');
            const previewBtn = e.target.closest('#themePreviewButton');
            const cancelBtn = e.target.closest('#themeCancelButton');

            if (newBtn) this.handleNewTheme();
            else if (editBtn) this.handleEditTheme(editBtn.dataset.themeId);
            else if (saveBtn) this.handleSaveTheme();
            else if (deleteBtn) this.handleDeleteTheme();
            else if (previewBtn) this.handlePreviewTheme();
            else if (cancelBtn) this.tabManager.activateTab('list');
        });
    }

    async loadThemes() {
        if (!isAuthenticated()) return;
        const response = await ThemesAPI.getAll();
        if (response.success) {
            this.themes = response.data || [];
            const listPanel = this.tabManager.loadedTabs.get('list')?.panel;
            if (listPanel && this.tabManager.activeTabId === 'list') {
                this.renderThemeList(listPanel);
            }
        } else {
            this.showMessage('Failed to load themes.', false);
        }
    }

    async renderThemeList(panel) {
        const response = await fetch('/partials/themes/list.html');
        panel.innerHTML = await response.text();
        const container = panel.querySelector('#themeListContainer');
        if (this.themes.length === 0) {
            container.innerHTML = '<p>No themes found.</p>';
            return;
        }
        container.innerHTML = this.themes.map(theme => this.renderThemeCard(theme)).join('');
    }

    renderThemeCard(theme) {
        return `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${theme.name}</h5>
                    <p class="card-text">${theme.description || 'No description'}</p>
                    <div class="admin-card-meta">
                        <span>${theme.is_active ? 'Active' : 'Inactive'}</span>
                        <span style="flex: 1"></span>
                        <button class="btn edit-theme-btn" data-theme-id="${theme.id}">Edit</button>
                    </div>
                </div>
            </div>
        `;
    }

    async renderEditForm(panel, theme = null) {
        const response = await fetch('/partials/themes/edit.html');
        panel.innerHTML = await response.text();
        this.cacheEditFormElements(panel);

        if (theme) {
            this.populateEditForm(theme);
            const settingsResponse = await ThemesAPI.getSettings(theme.id);
            if (settingsResponse.success) {
                this.populateThemeSettings(settingsResponse.data);
            }
        } else {
            this.populateEditForm({ name: 'New Theme' });
            this.populateThemeSettings({}); // Defaults will be set
        }
    }

    cacheEditFormElements(panel) {
        const settingIds = [
            'themeName', 'themeDescription', 'themeIsActive', 'themeMessageDiv',
            'primaryColor', 'secondaryColor', 'backgroundColor', 'surfaceColor',
            'textColor', 'borderColor', 'textSecondary', 'textMuted', 'fontFamily',
            'faviconUrl', 'logoUrl', 'customCss', 'footerText', 'footerLinks', 'menuLinks'
        ];
        settingIds.forEach(id => {
            this.elements[id] = panel.querySelector(`#${id}`);
        });
        this.elements.themeInfo = panel.querySelector('#themeInfo');
    }

    populateEditForm(theme) {
        this.elements.themeInfo.dataset.currentThemeId = theme.id || '';
        this.elements.themeName.value = theme.name || '';
        this.elements.themeDescription.value = theme.description || '';
        this.elements.themeIsActive.checked = theme.is_active || false;
    }

    populateThemeSettings(settings) {
        const defaults = {
            primaryColor: '#00FF00', secondaryColor: '#FFD700', backgroundColor: '#222222',
            surfaceColor: '#444444', textColor: '#E0E0E0', borderColor: '#00FF00',
            textSecondary: '#C0C0C0', textMuted: '#A0A0A0', fontFamily: "'Share Tech Mono', monospace",
            faviconUrl: '', logoUrl: '', customCss: '', footerText: '', footerLinks: '', menuLinks: ''
        };
        for (const key in defaults) {
            if (this.elements[key] && typeof this.elements[key].value !== 'undefined') {
                this.elements[key].value = settings[key] || defaults[key];
            }
        }
    }

    async handleEditTheme(themeId) {
        const theme = this.themes.find(t => t.id === parseInt(themeId));
        if (theme) {
            await this.tabManager.activateTab('edit');
            const editPanel = this.tabManager.loadedTabs.get('edit')?.panel;
            if (editPanel) {
                await this.renderEditForm(editPanel, theme);
            }
        }
    }

    async handleNewTheme() {
        await this.tabManager.activateTab('edit');
        const editPanel = this.tabManager.loadedTabs.get('edit')?.panel;
        if (editPanel) {
            await this.renderEditForm(editPanel, null);
        }
    }

    getThemeDataFromForm() {
        const settingsData = {};
        const settingIds = [
            'primaryColor', 'secondaryColor', 'backgroundColor', 'surfaceColor',
            'textColor', 'borderColor', 'textSecondary', 'textMuted', 'fontFamily',
            'faviconUrl', 'logoUrl', 'customCss', 'footerText', 'footerLinks', 'menuLinks'
        ];
        settingIds.forEach(id => {
            settingsData[id] = this.elements[id].value;
        });

        return {
            name: this.elements.themeName.value,
            description: this.elements.themeDescription.value,
            is_active: this.elements.themeIsActive.checked,
            settings: settingsData
        };
    }

    async handleSaveTheme() {
        const themeId = this.elements.themeInfo.dataset.currentThemeId;
        const themeData = this.getThemeDataFromForm();

        const response = themeId
            ? await ThemesAPI.update(themeId, themeData)
            : await ThemesAPI.create(themeData);

        if (response.success) {
            this.showMessage('Theme saved successfully.', true);
            if (themeData.is_active) await applyThemeFromAPI();
            await this.loadThemes();
            this.tabManager.activateTab('list');
        } else {
            this.showMessage(`Failed to save theme: ${response.message}`, false);
        }
    }

    async handleDeleteTheme() {
        const themeId = this.elements.themeInfo.dataset.currentThemeId;
        if (!themeId) return;
        const theme = this.themes.find(t => t.id === parseInt(themeId));
        if (!theme) return;

        const confirmed = await showConfirmationDialog(`Are you sure you want to delete the theme "${theme.name}"?`);
        if (!confirmed) return;

        const response = await ThemesAPI.delete(themeId);
        if (response.success) {
            this.showMessage('Theme deleted successfully.', true);
            await this.loadThemes();
            this.tabManager.activateTab('list');
        } else {
            this.showMessage(`Failed to delete theme: ${response.message}`, false);
        }
    }

    handlePreviewTheme() {
        const { settings } = this.getThemeDataFromForm();
        const styleId = 'theme-preview-style';
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        styleElement.innerHTML = `
            :root {
                --theme-primary-color: ${settings.primaryColor};
                --theme-secondary-color: ${settings.secondaryColor};
                --theme-background-color: ${settings.backgroundColor};
                --theme-surface-color: ${settings.surfaceColor};
                --theme-text-color: ${settings.textColor};
                --theme-border-color: ${settings.borderColor};
                --theme-font-family: ${settings.fontFamily};
            }
        `;
        this.showMessage('Preview applied. Save to make it permanent.', true);
    }

    showMessage(message, isSuccess) {
        if (this.elements.themeMessageDiv) {
            this.elements.themeMessageDiv.textContent = message;
            this.elements.themeMessageDiv.className = isSuccess ? 'message success' : 'message error';
            setTimeout(() => this.elements.themeMessageDiv.textContent = '', 3000);
        }
   }

    // Cleanup method for tab switching
    destroy() {
        // Remove all event listeners from this.container
        this.container.replaceWith(this.container.cloneNode(true));
        this.elements = {};
    }
}