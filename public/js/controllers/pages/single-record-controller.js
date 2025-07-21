import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsAPI, AuthAPI } from '../../core/api-client.js';
import { jwtDecode } from '../../utils/jwt-decode.js';
import { DownloadUtils } from '../../utils/download-utils.js';
import { setImagePreview } from '../../utils/image-preview.js';

export default class RecordDisplayController {
  constructor(app) {
    this.app = app;
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
  }

  displayRecord(record) {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) loadingContainer.style.display = 'none';
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.style.display = '';
      contentContainer.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h1 class="card-title">${record.title}</h1>
            <div class="meta-row">
              <span>${record.created_at ? new Date(record.created_at).toLocaleDateString() : ''}</span>
              ${record.public_name ? `<span>By ${record.public_name}</span>` : ''}
            </div>
            <img class="record-image" src="${record.image_url || '/img/placeholder-square.png'}" alt="${record.title}" onerror="this.src='/img/placeholder-square.png'" />
            ${record.description ? `<div class="card-subtitle">${record.description}</div>` : ''}
            <div class="card-text">${marked.parse(record.content || '')}</div>
            <div class="meta-row">
              <a id="editRecordButton" class="btn hidden" href="#">Edit</a>
              <a id="downloadRecordButton" class="btn hidden" href="#">Download</a>
            </div>
          </div>
        </div>
      `;
    }
    this.elements = this.getRecordElements();
    if (this.elements.imagePreview) {
      setImagePreview(this.elements.imagePreview, record.image_url, record.title);
    }
    this.setupDownloadFeature(record);
    this.setupAdminFeatures(record);
  }

  setupAdminFeatures(record) {
    if (!this.isUserAdmin()) return;
    
    this.elements.editButton.classList.remove('hidden');
    this.elements.editButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `/pages/records-manage-page.html?edit=${record.id}`;
    });
  }

  setupDownloadFeature(record) {
    if (!this.app.user.isAuthenticated) return;
    
    this.elements.downloadButton.classList.remove('hidden');
    this.elements.downloadButton.addEventListener('click', () => {
      DownloadUtils.downloadAsMarkdown(record.title, record.content);
    });
  }

  isUserAdmin() {
    return this.app.user.roles.includes('admin');
  }

  showRecordNotFound(description) {
    this.showMessage('Record Not Found', description, 'alert-warning');
  }

  showRecordError(description) {
    this.showMessage('Error Loading Record', description, 'alert-danger');
  }

  showNetworkError() {
    this.showMessage('Network Error', 'Unable to connect to the server. Please check your internet connection and try again.', 'alert-danger');
  }

  showMessage(title, description, alertClass) {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) loadingContainer.style.display = 'none';
    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
      contentContainer.classList.remove('hidden');
      contentContainer.style.display = '';
      contentContainer.innerHTML = `
        <div class="alert ${alertClass}">
          <h4>${title}</h4>
          <p>${description}</p>
          <a href="/" class="btn">Go to Homepage</a>
        </div>
      `;
    }
  }
}