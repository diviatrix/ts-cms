import { AdminAPI, RecordsAPI, ThemesAPI, CmsSettingsAPI } from '../../core/api-client.js';

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
        
        container.innerHTML = themes.map(theme => `
            <div class="box">
                <div class="meta-row">
                    <span><strong>${theme.name}</strong></span>
                    <span>${theme.is_active ? 'Active' : ''}</span>
                </div>
                <p>${theme.description || ''}</p>
                ${!theme.is_active ? `<button class="btn" onclick="window.adminPanel.activateTheme('${theme.id}')">Activate</button>` : ''}
            </div>
        `).join('');
        
        window.adminPanel = this;
    }

    async activateTheme(themeId) {
        try {
            const response = await ThemesAPI.setActive(themeId);
            if (response.success) {
                this.loadThemes();
            }
        } catch (error) {
            console.error('Failed to activate theme:', error);
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