import { AuthAPI } from '../js/api-client.js';
import { DataTable } from '../js/shared-components.js';
import { 
    MessageDisplay, 
    loadingManager, 
    errorHandler 
} from '../js/ui-utils.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { UserManagement, RecordManagement, AdminUtils, ResponseLog } from './modules/index.js';
import { ThemeManagement } from './modules/theme-management.js';
import { CMSSettings } from './modules/cms-settings.js';
import { messages } from '../js/ui-utils.js';

/**
 * Admin Panel Controller (Refactored)
 * Coordinates modular admin components for users and records administration
 */
class AdminController {
    constructor() {
        this.initializeElements();
        this.initializeDataTables();
        this.initializeModules();
        this.initializeEventHandlers();
        this.setupKeyboardShortcuts();
        this.loadInitialData();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Collect all DOM elements in a central object for easy passing to modules
        this.elements = {
            // User management elements
            userListContainer: document.getElementById('userList'),
            profileEditTab: document.getElementById('profileEditTab'),
            adminProfileInfo: document.getElementById('adminProfileInfo'),
            adminMessageDiv: document.getElementById('adminMessageDiv'),
            adminServerAnswerTextarea: document.getElementById('adminServerAnswerTextarea'),
            adminSaveButton: document.getElementById('adminSaveButton'),

            // Record management elements
            recordListContainer: document.getElementById('recordList'),
            recordEditTab: document.getElementById('recordEditTab'),
            recordEditInfo: document.getElementById('recordInfo'),
            recordTitle: document.getElementById('recordTitle'),
            recordDescription: document.getElementById('recordDescription'),
            recordImageUrl: document.getElementById('recordImageUrl'),
            recordContent: document.getElementById('recordContent'),
            recordTags: document.getElementById('recordTags'),
            recordCategories: document.getElementById('recordCategories'),
            recordIsPublished: document.getElementById('recordIsPublished'),
            recordMessageDiv: document.getElementById('recordMessageDiv'),
            recordServerAnswerTextarea: document.getElementById('recordServerAnswerTextarea'),
            recordSaveButton: document.getElementById('recordSaveButton'),
            recordDeleteButton: document.getElementById('recordDeleteButton'),
            recordDownloadButton: document.getElementById('recordDownloadButton'),
            newRecordButton: document.getElementById('newRecordButton'),

            // Tab elements
            usersTab: document.getElementById('users-tab'),
            recordsTab: document.getElementById('records-tab')
        };

        // Initialize main message display
        this.mainMessage = new MessageDisplay(document.getElementById('mainMessageDiv'));
    }

    /**
     * Initialize data tables
     */
    initializeDataTables() {
        // Initialize users table
        this.usersTable = new DataTable(this.elements.userListContainer, {
            columns: [
                {
                    key: 'base.login',
                    title: 'Username',
                    render: (value, row) => `
                        <a href="#" class="text-decoration-none user-link" data-user='${JSON.stringify(row)}'>
                            ${value || row.base?.login || 'N/A'}
                        </a>
                    `
                },
                {
                    key: 'base.id',
                    title: 'ID',
                    render: (value, row) => value || row.base?.id || 'N/A'
                }
            ],
            filterable: true,
            sortable: true,
            pagination: { enabled: true, pageSize: 10 }
        });

        // Initialize records table
        this.recordsTable = new DataTable(this.elements.recordListContainer, {
            columns: [
                {
                    key: 'title',
                    title: 'Title',
                    render: (value, row) => `
                        <span title="ID: ${row.id}" class="record-title-tooltip" style="cursor:pointer;">
                            ${value || 'Untitled'}
                        </span>
                    `
                },
                {
                    key: 'created_at',
                    title: 'Created',
                    render: (value) => value ? new Date(value).toLocaleDateString() : 'Unknown'
                },
                {
                    key: 'is_published',
                    title: 'Status',
                    render: (value) => value ? 
                        '<span class="badge bg-success">Published</span>' : 
                        '<span class="badge bg-secondary">Draft</span>'
                },
                {
                    key: 'actions',
                    title: 'Actions',
                    render: (value, row) => `
                        <button class="btn btn-sm btn-primary edit-record-btn" data-record-id="${row.id}" title="Edit">✏️</button>
                        <button class="btn btn-sm btn-danger delete-record-btn" data-record-id="${row.id}" title="Delete">🗑️</button>
                    `
                }
            ],
            filterable: true,
            sortable: true,
            pagination: { enabled: true, pageSize: 10 }
        });
    }

