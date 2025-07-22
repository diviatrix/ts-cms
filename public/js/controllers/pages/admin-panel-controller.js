import { AdminAPI, RecordsAPI, ThemesAPI, CmsSettingsAPI, apiFetch } from '../../core/api-client.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';

export default class AdminPanelController extends BasePageController {
    constructor(app) {
        super();
        this.app = app;
        this.container = document.getElementById('admin-panel-container');
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        this.render();
        await this.loadAllData();
    }

    render() {
        this.container.innerHTML = `
            <h2 class="page-title">Admin Panel</h2>
            <div class="card-grid">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Users</h3>
                        <div id="usersList">Loading...</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Settings</h3>
                        <div id="settingsList">Loading...</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Records</h3>
                        <div id="recordsList">Loading...</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Themes</h3>
                        <div id="themesList">Loading...</div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadAllData() {
        this.loadUsers();
        this.loadSettings();
        this.loadRecords();
        this.loadThemes();
    }

    async loadUsers() {
        await this.safeApiCall(
            () => AdminAPI.getUsers(),
            {
                successCallback: (data) => this.renderUsers(data),
                errorCallback: () => {
                    document.getElementById('usersList').innerHTML = '<p class="alert alert-danger">Failed to load users</p>';
                }
            }
        );
    }

    renderUsers(users) {
        const container = document.getElementById('usersList');
        if (!users.length) {
            container.innerHTML = '<p>No users found</p>';
            return;
        }
        
        container.innerHTML = users.map(user => `
            <div class="box">
                <div class="meta-row">
                    <span><strong>${user.login}</strong></span>
                    <span>${user.email}</span>
                </div>
                <div class="meta-row">
                    <span>Active: ${user.is_active ? 'Yes' : 'No'}</span>
                    <span>Created: ${new Date(user.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    async loadRecords() {
        await this.safeApiCall(
            () => RecordsAPI.getAll(),
            {
                successCallback: (data) => this.renderRecords(data),
                errorCallback: () => {
                    document.getElementById('recordsList').innerHTML = '<p class="alert alert-danger">Failed to load records</p>';
                }
            }
        );
    }

    renderRecords(records) {
        const container = document.getElementById('recordsList');
        
        container.innerHTML = `
            <p>${records.length} records found</p>
            <a href="/pages/records-manage-page.html" class="btn">Manage Records</a>
        `;
    }

    async loadThemes() {
        let appliedThemeId = null;
        
        // Load CMS settings to get applied theme
        await this.safeApiCall(
            () => CmsSettingsAPI.getAll(),
            {
                successCallback: (data) => {
                    const activeThemeSetting = data.find(s => s.setting_key === 'active_theme_id');
                    if (activeThemeSetting) {
                        appliedThemeId = activeThemeSetting.setting_value;
                    }
                }
            }
        );
        
        // Load all themes
        await this.safeApiCall(
            () => ThemesAPI.getAll(),
            {
                successCallback: (data) => this.renderThemes(data, appliedThemeId),
                errorCallback: () => {
                    document.getElementById('themesList').innerHTML = '<p class="alert alert-danger">Failed to load themes</p>';
                }
            }
        );
    }

    renderThemes(themes, appliedThemeId) {
        const container = document.getElementById('themesList');
        if (!themes.length) {
            container.innerHTML = '<p>No themes found</p>';
            return;
        }
        
        const appliedTheme = themes.find(t => t.id === appliedThemeId);
        const availableThemes = themes.filter(t => t.is_active && t.id !== appliedThemeId);
        
        container.innerHTML = `
            ${appliedTheme ? `
                <div class="box active-theme">
                    <div class="meta-row">
                        <span><strong>${appliedTheme.name}</strong></span>
                        <span class="badge badge-success">Applied</span>
                    </div>
                    <p class="text-muted">${appliedTheme.description || 'Currently applied to the website'}</p>
                </div>
            ` : '<p class="alert alert-warning">No theme is currently applied</p>'}
            
            <p class="text-muted">Manage themes to apply or write config</p>
            
            <div class="theme-actions">
                <a href="/pages/themes-manage-page.html" class="btn">Manage Themes</a>
            </div>
        `;
        
        window.adminPanel = this;
    }


    async loadSettings() {
        await this.safeApiCall(
            () => CmsSettingsAPI.getAll(),
            {
                successCallback: (data) => this.renderSettings(data),
                errorCallback: () => {
                    document.getElementById('settingsList').innerHTML = '<p class="alert alert-danger">Failed to load settings</p>';
                }
            }
        );
    }

    renderSettings(settings) {
        const container = document.getElementById('settingsList');
        if (!settings.length) {
            container.innerHTML = '<p>No settings found</p>';
            return;
        }
        
        const keySettings = settings.slice(0, 3);
        
        container.innerHTML = `
            ${keySettings.map(setting => `
                <div class="box">
                    <div class="meta-row">
                        <span><strong>${setting.setting_key}</strong></span>
                        <span>${setting.setting_value}</span>
                    </div>
                </div>
            `).join('')}
            <p>${settings.length} total settings</p>
            <a href="/pages/settings-page.html" class="btn">Manage Settings</a>
        `;
    }
}