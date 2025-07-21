import { RecordsAPI } from '../../core/api-client.js';
import { ImagePreview } from '../../components/image-preview.js';

export default class RecordsManageController {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('records-manage-container');
        this.selectedRecord = null;
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        this.render();
        await this.loadRecords();
        
        // Check if we need to edit a specific record
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            this.editRecord(editId);
        }
    }

    render() {
        this.container.innerHTML = `
            <h2 class="page-title">Manage Records</h2>
            <div class="card-grid" id="recordsGrid">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">New Record</h3>
                        <div id="newRecordForm"></div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">Records List</h3>
                        <div id="recordsList">Loading...</div>
                    </div>
                </div>
            </div>
        `;
        
        window.recordsManager = this;
        this.renderNewRecordForm();
    }

    async loadRecords() {
        try {
            const response = await RecordsAPI.getAll();
            if (response.success) {
                this.renderRecordsList(response.data);
            }
        } catch (error) {
            document.getElementById('recordsList').innerHTML = '<p class="alert alert-danger">Failed to load records</p>';
        }
    }

    renderRecordsList(records) {
        const container = document.getElementById('recordsList');
        if (!records.length) {
            container.innerHTML = '<p>No records found</p>';
            return;
        }
        
        container.innerHTML = records.map(record => `
            <div class="box">
                <div class="meta-row">
                    <span><strong>${record.title}</strong></span>
                    <span>${record.is_published ? 'Published' : 'Draft'}</span>
                </div>
                <div class="meta-row">
                    <button class="btn" onclick="window.recordsManager.editRecord('${record.id}')">Edit</button>
                    <button class="btn" onclick="window.recordsManager.deleteRecord('${record.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    renderNewRecordForm() {
        const container = document.getElementById('newRecordForm');
        container.innerHTML = `
            <form id="createRecordForm">
                <label for="newRecordTitle">Title</label>
                <input type="text" id="newRecordTitle" required>
                
                <label for="newRecordDescription">Description</label>
                <input type="text" id="newRecordDescription" required>
                
                <label for="newRecordImageUrl">Image URL (optional)</label>
                <input type="text" id="newRecordImageUrl" placeholder="https://example.com/image.jpg">
                <div id="newRecordImagePreview"></div>
                
                <label for="newRecordContent">Content (Markdown)</label>
                <textarea id="newRecordContent" rows="5" required></textarea>
                
                <label for="newRecordTags">Tags (comma-separated)</label>
                <input type="text" id="newRecordTags">
                
                <label for="newRecordCategories">Categories (comma-separated)</label>
                <input type="text" id="newRecordCategories">
                
                <label>
                    <input type="checkbox" id="newRecordPublished">
                    Published
                </label>
                
                <button type="submit" class="btn">Create Record</button>
            </form>
        `;
        
        document.getElementById('createRecordForm').addEventListener('submit', (e) => this.handleCreate(e));
        
        this.newImagePreview = new ImagePreview('newRecordImagePreview');
        document.getElementById('newRecordImageUrl').addEventListener('input', (e) => this.newImagePreview.update(e.target.value));
    }

    async editRecord(id) {
        try {
            const response = await RecordsAPI.getById(id);
            if (response.success) {
                this.selectedRecord = response.data;
                this.showEditCard();
                this.renderEditor(response.data);
            }
        } catch (error) {
            this.showMessage('Failed to load record', 'error');
        }
    }
    
    showEditCard() {
        const existingEditCard = document.getElementById('editRecordCard');
        if (!existingEditCard) {
            const grid = document.getElementById('recordsGrid');
            const editCard = document.createElement('div');
            editCard.className = 'card';
            editCard.id = 'editRecordCard';
            editCard.innerHTML = `
                <div class="card-body">
                    <h3 class="card-title">Edit Record</h3>
                    <div id="recordEditor"></div>
                </div>
            `;
            grid.appendChild(editCard);
        }
    }

    renderEditor(record) {
        const container = document.getElementById('recordEditor');
        container.innerHTML = `
            <form id="recordForm">
                <label for="recordTitle">Title</label>
                <input type="text" id="recordTitle" value="${record.title || ''}" required>
                
                <label for="recordDescription">Description</label>
                <input type="text" id="recordDescription" value="${record.description || ''}" required>
                
                <label for="recordImageUrl">Image URL (optional)</label>
                <input type="text" id="recordImageUrl" value="${record.image_url || ''}" placeholder="https://example.com/image.jpg">
                <div id="recordImagePreview"></div>
                
                <label for="recordContent">Content (Markdown)</label>
                <textarea id="recordContent" rows="10" required>${record.content || ''}</textarea>
                
                <label for="recordTags">Tags (comma-separated)</label>
                <input type="text" id="recordTags" value="${(record.tags || []).join(', ')}">
                
                <label for="recordCategories">Categories (comma-separated)</label>
                <input type="text" id="recordCategories" value="${(record.categories || []).join(', ')}">
                
                <label>
                    <input type="checkbox" id="recordPublished" ${record.is_published ? 'checked' : ''}>
                    Published
                </label>
                
                <div class="meta-row">
                    <button type="submit" class="btn">Update</button>
                    <button type="button" class="btn" onclick="window.recordsManager.cancelEdit()">Cancel</button>
                </div>
            </form>
            
            <h4>Preview</h4>
            <div class="box" id="markdownPreview"></div>
        `;
        
        document.getElementById('recordForm').addEventListener('submit', (e) => this.handleUpdate(e));
        document.getElementById('recordContent').addEventListener('input', (e) => this.updatePreview(e.target.value));
        
        this.editImagePreview = new ImagePreview('recordImagePreview');
        this.editImagePreview.update(record.image_url || '');
        document.getElementById('recordImageUrl').addEventListener('input', (e) => this.editImagePreview.update(e.target.value));
        
        this.updatePreview(record.content || '');
    }

    updatePreview(content) {
        const preview = document.getElementById('markdownPreview');
        if (preview && window.marked) {
            preview.innerHTML = marked.parse(content);
        }
    }
    

    async handleCreate(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('newRecordTitle').value,
            description: document.getElementById('newRecordDescription').value,
            image_url: document.getElementById('newRecordImageUrl').value,
            content: document.getElementById('newRecordContent').value,
            tags: document.getElementById('newRecordTags').value.split(',').map(t => t.trim()).filter(t => t),
            categories: document.getElementById('newRecordCategories').value.split(',').map(c => c.trim()).filter(c => c),
            is_published: document.getElementById('newRecordPublished').checked
        };
        
        try {
            const response = await RecordsAPI.create(formData);
            
            if (response.success) {
                this.showMessage('Record created successfully', 'success');
                await this.loadRecords();
                document.getElementById('createRecordForm').reset();
            } else {
                this.showMessage(response.message || 'Failed to create record', 'error');
            }
        } catch (error) {
            this.showMessage('Failed to create record', 'error');
        }
    }

    async handleUpdate(e) {
        e.preventDefault();
        
        if (!this.selectedRecord) return;
        
        const formData = {
            title: document.getElementById('recordTitle').value,
            description: document.getElementById('recordDescription').value,
            image_url: document.getElementById('recordImageUrl').value,
            content: document.getElementById('recordContent').value,
            tags: document.getElementById('recordTags').value.split(',').map(t => t.trim()).filter(t => t),
            categories: document.getElementById('recordCategories').value.split(',').map(c => c.trim()).filter(c => c),
            is_published: document.getElementById('recordPublished').checked
        };
        
        try {
            const response = await RecordsAPI.update(this.selectedRecord.id, formData);
            
            if (response.success) {
                this.showMessage('Record updated successfully', 'success');
                await this.loadRecords();
            } else {
                this.showMessage(response.message || 'Failed to update record', 'error');
            }
        } catch (error) {
            this.showMessage('Failed to update record', 'error');
        }
    }

    async deleteRecord(id) {
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }
        
        try {
            const response = await RecordsAPI.delete(id);
            if (response.success) {
                this.showMessage('Record deleted successfully', 'success');
                await this.loadRecords();
                if (this.selectedRecord && this.selectedRecord.id === id) {
                    this.cancelEdit();
                }
            }
        } catch (error) {
            this.showMessage('Failed to delete record', 'error');
        }
    }

    cancelEdit() {
        this.selectedRecord = null;
        const editCard = document.getElementById('editRecordCard');
        if (editCard) {
            editCard.remove();
        }
    }

    showMessage(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        alert.textContent = message;
        this.container.insertBefore(alert, this.container.firstChild.nextSibling);
        setTimeout(() => alert.remove(), 5000);
    }
}