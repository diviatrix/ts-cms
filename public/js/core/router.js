export class Router {
    constructor(app) {
        this.app = app;
        this.layout = null;
    }

    async init() {
        const { Layout } = await import('../components/layout.js');
        this.layout = new Layout();
        this.layout.init();
    }

    route() {
        if (this.layout) {
            const path = this.getCleanPath();
            this.layout.loadRoute(path);
        }
    }

    navigate(path) {
        if (this.layout) {
            this.layout.navigate(path);
        }
    }

    getCleanPath() {
        const path = window.location.pathname;
        
        // Map old HTML paths to new clean paths
        const pathMappings = {
            '/pages/profile-page.html': '/profile',
            '/pages/admin-page.html': '/admin',
            '/pages/record-page.html': '/record',
            '/pages/records-manage-page.html': '/records-manage',
            '/pages/settings-page.html': '/settings',
            '/pages/themes-manage-page.html': '/themes-manage',
            '/pages/theme-editor-page.html': '/theme-editor',
            '/pages/record-editor-page.html': '/record-editor',
            '/index.html': '/'
        };

        return pathMappings[path] || path;
    }
}