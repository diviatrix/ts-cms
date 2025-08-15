export class Pagination {
  constructor(onPageChange) {
    this.onPageChange = onPageChange;
    this.currentPage = 1;
    this.totalPages = 1;
    this.hasNext = false;
    this.hasPrev = false;
    this.eventListeners = [];
    this.container = null;
  }

  render(paginationData) {
    this.currentPage = paginationData.page;
    this.totalPages = paginationData.totalPages;
    this.hasNext = paginationData.hasNext;
    this.hasPrev = paginationData.hasPrev;

    // Remove existing pagination
    this.destroy();

    // Don't show pagination if there's only one page
    if (this.totalPages <= 1) {
      return;
    }

    this.container = document.createElement('div');
    this.container.className = 'pagination-container';
    this.container.innerHTML = this.generateHTML();

    // Insert pagination after records container
    const recordsContainer = document.getElementById('records-container');
    if (recordsContainer && recordsContainer.parentNode) {
      recordsContainer.parentNode.insertBefore(this.container, recordsContainer.nextSibling);
    }

    this.setupEventListeners();
  }

  generateHTML() {
    const pages = this.generatePageNumbers();
    
    return `
      <nav class="pagination-nav" aria-label="Pagination Navigation">
        <div class="pagination-info">
          <span class="pagination-current">Page ${this.currentPage} of ${this.totalPages}</span>
        </div>
        <ul class="pagination-list">
          ${this.hasPrev ? `
            <li class="pagination-item">
              <button class="pagination-button" data-page="${this.currentPage - 1}" aria-label="Previous page">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Previous
              </button>
            </li>
          ` : `
            <li class="pagination-item">
              <button class="pagination-button pagination-disabled" disabled aria-label="Previous page">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Previous
              </button>
            </li>
          `}
          
          ${pages.map(page => {
    if (page === '...') {
      return '<li class="pagination-item"><span class="pagination-ellipsis">...</span></li>';
    }
            
    const isActive = page === this.currentPage;
    return `
              <li class="pagination-item">
                <button class="pagination-button ${isActive ? 'pagination-active' : ''}" 
                        data-page="${page}" 
                        ${isActive ? 'aria-current="page"' : ''}
                        aria-label="Go to page ${page}">
                  ${page}
                </button>
              </li>
            `;
  }).join('')}
          
          ${this.hasNext ? `
            <li class="pagination-item">
              <button class="pagination-button" data-page="${this.currentPage + 1}" aria-label="Next page">
                Next
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </li>
          ` : `
            <li class="pagination-item">
              <button class="pagination-button pagination-disabled" disabled aria-label="Next page">
                Next
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </li>
          `}
        </ul>
      </nav>
    `;
  }

  generatePageNumbers() {
    const pages = [];
    const maxVisiblePages = 7; // Show up to 7 page numbers
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic for many pages
      const halfVisible = Math.floor((maxVisiblePages - 3) / 2); // -3 for first, last, and current
      
      // Always show first page
      pages.push(1);
      
      let startPage, endPage;
      
      if (this.currentPage <= halfVisible + 2) {
        // Current page is near the beginning
        startPage = 2;
        endPage = Math.min(maxVisiblePages - 1, this.totalPages - 1);
      } else if (this.currentPage >= this.totalPages - halfVisible - 1) {
        // Current page is near the end
        startPage = Math.max(2, this.totalPages - maxVisiblePages + 2);
        endPage = this.totalPages - 1;
      } else {
        // Current page is in the middle
        startPage = this.currentPage - halfVisible;
        endPage = this.currentPage + halfVisible;
      }
      
      // Add ellipsis if there's a gap
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if there's a gap
      if (endPage < this.totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page (if it's not already shown)
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  setupEventListeners() {
    if (!this.container) return;

    const buttons = this.container.querySelectorAll('.pagination-button[data-page]');
    buttons.forEach(button => {
      const handler = () => {
        const page = parseInt(button.dataset.page);
        if (page !== this.currentPage && !button.disabled) {
          this.currentPage = page;
          this.onPageChange(page);
        }
      };
      
      button.addEventListener('click', handler);
      this.eventListeners.push({ element: button, event: 'click', handler });
    });
  }

  // Quick navigation methods
  goToPage(page) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.onPageChange(page);
    }
  }

  nextPage() {
    if (this.hasNext) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.hasPrev) {
      this.goToPage(this.currentPage - 1);
    }
  }

  firstPage() {
    this.goToPage(1);
  }

  lastPage() {
    this.goToPage(this.totalPages);
  }

  // Component lifecycle management
  destroy() {
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
    
    // Remove container from DOM
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}