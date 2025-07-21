import { RecordsAPI } from './core/api-client.js';
import { renderCard } from './utils/ui-snippets.js';

export default class FrontPageController {
  constructor(app) {
    this.app = app;
    this.postsGrid = document.getElementById('postsGrid');
    this.recordsAPI = RecordsAPI;
    this.cardTemplate = null;
    this.init();
  }

  init() {
    this.fetchAndRenderRecords();
  }

  async fetchAndRenderRecords() {
    try {
      const response = await this.recordsAPI.getAll({ published: true });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch records');
      }
      this.renderRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      this.showError();
    }
  }

  async renderRecords(records) {
    this.postsGrid.className = 'card-grid';
    this.postsGrid.innerHTML = '';
    if (records.length === 0) {
      this.postsGrid.innerHTML = '<p>No posts available yet.</p>';
      return;
    }
    const isAdmin = this.app.user.roles.includes('admin');
    try {
      if (!this.cardTemplate) {
        const res = await fetch('/partials/front-card-skeleton.html');
        this.cardTemplate = await res.text();
      }
      records.forEach((record) => {
        const card = renderCard(record, this.cardTemplate, { isAdmin });
        this.postsGrid.appendChild(card);
      });
    } catch (e) {
      console.error('Failed to load card template:', e);
      this.showError();
    }
  }

  showError() {
    this.postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
  }
}