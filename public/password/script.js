document.addEventListener('DOMContentLoaded', function() {
  const newPasswordInput = document.getElementById('newPassword');
  const savePasswordButton = document.getElementById('savePasswordButton');
  const passwordMessageDiv = document.getElementById('passwordMessage');

  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if no token
    window.location.href = '/login';
    return;
  }

  // Function to decode JWT (simplified for client-side, consider a library like jwt-decode)
  function decodeJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  const decodedToken = decodeJwt(token);
  const authenticatedUserId = decodedToken ? decodedToken.id : null;
  const isAdmin = decodedToken && decodedToken.roles && decodedToken.roles.includes('admin');

  // Determine targetUserId based on context (e.g., from URL for admin panel)
  // For now, assume it's the authenticated user unless explicitly set by an admin context
  let targetUserId = authenticatedUserId;

  // This part would be more complex in a real admin panel where a user is selected
  // For demonstration, if an admin is logged in, we might allow them to specify a userId
  // For now, we'll keep it simple: if admin, they can change anyone's password if userId is provided in URL
  // Otherwise, it's always the authenticated user.
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = urlParams.get('userId');

  if (isAdmin && userIdFromUrl) {
    targetUserId = userIdFromUrl;
  }

  savePasswordButton.addEventListener('click', async function() {
    const newPassword = newPasswordInput.value;

    if (!newPassword) {
      passwordMessageDiv.textContent = 'Password cannot be empty.';
      passwordMessageDiv.className = 'text-danger';
      return;
    }

    try {
      const response = await fetch('/api/profile/password/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: targetUserId, // Send targetUserId if admin, otherwise it will be authenticatedUserId
          newPassword: newPassword
        }),
      });

      const result = await response.json();
      if (result.success) {
        passwordMessageDiv.textContent = result.message;
        passwordMessageDiv.className = 'text-success';
        newPasswordInput.value = ''; // Clear password field on success
      } else {
        passwordMessageDiv.textContent = result.message || 'Failed to change password.';
        passwordMessageDiv.className = 'text-danger';
      }
    } catch (error) {
      console.error('Error changing password:', error);
      passwordMessageDiv.textContent = 'An error occurred while changing password.';
      passwordMessageDiv.className = 'text-danger';
    }
  });
});