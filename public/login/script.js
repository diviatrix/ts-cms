import { AuthAPI } from '../js/api-auth.js';
import { AuthPageController, FormHandler } from '../js/shared-components.js';
import { messageSystem } from '../js/utils/message-system.js';
import { initMessageContainer } from '../js/shared-components/message-container.js';

/**
 * Login Page Controller
 */
class LoginPageController extends AuthPageController {
  constructor() {
    super({
      authAPI: AuthAPI,
      messageDiv: document.getElementById('messageDiv')
    });
    
    this.initializeElements();
    this.setupTabHandlers();
    this.setupFormHandler();
    this.setupInputValidation();
    this.setupPasswordStrengthValidation();
  }

  initializeElements() {
    // Login tab
    this.loginInput = document.getElementById('loginInput');
    this.passwordInput = document.getElementById('passwordInput');
    this.loginButton = document.getElementById('loginButton');
    this.loginForm = document.getElementById('loginForm');
    // Register tab
    this.registerLoginInput = document.getElementById('registerLoginInput');
    this.registerEmailInput = document.getElementById('registerEmailInput');
    this.registerPasswordInput = document.getElementById('registerPasswordInput');
    this.registerButton = document.getElementById('registerButton');
    this.registerForm = document.getElementById('registerForm');
    this.passwordStrengthDiv = document.getElementById('passwordStrength');
    // Tabs
    this.loginTab = document.getElementById('login-tab');
    this.registerTab = document.getElementById('register-tab');
    this.messageDiv = document.getElementById('messageDiv');
  }

  setupTabHandlers() {
    if (this.loginTab && this.registerTab) {
      this.loginTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.loginTab.classList.add('active');
        this.registerTab.classList.remove('active');
        document.getElementById('loginTabPane').classList.add('active');
        document.getElementById('registerTabPane').classList.remove('active');
        this.messageDiv.innerHTML = '';
        this.loginForm.reset();
        this.registerForm.reset();
        this.loginButton.disabled = true;
        this.registerButton.disabled = true;
        if (this.passwordStrengthDiv) this.passwordStrengthDiv.innerHTML = '';
      });
      this.registerTab.addEventListener('click', (e) => {
        e.preventDefault();
        this.registerTab.classList.add('active');
        this.loginTab.classList.remove('active');
        document.getElementById('registerTabPane').classList.add('active');
        document.getElementById('loginTabPane').classList.remove('active');
        this.messageDiv.innerHTML = '';
        this.loginForm.reset();
        this.registerForm.reset();
        this.loginButton.disabled = true;
        this.registerButton.disabled = true;
        if (this.passwordStrengthDiv) this.passwordStrengthDiv.innerHTML = '';
      });
    }
  }

  setupFormHandler() {
    // Use a single FormHandler, update rules dynamically
    this.formHandler = new FormHandler(document.body);
    // Login form submit (disable default submit)
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
    });
    // Register form submit (disable default submit)
    this.registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
    });
    // Login button click (now <a>)
    this.loginButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleSubmit('login');
    });
    // Register button click (now <a>)
    this.registerButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleSubmit('register');
    });
  }

  setupInputValidation() {
    // Login tab
    const updateLoginButton = () => {
      const loginValue = this.loginInput.value.trim();
      const passwordValue = this.passwordInput.value.trim();
      this.loginButton.disabled = !(loginValue && passwordValue);
    };
    [this.loginInput, this.passwordInput].forEach(input => {
      if (input) {
        input.setAttribute('name', input.id);
        input.addEventListener('input', updateLoginButton);
      }
    });
    // Register tab
    const updateRegisterButton = () => {
      const loginValue = this.registerLoginInput.value.trim();
      const passwordValue = this.registerPasswordInput.value.trim();
      const emailValue = this.registerEmailInput.value.trim();
      this.registerButton.disabled = !(loginValue && passwordValue && emailValue);
    };
    [this.registerLoginInput, this.registerPasswordInput, this.registerEmailInput].forEach(input => {
      if (input) {
        input.setAttribute('name', input.id);
        input.addEventListener('input', updateRegisterButton);
      }
    });
  }

  setupPasswordStrengthValidation() {
    if (!this.registerPasswordInput || !this.passwordStrengthDiv) return;
    this.registerPasswordInput.addEventListener('input', () => {
      const password = this.registerPasswordInput.value;
      const strength = this.calculatePasswordStrength(password);
      this.updatePasswordStrengthUI(this.passwordStrengthDiv, strength, password.length);
    });
  }

  calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)
    };
    score = Object.values(checks).filter(Boolean).length;
    return {
      score,
      checks,
      level: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong'
    };
  }

  updatePasswordStrengthUI(strengthDiv, strength, passwordLength) {
    if (passwordLength === 0) {
      strengthDiv.innerHTML = '';
      return;
    }
    const colors = { weak: '#ff3c3c', medium: '#ffc107', strong: '#3cff7a' };
    const messages = { weak: 'Weak password', medium: 'Medium strength', strong: 'Strong password' };
    const progressWidth = (strength.score / 5) * 100;
    strengthDiv.innerHTML = `
      <div style="font-size:0.95em; margin-bottom:0.5em;">Password strength: <span style="color:${colors[strength.level]}">${messages[strength.level]}</span></div>
      <div style="background:#222; border-radius:2px; height:4px; margin-bottom:0.5em; width:100%;">
        <div style="background:${colors[strength.level]}; height:4px; border-radius:2px; width:${progressWidth}%"></div>
      </div>
      <div style="font-size:0.95em; color:#aaa;">
        ${(strength.checks.length ? '✓' : '✗')} At least 8 characters<br>
        ${(strength.checks.lowercase ? '✓' : '✗')} Lowercase letter<br>
        ${(strength.checks.uppercase ? '✓' : '✗')} Uppercase letter<br>
        ${(strength.checks.numbers ? '✓' : '✗')} Number<br>
        ${(strength.checks.special ? '✓' : '✗')} Special character
      </div>
    `;
  }

  async handleSubmit(type) {
    if (type === 'login') {
      const login = this.loginInput.value.trim();
      const password = this.passwordInput.value.trim();
      if (!login || !password) return;
      const response = await AuthAPI.login(login, password);
      if (response.success) {
        this.handleAuthSuccess();
      } else {
        this.handleAuthFailure(response);
      }
    } else if (type === 'register') {
      const login = this.registerLoginInput.value.trim();
      const email = this.registerEmailInput.value.trim();
      const password = this.registerPasswordInput.value.trim();
      if (!login || !email || !password) return;
      const response = await AuthAPI.register(login, email, password);
      if (response.success) {
        // Auto-login after successful registration
        const loginResponse = await AuthAPI.login(login, password);
        if (loginResponse.success) {
          this.handleAuthSuccess();
        } else {
          this.handleAuthFailure(loginResponse);
        }
      } else {
        this.handleAuthFailure(response);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LoginPageController();
});