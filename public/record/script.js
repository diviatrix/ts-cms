import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsAPI } from '../js/api-core.js';
import { AuthAPI } from '../js/api-auth.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { messages } from '../js/ui-utils.js';
import { DownloadUtils } from '../js/utils/download-utils.js';
import { setImagePreview } from '../js/utils/image-preview.js';
import { messageSystem } from '../js/utils/message-system.js';
import { initMessageContainer } from '../js/shared-components/message-container.js';

/**
 * Record Display Controller
 * Handles individual record display with admin edit functionality
 */
class RecordDisplayController extends BasePageController {
  constructor() {
    // Create message display for user feedback
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mt-3';
    const container = document.querySelector('.record-wrapper');
    
    if (container) {
      // Insert message div at the top of the record-wrapper
      container.insertBefore(messageDiv, container.firstChild);
    } else {
      // Fallback: append to body
      document.body.appendChild(messageDiv);
    }
    
    super({ messageDiv });
    
    this.elements = this.getRecordElements();
    this.recordsAPI = RecordsAPI;
    this.authAPI = AuthAPI;
    this.recordId = this.getRecordIdFromUrl();
    
    this.init();
  }

  /**
   * Get all record display elements
   */
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

  /**
   * Get record ID from URL parameters
   */
  getRecordIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  /**
   * Initialize the record display
   */
  async init() {
    if (!this.recordId) {
      this.showRecordNotFound('No record ID provided.');
      return;
    }

    await this.loadAndDisplayRecord();
  }

  /**
   * Load and display the record
   */
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
      messages.showError('Error: ' + (error?.message || error?.toString()));
    }
  }

  /**
   * Handle record load error
   */
  handleRecordLoadError(response) {
    // Hide loading container
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }

    if (response.errors?.some(err => err.includes('not found'))) {
      this.showRecordNotFound('The requested record does not exist.');
    } else {
      this.showRecordError(response.message || 'An error occurred while loading the record.');
    }
    this.message.showApiResponse(response);
  }

  /**
   * Display the record content
   */
  displayRecord(record) {
    // Hide loading container and show content container
    const loadingContainer = document.getElementById('loadingContainer');
    const contentContainer = document.getElementById('contentContainer');
    
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
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

  /**
   * Setup admin-specific features
   */
  setupAdminFeatures(record) {
    if (!this.isUserAdmin()) {
      return;
    }

    this.elements.editButton.classList.remove('d-none');
    this.elements.editButton.addEventListener('click', () => {
      this.handleEditRecord(record.id);
    });
  }

  /**
   * Setup download functionality for all authenticated users
   */
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

  /**
   * Handle record download as markdown
   */
  handleRecordDownload(record) {
    DownloadUtils.downloadAsMarkdown(record.title, record.content);
  }

  /**
   * Check if current user is admin
   */
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

  /**
   * Handle edit record action
   */
  handleEditRecord(recordId) {
    window.location.href = `/admin#records?editRecordId=${recordId}`;
  }

  /**
   * Show record not found message
   */
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

document.addEventListener('DOMContentLoaded', () => {
    initMessageContainer();
    new RecordDisplayController();
});