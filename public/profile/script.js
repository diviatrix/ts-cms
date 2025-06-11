document.addEventListener('DOMContentLoaded', function() {
  const messageDiv = document.getElementById('messageDiv');

  const profileBlock = document.getElementById('profileBlock');
  const editButton = document.getElementById('editButton');
  const saveButton = document.getElementById('saveButton');
  const profileRoles = document.getElementById('profileRoles');
  const profilePicture = document.getElementById('profilePicture');


  // Check for token on page load
  const token = localStorage.getItem('token');
  if (token) {
    // Verify the token (optional, but good practice)
    // For simplicity, we'll assume the token is valid and fetch the profile
    // A real application might have an API endpoint to verify tokens
    fetchProfile(token);
    profileBlock.classList.remove('d-none');

  } else {
    // If no token, redirect to login
    window.location.href = '/login';
  }

  // Function to fetch user profile
  async function fetchProfile(token) {
    console.log('fetchProfile function called');
    try {
      console.log('Token used in fetchProfile:', token); // Log token value
      const response = await fetch('/api/profile', {
        method: 'GET',
        // Adding 'no-cache' to ensure the browser doesn't use a cached response
        // while debugging, you might want to remove this in production
        // to allow for browser caching
        cache: 'no-cache',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile fetch response received:', response);
      console.log('Profile fetch response status:', response.status);
      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirect to login page
        return; // Stop further processing
      }
      console.log('Fetched profile data:', data);

      document.getElementById('profile_name').textContent = data.public_name;
      document.getElementById('profileActive').textContent = data.is_active ? 'Yes' : 'No';
      // Parse the roles JSON string into an array before mapping
      const rolesArray = JSON.parse(data.roles || '[]');
      profileRoles.textContent = rolesArray.map(role => role.name).join(', ');

      document.getElementById('editProfilePicture').value = data.profile_picture_url || '';
      document.getElementById('profilePicture').src = data.profile_picture_url || '';

      const profileNameElement = document.getElementById('profile_name');
      if (profileNameElement) {
        profileNameElement.textContent = data.public_name || '';
        console.log('Updated profile_name textContent:', profileNameElement.textContent);
      } else {
        console.error('Element with ID "profile_name" not found.');
      }

      document.getElementById('profileBio').textContent = data.bio;
      const profileBioElement = document.getElementById('profileBio');
      profileBioElement.textContent = data.bio || ''; // Update bio textContent
      console.log('Updated profileBio textContent:', profileBioElement.textContent);
      if (!response.ok) { // Handle non-200 responses from the API
        messageDiv.classList.add('text-danger');
      }
      console.log('Profile fetch process completed.');
    } catch (error) {
      messageDiv.textContent = 'An error occurred while fetching profile.';
      messageDiv.classList.remove('text-success');
      messageDiv.classList.add('text-danger');
    }
  }

  // Add event listener for the single 'Edit All' button
  editButton.addEventListener('click', function() {
    // Hide Edit button, show Save button
    editButton.classList.add('d-none');
    saveButton.classList.remove('d-none');

    // Make profile fields editable
    // Name
    document.getElementById('profile_name').classList.add('d-none');
    document.getElementById('edit_profile_name').classList.remove('d-none');
    document.getElementById('edit_profile_name').value = document.getElementById('profile_name').textContent;

    // Bio
    document.getElementById('profileBio').classList.add('d-none');
    document.getElementById('editBio').classList.remove('d-none');
    document.getElementById('editBio').value = document.getElementById('profileBio').textContent;

    // Profile Picture URL
    document.getElementById('profilePicture').classList.add('d-none');
    document.getElementById('editProfilePicture').classList.remove('d-none');
    // Note: For the picture URL, we are editing the text content of the input, not the image src directly yet
    document.getElementById('editProfilePicture').value = document.getElementById('profilePicture').src === 'https://7331-firebase-ts-cms-1749238566848.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev/' ? '' : document.getElementById('profilePicture').src;
    // Handle Active and Roles later
    // Roles
    document.getElementById('profileRoles').classList.add('d-none');
    document.getElementById('editRoles').classList.remove('d-none');
    document.getElementById('editRoles').value = document.getElementById('profileRoles').textContent; // Assuming roles are edited as a comma-separated string
  });

  // Add event listener for the 'Save' button
  saveButton.addEventListener('click', async function() {
    console.log('Save button clicked. Starting profile update process.');
    // Hide Save button, show Edit button
    saveButton.classList.add('d-none');
    editButton.classList.remove('d-none');

    // Collect updated data from input fields
    const updatedProfileData = {
      public_name: document.getElementById('edit_profile_name').value,
      bio: document.getElementById('editBio').value,
      profile_picture_url: document.getElementById('editProfilePicture').value,
      // Handle active later
      // Assuming roles are edited as a comma-separated string and need to be parsed back
      roles: JSON.stringify(document.getElementById('editRoles').value.split(',').map(role => ({ name: role.trim() }))),
    };

    if (!updatedProfileData.public_name.trim()) {
      messageDiv.textContent = 'Name cannot be empty.';
      messageDiv.classList.add('text-danger');
      return; // Stop the save process
    }

    // Revert fields to display mode
    // Name
    document.getElementById('edit_profile_name').classList.add('d-none');
    document.getElementById('profile_name').classList.remove('d-none');

    // Bio
    document.getElementById('editBio').classList.add('d-none');
    document.getElementById('profileBio').classList.remove('d-none');

    // Profile Picture URL
    document.getElementById('editProfilePicture').classList.add('d-none');
    document.getElementById('profilePicture').classList.remove('d-none');
    // Send API request to update the profile
    try {
      // Roles
      // Revert roles fields to display mode
      // Note: Displaying the updated roles will be handled by the fetchProfile call below
      document.getElementById('editRoles').classList.add('d-none');
      document.getElementById('profileRoles').classList.remove('d-none');

      console.log('Sending PUT request to /api/profile with data:', updatedProfileData);
      console.log('Using token:', token);

      const updateResponse = await fetch('/api/profile', {
        method: 'POST', // Assuming your backend update endpoint is POST
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfileData)
      });

      console.log('Update Profile Response:', updateResponse);
      const updateData = await updateResponse.json();

      if (updateData.success) {
        messageDiv.textContent = updateData.message;
        messageDiv.classList.remove('text-danger');
        messageDiv.classList.add('text-success');
        // Re-fetch profile to update displayed data after save
        fetchProfile(localStorage.getItem('token'));
        console.log('Profile updated successfully. Re-fetching profile.');
      } else {
        messageDiv.textContent = 'Failed to update profile: ' + updateData.message;
        messageDiv.classList.remove('text-success');
        messageDiv.classList.add('text-danger');
        console.error('Update Profile Error Data:', updateData);
      }
    } catch (error) {
      messageDiv.textContent = 'An error occurred while updating profile.';
      console.error('Error updating profile:', error);
      messageDiv.classList.remove('text-success');
      messageDiv.classList.add('text-danger');
    }
  });
});
