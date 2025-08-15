export class RecordsFilter {
  constructor(onFilterChange) {
    this.onFilterChange = onFilterChange;
    this.activeCategories = new Set();
    this.activeTags = new Set();
    this.currentSearch = '';
    this.allRecords = [];
    this.eventListeners = [];
  }

  async init(records, enableSearch = true) {
    this.allRecords = records;
    this.enableSearch = enableSearch;
    this.extractFilters();
    this.render();
    this.setupEventListeners();
    await this.loadDefaultCategories();
    this.updateUI();
    this.applyFilters();
  }

  async loadDefaultCategories() {
    // This method is now handled by the main controller
    // Keep it for backward compatibility but don't load defaults here
    // as they are already loaded and applied by the main controller
  }

  extractFilters() {
    const categoryCounts = {};
    const tagCounts = {};

    this.allRecords.forEach(record => {
      (record.categories || []).forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      (record.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    this.categories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    this.tags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  render() {
    const container = document.createElement('div');
    container.className = 'filters-container';
    
    const hasFilters = this.categories.length > 0 || this.tags.length > 0;
    
    if (!hasFilters) return;

    container.innerHTML = `
      <div class="filters-panel" id="filtersPanel">
        <div class="filters-content">
          ${this.enableSearch ? `
            <div class="filter-section">
              <h4 class="filter-section-title">Search:</h4>
              <div class="filter-search">
                <input type="text" id="searchInput" placeholder="Search posts..."
                       class="form-control form-control-sm"
                       value="${this.escapeHtml(this.currentSearch)}">
              </div>
            </div>
          ` : ''}
          ${this.categories.length > 0 ? `
            <div class="filter-section">
              <h4 class="filter-section-title">Categories:</h4>
              <div class="filter-categories">
                ${this.categories.slice(0, 6).map(cat => `
                  <div class="filter-category"
                       data-category="${this.escapeHtml(cat.name)}">
                    ${this.escapeHtml(cat.name)}
                    <span class="count">${cat.count}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${this.tags.length > 0 ? `
            <div class="filter-section">
              <h4 class="filter-section-title">Tags:</h4>
              <div class="filter-tags">
                ${this.tags.slice(0, 10).map(tag => `
                  <div class="filter-tag" data-tag="${this.escapeHtml(tag.name)}">
                    ${this.escapeHtml(tag.name)}
                    <span class="count">${tag.count}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          <button class="btn btn-secondary btn-sm clear-filters hidden" id="clearFilters">
            Clear All
          </button>
        </div>
      </div>
      <button class="filters-toggle" id="filtersToggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="6" x2="20" y2="6"></line>
          <line x1="7" y1="12" x2="17" y2="12"></line>
          <line x1="10" y1="18" x2="14" y2="18"></line>
        </svg>
      </button>
    `;

    const recordsContainer = document.getElementById('records-container');
    recordsContainer.parentNode.insertBefore(container, recordsContainer);
  }

  setupEventListeners() {
    // Category filters
    document.querySelectorAll('.filter-category').forEach(el => {
      const handler = () => this.toggleCategory(el.dataset.category);
      el.addEventListener('click', handler);
      this.eventListeners.push({ element: el, event: 'click', handler });
    });

    // Tag filters
    document.querySelectorAll('.filter-tag').forEach(el => {
      const handler = () => this.toggleTag(el.dataset.tag);
      el.addEventListener('click', handler);
      this.eventListeners.push({ element: el, event: 'click', handler });
    });

    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
      const handler = () => this.clearAllFilters();
      clearBtn.addEventListener('click', handler);
      this.eventListeners.push({ element: clearBtn, event: 'click', handler });
    }

    // Mobile toggle
    const toggleBtn = document.getElementById('filtersToggle');
    const panel = document.getElementById('filtersPanel');
    if (toggleBtn && panel) {
      const handler = () => {
        panel.classList.toggle('active');
      };
      toggleBtn.addEventListener('click', handler);
      this.eventListeners.push({ element: toggleBtn, event: 'click', handler });
    }

    // Click on card categories/tags
    const cardClickHandler = (e) => {
      if (e.target.matches('.category-badge')) {
        this.toggleCategory(e.target.dataset.category);
      } else if (e.target.matches('.tag-chip')) {
        this.toggleTag(e.target.dataset.tag);
      }
    };
    document.addEventListener('click', cardClickHandler);
    this.eventListeners.push({ element: document, event: 'click', handler: cardClickHandler });

    // Search input handler
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      const searchHandler = (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentSearch = e.target.value;
          this.applyFilters();
        }, 300); // Debounce search for 300ms
      };
      
      searchInput.addEventListener('input', searchHandler);
      this.eventListeners.push({ element: searchInput, event: 'input', handler: searchHandler });
    }
  }

  toggleCategory(category) {
    if (this.activeCategories.has(category)) {
      this.activeCategories.delete(category);
    } else {
      this.activeCategories.add(category);
    }
    this.updateUI();
    this.applyFilters();
  }

  toggleTag(tag) {
    if (this.activeTags.has(tag)) {
      this.activeTags.delete(tag);
    } else {
      this.activeTags.add(tag);
    }
    this.updateUI();
    this.applyFilters();
  }

  clearAllFilters() {
    this.activeCategories.clear();
    this.activeTags.clear();
    this.currentSearch = '';
    
    // Clear search input if it exists
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
    }
    
    this.updateUI();
    this.applyFilters();
  }

  updateUI() {
    // Update category buttons
    document.querySelectorAll('.filter-category').forEach(el => {
      el.classList.toggle('active', this.activeCategories.has(el.dataset.category));
    });

    // Update tag buttons
    document.querySelectorAll('.filter-tag').forEach(el => {
      el.classList.toggle('active', this.activeTags.has(el.dataset.tag));
    });

    // Update clear button visibility
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden',
        this.activeCategories.size === 0 && this.activeTags.size === 0 && !this.currentSearch);
    }
  }

  applyFilters() {
    // Instead of filtering locally, send filter parameters to callback
    const filterParams = {
      categories: this.activeCategories,
      tags: this.activeTags,
      search: this.currentSearch || ''
    };

    this.onFilterChange(filterParams);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Component lifecycle management
  destroy() {
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
    
    // Clear active filters
    this.activeCategories.clear();
    this.activeTags.clear();
    
    // Clear all records
    this.allRecords = [];
    this.categories = [];
    this.tags = [];
  }
}