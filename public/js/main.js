import { RecordsAPI } from './core/api-client.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsFilter } from './components/records-filter.js';
import { Pagination } from './components/pagination.js';
import { LoadingState } from './components/loading-state.js';

export default class FrontPageController {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('records-container');
    this.recordsAPI = RecordsAPI;
    this.recordsFilter = null;
    this.pagination = null;
    this.currentFilters = {
      categories: [],
      tags: [],
      search: ''
    };
    this.currentPage = 1;
    this.pageSize = 10;
    this.isLoading = false;
    this.enableSearch = true; // Default value, will be loaded from settings
    this.init();
  }

  async init() {
    // First, load default categories and apply them
    await this.loadDefaultFilters();
    this.fetchAndRenderRecords();
  }

  async loadDefaultFilters() {
    try {
      // Load both default categories and enable_search setting in parallel
      const [categoriesResponse, searchResponse] = await Promise.all([
        fetch('/api/cms/public/default-categories'),
        fetch('/api/cms/public/enable-search')
      ]);
      
      // Handle default categories
      if (categoriesResponse.ok) {
        const result = await categoriesResponse.json();
        if (result.success && result.data && result.data.setting_value) {
          const defaultCategories = result.data.setting_value
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat.length > 0);
          
          // Set default categories as current filters
          if (defaultCategories.length > 0) {
            this.currentFilters.categories = defaultCategories;
          }
        }
      }
      
      // Handle enable_search setting
      if (searchResponse.ok) {
        const result = await searchResponse.json();
        if (result.success && result.data) {
          this.enableSearch = result.data.setting_value === 'true';
        } else {
          this.enableSearch = true; // Default to true
        }
      } else {
        this.enableSearch = true; // Default to true
      }
    } catch (error) {
      this.enableSearch = true; // Default to true on error
    }
  }

  async fetchAndRenderRecords(page = 1, filters = {}) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.currentPage = page;
    this.currentFilters = { ...this.currentFilters, ...filters };
    
    try {
      // Show skeleton loading for better perceived performance
      if (this.container) {
        LoadingState.showSkeleton(this.container, 'card');
      }
      
      // Prepare pagination parameters
      const paginationParams = {
        page: this.currentPage,
        size: this.pageSize,
        published: true,
        ...this.currentFilters
      };
      
      // Build query string for API call
      const queryParams = new URLSearchParams();
      Object.entries(paginationParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' &&
            !(Array.isArray(value) && value.length === 0)) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value);
          }
        }
      });
      
      const url = `/api/records?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch records');
      }
      
      const { data: records, pagination } = result.data;
      
      // Render records and pagination
      this.renderRecords(records);
      this.renderPagination(pagination);
      
      // Initialize or update filters (only on first load)
      if (!this.recordsFilter) {
        // For server-side filtering, we need to get all available filters
        // This is a simplified approach - in a real app, you might want a separate endpoint
        const allRecordsResponse = await this.recordsAPI.getAll({ published: true }, true);
        const allRecords = allRecordsResponse.success ? allRecordsResponse.data || [] : [];
        
        this.recordsFilter = new RecordsFilter((filterParams) => {
          this.handleFilterChange(filterParams);
        });
        
        // Initialize with current filters (including default categories) and enable_search setting
        await this.recordsFilter.init(allRecords, this.enableSearch);
        
        // Apply current filters to the filter component
        if (this.currentFilters.categories && this.currentFilters.categories.length > 0) {
          this.currentFilters.categories.forEach(category => {
            this.recordsFilter.activeCategories.add(category);
          });
          this.recordsFilter.updateUI();
        }
      }
      
    } catch (error) {
      this.showError(error.message || 'Unable to load posts at this time. Please try again later.');
    } finally {
      this.isLoading = false;
      if (this.container) {
        LoadingState.hide(this.container);
      }
    }
  }
  
  handleFilterChange(filterParams) {
    // Convert filter params to API format
    const apiFilters = {};
    
    // Only add categories if some are selected
    if (filterParams.categories && filterParams.categories.size > 0) {
      apiFilters.categories = Array.from(filterParams.categories);
    } else {
      // Set empty array instead of deleting to avoid undefined errors
      apiFilters.categories = [];
    }
    
    // Only add tags if some are selected
    if (filterParams.tags && filterParams.tags.size > 0) {
      apiFilters.tags = Array.from(filterParams.tags);
    } else {
      // Set empty array instead of deleting to avoid undefined errors
      apiFilters.tags = [];
    }
    
    // Only add search if it has content
    if (filterParams.search && filterParams.search.trim()) {
      apiFilters.search = filterParams.search.trim();
    } else {
      // Set empty string instead of deleting
      apiFilters.search = '';
    }
    
    // Reset to first page when filters change
    this.fetchAndRenderRecords(1, apiFilters);
  }
  
  renderPagination(paginationData) {
    if (!this.pagination) {
      this.pagination = new Pagination((page) => {
        this.fetchAndRenderRecords(page, this.currentFilters);
      });
    }
    
    this.pagination.render(paginationData);
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
    
    // Generate tags HTML
    const tagsHtml = this.generateTagsHtml(record.tags || []);
    
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
          <div class="card-meta-info">
            <span class="card-date">${createdAt}</span>
            ${record.public_name ? `<span class="card-author">By ${this.escapeHtml(record.public_name)}</span>` : ''}
          </div>
          ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
        </div>
        <div class="card-actions">
          <a href="/record?id=${record.id}" class="btn btn-primary">Read More</a>
          ${isAdmin ? `<a href="/record-editor?id=${record.id}" class="btn btn-secondary">Edit</a>` : ''}
        </div>
      </div>
    `;
    
    // Make card clickable
    card.addEventListener('click', (e) => {
      // Handle tag clicks
      if (e.target.matches('.tag-chip')) {
        e.preventDefault();
        e.stopPropagation();
        const tag = e.target.getAttribute('data-tag');
        if (tag && this.recordsFilter) {
          this.recordsFilter.toggleTag(tag);
        }
        return;
      }
      
      // Handle regular card click
      if (!e.target.matches('a, a *, button, button *, .tag-chip, .tag-chip *')) {
        window.location.href = `/record?id=${record.id}`;
      }
    });
    
    return card;
  }
  
  generateTagsHtml(tags) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return '';
    }
    
    return tags.map(tag =>
      `<span class="tag-chip" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`
    ).join('');
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