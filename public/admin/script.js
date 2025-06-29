import { handleAuthError } from '../js/auth-redirect.js';

document.addEventListener('DOMContentLoaded', function() {
  const userList = document.getElementById('userList');
  const profileEditTab = document.getElementById('profileEditTab');
  const adminProfileInfo = document.getElementById('adminProfileInfo');
  const adminMessageDiv = document.getElementById('adminMessageDiv');
  const adminServerAnswerTextarea = document.getElementById('adminServerAnswerTextarea');

  const recordList = document.getElementById('recordList');
  const recordEditTab = document.getElementById('recordEditTab');
  const recordInfo = document.getElementById('recordInfo');
  const recordTitle = document.getElementById('recordTitle');
  const recordDescription = document.getElementById('recordDescription');
  const recordContent = document.getElementById('recordContent');
  const recordTags = document.getElementById('recordTags');
  const recordCategories = document.getElementById('recordCategories');
  const recordIsPublished = document.getElementById('recordIsPublished');
  const recordMessageDiv = document.getElementById('recordMessageDiv');
  const newRecordButton = document.getElementById('newRecordButton');
  const recordSaveButton = document.getElementById('recordSaveButton');
  const recordDeleteButton = document.getElementById('recordDeleteButton');

  // Tab switching logic
  const usersTabBtn = document.getElementById('users-tab');
  const recordsTabBtn = document.getElementById('records-tab');

  usersTabBtn.addEventListener('shown.bs.tab', function (event) {
    fetchUsers();
  });

  recordsTabBtn.addEventListener('shown.bs.tab', function (event) {
    fetchRecords();
  });

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

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (handleAuthError(response)) return; // Centralized error handling

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
  async function displayUserProfile(user) {
    console.log('displayUserProfile: user object:', user); // Added log
    profileEditTab.classList.remove('d-none');
    adminServerAnswerTextarea.value = JSON.stringify(user, null, 2);
    adminProfileInfo.dataset.currentUserId = user.base.id; // Use user.base.id
    adminMessageDiv.textContent = '';
    adminMessageDiv.classList.remove('text-success', 'text-danger');
  }

  // Function to fetch and display a single user's profile
  async function fetchUserProfile(userId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (handleAuthError(response)) return;

      if (!response.ok) {
        const errorData = await response.json();
        adminMessageDiv.textContent = `Error fetching user profile: ${errorData.message || response.status}`;
        adminMessageDiv.classList.add('text-danger');
        return;
      }

      const responseData = await response.json();
      console.log('fetchUserProfile: responseData object:', responseData); // Added log
      const user = responseData.data; // Extract the actual user data
      adminServerAnswerTextarea.value = JSON.stringify(user, null, 2);
      adminProfileInfo.dataset.currentUserId = user.base.id;

    } catch (error) {
      console.error('Error fetching user profile:', error);
      adminMessageDiv.textContent = 'An error occurred while fetching user profile.';
      adminMessageDiv.classList.add('text-danger');
    }
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

    let updatedData;
    try {
      const parsedData = JSON.parse(adminServerAnswerTextarea.value);
      updatedData = {
        user_id: userIdToUpdate,
        base: parsedData.base,
        profile: parsedData.profile
      };
    } catch (e) {
      console.error('Invalid JSON format:', e);
      adminMessageDiv.textContent = 'Invalid JSON format.';
      adminMessageDiv.classList.add('text-danger');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      console.log('adminSaveButton: result object:', result); // Added log
      adminServerAnswerTextarea.value = JSON.stringify(result, null, 2);
      if (result.success) {
        adminMessageDiv.textContent = result.message;
        adminMessageDiv.classList.remove('text-danger');
        adminMessageDiv.classList.add('text-success');
        // Instead of re-fetching all users, fetch only the updated user
        fetchUserProfile(userIdToUpdate);
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

  // Record functions
  async function fetchRecords() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        recordMessageDiv.textContent = 'Not authenticated. Please log in.';
        recordMessageDiv.classList.add('text-danger');
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/records', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (handleAuthError(response)) return;

      if (!response.ok) {
        const errorData = await response.json();
        recordMessageDiv.textContent = `Error fetching records: ${errorData.message || response.status}`;
        recordMessageDiv.classList.add('text-danger');
        return;
      }

      const records = await response.json();
      displayRecords(records);

    } catch (error) {
      console.error('Error fetching records:', error);
      recordMessageDiv.textContent = 'An error occurred while fetching records.';
      recordMessageDiv.classList.add('text-danger');
    }
  }

  function displayRecords(records) {
    recordList.innerHTML = '';
    if (records.length === 0) {
      recordList.innerHTML = '<li class="list-group-item">No records found.</li>';
      return;
    }
    records.forEach(record => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'list-group-item-action');
      listItem.textContent = record.title;
      listItem.dataset.recordId = record.id;
      listItem.addEventListener('click', () => displayRecordForEdit(record));
      recordList.appendChild(listItem);
    });
  }

  function displayRecordForEdit(record) {
    recordEditTab.classList.remove('d-none');
    recordInfo.dataset.currentRecordId = record.id || '';
    recordTitle.value = record.title || '';
    recordDescription.value = record.description || '';
    recordContent.value = record.content || '';
    recordTags.value = (record.tags && record.tags.join(', ')) || '';
    recordCategories.value = (record.categories && record.categories.join(', ')) || '';
    recordIsPublished.checked = record.is_published || false;
    recordMessageDiv.textContent = '';
    recordMessageDiv.classList.remove('text-success', 'text-danger');
  }

  newRecordButton.addEventListener('click', () => {
    recordEditTab.classList.remove('d-none');
    recordInfo.dataset.currentRecordId = ''; // Clear ID for new record
    recordTitle.value = '';
    recordDescription.value = '';
    recordContent.value = '';
    recordTags.value = '';
    recordCategories.value = '';
    recordIsPublished.checked = false;
    recordMessageDiv.textContent = '';
    recordMessageDiv.classList.remove('text-success', 'text-danger');
  });

  recordSaveButton.addEventListener('click', async () => {
    const recordId = recordInfo.dataset.currentRecordId;
    const token = localStorage.getItem('token');
    if (!token) {
      recordMessageDiv.textContent = 'Not authenticated. Please log in.';
      recordMessageDiv.classList.add('text-danger');
      window.location.href = '/login';
      return;
    }

    const recordData = {
      title: recordTitle.value,
      description: recordDescription.value,
      content: recordContent.value,
      tags: recordTags.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      categories: recordCategories.value.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0),
      is_published: recordIsPublished.checked,
      // authorId will be set on the backend based on the authenticated user
    };

    try {
      let response;
      if (recordId) {
        // Update existing record
        response = await fetch(`/api/records/${recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(recordData),
        });
      } else {
        // Create new record
        response = await fetch('/api/records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(recordData),
        });
      }

      const result = await response.json();
      if (response.ok) {
        recordMessageDiv.textContent = `Record saved successfully!`;
        recordMessageDiv.classList.remove('text-danger');
        recordMessageDiv.classList.add('text-success');
        fetchRecords(); // Refresh the list
        if (!recordId && result.id) { // If new record, set its ID for further edits
          recordInfo.dataset.currentRecordId = result.id;
        }
      } else {
        recordMessageDiv.textContent = `Failed to save record: ${result.message || response.statusText}`;
        recordMessageDiv.classList.remove('text-success');
        recordMessageDiv.classList.add('text-danger');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      recordMessageDiv.textContent = 'An error occurred while saving the record.';
      recordMessageDiv.classList.remove('text-success');
      recordMessageDiv.classList.add('text-danger');
    }
  });

  recordDeleteButton.addEventListener('click', async () => {
    const recordId = recordInfo.dataset.currentRecordId;
    if (!recordId) {
      recordMessageDiv.textContent = 'No record selected for deletion.';
      recordMessageDiv.classList.add('text-danger');
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      recordMessageDiv.textContent = 'Not authenticated. Please log in.';
      recordMessageDiv.classList.add('text-danger');
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        recordMessageDiv.textContent = 'Record deleted successfully!';
        recordMessageDiv.classList.remove('text-danger');
        recordMessageDiv.classList.add('text-success');
        recordEditTab.classList.add('d-none'); // Hide edit form
        fetchRecords(); // Refresh the list
      } else {
        const errorData = await response.json();
        recordMessageDiv.textContent = `Failed to delete record: ${errorData.message || response.statusText}`;
        recordMessageDiv.classList.remove('text-success');
        recordMessageDiv.classList.add('text-danger');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      recordMessageDiv.textContent = 'An error occurred while deleting the record.';
      recordMessageDiv.classList.remove('text-success');
      recordMessageDiv.classList.add('text-danger');
    }
  });

  // Initial fetches based on active tab
  // This assumes the users tab is active by default
  fetchUsers();

  // Function to check URL for record ID and open for edit
  async function checkUrlForRecordId() {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
    const editRecordId = params.get('editRecordId');

    if (editRecordId) {
      // Activate the records tab
      const recordsTab = new bootstrap.Tab(recordsTabBtn);
      recordsTab.show();

      // Wait for the tab content to be shown before fetching the record
      recordsTabBtn.addEventListener('shown.bs.tab', async () => {
        try {
          const response = await fetch(`/api/records/${editRecordId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const record = await response.json();
          displayRecordForEdit(record);
        } catch (error) {
          console.error('Error fetching record for edit:', error);
          recordMessageDiv.textContent = 'Failed to load record for editing.';
          recordMessageDiv.classList.add('text-danger');
        }
      }, { once: true }); // Use { once: true } to remove the listener after it fires
    }
  }

  // Call the function on page load
  checkUrlForRecordId();
});
