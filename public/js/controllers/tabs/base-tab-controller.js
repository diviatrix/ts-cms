import { BasePageController } from '../pages/base-page-controller.js';

export class BaseTabController extends BasePageController {
    constructor(container, partialUrl) {
        super();
        if (!container) {
            throw new Error('A container element must be provided.');
        }
        if (!partialUrl) {
            throw new Error('A partial URL must be provided.');
        }
        this.container = container;
        this.partialUrl = partialUrl;
        this.elements = {};
    }

    async load() {
        try {
            const response = await fetch(this.partialUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch partial: ${response.statusText}`);
            }
            const html = await response.text();
            this.container.innerHTML = html;
            this.init();
        } catch (error) {
            console.error(`Error loading tab from ${this.partialUrl}:`, error);
            this.container.innerHTML = `<p class="error">Failed to load content. Please try again later.</p>`;
        }
    }

    init() {
        // This method should be overridden by subclasses to initialize
        // event listeners and load data.
        console.warn('init() method not implemented in subclass.');
    }

    // Add a no-op destroy method for cleanup, to be optionally overridden by subclasses
    destroy() {
        // Remove all event listeners from this.container
        this.container.replaceWith(this.container.cloneNode(true));
        // Optionally clear references
        this.elements = {};
    }
}