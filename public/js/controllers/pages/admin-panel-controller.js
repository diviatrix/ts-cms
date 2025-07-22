import { AdminAPI, RecordsAPI, ThemesAPI, CmsSettingsAPI, apiFetch } from '../../core/api-client.js';
import { notifications } from '../../modules/notifications.js';

export default class AdminPanelController {
    constructor(app) {
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
        try {
            const response = await AdminAPI.getUsers();
            if (response.success) {
                this.renderUsers(response.data);
            }
        } catch (error) {
            document.getElementById('usersList').innerHTML = '<p class="alert alert-danger">Failed to load users</p>';
        }
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
        try {
            const response = await RecordsAPI.getAll();
            if (response.success) {
                this.renderRecords(response.data);
            }
        } catch (error) {
            document.getElementById('recordsList').innerHTML = '<p class="alert alert-danger">Failed to load records</p>';
        }
    }

    renderRecords(records) {
        const container = document.getElementById('recordsList');
        
        container.innerHTML = `
            <p>${records.length} records found</p>
            <a href="/pages/records-manage-page.html" class="btn">Manage Records</a>
        `;
    }

    async loadThemes() {
        try {
            const response = await ThemesAPI.getAll();
            if (response.success) {
                this.renderThemes(response.data);
            }
        } catch (error) {
            document.getElementById('themesList').innerHTML = '<p class="alert alert-danger">Failed to load themes</p>';
        }
    }

    renderThemes(themes) {
        const container = document.getElementById('themesList');
        if (!themes.length) {
            container.innerHTML = '<p>No themes found</p>';
            return;
        }
        
        const activeTheme = themes.find(t => t.is_active);
        const inactiveThemes = themes.filter(t => !t.is_active);
        
        container.innerHTML = `
            ${activeTheme ? `
                <div class="box active-theme">
                    <div class="meta-row">
                        <span><strong>${activeTheme.name}</strong></span>
                        <span class="badge">Active</span>
                    </div>
                    <p class="text-muted">${activeTheme.description || 'Currently active theme'}</p>
                </div>
            ` : ''}
            
            ${inactiveThemes.length > 0 ? `
                <label for="theme-select">Change Theme:</label>
                <select id="theme-select" class="form-control">
                    <option value="">Select a theme...</option>
                    ${inactiveThemes.map(theme => `
                        <option value="${theme.id}">${theme.name}</option>
                    `).join('')}
                </select>
            ` : ''}
            
            <div class="theme-actions">
                <button class="btn" onclick="window.adminPanel.applySelectedTheme()">Apply Theme</button>
                <button class="btn btn-secondary" onclick="window.adminPanel.writeFrontConfig()">Write Front Config</button>
                <a href="/pages/themes-manage-page.html" class="btn btn-secondary">Manage Themes</a>
            </div>
        `;
        
        window.adminPanel = this;
    }

    async activateTheme(themeId) {
        try {
            const response = await apiFetch('/api/cms/active-theme', {
                method: 'PUT',
                data: { theme_id: themeId }
            });
            if (response.success) {
                this.loadThemes();
                // Apply theme immediately
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to activate theme:', error);
            notifications.error('Failed to activate theme');
        }
    }
    
    async applySelectedTheme() {
        const select = document.getElementById('theme-select');
        if (!select || !select.value) {
            notifications.error('Please select a theme');
            return;
        }
        await this.activateTheme(select.value);
    }
    
    async writeFrontConfig() {
        try {
            const response = await apiFetch('/api/admin/theme/write-config', {
                method: 'PUT'
            });
            
            if (response.success) {
                notifications.success('Theme config written to frontend successfully!');
                // Reload to apply new config
                setTimeout(() => window.location.reload(), 1500);
            } else {
                notifications.error('Failed to write theme config: ' + response.message);
            }
        } catch (error) {
            console.error('Failed to write theme config:', error);
            notifications.error('Error writing theme config');
        }
    }

    async loadSettings() {
        try {
            const response = await CmsSettingsAPI.getAll();
            if (response.success) {
                this.renderSettings(response.data);
            }
        } catch (error) {
            document.getElementById('settingsList').innerHTML = '<p class="alert alert-danger">Failed to load settings</p>';
        }
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