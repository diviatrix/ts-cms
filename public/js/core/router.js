export class Router {
    constructor(app) {
        this.app = app;
        this.routes = {
            '/': () => import('../main.js').then(module => new module.default(this.app)),
            '/index.html': () => import('../main.js').then(module => new module.default(this.app)),
            '/pages/profile-page.html': () => import('../controllers/pages/profile-controller.js').then(module => new module.default(this.app)),
            '/pages/admin-page.html': () => import('../controllers/pages/admin-panel-controller.js').then(module => new module.default(this.app)),
            '/pages/record-page.html': () => import('../controllers/pages/single-record-controller.js').then(module => new module.default(this.app)),
            '/pages/records-manage-page.html': () => import('../controllers/pages/records-manage-controller.js').then(module => new module.default(this.app)),
            '/pages/settings-page.html': () => import('../controllers/pages/settings-controller.js').then(module => new module.default(this.app)),
            '/pages/themes-manage-page.html': () => import('../controllers/pages/themes-manage-controller.js').then(module => new module.default(this.app)),
            '/pages/theme-editor-page.html': () => import('../controllers/pages/theme-editor-controller.js').then(module => new module.default(this.app)),
            '/pages/record-editor-page.html': () => import('../controllers/pages/record-editor-controller.js').then(module => new module.default(this.app)),
        };
    }

    route() {
        const path = window.location.pathname;

        const loadController = this.routes[path];

        if (loadController) {
            loadController().catch(err => {
                console.error(`Failed to load controller for path: ${path}`, err);
            });
        } else {
        }
    }
}