import { CmsSettingsAPI } from '../../core/api-client.js';
import { BasePageController } from './base-page-controller.js';

export default class SettingsController extends BasePageController {
    constructor(app) {
        super();
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
        await this.safeApiCall(
            () => CmsSettingsAPI.getAll(),
            {
                successCallback: (data) => {
                    this.settings = data;
                    this.renderSettings();
                },
                errorCallback: () => {
                    document.getElementById('settingsContent').innerHTML = '<p class="alert alert-danger">Failed to load settings</p>';
                }
            }
        );
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
                    <div class="card-full-height">
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
        // Special handling for registration_mode setting
        if (setting.setting_key === 'registration_mode') {
            return `
                <div class="box">
                    <label>${setting.setting_key}</label>
                    ${setting.description ? `<small class="form-hint">${setting.description}</small>` : ''}
                    <div class="meta-row">
                        <select data-key="${setting.setting_key}" 
                                data-type="${setting.setting_type}"
                                id="setting-${setting.setting_key}">
                            <option value="OPEN" ${setting.setting_value === 'OPEN' ? 'selected' : ''}>Open Registration</option>
                            <option value="INVITE_ONLY" ${setting.setting_value === 'INVITE_ONLY' ? 'selected' : ''}>Invite Only</option>
                            <option value="CLOSED" ${setting.setting_value === 'CLOSED' ? 'selected' : ''}>Closed</option>
                        </select>
                        <button class="btn" onclick="window.settingsManager.saveSetting('${setting.setting_key}')">Save</button>
                    </div>
                </div>
            `;
        }

        // Default handling for other settings
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
        } else if (input.tagName.toLowerCase() === 'select') {
            value = input.value;
        } else {
            value = input.value;
        }
        
        await this.safeApiCall(
            () => CmsSettingsAPI.update(key, value, type),
            {
                successCallback: () => {
                    button.textContent = 'Saved!';
                    setTimeout(() => button.textContent = 'Save', 2000);
                    
                    const setting = this.settings.find(s => s.setting_key === key);
                    if (setting) {
                        setting.setting_value = value;
                    }

                    // Show additional info for registration mode changes
                    if (key === 'registration_mode') {
                        const modeDescriptions = {
                            'OPEN': 'Anyone can register without restrictions.',
                            'INVITE_ONLY': 'Users need an invite code to register.',
                            'CLOSED': 'Registration is completely disabled.'
                        };
                        this.showMessage(`Registration mode updated: ${modeDescriptions[value]}`, 'success');
                    }
                },
                errorCallback: () => {
                    this.showMessage('Failed to save setting', 'error');
                }
            }
        );
    }

    showMessage(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        alert.textContent = message;
        this.container.insertBefore(alert, this.container.firstChild.nextSibling);
        setTimeout(() => alert.remove(), 5000);
    }
}