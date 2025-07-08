import { RecordsAPI } from '../js/api-core.js';
import { AuthAPI } from '../js/api-auth.js';
import { messages } from '../js/ui-utils.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { messageSystem } from '../js/utils/message-system.js';
import { initMessageContainer } from '../js/shared-components/message-container.js';
import { renderFrontpageCard } from '../js/shared-components/ui-snippets.js';

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
      const postCard = renderFrontpageCard(record, isAdmin);
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
}

document.addEventListener('DOMContentLoaded', () => {
    initMessageContainer();
    new FrontPageController();
});