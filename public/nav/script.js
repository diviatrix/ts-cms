console.log('nav/script.js loaded');

// Inject login/register dropdown partial into navbar
fetch('/nav/login-dropdown.html')
  .then(res => res.text())
  .then(html => {
    const loginDropdownToggle = document.getElementById('loginDropdownToggle');
    if (loginDropdownToggle) {
      const li = loginDropdownToggle.closest('li');
      if (li) {
        li.insertAdjacentHTML('beforeend', html);
        setupLoginDropdown();
      }
    }
  });

function setupLoginDropdown() {
  const loginDropdownToggle = document.getElementById('loginDropdownToggle');
  const loginDropdownMenu = document.getElementById('loginDropdownMenu');
  const loginTabBtn = document.getElementById('loginTabBtn');
  const registerTabBtn = document.getElementById('registerTabBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginDropdownMessage = document.getElementById('loginDropdownMessage');

  // Toggle dropdown
  loginDropdownToggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (loginDropdownMenu.style.display === 'none' || !loginDropdownMenu.style.display) {
      loginDropdownMenu.style.display = 'block';
    } else {
      loginDropdownMenu.style.display = 'none';
    }
  });
  document.addEventListener('click', (e) => {
    if (!loginDropdownMenu.contains(e.target) && e.target !== loginDropdownToggle) {
      loginDropdownMenu.style.display = 'none';
    }
  });

  // Tab switching
  loginTabBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginTabBtn.classList.add('active');
    registerTabBtn.classList.remove('active');
    loginForm.style.display = '';
    registerForm.style.display = 'none';
    loginDropdownMessage.textContent = '';
  });
  registerTabBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginTabBtn.classList.remove('active');
    registerTabBtn.classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = '';
    loginDropdownMessage.textContent = '';
  });

  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    if (!login || !password) {
      loginDropdownMessage.textContent = 'Please enter login and password.';
      return;
    }
    loginDropdownMessage.textContent = 'Logging in...';
    try {
      // Use AuthAPI from api-client.js
      const { AuthAPI } = await import('../js/api-client.js');
      const response = await AuthAPI.login(login, password);
      if (response.success) {
        loginDropdownMessage.textContent = 'Login successful!';
        setTimeout(() => window.location.reload(), 500);
      } else {
        loginDropdownMessage.textContent = response.message || 'Login failed.';
      }
    } catch (err) {
      loginDropdownMessage.textContent = 'Error: ' + (err?.message || err);
    }
  });

  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = document.getElementById('registerLoginInput').value.trim();
    const email = document.getElementById('registerEmailInput').value.trim();
    const password = document.getElementById('registerPasswordInput').value;
    if (!login || !email || !password) {
      loginDropdownMessage.textContent = 'Please fill all fields.';
      return;
    }
    loginDropdownMessage.textContent = 'Registering...';
    try {
      // Use AuthAPI from api-client.js
      const { AuthAPI } = await import('../js/api-client.js');
      const response = await AuthAPI.register(login, email, password);
      if (response.success) {
        loginDropdownMessage.textContent = 'Registration successful! You can now log in.';
        loginTabBtn.click();
      } else {
        loginDropdownMessage.textContent = response.message || 'Registration failed.';
      }
    } catch (err) {
      loginDropdownMessage.textContent = 'Error: ' + (err?.message || err);
    }
  });
}

// Ensure nav menu updates after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateNavMenu();
  });
} else {
  updateNavMenu();
}

// Hide dropdown for authenticated users
export function updateNavMenu() {
  const token = localStorage.getItem('token');
  let roles = [];
  let isAuthenticated = false;
  let payload = undefined;
  if (token) {
    try {
      payload = JSON.parse(atob(token.split('.')[1]));
      isAuthenticated = payload.exp * 1000 > Date.now();
      roles = payload.roles || payload.groups || [];
    } catch (e) {
      console.error('Token decode error in updateNavMenu:', e);
    }
  }
  console.log('updateNavMenu called', { token, payload, isAuthenticated, roles });
  const loginLink = document.getElementById('loginLink');
  const profileLink = document.getElementById('profileLink');
  const signOutButton = document.getElementById('signOutButton');
  const adminLink = document.getElementById('adminLink');
  if (loginLink) loginLink.classList.toggle('hidden', isAuthenticated);
  if (profileLink) profileLink.classList.toggle('hidden', !isAuthenticated);
  if (signOutButton) signOutButton.classList.toggle('hidden', !isAuthenticated);
  if (adminLink) adminLink.classList.toggle('hidden', !(isAuthenticated && roles.includes('admin')));
  // Setup sign out button
  if (signOutButton && isAuthenticated && !signOutButton.hasAttribute('data-listener-added')) {
    signOutButton.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      updateNavMenu();
      window.location.href = '/';
    });
    signOutButton.setAttribute('data-listener-added', 'true');
  }
  const loginDropdownToggle = document.getElementById('loginDropdownToggle');
  const loginDropdownMenu = document.getElementById('loginDropdownMenu');
  if (loginDropdownToggle) loginDropdownToggle.classList.toggle('hidden', isAuthenticated);
  if (loginDropdownMenu) loginDropdownMenu.style.display = isAuthenticated ? 'none' : 'block';
}

document.addEventListener('navigationLoaded', () => {
  console.log('navigationLoaded event received');
  updateNavMenu();
});
document.addEventListener('navShouldUpdate', () => {
  console.log('navShouldUpdate event received');
  updateNavMenu();
});
window.addEventListener('storage', (e) => { if (e.key === 'token') { console.log('storage event received'); updateNavMenu(); } });
// Optionally, call updateNavMenu() after login/logout in your auth logic.
