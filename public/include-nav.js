import { jwtDecode } from './js/jwt-decode.js';

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

      // Check user roles and hide admin link if not admin
      const token = localStorage.getItem('token');
      const adminLink = document.getElementById('adminLink');

      if (token && adminLink) {
        try {
          const decodedToken = jwtDecode(token);
          if (decodedToken && decodedToken.roles && decodedToken.roles.includes('admin')) {
            adminLink.classList.remove('d-none');
          } else {
            adminLink.classList.add('d-none');
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          adminLink.classList.add('d-none'); // Hide if token is invalid
        }
      } else if (adminLink) {
        adminLink.classList.add('d-none'); // Hide if no token
      }

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
