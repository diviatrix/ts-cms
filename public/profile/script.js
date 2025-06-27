document.addEventListener('DOMContentLoaded', function() {
  const messageDiv = document.getElementById('messageDiv');
  const profileBlock = document.getElementById('profileBlock');
  const responseBox = document.getElementById('responseBox');
  const fetchButton = document.getElementById('fetchButton');

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

      const data = await response.json();
      responseBox.value = JSON.stringify(data, null, 2);
      messageDiv.textContent = '';
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
});
