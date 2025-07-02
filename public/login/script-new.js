import { AuthAPI } from '../js/api-client.js';
import { AuthPageController, FormHandler } from '../js/shared-components.js';
import { messages, withErrorHandling } from '../js/utils/message-api.js';

/**
 * Login Page Controller - Modernized with Unified Message System
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
    this.setupPasswordStrengthValidation();
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
    // Login form handler - simplified validation
    this.loginFormHandler = new FormHandler(document.body, {
      messageDisplay: this.message, // Keep for backward compatibility
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

  setupPasswordStrengthValidation() {
    if (!this.passwordInput || !this.registerButton) return;

    // Create password strength indicator
    const strengthDiv = document.createElement('div');
    strengthDiv.id = 'passwordStrength';
    strengthDiv.className = 'mt-2';
    this.passwordInput.parentNode.appendChild(strengthDiv);

    this.passwordInput.addEventListener('input', () => {
      const password = this.passwordInput.value;
      const strength = this.calculatePasswordStrength(password);
      this.updatePasswordStrengthUI(strengthDiv, strength, password.length);
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

    const colors = {
      weak: 'danger',
      medium: 'warning', 
      strong: 'success'
    };

    const messages = {
      weak: 'Weak password',
      medium: 'Medium strength',
      strong: 'Strong password'
    };

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

  /**
   * Handle login - Modernized with new message system
   */
  async handleLogin() {
    // Client-side validation first
    const isValid = this.loginFormHandler.validateForm();
    if (!isValid) {
      messages.validationError('Please check the highlighted fields');
      return;
    }

    // Set context for better error categorization
    messages.setContext('login');

    // Disable button to prevent double-submission
    this.loginButton.disabled = true;
    const loadingId = messages.loading('Signing you in...', 10000);

    try {
      // Use the error handling wrapper for clean code
      const response = await withErrorHandling(
        () => AuthAPI.login(
          this.loginInput.value.trim(),
          this.passwordInput.value.trim()
        ),
        {
          action: 'login',
          operationKey: 'login_attempt',
          retry: () => this.handleLogin(),
          handleResponse: false // We'll handle it manually for custom success behavior
        }
      );

      // Dismiss loading message
      messages.dismiss(loadingId);

      if (response && response.success) {
        messages.success('Welcome back!', { toast: true });
        this.handleAuthSuccess();
      } else if (response) {
        // The system will automatically categorize and provide appropriate suggestions
        messages.apiResponse(response);
      }

    } catch (error) {
      messages.dismiss(loadingId);
      // Network and other errors are automatically handled by withErrorHandling
      console.error('Login error:', error);
    } finally {
      this.loginButton.disabled = false;
    }
  }

  /**
   * Handle registration - Modernized with new message system  
   */
  async handleRegister() {
    // Client-side validation
    const isValid = this.registerFormHandler.validateForm();
    if (!isValid) {
      messages.validationError('Please check the highlighted fields');
      return;
    }

    // Check password strength
    const password = this.passwordInput.value.trim();
    const strength = this.calculatePasswordStrength(password);
    
    if (strength.level === 'weak') {
      messages.warning('Your password is weak. Consider making it stronger for better security.', {
        suggestions: [
          'Use at least 8 characters',
          'Include uppercase and lowercase letters',
          'Add numbers and special characters'
        ]
      });
      return;
    }

    messages.setContext('registration');

    // Disable button and show loading
    this.registerButton.disabled = true;
    const loadingId = messages.loading('Creating your account...', 15000);

    try {
      const response = await withErrorHandling(
        () => AuthAPI.register(
          this.loginInput.value.trim(),
          this.emailInput.value.trim(),
          password
        ),
        {
          action: 'register',
          operationKey: 'register_attempt',
          retry: () => this.handleRegister()
        }
      );

      messages.dismiss(loadingId);

      if (response && response.success) {
        messages.success('Account created successfully! You can now log in.', {
          duration: 6000
        });
        this.clearForm();
        // Focus on login form
        this.loginInput.focus();
      }

    } catch (error) {
      messages.dismiss(loadingId);
      console.error('Registration error:', error);
    } finally {
      this.registerButton.disabled = false;
    }
  }

  /**
   * Clear form with visual feedback
   */
  clearForm() {
    [this.loginInput, this.passwordInput, this.emailInput].forEach(input => {
      if (input) {
        input.value = '';
        input.classList.remove('is-valid', 'is-invalid');
      }
    });
    
    // Clear field errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    
    // Clear password strength indicator
    const strengthDiv = document.getElementById('passwordStrength');
    if (strengthDiv) {
      strengthDiv.innerHTML = '';
    }
    
    // Reset button states
    this.loginButton.disabled = true;
    this.registerButton.disabled = true;

    // Show subtle feedback
    messages.info('Form cleared', { toast: true, duration: 2000 });
  }

  /**
   * Enhanced auth success handling
   */
  handleAuthSuccess() {
    // Clear any existing messages
    messages.clear();
    
    // Show success and redirect
    messages.success('Login successful! Redirecting...', { toast: true });
    
    // Call parent method
    super.handleAuthSuccess();
  }

  /**
   * Enhanced auth failure handling (legacy compatibility)
   */
  handleAuthFailure(response) {
    // The new system handles this automatically, but keep for compatibility
    messages.apiResponse(response);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new LoginPageController();
});
