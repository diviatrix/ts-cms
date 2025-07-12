import { RecordsAPI } from './core/api-client.js';
import { renderCard } from './utils/ui-snippets.js';

export default class FrontPageController {
  constructor(app) {
    this.app = app;
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

  async renderRecords(records) {
    this.postsGrid.className = 'card-grid';
    this.postsGrid.innerHTML = '';
    if (records.length === 0) {
      this.postsGrid.innerHTML = '<p>No posts available yet.</p>';
      return;
    }
    const isAdmin = this.app.user.roles.includes('admin');
    let cardTemplate = '';
    try {
      const res = await fetch('/partials/card-skeleton.html');
      cardTemplate = await res.text();
    } catch (e) {
      console.error('Failed to load card template:', e);
      this.postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
      return;
    }
    records.forEach((record) => {
      let card = renderCard(record, cardTemplate, {
        isAdmin,
        showEdit: isAdmin,
        showRead: true
      });
      // Ensure card is a Node
      if (typeof card === 'string') {
        const temp = document.createElement('div');
        temp.innerHTML = card.trim();
        card = temp.firstElementChild;
      }
      if (card instanceof Node) {
        this.postsGrid.appendChild(card);
      } else {
        console.warn('renderCard did not return a Node:', card);
      }
    });
  }
}