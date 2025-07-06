// Reusable image preview utility
export function setImagePreview(imgElement, url, altText = '') {
  const wrapper = imgElement.parentElement;
  if (imgElement && wrapper) {
    wrapper.style.display = 'none'; // Hide wrapper by default
    if (url) {
      imgElement.onload = () => {
        wrapper.style.display = '';
      };
      imgElement.onerror = () => {
        imgElement.src = '';
        wrapper.style.display = 'none';
      };
      imgElement.src = url;
      imgElement.alt = altText;
    } else {
      imgElement.src = '';
      imgElement.alt = altText;
      wrapper.style.display = 'none';
    }
  }
} 