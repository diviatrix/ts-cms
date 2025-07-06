import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsAPI, AuthAPI } from '../js/api-client.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { messages } from '../js/ui-utils.js';
import { DownloadUtils } from '../js/utils/download-utils.js';
import { initResponseLog } from '/js/shared-components/response-log-init.js';

/**
 * Record Display Controller
 * Handles individual record display with admin edit functionality
 */
class RecordDisplayController extends BasePageController {
  constructor() {
    // Create message display for user feedback
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mt-3';
    const container = document.querySelector('.container');
    
    // Find the row that contains the card
    const row = container.querySelector('.row');
    if (row) {
      // Insert message div at the beginning of the row
      row.insertBefore(messageDiv, row.firstChild);
    } else {
      // Fallback: append to container
      container.appendChild(messageDiv);
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
      downloadButton: document.getElementById('downloadRecordButton')
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

    // Admin check and log init after async work
    let isAdmin = false;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        isAdmin = decoded?.roles?.includes('admin');
      }
    } catch {}
    if (isAdmin) {
      initResponseLog();
    }
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
      this.errorHandler.handleNetworkError(error, this.message);
    }
  }

  /**
   * Handle record load error
   */
  handleRecordLoadError(response) {
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
    if (this.elements.title) {
      this.elements.title.textContent = record.title;
    }
    if (this.elements.description) {
      this.elements.description.textContent = record.description;
    }
    if (this.elements.content) {
      // Create image HTML if image_url exists
      const imageHtml = record.image_url ? `
        <div class="text-center mb-4">
          <img src="${record.image_url}" 
               class="img-fluid rounded" 
               alt="${record.title}"
               style="max-height: 400px; object-fit: cover;"
               onerror="this.style.display='none'">
        </div>
      ` : '';

      // Preserve the card structure and add content with proper padding
      this.elements.content.innerHTML = `
        <div class="card-body">
          <div class="px-4 py-3">
            ${imageHtml}
            ${marked.parse(record.content)}
          </div>
        </div>
      `;
    }
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
    if (this.elements.title) {
      this.elements.title.textContent = 'Record Not Found';
    }
    if (this.elements.description) {
      this.elements.description.textContent = description;
    }
    messages.error('Record not found: ' + description, { toast: true });
  }

  /**
   * Show record error message
   */
  showRecordError(description) {
    if (this.elements.title) {
      this.elements.title.textContent = 'Error Loading Record';
    }
    if (this.elements.description) {
      this.elements.description.textContent = description;
    }
  }

  /**
   * Show network error message
   */
  showNetworkError() {
    if (this.elements.title) {
      this.elements.title.textContent = 'Network Error';
    }
    if (this.elements.description) {
      this.elements.description.textContent = 'Unable to load the record. Please check your connection and try again.';
    }
  }
}

// Initialize the record display controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new RecordDisplayController();
});