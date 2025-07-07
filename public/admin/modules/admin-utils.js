/**
 * Admin Utilities Module
 * Shared utilities and helpers for the admin panel
 */

export class AdminUtils {
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
            userListContainer: document.getElementById('userListContainer'),
            profileEditTab: document.getElementById('profileEditTab'),
            adminProfileInfo: document.getElementById('adminProfileInfo'),
            adminMessageDiv: document.getElementById('adminMessageDiv'),
            adminServerAnswerTextarea: document.getElementById('adminServerAnswerTextarea'),
            adminSaveButton: document.getElementById('adminSaveButton'),

            // Record management elements
            recordListContainer: document.getElementById('recordListContainer'),
            recordEditTab: document.getElementById('recordEditTab'),
            recordInfo: document.getElementById('recordInfo'),
            recordTitle: document.getElementById('recordTitle'),
            recordDescription: document.getElementById('recordDescription'),
            recordImageUrl: document.getElementById('recordImageUrl'),
            recordContent: document.getElementById('recordContent'),
            recordTags: document.getElementById('recordTags'),
            recordCategories: document.getElementById('recordCategories'),
            recordIsPublished: document.getElementById('recordIsPublished'),
            recordMessageDiv: document.getElementById('recordMessageDiv'),
            newRecordButton: document.getElementById('newRecordButton'),
            recordSaveButton: document.getElementById('recordSaveButton'),
            recordDeleteButton: document.getElementById('recordDeleteButton'),
            recordDownloadButton: document.getElementById('recordDownloadButton'),

            // Tab elements
            usersTabBtn: document.getElementById('users-tab'),
            recordsTabBtn: document.getElementById('records-tab')
        };
    }


}
