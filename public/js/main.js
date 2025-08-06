import { RecordsAPI } from './core/api-client.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsFilter } from './components/records-filter.js';
import { LoadingState } from './components/loading-state.js';

export default class FrontPageController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('records-container');
    this.recordsAPI = RecordsAPI;
    this.recordsFilter = null;
    this.allRecords = [];
    this.isLoading = false;
    this.init();
  }

  init() {
    this.fetchAndRenderRecords();
  }

  async fetchAndRenderRecords() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Show skeleton loading for better perceived performance
      if (this.container) {
        LoadingState.showSkeleton(this.container, 'card');
      }
      
      const response = await this.recordsAPI.getAll({ published: true }, true); // Use batching
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch records');
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
      this.showError(error.message || 'Unable to load posts at this time. Please try again later.');
    } finally {
      this.isLoading = false;
      if (this.container) {
        LoadingState.hide(this.container);
      }
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
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    records.forEach((record) => {
      const cardElement = this.createRecordCard(record, isAdmin);
      fragment.appendChild(cardElement);
    });
    
    cardGrid.appendChild(fragment);
    this.container.appendChild(cardGrid);
    
    // Lazy load images
    this.lazyLoadImages();
  }

  createRecordCard(record, isAdmin) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-record-id', record.id);
    
    const createdAt = record.created_at ? new Date(record.created_at).toLocaleDateString() : '';
    
    // Format markdown content with length limit
    const previewLength = record.image_url ? 400 : 800;
    const rawContent = record.content || record.body || '';
    const truncatedContent = rawContent.substring(0, previewLength) + (rawContent.length > previewLength ? '...' : '');
    const contentPreview = truncatedContent ? marked.parse(truncatedContent) : '';
    
    card.innerHTML = `
      ${record.image_url ? `
        <div class="card-image-container">
          <img class="card-image lazy" data-src="${record.image_url}" alt="${record.title}" 
               src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQ0NCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2FhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4="/>
        </div>
      ` : ''}
      <div class="card-body">
        <h3 class="card-title">${this.escapeHtml(record.title)}</h3>
        ${record.description ? `<p class="card-subtitle">${this.escapeHtml(record.description)}</p>` : ''}
        ${contentPreview ? `<div class="card-content-preview">${contentPreview}</div>` : ''}
        <div class="card-meta">
          <span class="card-date">${createdAt}</span>
          ${record.public_name ? `<span class="card-author">By ${this.escapeHtml(record.public_name)}</span>` : ''}
        </div>
        <div class="card-actions">
          <a href="/record?id=${record.id}" class="btn btn-primary">Read More</a>
          ${isAdmin ? `<a href="/record-editor?id=${record.id}" class="btn btn-secondary">Edit</a>` : ''}
        </div>
      </div>
    `;
    
    // Make card clickable
    card.addEventListener('click', (e) => {
      if (!e.target.matches('a, a *, button, button *')) {
        window.location.href = `/record?id=${record.id}`;
      }
    });
    
    return card;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  showError(message = 'Unable to load posts at this time.') {
    if (!this.container) return;
    this.container.innerHTML = `<div class="card"><div class="card-body"><p class="text-muted">${message}</p><button class="btn" onclick="location.reload()">Retry</button></div></div>`;
  }
  
  // Lazy load images for better performance
  lazyLoadImages() {
    const lazyImages = this.container.querySelectorAll('img.lazy');
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              img.classList.add('loaded');
            }
            observer.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      lazyImages.forEach(img => {
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.classList.remove('lazy');
          img.classList.add('loaded');
        }
      });
    }
  }
  
  // Component lifecycle management
  destroy() {
    // Clean up event listeners
    const cards = this.container ? this.container.querySelectorAll('.card') : [];
    cards.forEach(card => {
      const clone = card.cloneNode(true);
      card.parentNode.replaceChild(clone, card);
    });
    
    // Clean up filter if it exists
    if (this.recordsFilter) {
      this.recordsFilter.destroy();
    }
    
    this.isLoading = false;
  }
}