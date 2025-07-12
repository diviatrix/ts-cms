import { RecordsAPI, isAuthenticated } from '../../core/api-client.js';
import { BaseTabController } from './base-tab-controller.js';
import { TabManager } from '../../components/tab-manager.js';
import { renderCardTitle } from '../../utils/ui-snippets.js';
import { showConfirmationDialog } from '../../utils/dialogs.js';

export class RecordsTab extends BaseTabController {
    constructor(container) {
        super(container, '/partials/records-tab.html');
        this.allRecords = [];
        this.elements = {};
        this.tabManager = null;
    }

    async init() {
        this.setupTabManager();
        this.addEventListeners();
        await this.loadRecords();
    }

    setupTabManager() {
        const tabContainer = this.container.querySelector('#record-management-tabs');
        const tabConfig = {
            initialTab: 'list',
            tabs: [
                {
                    id: 'list',
                    label: 'Record List',
                    loader: (panel) => this.renderRecordList(panel)
                },
                {
                    id: 'edit',
                    label: 'Edit Record',
                    loader: (panel) => this.renderEditForm(panel)
                }
            ]
        };
        this.tabManager = new TabManager(tabContainer, tabConfig);
        this.tabManager.navContainer.querySelector('[data-tab-id="edit"]').style.display = 'none';
    }

    addEventListeners() {
        this.container.addEventListener('click', async (e) => {
            const newRecordBtn = e.target.closest('#newRecordButton');
            const editBtn = e.target.closest('.edit-record-btn');
            const deleteBtn = e.target.closest('.delete-record-btn');
            const saveBtn = e.target.closest('#recordSaveButton');
            const cancelBtn = e.target.closest('#recordCancelButton');

            if (newRecordBtn) this.handleNewRecord();
            else if (editBtn) this.handleEditRecord(editBtn.dataset.recordId);
            else if (deleteBtn) this.handleDeleteRecord(deleteBtn.dataset.recordId);
            else if (saveBtn) this.handleRecordSave();
            else if (cancelBtn) this.tabManager.activateTab('list');
        });
    }

    async loadRecords() {
        if (!isAuthenticated()) return;
        const response = await RecordsAPI.getAll();
        if (response.success) {
            this.allRecords = response.data || [];
            // If the list view is already active, re-render it
            const listPanel = this.tabManager.loadedTabs.get('list')?.panel;
            if (listPanel && this.tabManager.activeTabId === 'list') {
                this.renderRecordList(listPanel);
            }
        } else {
            const listPanel = this.tabManager.loadedTabs.get('list')?.panel;
            if (listPanel) {
                listPanel.innerHTML = '<p class="error">Failed to load records.</p>';
            }
        }
    }

    async renderRecordList(panel) {
        const response = await fetch('/partials/records/list.html');
        panel.innerHTML = await response.text();

        const container = panel.querySelector('#recordListContainer');
        if (this.allRecords.length === 0) {
            container.innerHTML = '<p>No records found.</p>';
            return;
        }
        container.innerHTML = this.allRecords.map(record => this.renderRecordCard(record)).join('');
    }

    renderRecordCard(record) {
        return `
            <div class="card">
                <div class="admin-card-title">
                    ${renderCardTitle(record.title || 'Untitled')}
                </div>
                <div class="admin-card-meta">
                    <span>${record.is_published ? 'Published' : 'Draft'}</span>
                    <span style="flex: 1"></span>
                    <button class="btn edit-record-btn" data-record-id="${record.id}">Edit</button>
                    <button class="btn delete-record-btn" data-record-id="${record.id}">Delete</button>
                </div>
            </div>
        `;
    }

    async renderEditForm(panel, record = {}) {
        const response = await fetch('/partials/records/edit.html');
        panel.innerHTML = await response.text();
        this.cacheEditFormElements(panel);
        this.populateEditForm(record);
    }

