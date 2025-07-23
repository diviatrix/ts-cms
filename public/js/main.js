import { RecordsAPI } from './core/api-client.js';

export default class FrontPageController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('records-container');
    this.recordsAPI = RecordsAPI;
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
      this.renderRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      this.showError();
    }
  }

  async renderRecords(records) {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    if (records.length === 0) {
      this.container.innerHTML = '<div class="card"><div class="card-body"><p>No posts available yet.</p></div></div>';
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
    
    // Longer preview if no image to fill the space
    const previewLength = record.image_url ? 400 : 1400;
    const contentPreview = record.content ? record.content.substring(0, previewLength) + '...' : 
                           (record.body ? record.body.substring(0, previewLength) + '...' : '');
    
    card.innerHTML = `
      ${record.image_url ? `
        <div class="card-image-container">
          <img class="card-image" src="${record.image_url}" alt="${record.title}" />
        </div>
      ` : ''}
      <div class="card-body">
        <h3 class="card-title">${record.title}</h3>
        ${record.description ? `<p class="card-subtitle">${record.description}</p>` : ''}
        ${contentPreview ? `<div class="card-content-preview">${contentPreview}</div>` : ''}
        <div class="card-meta">
          <span class="card-date">${createdAt}</span>
          ${record.public_name ? `<span class="card-author">By ${record.public_name}</span>` : ''}
        </div>
        <div class="card-actions">
          <a href="/record?id=${record.id}" class="btn btn-primary">Read More</a>
          ${isAdmin ? `<a href="/record-editor?id=${record.id}" class="btn btn-secondary">Edit</a>` : ''}
        </div>
      </div>
    `;
    
    return card;
  }
  
  showError() {
    if (!this.container) return;
    this.container.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">Unable to load posts at this time.</p></div></div>';
  }
}