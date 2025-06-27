document.addEventListener('DOMContentLoaded', function() {
  const userList = document.getElementById('userList');
  const profileEditTab = document.getElementById('profileEditTab');
  const adminProfileInfo = document.getElementById('adminProfileInfo');
  const adminMessageDiv = document.getElementById('adminMessageDiv');
  const adminServerAnswerTextarea = document.getElementById('adminServerAnswerTextarea');

  // Function to fetch the list of users from the backend
  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        adminMessageDiv.textContent = 'Not authenticated. Please log in.';
        adminMessageDiv.classList.add('text-danger');
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/users', {
        method: 'GET',
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

      if (!response.ok) {
        const errorData = await response.json();
        adminMessageDiv.textContent = `Error fetching users: ${errorData.message || response.status}`;
        adminMessageDiv.classList.add('text-danger');
        return;
      }

      const answer = await response.json();
      const users = answer.data || [];
      displayUsers(users);

    } catch (error) {
      console.error('Error fetching users:', error);
      adminMessageDiv.textContent = 'An error occurred while fetching users.';
      adminMessageDiv.classList.add('text-danger');
    }
  }

  // Function to display users in the list
  function displayUsers(users) {
    userList.innerHTML = '';
    if (users.length === 0) {
      userList.innerHTML = '<li class="list-group-item">No users found.</li>';
      return;
    }
    users.forEach(user => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'list-group-item-action');
      listItem.textContent = user.base.login;
      listItem.dataset.login = user.base.login;
      listItem.addEventListener('click', () => displayUserProfile(user));
      userList.appendChild(listItem);
    });
  }

  // Function to display selected user's profile (just show server answer)
  function displayUserProfile(user) {
    profileEditTab.classList.remove('d-none');
    adminServerAnswerTextarea.value = JSON.stringify(user, null, 2);
    adminProfileInfo.dataset.currentUserId = user.id;
    adminMessageDiv.textContent = '';
    adminMessageDiv.classList.remove('text-success', 'text-danger');
  }

  // Save button: send textarea value to server, show server answer in textarea
  const adminSaveButton = document.getElementById('adminSaveButton');
  adminSaveButton.addEventListener('click', async function() {
    const userIdToUpdate = adminProfileInfo.dataset.currentUserId;
    if (!userIdToUpdate) {
      adminMessageDiv.textContent = 'No user selected for saving.';
      adminMessageDiv.classList.add('text-danger');
      return;
    }

    let updatedProfileData;
    try {
      updatedProfileData = JSON.parse(adminServerAnswerTextarea.value);
    } catch (e) {
      console.error('Invalid JSON format:', e);
      adminMessageDiv.textContent = 'Invalid JSON format.';
      adminMessageDiv.classList.add('text-danger');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProfileData),
      });
      const result = await response.json();
      adminServerAnswerTextarea.value = JSON.stringify(result, null, 2);
      if (result.success) {
        adminMessageDiv.textContent = result.message;
        adminMessageDiv.classList.remove('text-danger');
        adminMessageDiv.classList.add('text-success');
        fetchUsers();
      } else {
        adminMessageDiv.textContent = 'Failed to update profile: ' + result.message;
        adminMessageDiv.classList.remove('text-success');
        adminMessageDiv.classList.add('text-danger');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      adminMessageDiv.textContent = 'An error occurred while updating profile.';
      adminMessageDiv.classList.remove('text-success');
      adminMessageDiv.classList.add('text-danger');
    }
  });

  fetchUsers();
});