    cacheEditFormElements(panel) {
        this.elements.recordInfo = panel.querySelector('#recordInfo');
        this.elements.recordTitle = panel.querySelector('#recordTitle');
        this.elements.recordDescription = panel.querySelector('#recordDescription');
        this.elements.recordImageUrl = panel.querySelector('#recordImageUrl');
        this.elements.recordContent = panel.querySelector('#recordContent');
        this.elements.recordTags = panel.querySelector('#recordTags');
        this.elements.recordCategories = panel.querySelector('#recordCategories');
        this.elements.recordIsPublished = panel.querySelector('#recordIsPublished');
        this.elements.recordMessageDiv = panel.querySelector('#recordMessageDiv');
    }

    populateEditForm(record) {
        this.elements.recordInfo.dataset.currentRecordId = record.id || '';
        this.elements.recordTitle.value = record.title || '';
        this.elements.recordDescription.value = record.description || '';
        this.elements.recordImageUrl.value = record.image_url || '';
        this.elements.recordContent.value = record.content || '';
        this.elements.recordTags.value = (record.tags || []).join(', ');
        this.elements.recordCategories.value = (record.categories || []).join(', ');
        this.elements.recordIsPublished.checked = record.is_published || false;
    }

    async handleEditRecord(recordId) {
        const response = await RecordsAPI.getById(recordId);
        if (response.success) {
            await this.tabManager.activateTab('edit');
            const editPanel = this.tabManager.loadedTabs.get('edit')?.panel;
            if (editPanel) {
                this.renderEditForm(editPanel, response.data);
            }
        } else {
            this.showMessage('Failed to load record for editing.', false);
        }
    }

    async handleNewRecord() {
        await this.tabManager.activateTab('edit');
        const editPanel = this.tabManager.loadedTabs.get('edit')?.panel;
        if (editPanel) {
            this.renderEditForm(editPanel, {});
        }
    }

    async handleRecordSave() {
        const recordId = this.elements.recordInfo.dataset.currentRecordId;
        const recordData = {
            title: this.elements.recordTitle.value,
            description: this.elements.recordDescription.value,
            image_url: this.elements.recordImageUrl.value,
            content: this.elements.recordContent.value,
            tags: this.elements.recordTags.value.split(',').map(t => t.trim()).filter(Boolean),
            categories: this.elements.recordCategories.value.split(',').map(c => c.trim()).filter(Boolean),
            is_published: this.elements.recordIsPublished.checked,
        };

        const response = recordId
            ? await RecordsAPI.update(recordId, recordData)
            : await RecordsAPI.create(recordData);

        if (response.success) {
            this.showMessage('Record saved successfully.', true);
            await this.loadRecords();
            this.tabManager.activateTab('list');
        } else {
            this.showMessage(`Failed to save record: ${response.message}`, false);
        }
    }

    async handleDeleteRecord(recordId) {
        const confirmed = await showConfirmationDialog('Are you sure you want to delete this record?');
        if (!confirmed) return;

        const response = await RecordsAPI.delete(recordId);
        if (response.success) {
            this.showMessage('Record deleted successfully.', true);
            await this.loadRecords();
            this.tabManager.activateTab('list');
        } else {
            this.showMessage(`Failed to delete record: ${response.message}`, false);
        }
    }

    showMessage(message, isSuccess) {
        if (!this.elements.recordMessageDiv) {
            const activePanel = this.container.querySelector('.tab-pane.active');
            if (activePanel) {
                this.elements.recordMessageDiv = activePanel.querySelector('#recordMessageDiv');
            }
        }
        if (this.elements.recordMessageDiv) {
            this.elements.recordMessageDiv.textContent = message;
            this.elements.recordMessageDiv.className = isSuccess ? 'message success' : 'message error';
            setTimeout(() => this.elements.recordMessageDiv.textContent = '', 3000);
        }
   }

    // Cleanup method for tab switching
    destroy() {
        // Remove all event listeners from this.container
        this.container.replaceWith(this.container.cloneNode(true));
        this.elements = {};
    }
}