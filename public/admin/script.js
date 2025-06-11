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


  // Function to fetch the list of users (placeholder - simulates backend)
  async function fetchUsers() {
    try {
      console.log('Fetching users (simulated)...');
      // Simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const dummyUsers = [
        { id: 'user1', public_name: 'Alice', is_active: true, roles: '[{"name":"user"}]', profile_picture_url: '/img/placeholder_square.png', bio: 'A regular user.' },
        { id: 'user2', public_name: 'Bob', is_active: false, roles: '[{"name":"user"}, {"name":"editor"}]', profile_picture_url: '/img/placeholder_square.png', bio: 'An editor user.' },
        { id: 'user3', public_name: 'Charlie', is_active: true, roles: '[{"name":"user"}, {"name":"admin"}]', profile_picture_url: '/img/placeholder_square.png', bio: 'An admin user.' },
      ];

      console.log('Simulated users fetched:', dummyUsers);
      displayUsers(dummyUsers);

    } catch (error) {
      console.error('Error fetching users (simulated):', error);
      adminMessageDiv.textContent = 'Error fetching users (simulated).';
      adminMessageDiv.classList.add('text-danger');
    }
  }

  // Function to display users in the list
  function displayUsers(users) {
    userList.innerHTML = ''; // Clear the current list
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
    const rolesArray = JSON.parse(user.roles || '[]');
    adminProfileRolesSpan.textContent = rolesArray.map(role => role.name).join(', ');
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
       // We'll need a backend endpoint for updating user profiles as admin
       // For now, let's simulate a successful update and re-fetch users
       console.log('Updating user profile (simulated):', updatedProfileData);
        adminMessageDiv.textContent = 'Profile updated successfully (simulated).';
        adminMessageDiv.classList.remove('text-danger');
        adminMessageDiv.classList.add('text-success');

       // In a real application, you would send a fetch request here:
       /*
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
         fetchUsers();
       } else {
         adminMessageDiv.textContent = 'Failed to update profile: ' + result.message;
         adminMessageDiv.classList.remove('text-success');
         adminMessageDiv.classList.add('text-danger');
       }
       */

        // Simulate re-fetching users after a short delay
        setTimeout(fetchUsers, 1000); // Simulate network delay
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
