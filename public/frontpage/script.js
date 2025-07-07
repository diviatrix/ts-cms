import { RecordsAPI } from '../js/api-core.js';
import { AuthAPI } from '../js/api-auth.js';
import { messages } from '../js/ui-utils.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { messageSystem } from '../js/utils/message-system.js';
import { initMessageContainer } from '../js/shared-components/message-container.js';

/**
 * Front Page Controller
 * Handles the main page display of published records
 */
class FrontPageController extends BasePageController {
  constructor() {
    super();
    this.postsGrid = document.getElementById('postsGrid');
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
        messages.showError(response.message || 'Failed to load posts');
        return;
      }
      this.renderRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      this.postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
      messages.showError('Error: ' + (error?.message || error?.toString()));
    }
  }

  /**
   * Render records using CSS grid and card components, with auto-expanding cards for images
   */
  renderRecords(records) {
    this.postsGrid.className = 'card-grid';
    this.postsGrid.innerHTML = '';
    if (records.length === 0) {
      this.postsGrid.innerHTML = '<p>No posts available yet.</p>';
      return;
    }
    const isAdmin = this.checkAdminRole();
    records.forEach((record) => {
      const postCard = this.createPostCard(record, isAdmin);
      this.postsGrid.insertAdjacentHTML('beforeend', postCard);
    });
    if (isAdmin) {
      this.setupEditButtons();
    }
  }

  /**
   * Check if current user has admin role
   */
  checkAdminRole() {
    if (!this.authAPI.isAuthenticated(messages)) {
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
   * Create HTML for a post card using percent-based flex layout: image (32%) + excerpt (68%)
   */
  createPostCard(record, isAdmin) {
    const truncatedContent = record.content.substring(0, 150);
    const formattedDate = new Date(record.created_at).toLocaleDateString();
    const editButtonClass = isAdmin ? '' : 'd-none';
    const hasImage = !!record.image_url;
    // Percent-based widths for image/excerpt
    const imageContainerClass = 'flex-shrink-0 d-flex align-items-center justify-content-center card-image-container';
    const imageContainerStyle = hasImage ? 'width:32%;min-width:120pt;max-width:40%;height:100%;' : '';
    const imageHtml = hasImage ? `<div class="${imageContainerClass}" style="${imageContainerStyle}"><img src="${this.escapeHtml(record.image_url)}" class="card-image" style="width:100%;height:auto;aspect-ratio:1/1;object-fit:cover;display:block;margin:auto;" alt="${this.escapeHtml(record.title)}"></div>` : '';
    const excerptStyle = hasImage ? 'width:68%;min-width:180pt;max-width:68%;' : 'width:100%;max-width:100%;';
    const excerptHtml = `<div class="flex-grow-1 d-flex flex-column min-w-0" style="${excerptStyle}"><div class="card-body flex-grow-1 min-w-0"><h5 class="card-title text-truncate" style="max-width:100%;">${this.escapeHtml(record.title)}</h5><h6 class="card-subtitle mb-2 text-muted text-truncate" style="max-width:100%;">${this.escapeHtml(record.description)}</h6><div class="card-text" style="overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;max-width:100%;">${marked.parse(truncatedContent)}...</div></div><div class="card-footer d-flex justify-content-between align-items-center mt-auto min-w-0"><small class="text-muted">By ${this.escapeHtml(record.public_name)} on ${formattedDate}</small><div><a href="/record/index.html?id=${record.id}" class="btn btn-primary btn-sm">Read</a><button class="btn btn-warning btn-sm ms-2 edit-record-btn ${editButtonClass}" data-record-id="${record.id}">Edit</button></div></div></div>`;
    return `<div class="card-grid-item"><div class="card h-100 d-flex flex-row align-items-stretch${hasImage ? ' card-has-image' : ''}" style="width:auto;">${imageHtml}${excerptHtml}</div></div>`;
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

document.addEventListener('DOMContentLoaded', () => {
    initMessageContainer();
    new FrontPageController();
});