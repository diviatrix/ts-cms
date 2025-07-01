import { AdminAPI, AuthAPI, RecordsAPI, ProfileAPI } from '../js/api-client.js';
import { DataTable } from '../js/shared-components.js';
import { 
    MessageDisplay, 
    loadingManager, 
    ErrorHandler, 
    errorHandler, 
    keyboardShortcuts, 
    ConfirmationDialog 
} from '../js/ui-utils.js';
import { jwtDecode } from '../js/jwt-decode.js';

/**
 * Admin Panel Controller
 * Manages users and records administration
 */
class AdminController {
    constructor() {
        // Temporarily remove ProtectedPageController inheritance for debugging
        // super({
        //     authAPI: AuthAPI
        //     // Temporarily disable role requirement until JWT role issue is fixed
        //     // requiredRole: 'admin'
        // });
        
        console.log('AdminController: Starting initialization...');
        
        this.initializeElements();
        this.initializeDataTables();
        this.initializeEventHandlers();
        this.setupKeyboardShortcuts();
        this.loadInitialData();
        
        console.log('AdminController: Initialization complete');
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // User management elements
        this.userListContainer = document.getElementById('userList');
        this.profileEditTab = document.getElementById('profileEditTab');
        this.adminProfileInfo = document.getElementById('adminProfileInfo');
        this.adminMessageDiv = document.getElementById('adminMessageDiv');
        this.adminServerAnswerTextarea = document.getElementById('adminServerAnswerTextarea');
        this.adminSaveButton = document.getElementById('adminSaveButton');

        // Record management elements
        this.recordListContainer = document.getElementById('recordList');
        this.recordEditTab = document.getElementById('recordEditTab');
        this.recordInfo = document.getElementById('recordInfo');
        this.recordTitle = document.getElementById('recordTitle');
        this.recordDescription = document.getElementById('recordDescription');
        this.recordContent = document.getElementById('recordContent');
        this.recordTags = document.getElementById('recordTags');
        this.recordCategories = document.getElementById('recordCategories');
        this.recordIsPublished = document.getElementById('recordIsPublished');
        this.recordMessageDiv = document.getElementById('recordMessageDiv');
        this.newRecordButton = document.getElementById('newRecordButton');
        this.recordSaveButton = document.getElementById('recordSaveButton');
        this.recordDeleteButton = document.getElementById('recordDeleteButton');

        // Message displays
        this.adminMessage = new MessageDisplay(this.adminMessageDiv);
        this.recordMessage = new MessageDisplay(this.recordMessageDiv);

        // Tab elements
        this.usersTabBtn = document.getElementById('users-tab');
        this.recordsTabBtn = document.getElementById('records-tab');
    }

