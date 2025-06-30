import { AdminAPI, ProfileAPI, RecordsAPI, AuthAPI } from '../js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler } from '../js/ui-utils.js';

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

  // Create message displays
  const adminMessage = new MessageDisplay(adminMessageDiv);
  const recordMessage = new MessageDisplay(recordMessageDiv);

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
      // Check authentication
      if (!AuthAPI.isAuthenticated()) {
        adminMessage.showError('Not authenticated. Please log in.');
        window.location.href = '/login';
        return;
      }

      adminMessage.hide();
      const response = await AdminAPI.getUsers();

      if (!response.success) {
        ErrorHandler.handleApiError(response, adminMessage);
        return;
      }

      const users = response.data || [];
      displayUsers(users);

    } catch (error) {
      console.error('Error fetching users:', error);
      ErrorHandler.handleNetworkError(error, adminMessage);
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
      adminMessage.hide();
      const response = await AdminAPI.getUserProfile(userId);

      if (!response.success) {
        ErrorHandler.handleApiError(response, adminMessage);
        return;
      }

      console.log('fetchUserProfile: responseData object:', response); // Added log
      const user = response.data; // Extract the actual user data
      adminServerAnswerTextarea.value = JSON.stringify(user, null, 2);
      adminProfileInfo.dataset.currentUserId = user.base.id;

    } catch (error) {
      console.error('Error fetching user profile:', error);
      ErrorHandler.handleNetworkError(error, adminMessage);
    }
  }

  // Save button: send textarea value to server, show server answer in textarea
  const adminSaveButton = document.getElementById('adminSaveButton');
  adminSaveButton.addEventListener('click', async function() {
    const userIdToUpdate = adminProfileInfo.dataset.currentUserId;
    if (!userIdToUpdate) {
      adminMessage.showError('No user selected for saving.');
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
      adminMessage.showError('Invalid JSON format.');
      return;
    }

    try {
      loadingManager.setLoading(adminSaveButton, true, 'Saving...');
      
      // Note: Using ProfileAPI.update for profile updates
      const response = await ProfileAPI.update(updatedData);
      
      console.log('adminSaveButton: result object:', response); // Added log
      adminServerAnswerTextarea.value = JSON.stringify(response, null, 2);
      
      adminMessage.showApiResponse(response);
      
      if (response.success) {
        // Instead of re-fetching all users, fetch only the updated user
        fetchUserProfile(userIdToUpdate);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      ErrorHandler.handleNetworkError(error, adminMessage);
    } finally {
      loadingManager.setLoading(adminSaveButton, false);
    }
  });

  // Record functions
  async function fetchRecords() {
    try {
      // Check authentication
      if (!AuthAPI.isAuthenticated()) {
        recordMessage.showError('Not authenticated. Please log in.');
        window.location.href = '/login';
        return;
      }

      recordMessage.hide();
      const response = await RecordsAPI.getAll();

      if (!response.success) {
        ErrorHandler.handleApiError(response, recordMessage);
        return;
      }

      displayRecords(response.data || []);

    } catch (error) {
      console.error('Error fetching records:', error);
      ErrorHandler.handleNetworkError(error, recordMessage);
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
    
    // Check authentication
    if (!AuthAPI.isAuthenticated()) {
      recordMessage.showError('Not authenticated. Please log in.');
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
      loadingManager.setLoading(recordSaveButton, true, 'Saving...');
      
      let response;
      if (recordId) {
        // Update existing record
        response = await RecordsAPI.update(recordId, recordData);
      } else {
        // Create new record
        response = await RecordsAPI.create(recordData);
      }

      recordMessage.showApiResponse(response);
      
      if (response.success) {
        fetchRecords(); // Refresh the list
        if (!recordId && response.data?.id) { // If new record, set its ID for further edits
          recordInfo.dataset.currentRecordId = response.data.id;
        }
      }
    } catch (error) {
      console.error('Error saving record:', error);
      ErrorHandler.handleNetworkError(error, recordMessage);
    } finally {
      loadingManager.setLoading(recordSaveButton, false);
    }
  });

  recordDeleteButton.addEventListener('click', async () => {
    const recordId = recordInfo.dataset.currentRecordId;
    if (!recordId) {
      recordMessage.showError('No record selected for deletion.');
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    // Check authentication
    if (!AuthAPI.isAuthenticated()) {
      recordMessage.showError('Not authenticated. Please log in.');
      window.location.href = '/login';
      return;
    }

    try {
      loadingManager.setLoading(recordDeleteButton, true, 'Deleting...');
      
      const response = await RecordsAPI.delete(recordId);
      
      recordMessage.showApiResponse(response);
      
      if (response.success) {
        recordEditTab.classList.add('d-none'); // Hide edit form
        fetchRecords(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      ErrorHandler.handleNetworkError(error, recordMessage);
    } finally {
      loadingManager.setLoading(recordDeleteButton, false);
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
          const response = await RecordsAPI.getById(editRecordId);
          if (!response.success) {
            ErrorHandler.handleApiError(response, recordMessage);
            return;
          }
          displayRecordForEdit(response.data);
        } catch (error) {
          console.error('Error fetching record for edit:', error);
          ErrorHandler.handleNetworkError(error, recordMessage);
        }
      }, { once: true }); // Use { once: true } to remove the listener after it fires
    }
  }

  // Call the function on page load
  checkUrlForRecordId();
});
