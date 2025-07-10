/**
 * Record Management Module
 * Handles record CRUD operations for the admin panel
 */

import { RecordsAPI } from '../../js/api-core.js';
import { DownloadUtils } from '../../js/utils/download-utils.js';
import { BaseAdminController } from './base-admin-controller.js';
import { renderCardTitle } from '../../js/shared-components/ui-snippets.js';
import { AdminUtils } from './admin-utils.js';

export class RecordManagement extends BaseAdminController {
    constructor(elements, dataTable) {
        super({
            elements,
            messageDiv: elements.recordMessageDiv
        });
        
        this.recordsTable = dataTable;
        
        this.setupEventHandlers();
    }

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
                        console.error('Error loading record data: ' + (error?.message || error?.toString()));
                    }
                }
            }
        });
    }

    async loadRecords() {
        if (!this.checkAuthentication()) {
            return;
        }
        
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
                            <div class="card">
                                <div class="record-title-row">
                                    ${renderCardTitle(record.title || 'Untitled')}
                                </div>
                                <div class="record-meta-row">
                                    <span>${record.is_published ? 'Published' : 'Draft'}</span>
                                    <span style="flex: 1"></span>
                                    <button class="btn edit-record-btn" data-record-id="${record.id}" title="Edit">✏️</button>
                                    <button class="btn delete-record-btn" data-record-id="${record.id}" title="Delete">🗑️</button>
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

    displayRecordForEdit(record) {
        // Always refresh elements after the form is rendered
        this.elements = AdminUtils.getDOMElements();
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
        this.elements.recordInfo.dataset.currentRecordId = record.id || '';
        this.elements.recordTags.value = (record.tags && record.tags.join(', ')) || '';
        this.elements.recordCategories.value = (record.categories && record.categories.join(', ')) || '';
    }

    handleNewRecord() {
        // Always refresh elements after the form is rendered
        this.elements = AdminUtils.getDOMElements();
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
        this.elements.recordInfo.dataset.currentRecordId = '';
        this.elements.recordTags.value = '';
        this.elements.recordCategories.value = '';
    }

    async handleRecordSave() {
        const recordId = this.elements.recordInfo.dataset.currentRecordId;
        if (!this.checkAuthentication()) { return; }
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
                    this.loadRecords();
                }
            }
        );
        this.handleApiResponse(response);
        if (response.success && !recordId && response.data?.id) { this.elements.recordInfo.dataset.currentRecordId = response.data.id; }
    }

    /**
     * Handle record deletion
     */
    async handleRecordDelete(recordId) {
        const idToDelete = recordId || this.elements.recordInfo.dataset.currentRecordId;
        if (!idToDelete) {
            console.error('No record selected for deletion.');
            return;
        }
        if (!this.checkAuthentication()) { return; }
        const response = await this.safeApiCall(() => RecordsAPI.delete(idToDelete), {
            loadingElements: [this.elements.recordDeleteButton],
            loadingText: 'Deleting...',
            operationName: 'Delete Record',
            requestData: { recordId: idToDelete },
            successCallback: () => {
                this.elements.recordEditTab.classList.add('d-none');
                this.loadRecords();
            }
        });
        this.handleApiResponse(response);
    }

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
                        console.error('Failed to load record for edit', response.message);
                        return;
                    }
                    this.displayRecordForEdit(response.data);
                } catch (error) {
                    console.error('Error fetching record for edit:', error);
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
                        console.error('Failed to load record for editing', response.message);
                    }
                } catch (error) {
                    console.error('Error loading record for editing:', error);
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
        const recordId = this.elements.recordInfo.dataset.currentRecordId;
        if (!recordId) {
            console.error('No record selected for download.');
            return;
        }

        const title = this.elements.recordTitle.value;
        const content = this.elements.recordContent.value;
        
        DownloadUtils.downloadAsMarkdown(title, content);
    }
}
