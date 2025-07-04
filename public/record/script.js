import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsAPI, AuthAPI } from '../js/api-client.js';
import { BasePageController } from '../js/shared-components.js';
import { jwtDecode } from '../js/jwt-decode.js';
import { messages } from '../js/ui-utils.js';

/**
 * Record Display Controller
 * Handles individual record display with admin edit functionality
 */
class RecordDisplayController extends BasePageController {
  constructor() {
    // Create message display for user feedback
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mt-3';
    document.querySelector('.container').insertBefore(messageDiv, document.querySelector('.card'));
    
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
      editButton: document.getElementById('editRecordButton')
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
    this.elements.title.textContent = record.title;
    this.elements.description.textContent = record.description;
    this.elements.content.innerHTML = marked.parse(record.content);
    this.elements.author.textContent = record.public_name;
    this.elements.date.textContent = new Date(record.created_at).toLocaleDateString();
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
    this.elements.title.textContent = 'Record Not Found';
    this.elements.description.textContent = description;
    messages.error('Record not found: ' + description, { toast: true });
  }

  /**
   * Show record error message
   */
  showRecordError(description) {
    this.elements.title.textContent = 'Error Loading Record';
    this.elements.description.textContent = description;
  }

  /**
   * Show network error message
   */
  showNetworkError() {
    this.elements.title.textContent = 'Network Error';
    this.elements.description.textContent = 'Unable to load the record. Please check your connection and try again.';
  }
}

// Initialize the record display controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new RecordDisplayController();
});