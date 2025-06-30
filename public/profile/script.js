import { ProfileAPI, AuthAPI } from '../js/api-client.js';
import { MessageDisplay, loadingManager, ErrorHandler, errorHandler } from '../js/ui-utils.js';

// Make error handler available globally
window.errorHandler = errorHandler;

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
        errorHandler.handleApiError(response, message);
        responseBox.value = '';
        return;
      }

      responseBox.value = JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error('Error fetching profile:', error);
      errorHandler.handleNetworkError(error, message);
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

  // Add real-time JSON validation to textarea
  if (responseBox) {
    responseBox.addEventListener('input', function() {
      const jsonValidationDiv = document.getElementById('jsonValidation') || createJsonValidationDiv();
      
      try {
        const parsedData = JSON.parse(responseBox.value);
        jsonValidationDiv.innerHTML = '<div class="text-success small"><i class="fas fa-check-circle"></i> Valid JSON format</div>';
        saveButton.disabled = false;
      } catch (e) {
        jsonValidationDiv.innerHTML = `<div class="text-danger small"><i class="fas fa-exclamation-triangle"></i> Invalid JSON: ${e.message}</div>`;
        saveButton.disabled = true;
      }
    });
  }

  function createJsonValidationDiv() {
    const div = document.createElement('div');
    div.id = 'jsonValidation';
    div.className = 'mt-2';
    responseBox.parentNode.appendChild(div);
    return div;
  }

  // Save button: send textarea value to server
  if (saveButton) {
    saveButton.addEventListener('click', async function() {
      let parsedData;
      try {
        parsedData = JSON.parse(responseBox.value);
      } catch (e) {
        console.error('Invalid JSON format:', e);
        message.showError('Invalid JSON format. Please check the syntax and try again.');
        return;
      }

      // Extract the profile data from the API response format
      const profileData = parsedData.data || parsedData;

      // Structure the data correctly for the ProfileAPI - just send the profile data directly
      const updatedData = {
        profile: profileData
      };

      try {
        loadingManager.setLoading(saveButton, true, 'Saving...');
        
        const response = await ProfileAPI.update(updatedData);
        
        message.showApiResponse(response);
        
        if (response.success) {
          fetchProfile(); // Refresh profile after successful update
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        errorHandler.handleNetworkError(error, message);
      } finally {
        loadingManager.setLoading(saveButton, false);
      }
    });
  }
});
