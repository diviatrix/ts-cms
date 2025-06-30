import { RecordsAPI, AuthAPI } from '../js/api-client.js';
import { MessageDisplay, errorHandler } from '../js/ui-utils.js';
import { jwtDecode } from '../js/jwt-decode.js';

document.addEventListener('DOMContentLoaded', function() {
  const postsGrid = document.getElementById('postsGrid');
  
  // Create message display for user feedback
  const messageDiv = document.createElement('div');
  messageDiv.className = 'mt-3';
  messageDiv.id = 'frontpageMessages';
  
  // Find the appropriate container and insert the message div
  const container = document.querySelector('.container-fluid') || document.querySelector('.container');
  if (container && postsGrid) {
    const h1Element = container.querySelector('h1');
    if (h1Element) {
      // Insert after the h1 element
      h1Element.insertAdjacentElement('afterend', messageDiv);
    } else {
      // Fallback: insert before postsGrid
      postsGrid.parentElement.insertBefore(messageDiv, postsGrid);
    }
  }
  
  const message = new MessageDisplay(messageDiv);

  async function fetchAndRenderRecords() {
    try {
      const response = await RecordsAPI.getAll();
      
      if (!response.success) {
        console.error('Error fetching records:', response);
        postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
        message.showApiResponse(response);
        return;
      }
      
      // Hide any previous error messages on success
      message.hide();
      renderRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      postsGrid.innerHTML = '<p class="text-muted">Unable to load posts at this time.</p>';
      errorHandler.handleNetworkError(error, message);
    }
  }

  function renderRecords(records) {
    postsGrid.innerHTML = ''; // Clear existing posts
    if (records.length === 0) {
      postsGrid.innerHTML = '<p>No posts available yet.</p>';
      return;
    }

    // Adjust postsGrid class based on number of records
    if (records.length < 6) {
      postsGrid.className = 'row g-4 mt-4 justify-content-center'; // Center the single column
    } else {
      postsGrid.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mt-4'; // Default grid
    }

    const colClass = records.length < 6 ? 'col-12 col-md-8 col-lg-6' : 'col'; // Use 'col' for multi-column to let row-cols handle it

    let isAdmin = false;
    if (AuthAPI.isAuthenticated()) {
      try {
        const token = localStorage.getItem('token');
        const decodedToken = jwtDecode(token);
        if (decodedToken && decodedToken.roles && decodedToken.roles.includes('admin')) {
          isAdmin = true;
        }
      } catch (error) {
        console.error('Error decoding token for admin check:', error);
      }
    }

    records.forEach(record => {
      const postCardHtml = `
        <div class="${colClass} mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${record.title}</h5>
              <h6 class="card-subtitle mb-2 text-muted">${record.description}</h6>
              <p class="card-text">${record.content.substring(0, 150)}...</p>
            </div>
            <div class="card-footer d-flex justify-content-between align-items-center">
              <small class="neon-green-text">By ${record.public_name} on ${new Date(record.created_at).toLocaleDateString()}</small>
              <div class="d-flex">
                <a href="/record/index.html?id=${record.id}" class="btn btn-primary btn-sm">Read</a>
                <button class="btn btn-warning btn-sm ms-2 edit-record-btn ${isAdmin ? '' : 'd-none'}" data-record-id="${record.id}">Edit</button>
              </div>
            </div>
          </div>
        </div>
      `;
      postsGrid.insertAdjacentHTML('beforeend', postCardHtml);
    });

    // Add event listeners to edit buttons after they are added to the DOM
    if (isAdmin) {
      document.querySelectorAll('.edit-record-btn').forEach(button => {
        button.addEventListener('click', () => {
          const recordId = button.dataset.recordId;
          window.location.href = `/admin#records?editRecordId=${recordId}`;
        });
      });
    }
  }

  fetchAndRenderRecords();
});