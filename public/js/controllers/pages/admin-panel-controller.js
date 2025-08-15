import { AdminAPI, RecordsAPI, ThemesAPI, CmsSettingsAPI, apiFetch } from '../../core/api-client.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';
import { Validation } from '../../utils/validation.js';
import { cacheManager } from '../../utils/cache-manager.js';
import { lazyLoader } from '../../utils/lazy-loader.js';

export default class AdminPanelController extends BasePageController {
  constructor(app) {
    super();
    this.app = app;
    this.container = document.getElementById('admin-panel-container');
    this.cacheKey = 'admin-panel-data';
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
                <div class="card card-full-height">
                    <div class="card-body">
                        <h3 class="card-title">Users</h3>
                        <div id="usersList">Loading...</div>
                    </div>
                </div>
                <div class="card card-full-height">
                    <div class="card-body">
                        <h3 class="card-title">Invites</h3>
                        <div id="invitesList">Loading...</div>
                    </div>
                </div>
                <div class="card card-full-height">
                    <div class="card-body">
                        <h3 class="card-title">Themes</h3>
                        <div id="themesList">Loading...</div>
                    </div>
                </div>
                <div class="card card-full-height">
                    <div class="card-body">
                        <h3 class="card-title">Settings</h3>
                        <div id="settingsList">Loading...</div>
                    </div>
                </div>
                <div class="card card-full-height">
                    <div class="card-body">
                        <h3 class="card-title">Records</h3>
                        <div id="recordsList">Loading...</div>
                    </div>
                </div>
            </div>
        `;
  }

  async loadAllData() {
    // Try to load from cache first
    const cachedData = cacheManager.get(this.cacheKey);
    if (cachedData) {
      this.renderUsers(cachedData.users);
      this.renderInvites(cachedData.invites);
      this.renderRecords(cachedData.records);
      this.renderThemes(cachedData.themes, cachedData.appliedThemeId);
      this.renderSettings(cachedData.settings);
      return;
    }

    // Load data with skeleton loading
    const usersElement = document.getElementById('usersList');
    const invitesElement = document.getElementById('invitesList');
    const recordsElement = document.getElementById('recordsList');
    const themesElement = document.getElementById('themesList');
    const settingsElement = document.getElementById('settingsList');

    await this.setMultipleLoading([usersElement, invitesElement, recordsElement, themesElement, settingsElement], true, '', 'skeleton');

    try {
      // Load all data in parallel
      const [usersResponse, invitesResponse, recordsResponse, settingsResponse, themesResponse] = await Promise.all([
        AdminAPI.getUsers(),
        AdminAPI.getInvites(),
        RecordsAPI.getAll(),
        CmsSettingsAPI.getAll(),
        ThemesAPI.getAll()
      ]);

      // Extract applied theme ID from settings
      let appliedThemeId = null;
      if (settingsResponse.success) {
        const activeThemeSetting = settingsResponse.data.find(s => s.setting_key === 'active_theme_id');
        if (activeThemeSetting) {
          appliedThemeId = activeThemeSetting.setting_value;
        }
      }

      // Cache the data for 5 minutes
      cacheManager.set(this.cacheKey, {
        users: usersResponse.data,
        invites: invitesResponse.data,
        records: recordsResponse.data,
        themes: themesResponse.data,
        settings: settingsResponse.data,
        appliedThemeId: appliedThemeId
      }, 300000); // 5 minutes

      // Render the data
      this.renderUsers(usersResponse.data);
      this.renderInvites(invitesResponse.data);
      this.renderRecords(recordsResponse.data);
      this.renderThemes(themesResponse.data, appliedThemeId);
      this.renderSettings(settingsResponse.data);
    } catch (error) {
      this.handleNetworkErrorMessage(error);
            
      // Show error states
      usersElement.innerHTML = '<p class="alert alert-danger">Failed to load users</p>';
      invitesElement.innerHTML = '<p class="alert alert-danger">Failed to load invites</p>';
      recordsElement.innerHTML = '<p class="alert alert-danger">Failed to load records</p>';
      themesElement.innerHTML = '<p class="alert alert-danger">Failed to load themes</p>';
      settingsElement.innerHTML = '<p class="alert alert-danger">Failed to load settings</p>';
    } finally {
      await this.setMultipleLoading([usersElement, invitesElement, recordsElement, themesElement, settingsElement], false);
    }
  }

  renderUsers(users) {
    const container = document.getElementById('usersList');
        
    // API returns nested structure: response.data.data contains the actual users array
    let usersList = [];
    if (users && users.data && Array.isArray(users.data)) {
      usersList = users.data;
    } else if (users && Array.isArray(users)) {
      usersList = users;
    }
        
    if (!usersList || usersList.length === 0) {
      container.innerHTML = '<p>No users found</p>';
      return;
    }
        
    container.innerHTML = `
            <p>${usersList.length} users found</p>
            <a href="/users-manage" class="btn">Manage Users</a>
        `;
  }

  renderInvites(invites) {
    const container = document.getElementById('invitesList');
        
    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      container.innerHTML = `
                <p>No invites found</p>
                <button class="btn btn-primary" onclick="window.adminPanel.createInvite()">Create Invite</button>
            `;
      return;
    }

    const unusedInvites = invites.filter(invite => !invite.used_by);
    const usedInvites = invites.filter(invite => invite.used_by);
        
    container.innerHTML = `
            <div class="invite-summary">
                <p>${invites.length} total invites</p>
                <p class="text-muted">${unusedInvites.length} unused, ${usedInvites.length} used</p>
            </div>
            <div class="invite-actions">
                <button class="btn btn-primary btn-sm" onclick="window.adminPanel.createInvite()">Create Invite</button>
                <button class="btn btn-secondary btn-sm" onclick="window.adminPanel.showInviteDetails()">View Details</button>
            </div>
            ${invites.length > 0 ? `
                <div class="invite-preview">
                    <div class="box">
                        <div class="meta-row">
                            <span><strong>Recent:</strong> ${invites[0].code}</span>
                            <span>${invites[0].used_by ? 'Used' : 'Unused'}</span>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
  }

  renderRecords(records) {
    const container = document.getElementById('recordsList');
        
    container.innerHTML = `
            <p>${records.length} records found</p>
            <a href="/records-manage" class="btn">Manage Records</a>
        `;
  }

  renderThemes(themes, appliedThemeId) {
    const container = document.getElementById('themesList');
        
    const activeThemes = themes.filter(t => t.is_active);
        
    container.innerHTML = `
            <p>${themes.length} theme${themes.length !== 1 ? 's' : ''} total</p>
            <p class="text-muted">${activeThemes.length} active theme${activeThemes.length !== 1 ? 's' : ''}</p>
            <a href="/themes-manage" class="btn">Manage Themes</a>
        `;
        
    window.adminPanel = this;
  }

  async createInvite() {
    try {
      const result = await AdminAPI.createInvite();
      if (result.success) {
        notifications.success('Invite created successfully');
        cacheManager.clear(this.cacheKey);
        this.loadAllData(); // Refresh data
      } else {
        notifications.error(result.message || 'Failed to create invite');
      }
    } catch (error) {
      notifications.error('Failed to create invite');
    }
  }

  showInviteDetails() {
    // Navigate to a detailed invite management page or show modal
    window.location.href = '/invites-manage';
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
            <a href="/settings" class="btn">Manage Settings</a>
        `;
  }
}