document.addEventListener('DOMContentLoaded', function() {
  const messageDiv = document.getElementById('messageDiv');
  const profileBlock = document.getElementById('profileBlock');
  const responseBox = document.getElementById('responseBox');
  const fetchButton = document.getElementById('fetchButton');
  const saveButton = document.getElementById('saveButton');

  // Check for token on page load
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  profileBlock.classList.remove('d-none');

  // Fetch and display JSON server answer in textbox
  async function fetchProfile(token) {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const responseData = await response.json();
      if (responseData.success && responseData.data) {
        responseBox.value = JSON.stringify(responseData.data, null, 2);
      } else {
        messageDiv.textContent = responseData.message || 'Failed to fetch profile data.';
        messageDiv.classList.remove('text-success');
        messageDiv.classList.add('text-danger');
      }
      // messageDiv.textContent = ''; // Removed this line
    } catch (error) {
      console.error('Error fetching profile:', error);
      messageDiv.textContent = 'An error occurred while fetching profile.';
      messageDiv.classList.remove('text-success');
      messageDiv.classList.add('text-danger');
      responseBox.value = '';
    }
  }

  // Fetch on load
  fetchProfile(token);

  // Optional: Add a button to re-fetch
  if (fetchButton) {
    fetchButton.addEventListener('click', function() {
      fetchProfile(token);
    });
  }

  // Save button: send textarea value to server
  if (saveButton) {
    saveButton.addEventListener('click', async function() {
      let updatedData;
      try {
        updatedData = JSON.parse(responseBox.value);
      } catch (e) {
        console.error('Invalid JSON format:', e);
        messageDiv.textContent = 'Invalid JSON format.';
        messageDiv.classList.remove('text-success');
        messageDiv.classList.add('text-danger');
        return;
      }

      try {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ profile: updatedData }),
        });

        const result = await response.json();
        if (result.success) {
          messageDiv.textContent = result.message;
          messageDiv.classList.remove('text-danger');
          messageDiv.classList.add('text-success');
          fetchProfile(token); // Refresh profile after successful update
        } else {
          messageDiv.textContent = 'Failed to update profile: ' + result.message;
          messageDiv.classList.remove('text-success');
          messageDiv.classList.add('text-danger');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        messageDiv.textContent = 'An error occurred while updating profile.';
        messageDiv.classList.remove('text-success');
        messageDiv.classList.add('text-danger');
      }
    });
  }
});