    /**
     * Initialize data tables
     */
    initializeDataTables() {
        // Initialize users table
        this.usersTable = new DataTable(this.userListContainer, {
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
        this.recordsTable = new DataTable(this.recordListContainer, {
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
        });
    }

    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        // Tab switching logic
        this.usersTabBtn.addEventListener('shown.bs.tab', () => this.loadUsers());
        this.recordsTabBtn.addEventListener('shown.bs.tab', () => this.loadRecords());

        // User table interactions
        this.userListContainer.addEventListener('click', (e) => {
            const userLink = e.target.closest('.user-link');
            if (userLink) {
                e.preventDefault();
                const userData = JSON.parse(userLink.dataset.user);
                this.displayUserProfile(userData);
            }
        });

        // Record table interactions
        this.recordListContainer.addEventListener('click', (e) => {
            const recordLink = e.target.closest('.record-link');
            if (recordLink) {
                e.preventDefault();
                const recordData = JSON.parse(recordLink.dataset.record);
                this.displayRecordForEdit(recordData);
            }
        });

        // Form handlers
        this.adminSaveButton.addEventListener('click', () => this.handleUserSave());
        this.newRecordButton.addEventListener('click', () => this.handleNewRecord());
        this.recordSaveButton.addEventListener('click', () => this.handleRecordSave());
        this.recordDeleteButton.addEventListener('click', () => this.handleRecordDelete());
    }

    /**
     * Load initial data based on active tab
     */
    loadInitialData() {
        // Load users by default
        this.loadUsers();
        this.checkUrlForRecordId();
    }

    /**
     * Load users and populate the data table
     */
    async loadUsers() {
        try {
            // Check authentication
            if (!AuthAPI.isAuthenticated()) {
                this.adminMessage.showError('Not authenticated. Please log in.');
                window.location.href = '/login';
                return;
            }

            this.adminMessage.hide();
            
            // Show loading state
            this.usersTable.showLoading('Loading users...');
            
            const response = await AdminAPI.getUsers();

            if (!response.success) {
                this.usersTable.showError('Failed to load users');
                errorHandler.handleApiError(response, this.adminMessage);
                return;
            }

            let users = [];
            if (Array.isArray(response.data)) {
                users = response.data;
            } else if (response.data && typeof response.data === 'object') {
                // If data is an object with an array property, extract it
                if (Array.isArray(response.data.users)) {
                    users = response.data.users;
                } else if (Array.isArray(response.data.data)) {
                    users = response.data.data;
                } else {
                    // Convert object to array if needed
                    users = Object.values(response.data);
                }
            }
            
            if (users.length === 0) {
                this.usersTable.showEmpty('No users found');
            } else {
                this.usersTable.updateData(users);
            }

        } catch (error) {
            console.error('Error fetching users:', error);
            this.usersTable.showError('Network error occurred');
            errorHandler.handleNetworkError(error, this.adminMessage);
        }
    }

    /**
     * Load records and populate the data table
     */
    async loadRecords() {
        try {
            // Check authentication
            if (!AuthAPI.isAuthenticated()) {
                this.recordMessage.showError('Not authenticated. Please log in.');
                window.location.href = '/login';
                return;
            }

            this.recordMessage.hide();
            
            // Show loading state
            this.recordsTable.showLoading('Loading records...');
            
            const response = await RecordsAPI.getAll();

            if (!response.success) {
                this.recordsTable.showError('Failed to load records');
                errorHandler.handleApiError(response, this.recordMessage);
                return;
            }

            const records = response.data || [];
            
            if (records.length === 0) {
                this.recordsTable.showEmpty('No records found');
            } else {
                this.recordsTable.updateData(records);
            }

        } catch (error) {
            console.error('Error fetching records:', error);
            this.recordsTable.showError('Network error occurred');
            errorHandler.handleNetworkError(error, this.recordMessage);
        }
    }

    /**
     * Display user profile for editing
     */
    displayUserProfile(user) {
        console.log('displayUserProfile: user object:', user);
        this.profileEditTab.classList.remove('d-none');
        this.adminServerAnswerTextarea.value = JSON.stringify(user, null, 2);
        this.adminProfileInfo.dataset.currentUserId = user.base?.id || user.id;
        this.adminMessage.hide();
    }

    /**
     * Display record for editing
     */
    displayRecordForEdit(record) {
        this.recordEditTab.classList.remove('d-none');
        this.recordInfo.dataset.currentRecordId = record.id || '';
        this.recordTitle.value = record.title || '';
        this.recordDescription.value = record.description || '';
        this.recordContent.value = record.content || '';
        this.recordTags.value = (record.tags && record.tags.join(', ')) || '';
        this.recordCategories.value = (record.categories && record.categories.join(', ')) || '';
        this.recordIsPublished.checked = record.is_published || false;
        this.recordMessage.hide();
    }

    /**
     * Handle user profile save
     */
    async handleUserSave() {
        const userIdToUpdate = this.adminProfileInfo.dataset.currentUserId;
        if (!userIdToUpdate) {
            this.adminMessage.showError('No user selected for saving.');
            return;
        }

        let updatedData;
        try {
            const parsedData = JSON.parse(this.adminServerAnswerTextarea.value);
            updatedData = {
                user_id: userIdToUpdate,
                base: parsedData.base,
                profile: parsedData.profile
            };
        } catch (e) {
            console.error('Invalid JSON format:', e);
            this.adminMessage.showError('Invalid JSON format.');
            return;
        }

        try {
            loadingManager.setLoading(this.adminSaveButton, true, 'Saving...');
            
            const response = await ProfileAPI.update(updatedData);
            
            console.log('adminSaveButton: result object:', response);
            this.adminServerAnswerTextarea.value = JSON.stringify(response, null, 2);
            
            this.adminMessage.showApiResponse(response);
            
            if (response.success) {
                // Show success feedback and refresh the users list
                setTimeout(() => {
                    this.loadUsers();
                }, 1000); // Small delay to let user see the success message
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            errorHandler.handleNetworkError(error, this.adminMessage);
        } finally {
            loadingManager.setLoading(this.adminSaveButton, false);
        }
    }

    /**
     * Handle new record creation
     */
    handleNewRecord() {
        this.recordEditTab.classList.remove('d-none');
        this.recordInfo.dataset.currentRecordId = '';
        this.recordTitle.value = '';
        this.recordDescription.value = '';
        this.recordContent.value = '';
        this.recordTags.value = '';
        this.recordCategories.value = '';
        this.recordIsPublished.checked = false;
        this.recordMessage.hide();
    }

    /**
     * Handle record save (create or update)
     */
    async handleRecordSave() {
        const recordId = this.recordInfo.dataset.currentRecordId;
        
        // Check authentication
        if (!AuthAPI.isAuthenticated()) {
            this.recordMessage.showError('Not authenticated. Please log in.');
            window.location.href = '/login';
            return;
        }

        const recordData = {
            title: this.recordTitle.value,
            description: this.recordDescription.value,
            content: this.recordContent.value,
            tags: this.recordTags.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
            categories: this.recordCategories.value.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0),
            is_published: this.recordIsPublished.checked,
        };

        try {
            loadingManager.setLoading(this.recordSaveButton, true, 'Saving...');
            
            let response;
            if (recordId) {
                response = await RecordsAPI.update(recordId, recordData);
            } else {
                response = await RecordsAPI.create(recordData);
            }

            this.recordMessage.showApiResponse(response);
            
            if (response.success) {
                // Show success feedback and refresh the list
                setTimeout(() => {
                    this.loadRecords();
                }, 1000); // Small delay to let user see the success message
                if (!recordId && response.data?.id) {
                    this.recordInfo.dataset.currentRecordId = response.data.id;
                }
            }
        } catch (error) {
            console.error('Error saving record:', error);
            errorHandler.handleNetworkError(error, this.recordMessage);
        } finally {
            loadingManager.setLoading(this.recordSaveButton, false);
        }
    }

    /**
     * Handle record deletion
     */
    async handleRecordDelete() {
        const recordId = this.recordInfo.dataset.currentRecordId;
        if (!recordId) {
            this.recordMessage.showError('No record selected for deletion.');
            return;
        }

        const recordTitle = this.recordTitle.value || 'Untitled';
        const confirmed = await ConfirmationDialog.show({
            title: 'Delete Record',
            message: `Are you sure you want to delete this record?\n\nThis action cannot be undone.\n\nRecord: ${recordTitle}`,
            confirmText: 'Delete',
            confirmClass: 'btn-danger'
        });

        if (!confirmed) return;

        // Check authentication
        if (!AuthAPI.isAuthenticated()) {
            this.recordMessage.showError('Not authenticated. Please log in.');
            window.location.href = '/login';
            return;
        }

        try {
            loadingManager.setLoading(this.recordDeleteButton, true, 'Deleting...');
            
            const response = await RecordsAPI.delete(recordId);
            
            this.recordMessage.showApiResponse(response);
            
            if (response.success) {
                this.recordEditTab.classList.add('d-none');
                // Show success feedback and refresh the list
                setTimeout(() => {
                    this.loadRecords();
                }, 1000); // Small delay to let user see the success message
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            errorHandler.handleNetworkError(error, this.recordMessage);
        } finally {
            loadingManager.setLoading(this.recordDeleteButton, false);
        }
    }

    /**
     * Check URL for record ID and open for edit
     */
    async checkUrlForRecordId() {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
        const editRecordId = params.get('editRecordId');

        if (editRecordId) {
            // Activate the records tab
            const recordsTab = new bootstrap.Tab(this.recordsTabBtn);
            recordsTab.show();

            // Wait for the tab content to be shown before fetching the record
            this.recordsTabBtn.addEventListener('shown.bs.tab', async () => {
                try {
                    const response = await RecordsAPI.getById(editRecordId);
                    if (!response.success) {
                        ErrorHandler.handleApiError(response, this.recordMessage);
                        return;
                    }
                    this.displayRecordForEdit(response.data);
                } catch (error) {
                    console.error('Error fetching record for edit:', error);
                    errorHandler.handleNetworkError(error, this.recordMessage);
                }
            }, { once: true });
        }
    }

    /**
     * Setup keyboard shortcuts for admin panel
     */
    setupKeyboardShortcuts() {
        // Refresh data
        keyboardShortcuts.register('f5', () => {
            this.loadInitialData();
        }, 'Refresh all data');

        keyboardShortcuts.register('ctrl+r', () => {
            this.loadInitialData();
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

        // Quick actions
        keyboardShortcuts.register('ctrl+s', () => {
            if (this.adminSaveButton && !this.adminSaveButton.disabled) {
                this.adminSaveButton.click();
            }
        }, 'Save profile changes');
    }
}

// Initialize the admin controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Debug authentication before initializing controller
    console.log('=== Admin Panel Authentication Debug ===');
    console.log('Token from localStorage:', localStorage.getItem('token'));
    console.log('AuthAPI.isAuthenticated():', AuthAPI.isAuthenticated());
    
    try {
        const userRoles = AuthAPI.getUserRole();
        console.log('User roles:', userRoles);
        console.log('Has admin role:', userRoles.includes('admin'));
    } catch (error) {
        console.log('Error getting user roles:', error);
    }
    
    console.log('=== End Debug ===');
    
    // Small delay to see debug output before potential redirect
    setTimeout(() => {
        new AdminController();
    }, 100);
});

