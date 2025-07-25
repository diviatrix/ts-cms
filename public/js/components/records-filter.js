export class RecordsFilter {
  constructor(onFilterChange) {
    this.onFilterChange = onFilterChange;
    this.activeCategories = new Set();
    this.activeTags = new Set();
    this.allRecords = [];
    this.categoryColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
  }

  init(records) {
    this.allRecords = records;
    this.extractFilters();
    this.render();
    this.setupEventListeners();
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
          ${this.categories.length > 0 ? `
            <div class="filter-section">
              <h4 class="filter-section-title">Categories:</h4>
              <div class="filter-categories">
                ${this.categories.slice(0, 6).map((cat, index) => `
                  <div class="filter-category" 
                       data-category="${this.escapeHtml(cat.name)}"
                       style="background-color: ${this.categoryColors[index % this.categoryColors.length]}; color: ${index === 3 ? '#181a1f' : 'white'};">
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
            Clear
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
      el.addEventListener('click', () => this.toggleCategory(el.dataset.category));
    });

    // Tag filters
    document.querySelectorAll('.filter-tag').forEach(el => {
      el.addEventListener('click', () => this.toggleTag(el.dataset.tag));
    });

    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllFilters());
    }

    // Mobile toggle
    const toggleBtn = document.getElementById('filtersToggle');
    const panel = document.getElementById('filtersPanel');
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('active');
      });
    }

    // Click on card categories/tags
    document.addEventListener('click', (e) => {
      if (e.target.matches('.category-badge')) {
        this.toggleCategory(e.target.dataset.category);
      } else if (e.target.matches('.tag-chip')) {
        this.toggleTag(e.target.dataset.tag);
      }
    });
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
        this.activeCategories.size === 0 && this.activeTags.size === 0);
    }
  }

  applyFilters() {
    const filteredRecords = this.allRecords.filter(record => {
      // Check categories
      if (this.activeCategories.size > 0) {
        const recordCategories = new Set(record.categories || []);
        const hasCategory = Array.from(this.activeCategories).some(cat => 
          recordCategories.has(cat));
        if (!hasCategory) return false;
      }

      // Check tags
      if (this.activeTags.size > 0) {
        const recordTags = new Set(record.tags || []);
        const hasTag = Array.from(this.activeTags).some(tag => 
          recordTags.has(tag));
        if (!hasTag) return false;
      }

      return true;
    });

    this.onFilterChange(filteredRecords);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}