import { RecordsAPI, AuthAPI } from './js/api-client.js';
import { BasePageController } from './js/shared-components.js';
import { jwtDecode } from './js/jwt-decode.js';
import { renderFrontpageCard } from './js/shared-components/ui-snippets.js';

class FrontPageController extends BasePageController {
  constructor() {
    super();
    this.postsGrid = document.getElementById('postsGrid');
    this.recordsAPI = RecordsAPI;
    this.authAPI = AuthAPI;
    this.init();
  }

  init() {
    this.fetchAndRenderRecords();
  }

  async fetchAndRenderRecords() {
    try {
      const response = await this.recordsAPI.getAll();
      if (!response.success) {
        console.error('Error fetching records:', response);
        this.postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
        return;
      }
      this.renderRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      this.postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
    }
  }

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

  setupEditButtons() {
    document.querySelectorAll('.edit-record-btn').forEach(button => {
      button.addEventListener('click', () => {
        const recordId = button.dataset.recordId;
        window.location.href = `/admin#records?editRecordId=${recordId}`;
      });
    });
  }
}

// Replace navigationLoaded with DOMContentLoaded for reliable initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { new FrontPageController(); });
} else { new FrontPageController(); }