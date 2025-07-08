import { DataTable } from '../js/shared-components.js';
import { UserManagement, RecordManagement } from './modules/index.js';
import { ThemeManagement } from './modules/theme-management.js';
import { CMSSettings } from './modules/cms-settings.js';
import { AdminUtils } from './modules/admin-utils.js';

// Remove AdminController and all global controller code
// Only keep per-tab initialization logic as implemented

function loadTab(tabId, partial, initModule) {
    const container = document.getElementById(tabId);
    fetch(partial)
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
            container.style.display = 'block';
            // Get fresh DOM elements after partial is loaded
            const elements = AdminUtils.getDOMElements();
            initModule(elements);
        });
}

const tabContentMap = {
    'users-tab': {
        containerId: 'users-tab-content',
        partial: '/admin/partials/users-tab.html',
        init: (elements) => {
            const tableConfigs = AdminUtils.getDataTableConfigs();
            const usersTable = new DataTable(elements.userListContainer, tableConfigs.users);
            const userModule = new UserManagement(elements, usersTable);
            userModule.loadUsers();
        }
    },
    'records-tab': {
        containerId: 'records-tab-content',
        partial: '/admin/partials/records-tab.html',
        init: (elements) => {
            const tableConfigs = AdminUtils.getDataTableConfigs();
            const recordsTable = new DataTable(elements.recordListContainer, tableConfigs.records);
            const recordModule = new RecordManagement(elements, recordsTable);
            recordModule.loadRecords();
        }
    },
    'themes-tab': {
        containerId: 'themes-tab-content',
        partial: '/admin/partials/themes-tab.html',
        init: () => {
            new ThemeManagement();
        }
    },
    'cms-settings-tab': {
        containerId: 'settings-tab-content',
        partial: '/admin/partials/settings-tab.html',
        init: () => {
            const cmsSettings = new CMSSettings();
            // The constructor already calls loadCMSSettings() which loads both settings and themes
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-header .btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Hide all tab content containers
            Object.values(tabContentMap).forEach(tab => {
                const container = document.getElementById(tab.containerId);
                if (container) container.innerHTML = '';
                if (container) container.style.display = 'none';
            });

            // Hide welcome message
            const adminWelcome = document.getElementById('adminWelcome');
            if (adminWelcome) adminWelcome.style.display = 'none';

            // Load and show the selected tab's partial and initialize module
            const tab = tabContentMap[button.id];
            if (tab) {
                loadTab(tab.containerId, tab.partial, tab.init);
            }
        });
    });
    // Optionally, auto-load the first tab
    const firstTab = document.querySelector('.tab-header .btn');
    if (firstTab) firstTab.click();
});
