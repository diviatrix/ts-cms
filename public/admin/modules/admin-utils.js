/**
 * Admin Utilities Module
 * Shared utilities and helpers for the admin panel
 */

import { keyboardShortcuts } from '../../js/ui-utils.js';

export class AdminUtils {
    /**
     * Setup keyboard shortcuts for admin panel
     */
    static setupKeyboardShortcuts(loadDataCallback) {
        // Refresh data
        keyboardShortcuts.register('f5', () => {
            loadDataCallback();
        }, 'Refresh all data');

        keyboardShortcuts.register('ctrl+r', () => {
            loadDataCallback();
        }, 'Refresh all data');

        // Navigation shortcuts (using Alt+key to avoid browser conflicts)
        keyboardShortcuts.register('alt+u', () => {
            document.querySelector('[data-bs-target="#users"]')?.click();
        }, 'Switch to Users tab (Alt+U)');

        keyboardShortcuts.register('alt+r', () => {
            document.querySelector('[data-bs-target="#records"]')?.click();
        }, 'Switch to Records tab (Alt+R)');

        keyboardShortcuts.register('alt+p', () => {
            document.querySelector('[data-bs-target="#profile"]')?.click();
        }, 'Switch to Profile tab (Alt+P)');

        // Help shortcut (using a non-conflicting key combination)
        keyboardShortcuts.register('ctrl+shift+h', () => {
            keyboardShortcuts.showHelp();
        }, 'Show keyboard shortcuts help');

        keyboardShortcuts.register('ctrl+/', () => {
            keyboardShortcuts.showHelp();
        }, 'Show keyboard shortcuts help');
    }

    /**
     * Setup save shortcut for profile editing
     */
    static setupSaveShortcut(saveButton) {
        // Quick actions
        keyboardShortcuts.register('ctrl+s', () => {
            if (saveButton && !saveButton.disabled) {
                saveButton.click();
            }
        }, 'Save profile changes');
    }

    /**
     * Initialize data tables configuration
     */
    static getDataTableConfigs() {
        return {
            users: {
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
            },
            records: {
                columns: [
                    {
                        key: 'title',
                        title: 'Title',
                        render: (value, row) => `
                            <a href="#" class="text-decoration-none record-link" data-record='${JSON.stringify(row)}'>
                                ${value}
                            </a>
                        `
                    },
                    {
                        key: 'is_published',
                        title: 'Status',
                        render: (value) => `
                            <span class="badge ${value ? 'bg-success' : 'bg-secondary'}">
                                ${value ? 'Published' : 'Draft'}
                            </span>
                        `
                    }
                ],
                filterable: true,
                sortable: true,
                pagination: { enabled: true, pageSize: 10 }
            }
        };
    }

    /**
     * Get DOM elements for admin panel
     */
    static getDOMElements() {
        return {
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
            recordInfo: document.getElementById('recordInfo'),
            recordTitle: document.getElementById('recordTitle'),
            recordDescription: document.getElementById('recordDescription'),
            recordContent: document.getElementById('recordContent'),
            recordTags: document.getElementById('recordTags'),
            recordCategories: document.getElementById('recordCategories'),
            recordIsPublished: document.getElementById('recordIsPublished'),
            recordMessageDiv: document.getElementById('recordMessageDiv'),
            newRecordButton: document.getElementById('newRecordButton'),
            recordSaveButton: document.getElementById('recordSaveButton'),
            recordDeleteButton: document.getElementById('recordDeleteButton'),

            // Tab elements
            usersTabBtn: document.getElementById('users-tab'),
            recordsTabBtn: document.getElementById('records-tab')
        };
    }

    /**
     * Debug authentication status
     */
    static debugAuthentication() {
        console.log('=== Admin Panel Authentication Debug ===');
        console.log('Token from localStorage:', localStorage.getItem('token'));
        
        // Import AuthAPI dynamically to avoid circular dependency
        import('../../js/api-client.js').then(({ AuthAPI }) => {
            console.log('AuthAPI.isAuthenticated():', AuthAPI.isAuthenticated());
            
            try {
                const userRoles = AuthAPI.getUserRole();
                console.log('User roles:', userRoles);
                console.log('Has admin role:', userRoles.includes('admin'));
            } catch (error) {
                console.log('Error getting user roles:', error);
            }
            
            console.log('=== End Debug ===');
        });
    }
}
