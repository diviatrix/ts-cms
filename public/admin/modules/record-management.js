/**
 * Record Management Module
 * Handles record CRUD operations for the admin panel
 */

import { RecordsAPI, AuthAPI } from '../../js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler, errorHandler, ConfirmationDialog, messages } from '../../js/ui-utils.js';
import { getThemeColors } from '../../js/utils/theme-api.js';

export class RecordManagement {
    constructor(elements, dataTable) {
        this.elements = elements;
        this.recordsTable = dataTable;
        this.recordMessage = new MessageDisplay(elements.recordMessageDiv);
        
        this.setupEventHandlers();
    }

    /**
     * Get themed card styles using theme API
     */
    getThemedCardStyles() {
        const colors = getThemeColors();
        return `border-radius: 10px; margin-bottom: 1em; padding: 1em; background: ${colors.surfaceColor}; color: ${colors.textColor}; border: 1px solid ${colors.borderColor}; min-height: 3.5em;`;
    }

    /**
     * Get themed secondary text styles using theme API
     */
    getThemedSecondaryStyles() {
        const colors = getThemeColors();
        return `color: ${colors.secondaryColor}; font-size: 0.9em;`;
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
                    messages.error('Error loading record data', { toast: true });
                }
            }
        });
    }

    /**
     * Load records and populate the data table
     */
    async loadRecords() {
        try {
            if (!AuthAPI.isAuthenticated()) {
                messages.error('Not authenticated. Please log in.', { toast: true });
                window.location.href = '/login';
                return;
            }
            this.recordMessage.hide();
            this.elements.recordListContainer.innerHTML = '<div class="themed" style="padding:1em;">Loading records...</div>';
            const response = await RecordsAPI.getAll();
            if (!response.success) {
                messages.error('Failed to load records', { toast: true });
                errorHandler.handleApiError(response, this.recordMessage);
                return;
            }
            const records = response.data || [];
            if (records.length === 0) {
                this.elements.recordListContainer.innerHTML = '<div class="themed" style="padding:1em;">No records found</div>';
            } else {
                this.elements.recordListContainer.innerHTML = records.map(record => `
                    <div class="record-card themed" style="${this.getThemedCardStyles()}">
                        <div class="record-title-row" style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em; cursor: pointer;">
                            ${record.title || 'Untitled'}
                        </div>
                        <div class="record-meta-row" style="display: flex; align-items: center; gap: 1em;">
                            <span class="record-date" style="${this.getThemedSecondaryStyles()}">${new Date(record.created_at).toLocaleDateString()}</span>
                            <span class="badge ${record.is_published ? 'bg-success' : 'bg-secondary'}">${record.is_published ? 'Published' : 'Draft'}</span>
                            <span style="flex: 1"></span>
                            <button class="icon-btn edit-record-btn btn btn-sm btn-primary" data-record-id="${record.id}" title="Edit">✏️</button>
                            <button class="icon-btn delete-record-btn btn btn-sm btn-secondary" data-record-id="${record.id}" title="Delete">🗑️</button>
                        </div>
                    </div>
                `).join('');
                this.setupRecordActions();
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            messages.error('Network error occurred', { toast: true });
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
            messages.error('Not authenticated. Please log in.', { toast: true });
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
    async handleRecordDelete(recordId) {
        const idToDelete = recordId || this.elements.recordEditInfo.dataset.currentRecordId;
        if (!idToDelete) {
            messages.error('No record selected for deletion.', { toast: true });
            return;
        }
        if (!AuthAPI.isAuthenticated()) {
            messages.error('Not authenticated. Please log in.', { toast: true });
            window.location.href = '/login';
            return;
        }
        try {
            loadingManager.setLoading(this.elements.recordDeleteButton, true, 'Deleting...');
            const response = await RecordsAPI.delete(idToDelete);
            this.recordMessage.showApiResponse(response);
            if (response.success) {
                this.elements.recordEditTab.classList.add('d-none');
                setTimeout(() => {
                    this.loadRecords();
                }, 1000);
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            errorHandler.handleNetworkError(error, this.recordMessage);
        } finally {
            loadingManager.setLoading(this.elements.recordDeleteButton, false);
        }
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

    setupRecordActions() {
        // Track the currently confirming button
        let confirmingBtn = null;
        document.querySelectorAll('.edit-record-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const recordId = btn.getAttribute('data-record-id');
                // Fetch the full record data before editing
                try {
                    const response = await RecordsAPI.getById(recordId);
                    if (response.success) {
                        this.displayRecordForEdit(response.data);
                    } else {
                        messages.error('Failed to load record for editing.', { toast: true });
                    }
                } catch (error) {
                    messages.error('Error loading record for editing.', { toast: true });
                }
            });
        });
        document.querySelectorAll('.delete-record-btn').forEach(btn => {
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-secondary');
            btn.setAttribute('title', 'Click again to confirm deletion');
            btn.dataset.confirming = 'false';
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                // Reset other buttons
                document.querySelectorAll('.delete-record-btn').forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.classList.remove('btn-danger');
                        otherBtn.classList.add('btn-secondary');
                        otherBtn.setAttribute('title', 'Click again to confirm deletion');
                        otherBtn.dataset.confirming = 'false';
                    }
                });
                if (btn.dataset.confirming === 'true') {
                    // Confirmed, delete
                    btn.classList.remove('btn-danger');
                    btn.classList.add('btn-secondary');
                    btn.setAttribute('title', 'Click again to confirm deletion');
                    btn.dataset.confirming = 'false';
                    const recordId = btn.getAttribute('data-record-id');
                    await this.handleRecordDelete(recordId);
                } else {
                    // First click, set to confirm state
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-danger');
                    btn.setAttribute('title', 'Click again to permanently delete');
                    btn.dataset.confirming = 'true';
                    confirmingBtn = btn;
                }
            });
        });
        // Reset confirm state if user clicks elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-record-btn')) {
                document.querySelectorAll('.delete-record-btn').forEach(btn => {
                    btn.classList.remove('btn-danger');
                    btn.classList.add('btn-secondary');
                    btn.setAttribute('title', 'Click again to confirm deletion');
                    btn.dataset.confirming = 'false';
                });
            }
        });
    }
}
