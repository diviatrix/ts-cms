export class LoadingState {
    static show(element, text = 'Loading...') {
        if (element) {
            element.innerHTML = `<div class="loading-spinner">${text}</div>`;
            element.classList.add('loading');
        }
    }

    static hide(element) {
        if (element) {
            element.classList.remove('loading');
        }
    }

    static showMultiple(elements, text = 'Loading...') {
        elements.forEach(element => this.show(element, text));
    }

    static hideMultiple(elements) {
        elements.forEach(element => this.hide(element));
    }

    static create(text = 'Loading...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-spinner';
        loadingDiv.textContent = text;
        return loadingDiv;
    }

    static replace(element, content) {
        if (element) {
            element.classList.remove('loading');
            element.innerHTML = content;
        }
    }

    // Show skeleton loading state
    static showSkeleton(element, type = 'text') {
        if (element) {
            element.classList.add('loading');
            switch (type) {
                case 'card':
                    element.innerHTML = `
                        <div class="skeleton-card">
                            <div class="skeleton-image"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line"></div>
                            </div>
                        </div>
                    `;
                    break;
                case 'list':
                    element.innerHTML = `
                        <div class="skeleton-list">
                            <div class="skeleton-item"></div>
                            <div class="skeleton-item"></div>
                            <div class="skeleton-item"></div>
                        </div>
                    `;
                    break;
                case 'text':
                default:
                    element.innerHTML = `
                        <div class="skeleton-text">
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                            <div class="skeleton-line"></div>
                        </div>
                    `;
            }
        }
    }

    // Show progress indicator
    static showProgress(element, progress = 0, text = 'Loading...') {
        if (element) {
            element.innerHTML = `
                <div class="progress-container">
                    <div class="progress-text">${text}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-percent">${Math.round(progress)}%</div>
                </div>
            `;
            element.classList.add('loading');
        }
    }
}