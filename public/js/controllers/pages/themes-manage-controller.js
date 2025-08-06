import { ThemesAPI, CmsSettingsAPI, apiFetch } from '../../core/api-client.js';
import { applyThemeFromSettings } from '../../modules/theme-system.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';

export default class ThemesManageController extends BasePageController {
    constructor(app) {
        super();
        this.app = app;
        this.container = document.getElementById('themes-manage-container');
        this.themes = [];
        this.appliedThemeId = null; // The theme ID from cms settings
        this.previewTimer = null;
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        await this.loadThemes();
        await this.loadAppliedTheme();
        this.render();
    }

    async loadThemes() {
        await this.safeApiCall(
            () => ThemesAPI.getAll(),
            {
                successCallback: (data) => {
                    this.themes = data;
                },
                errorCallback: () => {
                    console.error('Failed to load themes');
                }
            }
        );
    }

    async loadAppliedTheme() {
        await this.safeApiCall(
            () => CmsSettingsAPI.getAll(),
            {
                successCallback: (data) => {
                    const activeThemeSetting = data.find(s => s.setting_key === 'active_theme_id');
                    if (activeThemeSetting) {
                        this.appliedThemeId = activeThemeSetting.setting_value;
                    }
                },
                errorCallback: () => {
                    console.error('Failed to load applied theme');
                }
            }
        );
    }

