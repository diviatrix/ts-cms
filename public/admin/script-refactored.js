/**
 * Admin Panel Controller (Refactored)
 * Main coordinator for the admin panel, using modular components
 */

import { AdminAPI, AuthAPI } from '../js/api-client.js';
import { DataTable } from '../js/shared-components.js';
import { UserManagement, RecordManagement, AdminUtils } from './modules/index.js';

/**
 * Admin Controller - Main coordinator class
 */
class AdminController {
    constructor() {
        console.log('AdminController: Starting initialization...');
        
        // Initialize elements and data structures
        this.elements = AdminUtils.getDOMElements();
        this.initializeDataTables();
        this.initializeModules();
        this.initializeEventHandlers();
        this.setupKeyboardShortcuts();
        this.loadInitialData();
        
        console.log('AdminController: Initialization complete');
    }

    /**
     * Initialize data tables
     */
    initializeDataTables() {
        const configs = AdminUtils.getDataTableConfigs();
        
        // Initialize users table
        this.usersTable = new DataTable(this.elements.userListContainer, configs.users);
        
        // Initialize records table  
        this.recordsTable = new DataTable(this.elements.recordListContainer, configs.records);
    }

    /**
     * Initialize modular components
     */
    initializeModules() {
        // Initialize user management module
        this.userManagement = new UserManagement(this.elements, this.usersTable);
        
        // Initialize record management module
        this.recordManagement = new RecordManagement(this.elements, this.recordsTable);
    }

    /**
     * Initialize main event handlers (tab switching)
     */
    initializeEventHandlers() {
        // Tab switching logic
        if (this.elements.usersTabBtn) {
            this.elements.usersTabBtn.addEventListener('shown.bs.tab', () => {
                this.userManagement.loadUsers();
            });
        }
        
        if (this.elements.recordsTabBtn) {
            this.elements.recordsTabBtn.addEventListener('shown.bs.tab', () => {
                this.recordManagement.loadRecords();
            });
        }
    }

    /**
     * Setup keyboard shortcuts for admin panel
     */
    setupKeyboardShortcuts() {
        // Setup general admin shortcuts
        AdminUtils.setupKeyboardShortcuts(() => this.loadInitialData());
        
        // Setup save shortcut for user profile editing
        AdminUtils.setupSaveShortcut(this.elements.adminSaveButton);
    }

    /**
     * Load initial data based on active tab
     */
    loadInitialData() {
        // Load users by default
        this.userManagement.loadUsers();
        
        // Check URL for specific record editing
        this.recordManagement.checkUrlForRecordId(this.elements.recordsTabBtn);
    }
}

// Initialize the admin controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Debug authentication before initializing controller
    AdminUtils.debugAuthentication();
    
    // Small delay to see debug output before potential redirect
    setTimeout(() => {
        new AdminController();
    }, 100);
});
