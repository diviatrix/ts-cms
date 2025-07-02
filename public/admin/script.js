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
import { CMSSettings } from './modules/cms-settings.js';

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
        
        // Initialize CMS settings module
        this.cmsSettings = new CMSSettings();
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

/**
 * Global Test Page Functions
 * These functions are used by the Test Pages tab for development and testing
 */

// Store references to opened test page windows
window.testPageWindows = window.testPageWindows || [];

/**
 * Opens all test pages in separate tabs/windows for comprehensive theme testing
 */
window.openAllTestPages = function() {
    const testPages = [
        { url: '/', name: 'Homepage' },
        { url: '/message-system-demo.html', name: 'Message System Demo' },
        { url: '/nav/', name: 'Navigation Test' },
        { url: '/login/', name: 'Login Page' },
        { url: '/login/index-theme-demo.html', name: 'Login Theme Demo' },
        { url: '/profile/', name: 'User Profile' },
        { url: '/password/', name: 'Password Management' },
        { url: '/record/', name: 'Records Page' }
    ];

    console.log('Opening all test pages for theme testing...');
    
    // Clear any closed window references
    window.testPageWindows = window.testPageWindows.filter(w => w && !w.closed);
    
    testPages.forEach(page => {
        try {
            const windowRef = window.open(page.url, `testpage_${page.name.replace(/\s+/g, '_')}`, 'width=1200,height=800');
            if (windowRef) {
                window.testPageWindows.push(windowRef);
                console.log(`Opened: ${page.name} (${page.url})`);
            }
        } catch (error) {
            console.error(`Failed to open ${page.name}:`, error);
        }
    });
    
    // Show success message
    const messageDiv = document.getElementById('cmsSettingsMessageDiv');
    if (messageDiv) {
        messageDiv.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Test Pages Opened!</strong> ${testPages.length} pages opened for theme testing.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
};

/**
 * Refreshes all currently open test page windows
 */
window.refreshAllTestPages = function() {
    // Filter out closed windows
    window.testPageWindows = window.testPageWindows.filter(w => w && !w.closed);
    
    if (window.testPageWindows.length === 0) {
        const messageDiv = document.getElementById('cmsSettingsMessageDiv');
        if (messageDiv) {
            messageDiv.innerHTML = `
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    <strong>No Test Pages Open!</strong> Please open some test pages first.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
        return;
    }
    
    console.log(`Refreshing ${window.testPageWindows.length} test page windows...`);
    
    let refreshCount = 0;
    window.testPageWindows.forEach(windowRef => {
        try {
            if (windowRef && !windowRef.closed) {
                windowRef.location.reload();
                refreshCount++;
            }
        } catch (error) {
            console.warn('Failed to refresh a test page window:', error);
        }
    });
    
    // Show success message
    const messageDiv = document.getElementById('cmsSettingsMessageDiv');
    if (messageDiv) {
        messageDiv.innerHTML = `
            <div class="alert alert-info alert-dismissible fade show" role="alert">
                <strong>Pages Refreshed!</strong> ${refreshCount} test pages have been refreshed to show current theme.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
};

/**
 * Clears test data and closes all test page windows
 */
window.clearTestPageData = function() {
    // Close all test page windows
    const windowCount = window.testPageWindows.length;
    window.testPageWindows.forEach(windowRef => {
        try {
            if (windowRef && !windowRef.closed) {
                windowRef.close();
            }
        } catch (error) {
            console.warn('Failed to close a test page window:', error);
        }
    });
    
    // Clear the array
    window.testPageWindows = [];
    
    // Clear any session storage or local storage used for testing (if needed)
    try {
        // Clear any test-specific storage keys
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('test_')) {
                sessionStorage.removeItem(key);
            }
        }
    } catch (error) {
        console.warn('Failed to clear test session data:', error);
    }
    
    console.log(`Cleared test data and closed ${windowCount} test page windows`);
    
    // Show success message
    const messageDiv = document.getElementById('cmsSettingsMessageDiv');
    if (messageDiv) {
        messageDiv.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Test Data Cleared!</strong> Closed ${windowCount} test page windows and cleared test data.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
};

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
