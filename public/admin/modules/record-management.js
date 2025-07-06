/**
 * Record Management Module
 * Handles record CRUD operations for the admin panel
 */

import { RecordsAPI, AuthAPI } from '../../js/api-client.js';
import { ConfirmationDialog, messages } from '../../js/ui-utils.js';
import { DownloadUtils } from '../../js/utils/download-utils.js';
import { BaseAdminController } from './base-admin-controller.js';

export class RecordManagement extends BaseAdminController {
    constructor(elements, dataTable) {
        super({
            elements,
            messageDiv: elements.recordMessageDiv
        });
        
        this.recordsTable = dataTable;
        
        this.setupEventHandlers();
    }

    /**
     * Setup record management event handlers
     */
    setupEventHandlers() {
        // Bind direct element events
        this.bindEvents({
            newRecordButton: {
                click: () => this.handleNewRecord()
            },
            recordSaveButton: {
                click: () => this.handleRecordSave()
            },
            recordDeleteButton: {
                click: () => this.handleRecordDelete()
            },
            recordDownloadButton: {
                click: () => this.handleRecordDownload()
            }
        });

        // Setup delegated events for dynamic content
        this.setupDelegatedEvents(this.elements.recordListContainer, {
            '.record-link': {
                click: (event, target) => {
                    event.preventDefault();
                    try {
                        const recordData = JSON.parse(target.dataset.record);
                        this.displayRecordForEdit(recordData);
                    } catch (error) {
                        console.error('Error parsing record data:', error);
                        messages.error('Error loading record data');
                    }
                }
            }
        });
    }

    /**
     * Load records and populate the data table
     */
    async loadRecords() {
        if (!this.checkAuthentication()) {
            return;
        }

        this.messageDisplay.hide();
        this.showContainerLoading(this.elements.recordListContainer, 'Loading records...');
        
        const response = await this.safeApiCall(
            () => RecordsAPI.getAll(),
            {
                operationName: 'Load Records',
                successCallback: (data) => {
                    const records = data || [];
                    if (records.length === 0) {
                        this.showContainerEmpty(this.elements.recordListContainer, 'No records found');
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
                }
            }
        );

        if (!response.success) {
            this.showContainerError(this.elements.recordListContainer, 'Failed to load records');
        }
    }

    /**
     * Display record for editing
     */
    displayRecordForEdit(record) {
        this.displayItemForEdit(record, {
            editTabSelector: '#recordEditTab',
            formFields: {
                recordTitle: 'title',
                recordDescription: 'description',
                recordImageUrl: 'image_url',
                recordContent: 'content',
                recordTags: 'tags',
                recordCategories: 'categories',
                recordIsPublished: 'is_published'
            }
        });
        
        // Handle special field types
        this.elements.recordEditInfo.dataset.currentRecordId = record.id || '';
        this.elements.recordTags.value = (record.tags && record.tags.join(', ')) || '';
        this.elements.recordCategories.value = (record.categories && record.categories.join(', ')) || '';
    }

    /**
     * Handle new record creation
     */
    handleNewRecord() {
        this.handleNewItem({
            editTabSelector: '#recordEditTab',
            formFields: {
                recordTitle: 'title',
                recordDescription: 'description',
                recordImageUrl: 'image_url',
                recordContent: 'content',
                recordTags: 'tags',
                recordCategories: 'categories',
                recordIsPublished: 'is_published'
            }
        });
        
        // Handle special field types
        this.elements.recordEditInfo.dataset.currentRecordId = '';
        this.elements.recordTags.value = '';
        this.elements.recordCategories.value = '';
    }

    /**
     * Handle record save (create or update)
     */
    async handleRecordSave() {
        const recordId = this.elements.recordEditInfo.dataset.currentRecordId;
        
        if (!this.checkAuthentication()) {
            return;
        }

        const recordData = {
            title: this.elements.recordTitle.value,
            description: this.elements.recordDescription.value,
            image_url: this.elements.recordImageUrl.value || null,
            content: this.elements.recordContent.value,
            tags: this.elements.recordTags.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
            categories: this.elements.recordCategories.value.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0),
            is_published: this.elements.recordIsPublished.checked,
        };

        const operation = recordId ? 'Update Record' : 'Create Record';
        const apiCall = recordId ? 
            () => RecordsAPI.update(recordId, recordData) : 
            () => RecordsAPI.create(recordData);

        const response = await this.safeApiCall(
            apiCall,
            {
                loadingElements: [this.elements.recordSaveButton],
                loadingText: 'Saving...',
                operationName: operation,
                requestData: recordData,
                successCallback: () => {
                    this.refreshData(() => this.loadRecords());
                }
            }
        );

        this.messageDisplay.showApiResponse(response);
        
        if (response.success && !recordId && response.data?.id) {
            this.elements.recordEditInfo.dataset.currentRecordId = response.data.id;
        }
    }

    /**
     * Handle record deletion
     */
    async handleRecordDelete(recordId) {
        const idToDelete = recordId || this.elements.recordEditInfo.dataset.currentRecordId;
        if (!idToDelete) {
            messages.error('No record selected for deletion.');
            return;
        }
        
        if (!this.checkAuthentication()) {
            return;
        }

        const response = await this.safeApiCall(
            () => RecordsAPI.delete(idToDelete),
            {
                loadingElements: [this.elements.recordDeleteButton],
                loadingText: 'Deleting...',
                operationName: 'Delete Record',
                requestData: { recordId: idToDelete },
                successCallback: () => {
                    this.elements.recordEditTab.classList.add('d-none');
                    this.refreshData(() => this.loadRecords());
                }
            }
        );

        this.messageDisplay.showApiResponse(response);
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
        document.querySelectorAll('.edit-record-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const recordId = btn.getAttribute('data-record-id');
                // Fetch the full record data before editing
                try {
                    const response = await RecordsAPI.getById(recordId);
                    if (response.success) {
                        this.displayRecordForEdit(response.data);
                    } else {
                        messages.error('Failed to load record for editing.');
                    }
                } catch (error) {
                    messages.error('Error loading record for editing.');
                }
            });
        });
        document.querySelectorAll('.delete-record-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const recordId = btn.getAttribute('data-record-id');
                const confirmed = await ConfirmationDialog.show({
                    title: 'Delete Record',
                    message: 'Are you sure you want to delete this record? This action cannot be undone.',
                    confirmText: 'Delete',
                    cancelText: 'Cancel',
                    confirmBtnClass: 'btn-danger'
                });
                if (confirmed) {
                    await this.handleRecordDelete(recordId);
                }
            });
        });
    }

    /**
     * Handle record download as markdown
     */
    handleRecordDownload() {
        const recordId = this.elements.recordEditInfo.dataset.currentRecordId;
        if (!recordId) {
            messages.error('No record selected for download.');
            return;
        }

        const title = this.elements.recordTitle.value;
        const content = this.elements.recordContent.value;
        
        DownloadUtils.downloadAsMarkdown(title, content);
    }
}
