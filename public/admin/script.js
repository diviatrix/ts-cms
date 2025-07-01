import { AuthAPI } from '../js/api-client.js';
import { DataTable } from '../js/shared-components.js';
import { 
    MessageDisplay, 
    loadingManager, 
    errorHandler 
} from '../js/ui-utils.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { UserManagement, RecordManagement, AdminUtils } from './modules/index.js';
import { ThemeManagement } from './modules/theme-management.js';

/**
 * Admin Panel Controller (Refactored)
 * Coordinates modular admin components for users and records administration
 */
class AdminController {
    constructor() {
        console.log('AdminController: Starting modular initialization...');
        
        this.initializeElements();
        this.initializeDataTables();
        this.initializeModules();
        this.initializeEventHandlers();
        this.setupKeyboardShortcuts();
        this.loadInitialData();
        
        console.log('AdminController: Modular initialization complete');
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
            recordContent: document.getElementById('recordContent'),
            recordTags: document.getElementById('recordTags'),
            recordCategories: document.getElementById('recordCategories'),
            recordIsPublished: document.getElementById('recordIsPublished'),
            recordMessageDiv: document.getElementById('recordMessageDiv'),
            recordServerAnswerTextarea: document.getElementById('recordServerAnswerTextarea'),
            recordSaveButton: document.getElementById('recordSaveButton'),
            recordDeleteButton: document.getElementById('recordDeleteButton'),
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
                        <a href="#" class="text-decoration-none record-link" data-record='${JSON.stringify(row)}'>
                            ${value || 'Untitled'}
                        </a>
                    `
                },
                {
                    key: 'id',
                    title: 'ID'
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
        // Initialize user management module
        this.userManagement = new UserManagement(this.elements, this.usersTable);

        // Initialize record management module  
        this.recordManagement = new RecordManagement(this.elements, this.recordsTable);

        // Initialize theme management module
        this.themeManagement = new ThemeManagement();
    }

    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        // Tab switching events
        if (this.elements.usersTab) {
            this.elements.usersTab.addEventListener('shown.bs.tab', () => {
                this.userManagement.loadUsers();
            });
        }

        if (this.elements.recordsTab) {
            this.elements.recordsTab.addEventListener('shown.bs.tab', () => {
                this.recordManagement.loadRecords();
            });
        }

        // Add themes tab event handler
        const themesTab = document.getElementById('themes-tab');
        if (themesTab) {
            themesTab.addEventListener('shown.bs.tab', () => {
                this.themeManagement.loadThemes();
            });
        }

        // Check URL for direct record access on page load
        this.checkUrlForRecordId();
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
        const urlParams = new URLSearchParams(window.location.search);
        const recordId = urlParams.get('recordId');
        
        if (recordId) {
            try {
                // Switch to records tab
                const recordsTab = document.getElementById('records-tab');
                if (recordsTab) {
                    recordsTab.click();
                }
                
                // Load records first, then try to find and display the specific record
                await this.recordManagement.loadRecords();
                
                // Small delay to ensure records are loaded
                setTimeout(() => {
                    const recordLink = document.querySelector(`[data-record*='"id":"${recordId}"']`);
                    if (recordLink) {
                        recordLink.click();
                    } else {
                        this.mainMessage.showWarning(`Record with ID ${recordId} not found.`);
                    }
                }, 500);
                
            } catch (error) {
                console.error('Error loading record from URL:', error);
                this.mainMessage.showError('Error loading the requested record.');
            }
        }
    }
}

// Wait for DOM to be ready, then initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== Admin Panel Debug ===');
    
    try {
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        
        if (token) {
            const decoded = jwtDecode(token);
            console.log('Decoded token:', decoded);
            console.log('Token roles:', decoded.roles);
        }
        
        const userRoles = AuthAPI.getUserRole();
        console.log('User roles from AuthAPI:', userRoles);
    } catch (error) {
        console.log('Error getting user roles:', error);
    }
    
    console.log('=== End Debug ===');
    
    // Small delay to see debug output before potential redirect
    setTimeout(() => {
        new AdminController();
    }, 100);
});
