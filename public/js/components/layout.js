import { LoadingState } from './loading-state.js';

export class Layout {
  constructor() {
    this.mainContainer = null;
    this.currentController = null;
    this.isLoading = false;
  }

  init() {
    this.createMainContainer();
    this.setupNavigationListeners();
  }

  createMainContainer() {
    let mainContainer = document.getElementById('main-content');
    if (!mainContainer) {
      mainContainer = document.createElement('main');
      mainContainer.id = 'main-content';
      mainContainer.className = 'main-content';
            
      const navbar = document.querySelector('.navbar');
      if (navbar && navbar.nextSibling) {
        document.body.insertBefore(mainContainer, navbar.nextSibling);
      } else {
        document.body.appendChild(mainContainer);
      }
    }
    this.mainContainer = mainContainer;
  }

  setupNavigationListeners() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/"]');
      if (link && !link.hasAttribute('target')) {
        e.preventDefault();
        const path = link.getAttribute('href');
        this.navigate(path);
      }
    });

    window.addEventListener('popstate', (e) => {
      const path = window.location.pathname + window.location.search;
      this.loadRoute(path);
    });
  }

  navigate(path) {
    history.pushState(null, '', path);
    this.loadRoute(path);
  }

  async loadRoute(path) {
    // Show loading state immediately
    if (this.mainContainer) {
      LoadingState.show(this.mainContainer, 'Loading page...');
    }
        
    // Clean up previous controller
    if (this.currentController && typeof this.currentController.destroy === 'function') {
      this.currentController.destroy();
    }

    try {
      const routeInfo = this.getRouteInfo(path);
      if (!routeInfo) {
        this.show404();
        return;
      }

      // Update page title
      document.title = routeInfo.title;
            
      // Show skeleton loading for better perceived performance
      if (this.mainContainer) {
        LoadingState.showSkeleton(this.mainContainer, 'card');
      }
            
      // Load template immediately
            
      this.mainContainer.innerHTML = routeInfo.template;
            
      const controllerModule = await routeInfo.controllerLoader();
      this.currentController = new controllerModule.default(window.app);

    } catch (error) {
      this.showError('Failed to load page. Please try again.');
    } finally {
      // Hide loading state
      if (this.mainContainer) {
        LoadingState.hide(this.mainContainer);
      }
    }
  }

  getRouteInfo(path) {
    // Handle paths with query parameters
    const [pathname] = path.split('?');
        
    const routes = {
      '/': {
        title: 'Home',
        template: '<div id="records-container"></div>',
        controllerLoader: () => import('../main.js')
      },
      '/profile': {
        title: 'Profile',
        template: '<div id="profile-container"></div>',
        controllerLoader: () => import('../controllers/pages/profile-controller.js')
      },
      '/admin': {
        title: 'Admin Panel',
        template: '<div id="admin-panel-container"></div>',
        controllerLoader: () => import('../controllers/pages/admin-panel-controller.js')
      },
      '/record': {
        title: 'Record',
        template: '<div id="record-container"></div>',
        controllerLoader: () => import('../controllers/pages/single-record-controller.js')
      },
      '/records-manage': {
        title: 'Manage Records',
        template: '<div id="records-manage-container"></div>',
        controllerLoader: () => import('../controllers/pages/records-manage-controller.js')
      },
      '/settings': {
        title: 'Settings',
        template: '<div id="settings-container"></div>',
        controllerLoader: () => import('../controllers/pages/settings-controller.js')
      },
      '/themes-manage': {
        title: 'Manage Themes',
        template: '<div id="themes-manage-container"></div>',
        controllerLoader: () => import('../controllers/pages/themes-manage-controller.js')
      },
      '/theme-editor': {
        title: 'Theme Editor',
        template: '<div id="theme-editor-container"></div>',
        controllerLoader: () => import('../controllers/pages/theme-editor-controller.js')
      },
      '/record-editor': {
        title: 'Record Editor',
        template: '<div id="record-editor-container"></div>',
        controllerLoader: () => import('../controllers/pages/record-editor-controller.js')
      },
      '/users-manage': {
        title: 'Manage Users',
        template: '<div id="users-manage-container"></div>',
        controllerLoader: () => import('../controllers/pages/users-manage-controller.js')
      },
      '/user-editor': {
        title: 'User Editor',
        template: '<div id="user-editor-container"></div>',
        controllerLoader: () => import('../controllers/pages/user-editor-controller.js')
      },
      '/invites-manage': {
        title: 'Manage Invites',
        template: '<div id="invites-manage-container"></div>',
        controllerLoader: () => import('../controllers/pages/invites-manage-controller.js')
      }
    };

    return routes[pathname] || null;
  }

  show404() {
    this.mainContainer.innerHTML = `
            <div class="error-page">
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/" class="btn">Go Home</a>
            </div>
        `;
  }

  showError(message) {
    this.mainContainer.innerHTML = `
            <div class="error-page">
                <h1>Error</h1>
                <p>${message}</p>
                <a href="/" class="btn">Go Home</a>
            </div>
        `;
  }

  setContent(html) {
    if (this.mainContainer) {
      this.mainContainer.innerHTML = html;
    }
  }
    
  // Show progress indicator
  showProgress(progress, text = 'Loading...') {
    if (this.mainContainer) {
      LoadingState.showProgress(this.mainContainer, progress, text);
    }
  }
}