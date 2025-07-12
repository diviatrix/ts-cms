import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsAPI, AuthAPI } from '../js/api-client.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { DownloadUtils } from '../../utils/download-utils.js';
import { setImagePreview } from '../../utils/image-preview.js';

class RecordDisplayController extends BasePageController {
  constructor() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mt-3';
    const container = document.querySelector('.record-wrapper');
    
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);
    } else {
      document.body.appendChild(messageDiv);
    }
    
    super({ messageDiv });
    
    this.elements = this.getRecordElements();
    this.recordsAPI = RecordsAPI;
    this.authAPI = AuthAPI;
    this.recordId = this.getRecordIdFromUrl();
    
    this.init();
  }

  getRecordElements() {
    return {
      title: document.getElementById('recordTitle'),
      description: document.getElementById('recordDescription'),
      content: document.getElementById('recordContent'),
      author: document.getElementById('recordAuthor'),
      date: document.getElementById('recordDate'),
      editButton: document.getElementById('editRecordButton'),
      downloadButton: document.getElementById('downloadRecordButton'),
      imagePreview: document.getElementById('recordImagePreview')
    };
  }

  getRecordIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  async init() {
    if (!this.recordId) {
      this.showRecordNotFound('No record ID provided.');
      return;
    }

    await this.loadAndDisplayRecord();
  }

  async loadAndDisplayRecord() {
    try {
      const response = await this.recordsAPI.getById(this.recordId);
      
      if (!response.success) {
        this.handleRecordLoadError(response);
        return;
      }

      this.displayRecord(response.data);
      this.setupAdminFeatures(response.data);

    } catch (error) {
      console.error('Error fetching record:', error);
      this.showNetworkError();
    }
  }

  handleRecordLoadError(response) {
    if (response.errors?.some(err => err.includes('not found'))) {
      this.showRecordNotFound('The requested record does not exist.');
    } else {
      this.showRecordError(response.message || 'An error occurred while loading the record.');
    }
    this.message.showApiResponse(response);
  }

  displayRecord(record) {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) loadingContainer.style.display = 'none';
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.style.display = '';
      // Build a modern card layout for the record
      contentContainer.innerHTML = `
        <div class="card record-card">
          <div class="card-body">
            <h1 class="card-title" id="recordTitle">${record.title}</h1>
            <div class="mb-2 text-muted" id="recordDate">${record.created_at ? new Date(record.created_at).toLocaleDateString() : ''}</div>
            ${record.image_url ? `<img id="recordImagePreview" class="card-image mb-3" src="${record.image_url}" alt="${record.title}" />` : ''}
            <div class="mb-3" id="recordDescription">${record.description || ''}</div>
            <div id="recordContent">${marked.parse(record.content || '')}</div>
            <div class="mt-3">
              ${record.tags && record.tags.length ? `<span class="me-2">Tags:</span>${record.tags.map(tag => `<span class='badge bg-secondary me-1'>${tag}</span>`).join('')}` : ''}
              ${record.categories && record.categories.length ? `<span class="ms-3 me-2">Categories:</span>${record.categories.map(cat => `<span class='badge bg-primary me-1'>${cat}</span>`).join('')}` : ''}
            </div>
            <div class="mt-3" id="recordAuthor">${record.public_name ? `By ${record.public_name}` : ''}</div>
            <div class="mt-4">
              <a id="editRecordButton" class="btn d-none" href="#">Edit</a>
              <a id="downloadRecordButton" class="btn d-none" href="#">Download</a>
            </div>
          </div>
        </div>
      `;
    }
    console.log('[Record] Displaying record:', record);
    // Re-acquire element references after innerHTML update
    this.elements = this.getRecordElements();
    if (this.elements.imagePreview) {
      setImagePreview(this.elements.imagePreview, record.image_url, record.title);
    }
    // Setup download feature for authenticated users
    this.setupDownloadFeature(record);
    // Setup admin features if user is admin
    this.setupAdminFeatures(record);
  }

  setupAdminFeatures(record) {
    if (!this.isUserAdmin()) {
      return;
    }

    this.elements.editButton.classList.remove('d-none');
    this.elements.editButton.addEventListener('click', () => {
      this.handleEditRecord(record.id);
    });
  }

  setupDownloadFeature(record) {
    if (!this.authAPI.isAuthenticated()) {
      return;
    }

    if (this.elements.downloadButton) {
      this.elements.downloadButton.classList.remove('d-none');
      this.elements.downloadButton.addEventListener('click', () => {
        this.handleRecordDownload(record);
      });
    }
  }

  handleRecordDownload(record) {
    DownloadUtils.downloadAsMarkdown(record.title, record.content);
  }

  isUserAdmin() {
    if (!this.authAPI.isAuthenticated()) {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      return decodedToken?.roles?.includes('admin') || false;
    } catch (error) {
      console.error('Error decoding token for admin check:', error);
      return false;
    }
  }

  handleEditRecord(recordId) {
    window.location.href = `/admin#records?editRecordId=${recordId}`;
  }

  showRecordNotFound(description) {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) loadingContainer.style.display = 'none';
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.style.display = '';
      contentContainer.innerHTML = `
        <div class="alert alert-warning">
          <h4>Record Not Found</h4>
          <p>${description}</p>
          <a href="/frontpage/" class="btn btn-primary">Go to Homepage</a>
        </div>
      `;
    }
    console.warn('[Record] Not found:', description);
  }

  /**
   * Show record error message
   */
  showRecordError(description) {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) loadingContainer.style.display = 'none';
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.style.display = '';
      contentContainer.innerHTML = `
        <div class="alert alert-danger">
          <h4>Error Loading Record</h4>
          <p>${description}</p>
          <a href="/frontpage/" class="btn btn-primary">Go to Homepage</a>
        </div>
      `;
    }
    console.error('[Record] Error:', description);
  }

  /**
   * Show network error message
   */
  showNetworkError() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) loadingContainer.style.display = 'none';
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.style.display = '';
      contentContainer.innerHTML = `
        <div class="alert alert-danger">
          <h4>Network Error</h4>
          <p>Unable to connect to the server. Please check your internet connection and try again.</p>
          <a href="/frontpage/" class="btn btn-primary">Go to Homepage</a>
        </div>
      `;
    }
    console.error('[Record] Network error');
  }
}



// If there is a controller or main logic, wrap in:
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Record] RecordDisplayController initializing');
  new RecordDisplayController();
});