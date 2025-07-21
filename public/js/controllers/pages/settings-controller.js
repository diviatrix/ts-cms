import { CmsSettingsAPI } from '../../core/api-client.js';

export default class SettingsController {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('settings-container');
        this.settings = [];
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        this.render();
        await this.loadSettings();
    }

    render() {
        this.container.innerHTML = `
            <h2 class="page-title">CMS Settings</h2>
            <div id="settingsContent">Loading...</div>
        `;
    }

    async loadSettings() {
        try {
            const response = await CmsSettingsAPI.getAll();
            if (response.success) {
                this.settings = response.data;
                this.renderSettings();
            }
        } catch (error) {
            document.getElementById('settingsContent').innerHTML = '<p class="alert alert-danger">Failed to load settings</p>';
        }
    }

    renderSettings() {
        const container = document.getElementById('settingsContent');
        
        const categories = {};
        this.settings.forEach(setting => {
            const category = setting.category || 'general';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(setting);
        });
        
        container.innerHTML = `
            <div class="card-grid">
                ${Object.entries(categories).map(([category, settings]) => `
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title">${this.formatCategoryName(category)}</h3>
                            ${settings.map(setting => this.renderSetting(setting)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        window.settingsManager = this;
    }

    renderSetting(setting) {
        const inputType = setting.setting_type === 'boolean' ? 'checkbox' : 'text';
        const value = setting.setting_type === 'boolean' ? '' : `value="${setting.setting_value}"`;
        const checked = setting.setting_type === 'boolean' && setting.setting_value === 'true' ? 'checked' : '';
        
        return `
            <div class="box">
                <label>${setting.setting_key}</label>
                ${setting.description ? `<small class="form-hint">${setting.description}</small>` : ''}
                <div class="meta-row">
                    <input type="${inputType}" ${value} ${checked} 
                           data-key="${setting.setting_key}" 
                           data-type="${setting.setting_type}"
                           id="setting-${setting.setting_key}">
                    <button class="btn" onclick="window.settingsManager.saveSetting('${setting.setting_key}')">Save</button>
                </div>
            </div>
        `;
    }

    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
    }

    async saveSetting(key) {
        const input = document.getElementById(`setting-${key}`);
        const button = input.parentElement.querySelector('.btn');
        const type = input.dataset.type;
        
        let value;
        if (type === 'boolean') {
            value = input.checked ? 'true' : 'false';
        } else {
            value = input.value;
        }
        
        try {
            const response = await CmsSettingsAPI.update(key, value, type);
            if (response.success) {
                button.textContent = 'Saved!';
                setTimeout(() => button.textContent = 'Save', 2000);
                
                const setting = this.settings.find(s => s.setting_key === key);
                if (setting) {
                    setting.setting_value = value;
                }
            } else {
                this.showMessage('Failed to save setting', 'error');
            }
        } catch (error) {
            this.showMessage('Failed to save setting', 'error');
        }
    }

    showMessage(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        alert.textContent = message;
        this.container.insertBefore(alert, this.container.firstChild.nextSibling);
        setTimeout(() => alert.remove(), 5000);
    }
}