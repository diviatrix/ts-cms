document.addEventListener('DOMContentLoaded', function() {
  const userList = document.getElementById('userList');
  const profileEditTab = document.getElementById('profileEditTab');
  const adminProfileInfo = document.getElementById('adminProfileInfo');
  const adminMessageDiv = document.getElementById('adminMessageDiv');

  const adminEditButton = document.getElementById('adminEditButton');
  const adminSaveButton = document.getElementById('adminSaveButton');

  // Profile fields
  const adminProfileNameSpan = document.getElementById('admin_profile_name');
  const adminEditProfileNameInput = document.getElementById('admin_edit_profile_name');
  const adminProfileActiveSpan = document.getElementById('adminProfileActive');
  const adminEditProfileActiveInput = document.getElementById('admin_edit_profileActive');
  const adminProfileRolesSpan = document.getElementById('adminProfileRoles');
  const adminEditRolesInput = document.getElementById('admin_editRoles');
  const adminProfilePictureImg = document.getElementById('adminProfilePicture');
  const adminEditProfilePictureInput = document.getElementById('admin_editProfilePicture');
  const adminProfileBioSpan = document.getElementById('adminProfileBio');
  const adminEditBioTextarea = document.getElementById('admin_editBio');


  // Function to fetch the list of users from the backend
  async function fetchUsers() {
    try {
      console.log('Fetching users from backend...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found. Cannot fetch users.');
        adminMessageDiv.textContent = 'Not authenticated. Please log in.';
        adminMessageDiv.classList.add('text-danger');
        // Redirect to login if no token
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

      console.log('Fetch users response received:', response);

      if (response.status === 401) {
        // Handle unauthorized access (e.g., token expired or invalid)
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching users:', response.status, errorData);
        adminMessageDiv.textContent = `Error fetching users: ${errorData.message || response.status}`;
        adminMessageDiv.classList.add('text-danger');
        return;
      }

      const users = await response.json();
      console.log('Users fetched from backend:', users);
      displayUsers(users);

    } catch (error) {
      console.error('Error fetching users:', error);
      adminMessageDiv.textContent = 'An error occurred while fetching users.';
      adminMessageDiv.classList.add('text-danger');
    }
  }

  // Function to display users in the list
  function displayUsers(users) {
    userList.innerHTML = ''; // Clear the current list
    if (users.length === 0) {
        userList.innerHTML = '<li class="list-group-item">No users found.</li>';
        return;
    }
    users.forEach(user => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'list-group-item-action');
      listItem.textContent = user.public_name;
      listItem.dataset.userId = user.id; // Store user ID in data attribute
      listItem.addEventListener('click', () => displayUserProfile(user));
      userList.appendChild(listItem);
    });
  }

  // Function to display selected user's profile
  function displayUserProfile(user) {
    console.log('Displaying profile for user:', user.public_name);
    // Show the profile edit tab
    profileEditTab.classList.remove('d-none');

    // Populate the profile fields (read-only initially)
    adminProfileNameSpan.textContent = user.public_name || '';
    adminProfileActiveSpan.textContent = user.is_active ? 'Yes' : 'No';
     try {
         const rolesArray = JSON.parse(user.roles || '[]');
         adminProfileRolesSpan.textContent = rolesArray.map(role => role.name).join(', ');
     } catch (e) {
         console.error('Error parsing roles JSON:', e);
         adminProfileRolesSpan.textContent = 'Invalid roles format';
     }
    adminProfilePictureImg.src = user.profile_picture_url || '';
    adminProfileBioSpan.textContent = user.bio || '';

    // Hide edit inputs and show display spans
    adminEditProfileNameInput.classList.add('d-none');
    adminProfileNameSpan.classList.remove('d-none');
    adminEditProfileActiveInput.classList.add('d-none');
    adminProfileActiveSpan.classList.remove('d-none');
    adminEditRolesInput.classList.add('d-none');
    adminProfileRolesSpan.classList.remove('d-none');
    adminEditProfilePictureInput.classList.add('d-none');
    adminProfilePictureImg.classList.remove('d-none');
    adminEditBioTextarea.classList.add('d-none');
    adminProfileBioSpan.classList.remove('d-none');

    // Hide save button, show edit button
    adminSaveButton.classList.add('d-none');
    adminEditButton.classList.remove('d-none');

    // Clear any previous messages
    adminMessageDiv.textContent = '';
    adminMessageDiv.classList.remove('text-success', 'text-danger');

    // Store the current user ID for saving
    adminProfileInfo.dataset.currentUserId = user.id;
  }

  // Event listener for the Admin Edit button
  adminEditButton.addEventListener('click', function() {
     console.log('Admin Edit button clicked.');
     // Hide Edit button, show Save button
     adminEditButton.classList.add('d-none');
     adminSaveButton.classList.remove('d-none');

     // Show edit inputs and hide display spans
     adminProfileNameSpan.classList.add('d-none');
     adminEditProfileNameInput.classList.remove('d-none');
     adminEditProfileNameInput.value = adminProfileNameSpan.textContent;

     adminProfileActiveSpan.classList.add('d-none');
     adminEditProfileActiveInput.classList.remove('d-none');
     adminEditProfileActiveInput.value = adminProfileActiveSpan.textContent === 'Yes' ? 'true' : 'false'; // Populate with boolean value

     adminProfileRolesSpan.classList.add('d-none');
     adminEditRolesInput.classList.remove('d-none');
     adminEditRolesInput.value = adminProfileRolesSpan.textContent;

     adminProfilePictureImg.classList.add('d-none');
     adminEditProfilePictureInput.classList.remove('d-none');
     adminEditProfilePictureInput.value = adminProfilePictureImg.src || '';

     adminProfileBioSpan.classList.add('d-none');
     adminEditBioTextarea.classList.remove('d-none');
     adminEditBioTextarea.value = adminProfileBioSpan.textContent;
  });

  // Event listener for the Admin Save button
  adminSaveButton.addEventListener('click', async function() {
     console.log('Admin Save button clicked.');
     const userIdToUpdate = adminProfileInfo.dataset.currentUserId;
     if (!userIdToUpdate) {
       adminMessageDiv.textContent = 'No user selected for saving.';
       adminMessageDiv.classList.add('text-danger');
       return;
     }

     // Collect updated data from input fields
     const updatedProfileData = {
       id: userIdToUpdate, // Include user ID in the update data
       public_name: adminEditProfileNameInput.value.trim(),
       is_active: adminEditProfileActiveInput.value.toLowerCase() === 'true', // Convert 'true'/'false' string to boolean
       roles: JSON.stringify(adminEditRolesInput.value.split(',').map(role => ({ name: role.trim() }))),
       profile_picture_url: adminEditProfilePictureInput.value.trim(),
       bio: adminEditBioTextarea.value.trim(),
     };

      if (!updatedProfileData.public_name) {
        adminMessageDiv.textContent = 'Name cannot be empty.';
        adminMessageDiv.classList.add('text-danger');
        return;
      }

     // Revert fields to display mode (will be updated after re-fetching)
     adminEditProfileNameInput.classList.add('d-none');
     adminProfileNameSpan.classList.remove('d-none');
     adminEditProfileActiveInput.classList.add('d-none');
     adminProfileActiveSpan.classList.remove('d-none');
     adminEditRolesInput.classList.add('d-none');
     adminProfileRolesSpan.classList.remove('d-none');
     adminEditProfilePictureInput.classList.add('d-none');
     adminProfilePictureImg.classList.remove('d-none');
     adminEditBioTextarea.classList.add('d-none');
     adminProfileBioSpan.classList.remove('d-none');

     // Hide Save button, show Edit button
     adminSaveButton.classList.add('d-none');
     adminEditButton.classList.remove('d-none');


     try {
       const token = localStorage.getItem('token');
       const response = await fetch('/api/admin/updateProfile', { // Example endpoint
         method: 'POST', // Or PUT
         headers: {
           'Content-Type': 'application/json',
 'Authorization': `Bearer ${token}`,
         },
         body: JSON.stringify(updatedProfileData),
       });
       const result = await response.json();
       if (result.success) {
         adminMessageDiv.textContent = result.message;
         adminMessageDiv.classList.remove('text-danger');
         adminMessageDiv.classList.add('text-success');
         // Re-fetch users to update the displayed list and profile
         fetchUsers(); // Re-fetch users after a successful update
       } else {
         adminMessageDiv.textContent = 'Failed to update profile: ' + result.message;
         adminMessageDiv.classList.remove('text-success');
         adminMessageDiv.classList.add('text-danger');
       }
     } catch (error) {
       console.error('Error updating user profile:', error);
       adminMessageDiv.textContent = 'An error occurred while updating profile.';
       adminMessageDiv.classList.remove('text-success');
       adminMessageDiv.classList.add('text-danger');
     }
  });


  // Fetch users when the page loads
  fetchUsers();
});
