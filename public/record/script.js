import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsAPI, AuthAPI } from '../js/api-client.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { DownloadUtils } from '../js/utils/download-utils.js';
import { setImagePreview } from '../js/utils/image-preview.js';

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
    const contentContainer = document.getElementById('contentContainer');

    if (contentContainer) {
      contentContainer.classList.remove('hidden');
    }

    if (this.elements.title) {
      this.elements.title.textContent = record.title;
    }
    if (this.elements.description) {
      this.elements.description.textContent = record.description;
    }
    if (this.elements.content) {
      this.elements.content.innerHTML = `
        <div class="card-body">
          <div class="px-4 py-3">
            ${marked.parse(record.content)}
          </div>
        </div>
      `;
    }
    setImagePreview(this.elements.imagePreview, record.image_url, record.title);
    if (this.elements.author) {
      this.elements.author.textContent = record.public_name;
    }
    if (this.elements.date) {
      this.elements.date.textContent = new Date(record.created_at).toLocaleDateString();
    }
    
    // Setup download feature for authenticated users
    this.setupDownloadFeature(record);
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
    if (!this.authAPI.isAuthenticated(messages)) {
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
    if (!this.authAPI.isAuthenticated(messages)) {
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
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.innerHTML = `
        <div class="alert alert-warning">
          <h4>Record Not Found</h4>
          <p>${description}</p>
          <a href="/frontpage/" class="btn btn-primary">Go to Homepage</a>
        </div>
      `;
    }
  }

  /**
   * Show record error message
   */
  showRecordError(description) {
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.innerHTML = `
        <div class="alert alert-danger">
          <h4>Error Loading Record</h4>
          <p>${description}</p>
          <a href="/frontpage/" class="btn btn-primary">Go to Homepage</a>
        </div>
      `;
    }
  }

  /**
   * Show network error message
   */
  showNetworkError() {
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.innerHTML = `
        <div class="alert alert-danger">
          <h4>Network Error</h4>
          <p>Unable to connect to the server. Please check your internet connection and try again.</p>
          <a href="/frontpage/" class="btn btn-primary">Go to Homepage</a>
        </div>
      `;
    }
  }
}



// If there is a controller or main logic, wrap in:
document.addEventListener('navigationLoaded', () => { new RecordDisplayController(); });