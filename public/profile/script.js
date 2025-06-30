import { ProfileAPI, AuthAPI } from '../js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler } from '../js/ui-utils.js';

document.addEventListener('DOMContentLoaded', function() {
  const messageDiv = document.getElementById('messageDiv');
  const profileBlock = document.getElementById('profileBlock');
  const responseBox = document.getElementById('responseBox');
  const fetchButton = document.getElementById('fetchButton');
  const saveButton = document.getElementById('saveButton');

  // Create message display
  const message = new MessageDisplay(messageDiv);

  // Check for token on page load
  if (!AuthAPI.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }
  profileBlock.classList.remove('d-none');

  // Fetch and display JSON server answer in textbox
  async function fetchProfile() {
    try {
      message.hide();
      loadingManager.setLoading(fetchButton, true, 'Loading...');
      
      const response = await ProfileAPI.get();
      
      if (!response.success) {
        ErrorHandler.handleApiError(response, message);
        responseBox.value = '';
        return;
      }

      responseBox.value = JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error('Error fetching profile:', error);
      ErrorHandler.handleNetworkError(error, message);
      responseBox.value = '';
    } finally {
      loadingManager.setLoading(fetchButton, false);
    }
  }

  // Fetch on load
  fetchProfile();

  // Optional: Add a button to re-fetch
  if (fetchButton) {
    fetchButton.addEventListener('click', function() {
      fetchProfile();
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
        message.showError('Invalid JSON format.');
        return;
      }

      try {
        loadingManager.setLoading(saveButton, true, 'Saving...');
        
        const response = await ProfileAPI.update({ profile: updatedData });
        
        message.showApiResponse(response);
        
        if (response.success) {
          fetchProfile(); // Refresh profile after successful update
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        ErrorHandler.handleNetworkError(error, message);
      } finally {
        loadingManager.setLoading(saveButton, false);
      }
    });
  }
});
