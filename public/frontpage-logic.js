import { RecordsAPI, getUserRole } from './js/api-client.js';
import { BasePageController } from './js/shared-components.js';
import { renderFrontpageCard } from './js/shared-components/ui-snippets.js';

class FrontPageController extends BasePageController {
  constructor() {
    super();
    this.postsGrid = document.getElementById('postsGrid');
    this.recordsAPI = RecordsAPI;
    this.init();
  }

  init() {
    this.fetchAndRenderRecords();
  }

  async fetchAndRenderRecords() {
    try {
      // Always request only published records for the front page
      const response = await this.recordsAPI.getAll({ published: true });
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
    const isAdmin = getUserRole().includes('admin');
    records.forEach((record) => {
      const postCard = renderFrontpageCard(record, isAdmin);
      this.postsGrid.insertAdjacentHTML('beforeend', postCard);
    });
  }
}

// Replace navigationLoaded with DOMContentLoaded for reliable initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { new FrontPageController(); });
} else { new FrontPageController(); }