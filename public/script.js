const messageDiv = document.getElementById('message');

const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const emailInput = document.getElementById('emailInput');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');

// Initially disable buttons
loginButton.disabled = true;
registerButton.disabled = true;

function checkInputs() {
  const loginValue = loginInput.value.trim();
  const passwordValue = passwordInput.value.trim();
  const emailValue = emailInput.value.trim();

  loginButton.disabled = !(loginValue && passwordValue);
  registerButton.disabled = !(loginValue && passwordValue && emailValue);
}

function isValidEmail(email) {
  // Basic email format validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
loginInput.addEventListener('input', checkInputs);
passwordInput.addEventListener('input', checkInputs);
emailInput.addEventListener('input', checkInputs);

registerButton.addEventListener('click', function(event) {
  event.preventDefault();

  // Hash the password before sending
  const emailValue = emailInput.value.trim();

  if (!isValidEmail(emailValue)) {
    messageDiv.textContent = 'Please enter a valid email address.';
 messageDiv.classList.remove('text-success');
    messageDiv.classList.add('text-danger');
    return; // Stop the registration process
  }
  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
 body: JSON.stringify({ login: loginInput.value.trim(), email: emailInput.value.trim(), passwordHash: passwordInput.value.trim() }), // Sending plain password for now (testing)
  })
  .then(response => response.json())
  .then(data => {
 messageDiv.textContent = data.message;
    if (data.status === 'succeeded') {
 messageDiv.classList.remove('text-danger');
 messageDiv.classList.add('text-success');
    } else {
 messageDiv.classList.remove('text-success');
 messageDiv.classList.add('text-danger');
    }
  })
  .catch((error) => {
 messageDiv.textContent = 'An error occurred during registration.';
 messageDiv.classList.remove('text-success');
 messageDiv.classList.add('text-danger');
  });
});

loginButton.addEventListener('click', function(event) {
  event.preventDefault();

  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login: loginInput.value.trim(), password: passwordInput.value.trim() }),
  })
  .then(response => response.json())
  .then(data => {
 messageDiv.textContent = data.message;
    if (data.success) {
 messageDiv.classList.remove('text-danger');
 messageDiv.classList.add('text-success');
      // You might want to redirect or update UI on successful login
    } else {
 messageDiv.classList.remove('text-success');
 messageDiv.classList.add('text-danger');
    }
  })
  .catch((error) => {
 messageDiv.textContent = 'An error occurred during login.';
 messageDiv.classList.remove('text-success');
 messageDiv.classList.add('text-danger');
  });
});