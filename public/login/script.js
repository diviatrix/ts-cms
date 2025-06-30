import { AuthAPI } from '../js/api-client.js';
import { MessageDisplay, FormValidator, loadingManager } from '../js/ui-utils.js';

document.addEventListener('DOMContentLoaded', function() {
  const messageDiv = document.getElementById('messageDiv');
  const message = new MessageDisplay(messageDiv);

  const loginInput = document.getElementById('loginInput');
  const passwordInput = document.getElementById('passwordInput');
  const emailInput = document.getElementById('emailInput');
  const loginButton = document.getElementById('loginButton');
  const registerButton = document.getElementById('registerButton');

  // Initially disable buttons
  loginButton.disabled = true;
  registerButton.disabled = true;

  // Check for token on page load and redirect if found
  if (AuthAPI.isAuthenticated()) {
    window.location.href = '/'; // Redirect to main page
    return; // Stop further execution of this script
  }

  function checkInputs() {
    const loginValue = loginInput.value.trim();
    const passwordValue = passwordInput.value.trim();
    const emailValue = emailInput.value.trim();

    loginButton.disabled = !(loginValue && passwordValue);
    registerButton.disabled = !(loginValue && passwordValue && emailValue);
  }

  loginInput.addEventListener('input', checkInputs);
  passwordInput.addEventListener('input', checkInputs);
  emailInput.addEventListener('input', checkInputs);

  registerButton.addEventListener('click', async function(event) {
    event.preventDefault();
    
    // Clear previous messages
    message.hide();

    // Validate inputs
    const requiredFields = [
      { element: loginInput, name: 'Login' },
      { element: passwordInput, name: 'Password' },
      { element: emailInput, name: 'Email' }
    ];

    const requiredErrors = FormValidator.validateRequired(requiredFields);
    const emailErrors = FormValidator.validateEmail(emailInput);
    const passwordErrors = FormValidator.validatePassword(passwordInput);

    const allErrors = [...requiredErrors, ...emailErrors, ...passwordErrors];
    
    if (allErrors.length > 0) {
      message.showError(allErrors.join(', '));
      return;
    }

    // Set loading state
    loadingManager.setLoading(registerButton, true, 'Registering...');

    try {
      const response = await AuthAPI.register(
        loginInput.value.trim(),
        emailInput.value.trim(),
        passwordInput.value.trim()
      );

      message.showApiResponse(response);
      
      if (response.success) {
        // Clear form on success
        loginInput.value = '';
        passwordInput.value = '';
        emailInput.value = '';
        checkInputs();
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.showError('An error occurred during registration. Please try again.');
    } finally {
      loadingManager.setLoading(registerButton, false);
    }
  });

  loginButton.addEventListener('click', async function(event) {
    event.preventDefault();
    
    // Clear previous messages
    message.hide();

    // Validate inputs
    const requiredFields = [
      { element: loginInput, name: 'Login' },
      { element: passwordInput, name: 'Password' }
    ];

    const requiredErrors = FormValidator.validateRequired(requiredFields);
    
    if (requiredErrors.length > 0) {
      message.showError(requiredErrors.join(', '));
      return;
    }

    // Set loading state
    loadingManager.setLoading(loginButton, true, 'Logging in...');

    try {
      const response = await AuthAPI.login(
        loginInput.value.trim(),
        passwordInput.value.trim()
      );

      message.showApiResponse(response);
      
      if (response.success) {
        // Redirect to main page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Login error:', error);
      message.showError('An error occurred during login. Please try again.');
    } finally {
      loadingManager.setLoading(loginButton, false);
    }
  });
});