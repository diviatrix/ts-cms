import { DataTable } from '../js/shared-components.js';
import { UserManagement, RecordManagement } from './modules/index.js';
import { ThemeManagement } from './modules/theme-management.js';
import { CMSSettings } from './modules/cms-settings.js';
import { AdminUtils } from './modules/admin-utils.js';
import { BasePageController } from '../js/shared-components/base-controller.js';

function loadTab(tabId, partial, initModule) {
    const container = document.getElementById(tabId);
    fetch(partial)
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
            container.style.display = 'block';
            const elements = AdminUtils.getDOMElements();
            initModule(elements);
        });
}

const tabContentMap = {
    'users-tab': {
        containerId: 'users-tab-content',
        partial: '/admin/partials/users-tab.html',
        init: () => {
            fetch('/admin/partials/users-tab.html')
                .then(response => response.text())
                .then(html => {
                    const container = document.getElementById('users-tab-content');
                    container.innerHTML = html;
                    container.style.display = 'block';
                    const elements = AdminUtils.getDOMElements();
                    const tableConfigs = AdminUtils.getDataTableConfigs();
                    const usersTable = new DataTable(elements.userListContainer, tableConfigs.users);
                    const userModule = new UserManagement(elements, usersTable);
                    userModule.loadUsers();
                });
        }
    },
    'records-tab': {
        containerId: 'records-tab-content',
        partial: '/admin/partials/records-tab.html',
        init: () => {
            fetch('/admin/partials/records-tab.html')
                .then(response => response.text())
                .then(html => {
                    const container = document.getElementById('records-tab-content');
                    container.innerHTML = html;
                    container.style.display = 'block';
                    // Show only the list section by default
                    document.querySelector('.records-list-section').classList.remove('hidden');
                    document.querySelector('.records-edit-section').classList.add('hidden');
                    const elements = AdminUtils.getDOMElements();
                    const tableConfigs = AdminUtils.getDataTableConfigs();
                    const recordsTable = new DataTable(elements.recordListContainer, tableConfigs.records);
                    const recordModule = new RecordManagement(elements, recordsTable);
                    recordModule.loadRecords();
                    // Add subtab switching logic
                    document.getElementById('newRecordButton').addEventListener('click', (e) => {
                        e.preventDefault();
                        document.querySelector('.records-list-section').classList.add('hidden');
                        document.querySelector('.records-edit-section').classList.remove('hidden');
                        recordModule.handleNewRecord();
                    });
                    // When a record is selected for edit, show edit section
                    elements.recordListContainer.addEventListener('click', (e) => {
                        const btn = e.target.closest('.edit-record-btn');
                        if (btn) {
                            document.querySelector('.records-list-section').classList.add('hidden');
                            document.querySelector('.records-edit-section').classList.remove('hidden');
                        }
                    });
                    // Add cancel button logic
                    const cancelBtn = document.getElementById('recordCancelButton');
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            document.querySelector('.records-edit-section').classList.add('hidden');
                            document.querySelector('.records-list-section').classList.remove('hidden');
                        });
                    }
                });
        }
    },
    'themes-tab': {
        containerId: 'themes-tab-content',
        partial: '/admin/partials/themes-tab.html',
        init: () => {
            fetch('/admin/partials/themes-tab.html')
                .then(response => response.text())
                .then(html => {
                    const container = document.getElementById('themes-tab-content');
                    container.innerHTML = html;
                    container.style.display = 'block';
                    // Show only the list section by default
                    document.querySelector('.themes-list-section').classList.remove('hidden');
                    document.querySelector('.themes-edit-section').classList.add('hidden');
                    const themeModule = new ThemeManagement();
                    // Add subtab switching logic
                    document.getElementById('newThemeButton').addEventListener('click', (e) => {
                        e.preventDefault();
                        document.querySelector('.themes-list-section').classList.add('hidden');
                        document.querySelector('.themes-edit-section').classList.remove('hidden');
                        themeModule.showNewThemeForm();
                    });
                    // When a theme is selected for edit, show edit section
                    document.getElementById('themeList').addEventListener('click', (e) => {
                        const btn = e.target.closest('.edit-theme-btn');
                        if (btn) {
                            document.querySelector('.themes-list-section').classList.add('hidden');
                            document.querySelector('.themes-edit-section').classList.remove('hidden');
                        }
                    });
                    // Add cancel button logic
                    const cancelBtn = document.getElementById('themeCancelButton');
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            document.querySelector('.themes-edit-section').classList.add('hidden');
                            document.querySelector('.themes-list-section').classList.remove('hidden');
                        });
                    }
                });
        }
    },
    'cms-settings-tab': {
        containerId: 'settings-tab-content',
        partial: '/admin/partials/settings-tab.html',
        init: () => {
            fetch('/admin/partials/settings-tab.html')
                .then(response => response.text())
                .then(html => {
                    const container = document.getElementById('settings-tab-content');
                    container.innerHTML = html;
                    container.style.display = 'block';
                    new CMSSettings();
                });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-header .btn');
    const { tab, params } = BasePageController.parseHashQuery();
    let autoTab = null;
    if (params.get('editRecordId')) {
        autoTab = document.getElementById('records-tab');
    }
    tabButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            Object.values(tabContentMap).forEach(tabObj => {
                const container = document.getElementById(tabObj.containerId);
                if (container) container.innerHTML = '';
                if (container) container.style.display = 'none';
            });
            const adminWelcome = document.getElementById('adminWelcome');
            if (adminWelcome) adminWelcome.style.display = 'none';
            const tabObj = tabContentMap[button.id];
            if (tabObj) {
                // Always use shared hash/query parser for consistency
                const { params } = BasePageController.parseHashQuery();
                if (button.id === 'records-tab' && params.get('editRecordId')) {
                    const tableConfigs = AdminUtils.getDataTableConfigs();
                    const recordsTable = new DataTable(AdminUtils.getDOMElements().recordListContainer, tableConfigs.records);
                    const recordModule = new RecordManagement(AdminUtils.getDOMElements(), recordsTable);
                    recordModule.loadRecords();
                    recordModule.checkUrlForRecordId(button);
                } else {
                    tabObj.init(AdminUtils.getDOMElements());
                }
            }
        });
    });
    // Auto-select tab from hash/query, or default to first tab
    if (autoTab) {
        autoTab.click();
    } else if (tab && document.getElementById(tab + '-tab')) {
        document.getElementById(tab + '-tab').click();
    } else {
        const firstTab = document.querySelector('.tab-header .btn');
        if (firstTab) firstTab.click();
    }
});
