console.log('include-nav.js script started.');

fetch('/nav/index.html')
  .then(response => {
    console.log('Fetch response received:', response);
    if (!response.ok) {
      console.error('Fetch failed with status:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
  })
  .then(html => {
    console.log('Navigation HTML fetched successfully.');
    const navPlaceholder = document.getElementById('navPlaceholder');
    if (navPlaceholder) {
      navPlaceholder.innerHTML = html;
      console.log('Navigation HTML inserted into navPlaceholder.');
      // Dispatch a custom event after inserting the navigation
      const event = new CustomEvent('navigationLoaded');
      document.dispatchEvent(event);
      console.log('navigationLoaded event dispatched.');
    } else {
      console.error('navPlaceholder element not found.');
    }
  })
  .catch(error => {
    console.error('Error fetching or inserting navigation:', error);
  });

console.log('include-nav.js script finished.');
