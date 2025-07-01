/**
 * Record Management Module
 * Handles record CRUD operations for the admin panel
 */

import { RecordsAPI, AuthAPI } from '../../js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler, errorHandler, ConfirmationDialog } from '../../js/ui-utils.js';

export class RecordManagement {
    constructor(elements, dataTable) {
        this.elements = elements;
        this.recordsTable = dataTable;
        this.recordMessage = new MessageDisplay(elements.recordMessageDiv);
        
        this.setupEventHandlers();
    }

    /**
     * Setup record management event handlers
     */
    setupEventHandlers() {
        // Record CRUD buttons
        if (this.elements.newRecordButton) {
            this.elements.newRecordButton.addEventListener('click', () => this.handleNewRecord());
        }
        
        if (this.elements.recordSaveButton) {
            this.elements.recordSaveButton.addEventListener('click', () => this.handleRecordSave());
        }
        
        if (this.elements.recordDeleteButton) {
            this.elements.recordDeleteButton.addEventListener('click', () => this.handleRecordDelete());
        }

        // Record link clicks in the data table
        this.elements.recordListContainer.addEventListener('click', (e) => {
            const recordLink = e.target.closest('.record-link');
            if (recordLink) {
                e.preventDefault();
                try {
                    const recordData = JSON.parse(recordLink.dataset.record);
                    this.displayRecordForEdit(recordData);
                } catch (error) {
                    console.error('Error parsing record data:', error);
                    this.recordMessage.showError('Error loading record data');
                }
            }
        });
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
     * Display record for editing
     */
    displayRecordForEdit(record) {
        this.elements.recordEditTab.classList.remove('d-none');
        this.elements.recordEditInfo.dataset.currentRecordId = record.id || '';
        this.elements.recordTitle.value = record.title || '';
        this.elements.recordDescription.value = record.description || '';
        this.elements.recordContent.value = record.content || '';
        this.elements.recordTags.value = (record.tags && record.tags.join(', ')) || '';
        this.elements.recordCategories.value = (record.categories && record.categories.join(', ')) || '';
        this.elements.recordIsPublished.checked = record.is_published || false;
        this.recordMessage.hide();
    }

    /**
     * Handle new record creation
     */
    handleNewRecord() {
        this.elements.recordEditTab.classList.remove('d-none');
        this.elements.recordEditInfo.dataset.currentRecordId = '';
        this.elements.recordTitle.value = '';
        this.elements.recordDescription.value = '';
        this.elements.recordContent.value = '';
        this.elements.recordTags.value = '';
        this.elements.recordCategories.value = '';
        this.elements.recordIsPublished.checked = false;
        this.recordMessage.hide();
    }

    /**
     * Handle record save (create or update)
     */
    async handleRecordSave() {
        const recordId = this.elements.recordEditInfo.dataset.currentRecordId;
        
        // Check authentication
        if (!AuthAPI.isAuthenticated()) {
            this.recordMessage.showError('Not authenticated. Please log in.');
            window.location.href = '/login';
            return;
        }

        const recordData = {
            title: this.elements.recordTitle.value,
            description: this.elements.recordDescription.value,
            content: this.elements.recordContent.value,
            tags: this.elements.recordTags.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
            categories: this.elements.recordCategories.value.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0),
            is_published: this.elements.recordIsPublished.checked,
        };

        try {
            loadingManager.setLoading(this.elements.recordSaveButton, true, 'Saving...');
            
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
                    this.elements.recordEditInfo.dataset.currentRecordId = response.data.id;
                }
            }
        } catch (error) {
            console.error('Error saving record:', error);
            errorHandler.handleNetworkError(error, this.recordMessage);
        } finally {
            loadingManager.setLoading(this.elements.recordSaveButton, false);
        }
    }

    /**
     * Handle record deletion
     */
    async handleRecordDelete() {
        const recordId = this.elements.recordEditInfo.dataset.currentRecordId;
        
        if (!recordId) {
            this.recordMessage.showError('No record selected for deletion.');
            return;
        }

        // Check authentication
        if (!AuthAPI.isAuthenticated()) {
            this.recordMessage.showError('Not authenticated. Please log in.');
            window.location.href = '/login';
            return;
        }

        // Show confirmation dialog
        try {
            const confirmed = await this.showDeleteConfirmation();
            if (!confirmed) return;

            loadingManager.setLoading(this.elements.recordDeleteButton, true, 'Deleting...');
            
            const response = await RecordsAPI.delete(recordId);
            
            this.recordMessage.showApiResponse(response);
            
            if (response.success) {
                // Hide the edit form and refresh the list
                this.elements.recordEditTab.classList.add('d-none');
                setTimeout(() => {
                    this.loadRecords();
                }, 1000); // Small delay to let user see the success message
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            errorHandler.handleNetworkError(error, this.recordMessage);
        } finally {
            loadingManager.setLoading(this.elements.recordDeleteButton, false);
        }
    }

    /**
     * Show confirmation dialog for record deletion
     * @returns {Promise<boolean>} - User's confirmation choice
     */
    async showDeleteConfirmation() {
        return new Promise((resolve) => {
            const dialog = new ConfirmationDialog({
                title: 'Delete Record',
                message: 'Are you sure you want to delete this record? This action cannot be undone.',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });
            dialog.show();
        });
    }

    /**
     * Check URL for record ID and open for edit
     */
    async checkUrlForRecordId(recordsTabBtn) {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
        const editRecordId = params.get('editRecordId');

        if (editRecordId) {
            // Activate the records tab
            const recordsTab = new bootstrap.Tab(recordsTabBtn);
            recordsTab.show();

            // Wait for the tab content to be shown before fetching the record
            recordsTabBtn.addEventListener('shown.bs.tab', async () => {
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
}
