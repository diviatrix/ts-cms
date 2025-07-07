import { UtilityAPI } from './js/api-core.js';

// Use the API client to fetch navigation HTML
UtilityAPI.getHtml('/nav/index.html')
  .then(response => {
    if (!response.success) {
      console.error('Navigation fetch failed:', response.message);
      return;
    }
    
    const navPlaceholder = document.getElementById('navPlaceholder');
    if (navPlaceholder) {
      navPlaceholder.innerHTML = response.data;

      // Dispatch navigation loaded event
      const event = new CustomEvent('navigationLoaded');
      document.dispatchEvent(event);

      // Notify theme manager to re-apply styles to newly loaded navigation
      const themeEvent = new CustomEvent('dynamicContentLoaded', {
        detail: { type: 'navigation', element: navPlaceholder }
      });
      document.dispatchEvent(themeEvent);
    } else {
      console.error('navPlaceholder element not found.');
    }
  })
  .catch(error => {
    console.error('Error fetching or inserting navigation:', error);
  });