    /**
     * Initialize modules
     */
    initializeModules() {
        // Initialize response log module
        this.responseLog = new ResponseLog();

        // Initialize user management module
        this.userManagement = new UserManagement(this.elements, this.usersTable, this.responseLog);

        // Initialize record management module  
        this.recordManagement = new RecordManagement(this.elements, this.recordsTable, this.responseLog);

        // Initialize CMS settings module
        this.cmsSettings = new CMSSettings(this.responseLog);
    }

    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        // Setup tab functionality
        this.setupTabs();
        
        // Check URL for direct record access on page load
        this.checkUrlForRecordId();
    }

    /**
     * Setup tab functionality without Bootstrap
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('#adminTab .nav-link');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                tabPanes.forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Add active class to clicked button
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
                
                // Show corresponding pane
                const targetId = button.getAttribute('data-bs-target') || button.getAttribute('href');
                const targetPane = document.querySelector(targetId);
                if (targetPane) {
                    targetPane.classList.add('show', 'active');
                }

                // Load data for the activated tab
                this.loadTabData(button.id);
            });
        });
    }

    /**
     * Load data for the specified tab
     */
    loadTabData(tabId) {
        switch (tabId) {
            case 'users-tab':
                this.userManagement.loadUsers();
                break;
            case 'records-tab':
                this.recordManagement.loadRecords();
                break;
            case 'cms-settings-tab':
                this.cmsSettings.loadSettings();
                break;
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        AdminUtils.setupKeyboardShortcuts(() => {
            this.loadInitialData();
        });
    }

    /**
     * Load initial data based on active tab
     */
    loadInitialData() {
        // Determine which tab is active and load appropriate data
        const activeTab = document.querySelector('.nav-link.active');
        if (activeTab && activeTab.id === 'users-tab') {
            this.userManagement.loadUsers();
        } else if (activeTab && activeTab.id === 'records-tab') {
            this.recordManagement.loadRecords();
        } else {
            // Default to loading users if no specific tab is active
            this.userManagement.loadUsers();
        }
    }

    /**
     * Check URL for record ID parameter and load record if present
     */
    async checkUrlForRecordId() {
        // Check for editRecordId in hash fragment (used by edit buttons)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
        const editRecordId = params.get('editRecordId');
        
        if (editRecordId) {
            try {
                // Switch to records tab
                const recordsTab = document.getElementById('records-tab');
                if (recordsTab) {
                    recordsTab.click();
                    
                    // Call the record management module's method to handle the editRecordId
                    await this.recordManagement.checkUrlForRecordId(recordsTab);
                }
            } catch (error) {
                console.error('Error loading record from URL:', error);
                messages.error('Error loading the requested record.', { toast: true });
            }
        }
    }
}

// Shared utility for lazy-loading admin modules on tab activation
function lazyLoadModule(tabSelector, moduleInitFn) {
    let initialized = false;
    const tabBtn = document.querySelector(tabSelector);
    if (!tabBtn) return;
    tabBtn.addEventListener('shown.bs.tab', () => {
        if (!initialized) {
            moduleInitFn();
            initialized = true;
        }
    });
}

// Wait for DOM to be ready, then initialize
document.addEventListener('DOMContentLoaded', () => {
    new AdminController();
    const adminTab = document.getElementById('adminTab');
    const adminWelcome = document.getElementById('adminWelcome');
    if (adminTab && adminWelcome) {
        adminTab.addEventListener('shown.bs.tab', () => {
            adminWelcome.style.display = 'none';
        });
    }

    // Lazy-load ThemeManagement only when Themes tab is shown
    lazyLoadModule('#themes-tab', () => {
        // You can extend this pattern for other modules as needed
        new ThemeManagement();
    });
});
