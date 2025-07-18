export class Router {
    constructor(app) {
        this.app = app;
        this.routes = {
            '/': () => import('../main.js').then(module => new module.default(this.app)),
            '/index.html': () => import('../main.js').then(module => new module.default(this.app)),
            '/pages/profile-page.html': () => import('../controllers/pages/profile-controller.js').then(module => new module.default(this.app)),
            '/pages/admin-page.html': () => import('../controllers/pages/admin-panel-controller.js').then(module => new module.default(this.app)),
            '/pages/record-page.html': () => import('../controllers/pages/single-record-controller.js').then(module => new module.default(this.app)),
        };
    }

    route() {
        const path = window.location.pathname;
        console.log(`Routing for path: ${path}`);

        const loadController = this.routes[path];

        if (loadController) {
            loadController().catch(err => {
                console.error(`Failed to load controller for path: ${path}`, err);
            });
        } else {
            console.warn(`No route found for path: ${path}`);
        }
    }
}