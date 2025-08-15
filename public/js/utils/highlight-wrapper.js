/**
 * Wrapper module for highlight.js
 * Loads highlight.js and provides a simple interface
 */

class HighlightWrapper {
  constructor() {
    this.hljs = null;
    this.loaded = false;
    this.loadPromise = null;
  }

  /**
     * Load highlight.js and its styles
     */
  async load() {
    if (this.loaded) return this.hljs;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      // Load CSS if not already loaded
      if (!document.getElementById('highlightjs-style')) {
        const link = document.createElement('link');
        link.id = 'highlightjs-style';
        link.rel = 'stylesheet';
        link.href = '/node_modules/highlight.js/styles/github-dark.css';
        document.head.appendChild(link);
      }

      // Load the script
      if (!window.hljs) {
        const script = document.createElement('script');
        script.src = '/node_modules/highlight.js/lib/highlight.js';
        script.onload = () => {
          this.hljs = window.hljs;
          this.loaded = true;
          resolve(this.hljs);
        };
        script.onerror = () => {
          resolve(null);
        };
        document.head.appendChild(script);
      } else {
        this.hljs = window.hljs;
        this.loaded = true;
        resolve(this.hljs);
      }
    });

    return this.loadPromise;
  }

  /**
     * Highlight a code block
     */
  highlight(code, language) {
    if (!this.hljs) return code;
        
    try {
      if (language && this.hljs.getLanguage(language)) {
        return this.hljs.highlight(code, { language }).value;
      }
      return this.hljs.highlightAuto(code).value;
    } catch (err) {
      return code;
    }
  }

  /**
     * Highlight all code blocks in an element
     */
  highlightAll(container = document) {
    if (!this.hljs) return;
        
    container.querySelectorAll('pre code').forEach(block => {
      try {
        this.hljs.highlightElement(block);
      } catch (err) {
      }
    });
  }
}

// Export singleton instance
export const highlightWrapper = new HighlightWrapper();