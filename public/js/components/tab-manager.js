export class TabManager {
  constructor(container, config) {
    if (!container) {
      throw new Error('A container element must be provided to TabManager.');
    }
    this.container = container;
    this.config = config;
    this.activeTabId = null;
    this.loadedTabs = new Map();

    this.navContainer = this.container.querySelector('.tabs-nav');
    this.contentContainer = this.container.querySelector('.tabs-content');

    if (!this.navContainer || !this.contentContainer) {
      throw new Error('TabManager container must have a .tabs-nav and a .tabs-content element.');
    }

    this.init();
  }

  init() {
    this.renderNav();
    this.setupEventListeners();

    const initialTab = this.config.initialTab || this.config.tabs[0]?.id;
    if (initialTab) {
      this.activateTab(initialTab);
    }
  }

  renderNav() {
    this.navContainer.innerHTML = '';
    this.config.tabs.forEach(tab => {
      const button = document.createElement('button');
      button.className = 'btn';
      button.dataset.tabId = tab.id;
      button.textContent = tab.label;
      this.navContainer.appendChild(button);
    });
  }

  setupEventListeners() {
    this.navContainer.addEventListener('click', (e) => {
      const button = e.target.closest('[data-tab-id]');
      if (button) {
        e.preventDefault();
        this.activateTab(button.dataset.tabId);
      }
    });
  }

  async activateTab(tabId) {
    if (this.activeTabId === tabId && this.loadedTabs.has(tabId)) {
      return; 
    }

    if (this.activeTabId && this.loadedTabs.has(this.activeTabId)) {
      const prev = this.loadedTabs.get(this.activeTabId);
      if (prev && prev.controller && typeof prev.controller.destroy === 'function') {
        prev.controller.destroy();
      }
    }

    this.activeTabId = tabId;

    this.container.querySelectorAll('[data-tab-id]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tabId === tabId);
    });

    if (!this.loadedTabs.has(tabId)) {
      const tabConfig = this.config.tabs.find(t => t.id === tabId);
      if (tabConfig && tabConfig.loader) {
        try {
          const panel = document.createElement('div');
          panel.className = 'tab-pane';
          panel.dataset.tabPanel = tabId;
          this.contentContainer.appendChild(panel);

          const controller = await tabConfig.loader(panel);
          this.loadedTabs.set(tabId, { controller, panel });
        } catch (error) {
          const panel = this.contentContainer.querySelector(`[data-tab-panel="${tabId}"]`);
          if (panel) {
            panel.innerHTML = '<p class="error">Failed to load content.</p>';
          }
        }
      }
    }

    this.contentContainer.querySelectorAll('.tab-pane').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.tabPanel === tabId);
    });
  }
}