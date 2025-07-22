import { RecordsAPI } from '../../core/api-client.js';
import { ImagePreview } from '../../components/image-preview.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';

export default class RecordEditorController extends BasePageController {
    constructor(app) {
        super();
        this.app = app;
        this.container = document.getElementById('record-editor-container');
        this.recordId = null;
        this.record = null;
        this.imagePreview = null;
        this.init();
    }

    async init() {
        if (!this.app.user.isAuthenticated) {
            window.location.href = '/';
            return;
        }

        // Get record ID from URL
        const params = new URLSearchParams(window.location.search);
        this.recordId = params.get('id');

        if (this.recordId) {
            await this.loadRecord();
        } else {
            this.initNewRecord();
        }

        this.render();
    }

    async loadRecord() {
        await this.safeApiCall(
            () => RecordsAPI.getById(this.recordId),
            {
                successCallback: (data) => {
                    this.record = data;
                },
                errorCallback: () => {
                    notifications.error('Failed to load record');
                    setTimeout(() => {
                        window.location.href = '/records-manage';
                    }, 2000);
                }
            }
        );
    }

    initNewRecord() {
        this.record = {
            title: '',
            description: '',
            content: '',
            image_url: '',
            tags: [],
            categories: [],
            is_published: false
        };
    }

    render() {
        const isNew = !this.recordId;
        const createdAt = this.record?.created_at ? new Date(this.record.created_at).toLocaleDateString() : null;
        const updatedAt = this.record?.updated_at ? new Date(this.record.updated_at).toLocaleDateString() : null;

        this.container.innerHTML = `
            <h2 class="page-title">${isNew ? 'Create New Record' : 'Edit Record'}</h2>
            ${!isNew && (createdAt || updatedAt) ? `
                <div class="meta-row">
                    ${createdAt ? `<span>Created: ${createdAt}</span>` : ''}
                    ${updatedAt ? `<span>Updated: ${updatedAt}</span>` : ''}
                </div>
            ` : ''}
            
            <form id="recordForm">
                <div class="card-grid">
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title">Record Details</h3>
                            
                            <label for="recordTitle">Title</label>
                            <input type="text" id="recordTitle" value="${this.record.title || ''}" required placeholder="Enter record title">
                            
                            <label for="recordDescription">Description</label>
                            <input type="text" id="recordDescription" value="${this.record.description || ''}" required placeholder="Brief description">
                            
                            <label for="recordImageUrl">Image URL (optional)</label>
                            <input type="text" id="recordImageUrl" value="${this.record.image_url || ''}" placeholder="/img/placeholder-square.png">
                            <div id="recordImagePreview"></div>
                            
                            <label for="recordTags">Tags (comma-separated)</label>
                            <input type="text" id="recordTags" value="${(this.record.tags || []).join(', ')}" placeholder="tag1, tag2, tag3">
                            
                            <label for="recordCategories">Categories (comma-separated)</label>
                            <input type="text" id="recordCategories" value="${(this.record.categories || []).join(', ')}" placeholder="category1, category2">
                            
                            <label class="checkbox-label">
                                <input type="checkbox" id="recordPublished" ${this.record.is_published ? 'checked' : ''}>
                                Published
                            </label>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-body">
                            <label for="recordContent">Content (Markdown)</label>
                            <textarea id="recordContent" rows="30" required placeholder="Write your content in markdown...">${this.record.content || ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-2">
                    <div class="card-body">
                        <h3 class="card-title">Content Preview</h3>
                        <div class="markdown-preview" id="markdownPreview">
                            <p class="text-muted">Preview will appear here...</p>
                        </div>
                    </div>
                </div>
                
                <div class="theme-actions mt-2">
                    <button type="submit" class="btn">${isNew ? 'Create Record' : 'Save Changes'}</button>
                    <a href="/records-manage" class="btn btn-secondary">Cancel</a>
                </div>
            </form>
        `;

        // Set up event listeners
        document.getElementById('recordForm').addEventListener('submit', (e) => this.handleSubmit(e));

        // Set up image preview
        this.imagePreview = new ImagePreview('recordImagePreview', { className: 'record-image-preview' });
        if (this.record.image_url) {
            this.imagePreview.update(this.record.image_url);
        }

        const imageInput = document.getElementById('recordImageUrl');
        if (imageInput) {
            imageInput.addEventListener('input', (e) => this.imagePreview.update(e.target.value));
        }

        // Set up markdown preview
        const contentTextarea = document.getElementById('recordContent');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', () => this.updateMarkdownPreview());
            this.updateMarkdownPreview(); // Initial preview
        }
    }

    updateMarkdownPreview() {
        const content = document.getElementById('recordContent').value;
        const preview = document.getElementById('markdownPreview');
        
        if (!content) {
            preview.innerHTML = '<p class="text-muted">Preview will appear here...</p>';
            return;
        }

        // Simple markdown parsing - you might want to use a proper markdown library
        let html = content
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*)\*/g, '<em>$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            // Paragraphs
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        preview.innerHTML = `<p>${html}</p>`;
    }

    collectFormData() {
        const tags = document.getElementById('recordTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        const categories = document.getElementById('recordCategories').value
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat.length > 0);

        return {
            title: document.getElementById('recordTitle').value,
            description: document.getElementById('recordDescription').value,
            content: document.getElementById('recordContent').value,
            image_url: document.getElementById('recordImageUrl').value,
            tags: tags,
            categories: categories,
            is_published: document.getElementById('recordPublished').checked
        };
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const data = this.collectFormData();
        
        const apiCall = this.recordId 
            ? () => RecordsAPI.update(this.recordId, data)
            : () => RecordsAPI.create(data);
        
        await this.safeApiCall(
            apiCall,
            {
                successCallback: (responseData) => {
                    notifications.success(this.recordId ? 'Record updated successfully!' : 'Record created successfully!');
                    
                    if (!this.recordId && responseData && responseData.id) {
                        // Update URL for new record
                        const newUrl = `/record-editor?id=${responseData.id}`;
                        window.history.replaceState({}, '', newUrl);
                        this.recordId = responseData.id;
                        this.record = { ...this.record, ...responseData };
                    }
                },
                errorCallback: (response) => {
                    notifications.error(response.message || 'Failed to save record');
                }
            }
        );
    }
}