import { AuthAPI } from '../js/api-client.js';
import { AuthPageController, FormHandler } from '../js/shared-components.js';
import { MessageDisplay, ErrorHandler } from '../js/ui-utils.js';

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
    this.setupFormHandlers();
    this.setupInputValidation();
  }

  initializeElements() {
    this.loginInput = document.getElementById('loginInput');
    this.passwordInput = document.getElementById('passwordInput');
    this.emailInput = document.getElementById('emailInput');
    this.loginButton = document.getElementById('loginButton');
    this.registerButton = document.getElementById('registerButton');

    // Initially disable buttons
    this.loginButton.disabled = true;
    this.registerButton.disabled = true;
  }

  setupFormHandlers() {
    // Login form handler
    this.loginFormHandler = new FormHandler(document.body, {
      messageDisplay: this.message,
      validationRules: {
        login: [{ type: 'required', message: 'Login is required' }],
        password: [{ type: 'required', message: 'Password is required' }]
      }
    });

    // Register form handler  
    this.registerFormHandler = new FormHandler(document.body, {
      messageDisplay: this.message,
      validationRules: {
        login: [
          { type: 'required', message: 'Login is required' },
          { type: 'minLength', value: 3, message: 'Login must be at least 3 characters long' },
          { type: 'maxLength', value: 50, message: 'Login must be no more than 50 characters long' }
        ],
        password: [
          { type: 'required', message: 'Password is required' },
          { type: 'minLength', value: 6, message: 'Password must be at least 6 characters long' }
        ],
        email: [
          { type: 'required', message: 'Email is required' },
          { type: 'email', message: 'Please enter a valid email address' }
        ]
      }
    });

    // Set up button event listeners
    this.loginButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    this.registerButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleRegister();
    });
  }

  setupInputValidation() {
    const updateButtonStates = () => {
      const loginValue = this.loginInput.value.trim();
      const passwordValue = this.passwordInput.value.trim();
      const emailValue = this.emailInput.value.trim();

      this.loginButton.disabled = !(loginValue && passwordValue);
      this.registerButton.disabled = !(loginValue && passwordValue && emailValue);
    };

    [this.loginInput, this.passwordInput, this.emailInput].forEach(input => {
      if (input) {
        input.setAttribute('name', input.id.replace('Input', ''));
        input.addEventListener('input', updateButtonStates);
      }
    });
  }

  async handleLogin() {
    const isValid = this.loginFormHandler.validateForm();
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
  }

  async handleRegister() {
    const isValid = this.registerFormHandler.validateForm();
    if (!isValid) return;

    const response = await this.safeApiCall(
      () => AuthAPI.register(
        this.loginInput.value.trim(),
        this.emailInput.value.trim(),
        this.passwordInput.value.trim()
      ),
      {
        loadingElements: [this.registerButton],
        successCallback: () => {
          ErrorHandler.showToast('Registration successful!', 'success');
          this.clearForm();
        }
      }
    );

    return response;
  }

  clearForm() {
    [this.loginInput, this.passwordInput, this.emailInput].forEach(input => {
      if (input) {
        input.value = '';
        input.classList.remove('is-valid', 'is-invalid');
      }
    });
    
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    this.loginButton.disabled = true;
    this.registerButton.disabled = true;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new LoginPageController();

});