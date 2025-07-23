import { RecordsAPI } from './core/api-client.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsFilter } from './components/records-filter.js';

export default class FrontPageController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('records-container');
    this.recordsAPI = RecordsAPI;
    this.recordsFilter = null;
    this.allRecords = [];
    this.init();
  }

  init() {
    this.fetchAndRenderRecords();
  }

  async fetchAndRenderRecords() {
    try {
      const response = await this.recordsAPI.getAll({ published: true });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch records');
      }
      this.allRecords = response.data || [];
      
      // Initialize filters
      if (!this.recordsFilter) {
        this.recordsFilter = new RecordsFilter((filteredRecords) => {
          this.renderRecords(filteredRecords);
        });
        this.recordsFilter.init(this.allRecords);
      }
      
      this.renderRecords(this.allRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
      this.showError();
    }
  }

  async renderRecords(records) {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    if (records.length === 0) {
      this.container.innerHTML = '<div class="no-results"><p>No posts match your filters.</p><button class="btn" onclick="location.reload()">Reset Filters</button></div>';
      return;
    }
    
    const isAdmin = this.app.user.roles.includes('admin');
    const cardGrid = document.createElement('div');
    cardGrid.className = 'card-grid';
    
    records.forEach((record) => {
      const cardElement = this.createRecordCard(record, isAdmin);
      cardGrid.appendChild(cardElement);
    });
    
    this.container.appendChild(cardGrid);
  }

  createRecordCard(record, isAdmin) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const createdAt = record.created_at ? new Date(record.created_at).toLocaleDateString() : '';
    
    // Format markdown content with length limit
    const previewLength = record.image_url ? 400 : 1400;
    const rawContent = record.content || record.body || '';
    const truncatedContent = rawContent.substring(0, previewLength) + (rawContent.length > previewLength ? '...' : '');
    const contentPreview = truncatedContent ? marked.parse(truncatedContent) : '';
    
    // Process categories and tags
    const categories = record.categories || [];
    const tags = record.tags || [];
    const maxCategories = 3;
    const maxTags = 5;
    
    const categoriesHtml = categories.length > 0 ? `
      <div class="card-categories">
        ${categories.slice(0, maxCategories).map(cat => 
          `<span class="category-badge" data-category="${this.escapeHtml(cat)}">${this.escapeHtml(cat)}</span>`
        ).join('')}
        ${categories.length > maxCategories ? 
          `<span class="category-badge more-indicator">+${categories.length - maxCategories}</span>` : ''}
      </div>
    ` : '';
    
    const tagsHtml = tags.length > 0 ? `
      <div class="card-tags">
        ${tags.slice(0, maxTags).map(tag => 
          `<span class="tag-chip" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`
        ).join('')}
        ${tags.length > maxTags ? 
          `<span class="tag-chip more-indicator">+${tags.length - maxTags}</span>` : ''}
      </div>
    ` : '';
    
    card.innerHTML = `
      ${record.image_url ? `
        <div class="card-image-container">
          <img class="card-image" src="${record.image_url}" alt="${record.title}" />
        </div>
      ` : ''}
      <div class="card-body">
        ${categoriesHtml}
        <h3 class="card-title">${record.title}</h3>
        ${record.description ? `<p class="card-subtitle">${record.description}</p>` : ''}
        ${contentPreview ? `<div class="card-content-preview">${contentPreview}</div>` : ''}
        <div class="card-meta">
          <span class="card-date">${createdAt}</span>
          ${record.public_name ? `<span class="card-author">By ${record.public_name}</span>` : ''}
        </div>
        ${tagsHtml}
        <div class="card-actions">
          <a href="/record?id=${record.id}" class="btn btn-primary">Read More</a>
          ${isAdmin ? `<a href="/record-editor?id=${record.id}" class="btn btn-secondary">Edit</a>` : ''}
        </div>
      </div>
    `;
    
    return card;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  showError() {
    if (!this.container) return;
    this.container.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">Unable to load posts at this time.</p></div></div>';
  }
}