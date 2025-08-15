export class ImagePreview {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.placeholder = options.placeholder || '/img/placeholder-square.png';
    this.className = options.className || 'image-preview';
        
    if (!this.container) {
      return;
    }
        
    this.render();
  }
    
  render() {
    this.container.innerHTML = `<img src="${this.placeholder}" alt="Preview" class="${this.className}">`;
  }
    
  update(url) {
    if (!this.container) return;
        
    if (!url) {
      this.render();
      return;
    }
        
    const img = new Image();
    img.onload = () => {
      this.container.innerHTML = `<img src="${url}" alt="Preview" class="${this.className}">`;
    };
    img.onerror = () => {
      this.render();
    };
    img.src = url;
  }
}