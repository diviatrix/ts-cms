export class AuthDropdown {
  constructor() {
    this.dropdownElement = null;
    this.isOpen = false;
    this.formElement = null;
  }

  async init() {
    this.dropdownElement = document.getElementById('loginDropdownMenu');
    this.formElement = document.getElementById('loginForm');

    if (this.formElement) {
      this.formElement.addEventListener('submit', (e) => this.handleLogin(e));
    }

    const toggleBtn = document.getElementById('authToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    document.addEventListener('click', (e) => this.handleOutsideClick(e));
  }

  handleOutsideClick(e) {
    if (!this.isOpen) return;
    const dropdown = this.dropdownElement;
    const toggleBtn = document.getElementById('authToggleBtn');
    if (dropdown && !dropdown.contains(e.target) && toggleBtn && !toggleBtn.contains(e.target)) {
      this.close();
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.dropdownElement) {
      this.dropdownElement.classList.add('show');
      this.isOpen = true;
      const input = document.getElementById('loginInput');
      if (input) input.focus();
    }
  }

  close() {
    if (this.dropdownElement) {
      this.dropdownElement.classList.remove('show');
      this.isOpen = false;
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    if (!login || !password) {
      notifications.error('Please fill in all fields.');
      return;
    }

    const submitBtn = document.getElementById('loginSubmitBtn');
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      const btnIcon = submitBtn.querySelector('.btn-icon');
      if (btnIcon) btnIcon.style.display = 'none';
    }
        
    notifications.info('Signing in...');
    const res = await fetch('https://auth.hole.icu/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    const data = await res.json();

    if (submitBtn) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      const btnIcon = submitBtn.querySelector('.btn-icon');
      if (btnIcon) btnIcon.style.display = '';
    }

    if (res.ok && data.session_token) {
      localStorage.setItem('session_token', data.session_token);
      notifications.success('Welcome back!');
      document.dispatchEvent(new CustomEvent('authSuccess', { 
        detail: { token: data.session_token } 
      }));
      this.close();
    } else {
      notifications.error(data.error || 'Invalid credentials.');
    }
  }
}