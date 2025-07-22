import { ThemesAPI, CmsSettingsAPI } from '../../core/api-client.js';
import { applyThemeFromSettings } from '../../modules/theme-system.js';
import { notifications } from '../../modules/notifications.js';

export default class ThemesManageController {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('themesContent');
        this.themes = [];
        this.activeThemeId = null;
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        await this.loadThemes();
        this.render();
    }

    async loadThemes() {
        try {
            const response = await ThemesAPI.getAll();
            if (response.success) {
                this.themes = response.data;
                this.activeThemeId = this.themes.find(t => t.is_active)?.id;
            }
        } catch (error) {
            console.error('Failed to load themes:', error);
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="theme-management">
                <div class="theme-actions mb-2">
                    <button class="btn" onclick="window.themesManager.createNewTheme()">Create New Theme</button>
                    <a href="/pages/admin-page.html" class="btn btn-secondary">Back to Admin</a>
                </div>
                
                <div class="theme-grid">
                    ${this.themes.map(theme => this.renderThemeCard(theme)).join('')}
                </div>
            </div>
        `;
        
        window.themesManager = this;
    }

    renderThemeCard(theme) {
        const isActive = theme.id === this.activeThemeId;
        
        return `
            <div class="card theme-card ${isActive ? 'active-theme' : ''}">
                <div class="card-body">
                    <h3 class="card-title">${theme.name}</h3>
                    <p class="card-text text-muted">${theme.description || 'No description'}</p>
                    
                    <div class="theme-info mb-1">
                        <small class="text-muted">Created: ${new Date(theme.created_at).toLocaleDateString()}</small>
                        ${isActive ? '<span class="badge ml-1">Active</span>' : ''}
                    </div>
                    
                    <div class="theme-actions">
                        <button class="btn btn-sm" onclick="window.themesManager.previewTheme('${theme.id}')">Preview</button>
                        <button class="btn btn-sm" onclick="window.themesManager.editTheme('${theme.id}')">Edit</button>
                        ${!isActive ? `<button class="btn btn-sm" onclick="window.themesManager.activateTheme('${theme.id}')">Activate</button>` : ''}
                        ${!theme.is_default && !isActive ? `<button class="btn btn-sm btn-danger" onclick="window.themesManager.deleteTheme('${theme.id}')">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async previewTheme(themeId) {
        try {
            const response = await ThemesAPI.getSettings(themeId);
            if (response.success) {
                applyThemeFromSettings(response.data);
                
                // Show preview notification with reset button
                const notification = notifications.show('Previewing theme.', 'success', 0);
                const resetBtn = document.createElement('button');
                resetBtn.className = 'btn btn-sm ml-2';
                resetBtn.textContent = 'Reset';
                resetBtn.onclick = () => window.location.reload();
                notification.appendChild(resetBtn);
                
                setTimeout(() => notification.remove(), 5000);
            }
        } catch (error) {
            console.error('Failed to preview theme:', error);
        }
    }

    async activateTheme(themeId) {
        const confirmed = await notifications.confirm('Are you sure you want to activate this theme?');
        if (!confirmed) return;
        
        try {
            const response = await CmsSettingsAPI.setActiveTheme(themeId);
            if (response.success) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to activate theme:', error);
            notifications.error('Failed to activate theme');
        }
    }

    editTheme(themeId) {
        window.location.href = `/pages/theme-editor-page.html?id=${themeId}`;
    }

    createNewTheme() {
        window.location.href = '/pages/theme-editor-page.html';
    }

    async deleteTheme(themeId) {
        const confirmed = await notifications.confirm('Are you sure you want to delete this theme? This action cannot be undone.');
        if (!confirmed) return;
        
        try {
            const response = await ThemesAPI.delete(themeId);
            if (response.success) {
                notifications.success('Theme deleted successfully');
                await this.loadThemes();
                this.render();
            }
        } catch (error) {
            console.error('Failed to delete theme:', error);
            notifications.error('Failed to delete theme');
        }
    }
}