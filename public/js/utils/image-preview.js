// Reusable image preview utility
export function setImagePreview(imgElement, url, altText = '') {
  if (imgElement) {
    if (url) {
      imgElement.src = url;
      imgElement.alt = altText;
      imgElement.style.display = '';
      imgElement.onerror = () => {
        imgElement.style.display = 'none';
      };
    } else {
      imgElement.src = '';
      imgElement.style.display = 'none';
    }
  }
} 