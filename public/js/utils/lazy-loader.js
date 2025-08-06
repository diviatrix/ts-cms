export class LazyLoader {
    constructor() {
        this.imageObserver = null;
        this.pageObserver = null;
        this.initImageObserver();
        this.initPageObserver();
    }

    initImageObserver() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px' // Load images when they're 50px away from viewport
            });
        }
    }

    initPageObserver() {
        if ('IntersectionObserver' in window) {
            this.pageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const loadCallback = element.dataset.loadCallback;
                        if (loadCallback && typeof window[loadCallback] === 'function') {
                            window[loadCallback]();
                            this.pageObserver.unobserve(element);
                        }
                    }
                });
            }, {
                rootMargin: '100px' // Load content when it's 100px away from viewport
            });
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Create a new image to preload
        const image = new Image();
        image.onload = () => {
            img.src = src;
            img.classList.remove('lazy');
            img.classList.add('loaded');
        };
        image.onerror = () => {
            img.classList.remove('lazy');
            // Optionally set a fallback image
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzR0NDQ0NCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2FhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
        };
        image.src = src;
    }

    observeImage(img) {
        if (this.imageObserver) {
            this.imageObserver.observe(img);
        } else {
            // Fallback for browsers that don't support IntersectionObserver
            this.loadImage(img);
        }
    }

    observePageElement(element) {
        if (this.pageObserver) {
            this.pageObserver.observe(element);
        }
    }

    // Load all lazy images in a container
    loadAllImages(container = document) {
        const lazyImages = container.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            if (this.imageObserver) {
                this.observeImage(img);
            } else {
                this.loadImage(img);
            }
        });
    }

    // Load all lazy page elements in a container
    loadAllPageElements(container = document) {
        const lazyElements = container.querySelectorAll('[data-load-callback]');
        lazyElements.forEach(element => {
            if (this.pageObserver) {
                this.observePageElement(element);
            } else {
                // Fallback for browsers that don't support IntersectionObserver
                const loadCallback = element.dataset.loadCallback;
                if (loadCallback && typeof window[loadCallback] === 'function') {
                    window[loadCallback]();
                }
            }
        });
    }
}

// Create a singleton instance
export const lazyLoader = new LazyLoader();