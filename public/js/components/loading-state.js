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
}