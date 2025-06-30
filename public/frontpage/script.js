import { RecordsAPI, AuthAPI } from '../js/api-client.js';
import { MessageDisplay, errorHandler } from '../js/ui-utils.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';

/**
 * Front Page Controller
 * Handles the main page display of published records
 */
class FrontPageController extends BasePageController {
  constructor() {
    // Create message display for user feedback
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mt-3';
    messageDiv.id = 'frontpageMessages';
    
    // Find the appropriate container and insert the message div
    const container = document.querySelector('.container-fluid') || document.querySelector('.container');
    const postsGrid = document.getElementById('postsGrid');
    
    if (container && postsGrid) {
      const h1Element = container.querySelector('h1');
      if (h1Element) {
        h1Element.insertAdjacentElement('afterend', messageDiv);
      } else {
        postsGrid.parentElement.insertBefore(messageDiv, postsGrid);
      }
    }

    super({ messageDiv });
    
    this.postsGrid = postsGrid;
    this.recordsAPI = RecordsAPI;
    this.authAPI = AuthAPI;
    
    this.init();
  }

  /**
   * Initialize the front page
   */
  init() {
    this.fetchAndRenderRecords();
  }

  /**
   * Fetch and render all published records
   */
  async fetchAndRenderRecords() {
    try {
      const response = await this.recordsAPI.getAll();
      
      if (!response.success) {
        console.error('Error fetching records:', response);
        this.postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
        this.message.showApiResponse(response);
        return;
      }
      
      this.message.hide();
      this.renderRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      this.postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
      this.errorHandler.handleNetworkError(error, this.message);
    }
  }

  /**
   * Render records in grid layout
   */
  renderRecords(records) {
    this.postsGrid.innerHTML = '';
    
    if (records.length === 0) {
      this.postsGrid.innerHTML = '<p>No posts available yet.</p>';
      return;
    }

    this.setupGridLayout(records.length);
    const isAdmin = this.checkAdminRole();
    const colClass = this.getColumnClass(records.length);

    records.forEach(record => {
      const postCard = this.createPostCard(record, colClass, isAdmin);
      this.postsGrid.insertAdjacentHTML('beforeend', postCard);
    });

    if (isAdmin) {
      this.setupEditButtons();
    }
  }

  /**
   * Setup grid layout based on number of records
   */
  setupGridLayout(recordCount) {
    if (recordCount < 6) {
      this.postsGrid.className = 'row g-4 mt-4 justify-content-center';
    } else {
      this.postsGrid.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mt-4';
    }
  }

  /**
   * Get column class based on number of records
   */
  getColumnClass(recordCount) {
    return recordCount < 6 ? 'col-12 col-md-8 col-lg-6' : 'col';
  }

  /**
   * Check if current user has admin role
   */
  checkAdminRole() {
    if (!this.authAPI.isAuthenticated()) {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      return decodedToken?.roles?.includes('admin') || false;
    } catch (error) {
      console.error('Error decoding token for admin check:', error);
      return false;
    }
  }

  /**
   * Create HTML for a post card
   */
  createPostCard(record, colClass, isAdmin) {
    const truncatedContent = record.content.substring(0, 150);
    const formattedDate = new Date(record.created_at).toLocaleDateString();
    const editButtonClass = isAdmin ? '' : 'd-none';

    return `
      <div class="${colClass} mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${this.escapeHtml(record.title)}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${this.escapeHtml(record.description)}</h6>
            <p class="card-text">${this.escapeHtml(truncatedContent)}...</p>
          </div>
          <div class="card-footer d-flex justify-content-between align-items-center">
            <small class="neon-green-text">By ${this.escapeHtml(record.public_name)} on ${formattedDate}</small>
            <div class="d-flex">
              <a href="/record/index.html?id=${record.id}" class="btn btn-primary btn-sm">Read</a>
              <button class="btn btn-warning btn-sm ms-2 edit-record-btn ${editButtonClass}" 
                      data-record-id="${record.id}">Edit</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for edit buttons
   */
  setupEditButtons() {
    document.querySelectorAll('.edit-record-btn').forEach(button => {
      button.addEventListener('click', () => {
        const recordId = button.dataset.recordId;
        window.location.href = `/admin#records?editRecordId=${recordId}`;
      });
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the front page controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new FrontPageController();
});