    render() {
        const availableThemes = this.themes.filter(t => t.is_active);
        const inactiveThemes = this.themes.filter(t => !t.is_active);
        
        this.container.innerHTML = `
            <div class="theme-management">
                <div class="theme-actions mb-2">
                    <button class="btn" onclick="window.themesManager.createNewTheme()">Create New Theme</button>
                    <a href="/admin" class="btn btn-secondary">Back to Admin</a>
                </div>
                
                <div id="preview-indicator" class="alert alert-info hidden">
                    <span>Preview Mode Active</span>
                    <button class="btn btn-sm ml-2" onclick="window.themesManager.applyPreview()">Apply Permanently</button>
                    <button class="btn btn-sm ml-1" onclick="window.themesManager.cancelPreview()">Cancel Preview</button>
                    <span class="ml-2" id="preview-timer"></span>
                </div>
                
                <div class="card card-full-height mb-2">
                    <div class="card-body">
                        <h3 class="card-title">Available Themes</h3>
                        <p class="text-muted">Themes that can be written to the frontend configuration.</p>
                        <div class="theme-grid">
                            ${availableThemes.length > 0 
                                ? availableThemes.map(theme => this.renderThemeCard(theme, 'available')).join('')
                                : '<p class="text-muted">No available themes. Activate a theme to make it available.</p>'
                            }
                        </div>
                    </div>
                </div>
                
                <div class="card card-full-height">
                    <div class="card-body">
                        <h3 class="card-title">Inactive Themes</h3>
                        <p class="text-muted">Themes that are not available for selection.</p>
                        <div class="theme-grid">
                            ${inactiveThemes.length > 0 
                                ? inactiveThemes.map(theme => this.renderThemeCard(theme, 'inactive')).join('')
                                : '<p class="text-muted">No inactive themes.</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        window.themesManager = this;
    }

    renderThemeCard(theme, state) {
        const isAvailable = theme.is_active;
        
        // Determine badge
        let badge = '';
        if (isAvailable) {
            badge = '<span class="badge badge-primary">Available</span>';
        } else {
            badge = '<span class="badge badge-secondary">Inactive</span>';
        }
        
        return `
            <div class="card theme-card">
                <div class="card-body">
                    <h3 class="card-title">${theme.name}</h3>
                    <p class="card-text text-muted">${theme.description || 'No description'}</p>
                    
                    <div class="theme-info mb-1">
                        <small class="text-muted">Created: ${new Date(theme.created_at).toLocaleDateString()}</small>
                        ${badge}
                    </div>
                    
                    ${this.renderThemePreviewColors(theme)}
                    
                    <div class="theme-actions">
                        ${state === 'available' ? `
                            <button class="btn btn-sm" onclick="window.themesManager.previewTheme('${theme.id}')">Preview</button>
                            <button class="btn btn-sm btn-primary" onclick="window.themesManager.writeThemeConfig('${theme.id}')">Write to Frontend</button>
                        ` : ''}
                        
                        <button class="btn btn-sm" onclick="window.themesManager.editTheme('${theme.id}')">Edit</button>
                        
                        ${state === 'inactive' ? `
                            <button class="btn btn-sm" onclick="window.themesManager.makeAvailable('${theme.id}')">Make Available</button>
                        ` : ''}
                        
                        ${state === 'available' ? `
                            <button class="btn btn-sm btn-secondary" onclick="window.themesManager.makeInactive('${theme.id}')">Make Inactive</button>
                        ` : ''}
                        
                        ${!theme.is_default ? `
                            <button class="btn btn-sm btn-danger" onclick="window.themesManager.deleteTheme('${theme.id}')">Delete</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderThemePreviewColors(theme) {
        // This will be populated when we have theme settings
        return '';
    }

    async previewTheme(themeId) {
        await this.safeApiCall(
            () => ThemesAPI.getSettings(themeId),
            {
                successCallback: (data) => {
                    // Store current theme for preview
                    this.previewingThemeId = themeId;
                    
                    // Apply theme settings
                    applyThemeFromSettings(data);
                    
                    // Show preview indicator
                    const indicator = document.getElementById('preview-indicator');
                    indicator.classList.remove('hidden');
                    
                    // Start 30 second timer
                    let timeLeft = 30;
                    const timerElement = document.getElementById('preview-timer');
                    
                    const updateTimer = () => {
                        timerElement.textContent = `(${timeLeft}s remaining)`;
                        timeLeft--;
                        
                        if (timeLeft < 0) {
                            this.cancelPreview();
                        }
                    };
                    
                    updateTimer();
                    this.previewTimer = setInterval(updateTimer, 1000);
                },
                errorCallback: () => {
                    notifications.error('Failed to preview theme');
                }
            }
        );
    }
    
    async applyPreview() {
        if (!this.previewingThemeId) return;
        
        // Clear timer
        if (this.previewTimer) {
            clearInterval(this.previewTimer);
            this.previewTimer = null;
        }
        
        // Apply the theme
        await this.applyTheme(this.previewingThemeId);
    }
    
    cancelPreview() {
        // Clear timer
        if (this.previewTimer) {
            clearInterval(this.previewTimer);
            this.previewTimer = null;
        }
        
        // Hide indicator
        const indicator = document.getElementById('preview-indicator');
        indicator.classList.add('hidden');
        
        // Reload to restore original theme
        window.location.reload();
    }

    
    async makeAvailable(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        if (!theme) return;
        
        theme.is_active = true;
        await this.safeApiCall(
            () => ThemesAPI.update(themeId, { 
                name: theme.name,
                description: theme.description,
                is_active: true 
            }),
            {
                successCallback: async () => {
                    notifications.success('Theme is now available for selection');
                    await this.loadThemes();
                    this.render();
                },
                errorCallback: () => {
                    notifications.error('Failed to update theme');
                }
            }
        );
    }
    
    async makeInactive(themeId) {
        const confirmed = await notifications.confirm('Make this theme inactive? It will no longer be available for selection.');
        if (!confirmed) return;
        
        const theme = this.themes.find(t => t.id === themeId);
        if (!theme) return;
        
        theme.is_active = false;
        await this.safeApiCall(
            () => ThemesAPI.update(themeId, { 
                name: theme.name,
                description: theme.description,
                is_active: false 
            }),
            {
                successCallback: async () => {
                    notifications.success('Theme is now inactive');
                    await this.loadThemes();
                    this.render();
                },
                errorCallback: () => {
                    notifications.error('Failed to update theme');
                }
            }
        );
    }

    editTheme(themeId) {
        window.location.href = `/theme-editor?id=${themeId}`;
    }

    createNewTheme() {
        window.location.href = '/theme-editor';
    }

    async deleteTheme(themeId) {
        const confirmed = await notifications.confirm('Are you sure you want to delete this theme? This action cannot be undone.');
        if (!confirmed) return;
        
        await this.safeApiCall(
            () => ThemesAPI.delete(themeId),
            {
                successCallback: async () => {
                    notifications.success('Theme deleted successfully');
                    await this.loadThemes();
                    this.render();
                },
                errorCallback: () => {
                    notifications.error('Failed to delete theme');
                }
            }
        );
    }
    
    async writeThemeConfig(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        if (!theme) {
            notifications.error('Theme not found');
            return;
        }
        
        const themeName = theme.name;
        
        notifications.info(`Writing "${themeName}" theme to frontend...`);
        
        await this.safeApiCall(
            () => apiFetch('/api/admin/theme/write-config', {
                method: 'PUT',
                data: { theme_id: themeId }
            }),
            {
                successCallback: async () => {
                    // Also update active_theme_id in CMS settings
                    await this.safeApiCall(
                        () => CmsSettingsAPI.update('active_theme_id', {
                            setting_value: themeId
                        }),
                        {
                            successCallback: () => {
                                notifications.success(`Theme "${themeName}" written to frontend and set as active!`);
                                // Reload to apply new theme
                                setTimeout(() => window.location.reload(), 1500);
                            },
                            errorCallback: () => {
                                notifications.error('Theme written but failed to update CMS settings');
                                setTimeout(() => window.location.reload(), 1500);
                            }
                        }
                    );
                },
                errorCallback: (response) => {
                    notifications.error('Failed to write theme config: ' + response.message);
                }
            }
        );
    }
}