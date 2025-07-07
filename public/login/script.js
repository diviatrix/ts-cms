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
      [this.loginTab, this.registerTab].forEach(tab => {
        tab.addEventListener('click', () => {
          this.messageDiv.innerHTML = '';
          this.loginForm.reset();
          this.registerForm.reset();
          this.loginButton.disabled = true;
          this.registerButton.disabled = true;
          if (this.passwordStrengthDiv) this.passwordStrengthDiv.innerHTML = '';
        });
      });
    }
  }

  setupFormHandler() {
    // Use a single FormHandler, update rules dynamically
    this.formHandler = new FormHandler(document.body);
    // Login form submit
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit('login');
    });
    // Register form submit
    this.registerForm.addEventListener('submit', (e) => {
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
    const colors = { weak: 'danger', medium: 'warning', strong: 'success' };
    const messages = { weak: 'Weak password', medium: 'Medium strength', strong: 'Strong password' };
    const progressWidth = (strength.score / 5) * 100;
    strengthDiv.innerHTML = `
      <div class="small mb-1">Password strength: <span class="text-${colors[strength.level]}">${messages[strength.level]}</span></div>
      <div class="progress mb-2" style="height: 4px;">
        <div class="progress-bar bg-${colors[strength.level]}" style="width: ${progressWidth}%"></div>
      </div>
      <div class="small text-muted">
        ${strength.checks.length ? '✓' : '✗'} At least 8 characters<br>
        ${strength.checks.lowercase ? '✓' : '✗'} Lowercase letter<br>
        ${strength.checks.uppercase ? '✓' : '✗'} Uppercase letter<br>
        ${strength.checks.numbers ? '✓' : '✗'} Number<br>
        ${strength.checks.special ? '✓' : '✗'} Special character
      </div>
    `;
  }

  async handleSubmit(type) {
    // Set validation rules dynamically
    if (type === 'login') {
      this.formHandler.validationRules = {
        loginInput: [
          { type: 'required', message: 'Login is required' },
          { type: 'noSpaces', message: 'Login cannot contain spaces' }
        ],
        passwordInput: [{ type: 'required', message: 'Password is required' }]
      };
      const isValid = this.formHandler.validateForm();
      if (!isValid) return;
      const attemptLogin = async () => {
        const response = await AuthAPI.login(
          this.loginInput.value.trim(),
          this.passwordInput.value.trim()
        );
        if (response.success) {
          this.handleAuthSuccess();
        } else {
          this.handleAuthFailure(response);
        }
      };
      return this.safeApiCall(attemptLogin, {
        loadingElements: [this.loginButton],
        retryCallback: attemptLogin,
        operationKey: 'login_attempt'
      });
    } else if (type === 'register') {
      this.formHandler.validationRules = {
        registerLoginInput: [
          { type: 'required', message: 'Login is required' },
          { type: 'minLength', value: 4, message: 'Login must be at least 4 characters long' },
          { type: 'maxLength', value: 50, message: 'Login must be no more than 50 characters long' },
          { type: 'username', message: 'Login can only contain letters, numbers, underscores, and hyphens' },
          { type: 'noSpaces', message: 'Login cannot contain spaces' }
        ],
        registerPasswordInput: [
          { type: 'required', message: 'Password is required' },
          { type: 'minLength', value: 6, message: 'Password must be at least 6 characters long' },
          { type: 'maxLength', value: 100, message: 'Password must be no more than 100 characters long' }
        ],
        registerEmailInput: [
          { type: 'required', message: 'Email is required' },
          { type: 'email', message: 'Please enter a valid email address' }
        ]
      };
      const isValid = this.formHandler.validateForm();
      if (!isValid) return;
      const response = await this.safeApiCall(
        () => AuthAPI.register(
          this.registerLoginInput.value.trim(),
          this.registerEmailInput.value.trim(),
          this.registerPasswordInput.value.trim()
        ),
        {
          loadingElements: [this.registerButton],
        }
      );
      if (response.success) {
        this.handleAuthSuccess();
      } else {
        this.handleAuthFailure(response);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
    initMessageContainer();
    messageSystem.subscribe(renderMessages);
});

document.addEventListener('DOMContentLoaded', function() {
  new LoginPageController();
});