import { AuthAPI } from '../js/api-client.js';

document.addEventListener('navigationLoaded', function() {
  console.log('nav/script.js received navigationLoaded event.');
  const signOutButton = document.getElementById('signOutButton');
  const profileLink = document.getElementById('profileLink');
  const adminLink = document.getElementById('adminLink');
  const loginLink = document.getElementById('loginLink');
  const menuBlock = document.getElementById('menuBlock');

  if (!AuthAPI.isAuthenticated()) {
    // If no token, show login/register link and hide others
    if (loginLink) {
      loginLink.classList.remove('d-none');
    }
    if (profileLink) {
      profileLink.classList.add('d-none');
    }
    if (adminLink) {
      adminLink.classList.add('d-none');
    }
    if (signOutButton) {
      signOutButton.classList.add('d-none');
    }
  } else {
    // If token exists, show profile, admin, and sign out links and hide login/register
    if (loginLink) {
      loginLink.classList.add('d-none');
    }
    if (profileLink) {
      profileLink.classList.remove('d-none');
    }
     
    if (signOutButton) {
      signOutButton.classList.remove('d-none');
      signOutButton.addEventListener('click', function() {
        AuthAPI.logout(); // Use AuthAPI logout method
      });
    }

    // Ensure menu block is visible if any logged-in links are shown
     if (menuBlock) {
        menuBlock.classList.remove('d-none');
     }
  }
  console.log('nav/script.js finished execution.');
});
