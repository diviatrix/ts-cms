import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import { RecordsAPI, AuthAPI } from '../../core/api-client.js';
import { DownloadUtils } from '../../utils/download-utils.js';
import { BasePageController } from './base-page-controller.js';

export default class RecordDisplayController extends BasePageController {
  constructor(app) {
    super();
    this.app = app;
    this.container = document.getElementById('record-container');
    this.recordsAPI = RecordsAPI;
    this.authAPI = AuthAPI;
    this.recordId = this.getRecordIdFromUrl();
    
    this.init();
  }

  getRecordElements() {
    return {
      editButton: document.getElementById('editRecordButton'),
      downloadButton: document.getElementById('downloadRecordButton')
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
    await this.safeApiCall(
      () => this.recordsAPI.getById(this.recordId),
      {
        successCallback: (data) => {
          this.displayRecord(data);
          this.setupAdminFeatures(data);
        },
        errorCallback: (response) => {
          this.handleRecordLoadError(response);
        }
      }
    );
  }

  handleRecordLoadError(response) {
    if (response.errors?.some(err => err.includes('not found'))) {
      this.showRecordNotFound('The requested record does not exist.');
    } else {
      this.showRecordError(response.message || 'An error occurred while loading the record.');
    }
  }

  displayRecord(record) {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="meta-row mb-2">
        <a id="editRecordButton" class="btn hidden" href="#">Edit</a>
        <a id="downloadRecordButton" class="btn hidden" href="#">Download</a>
      </div>
      <div class="card">
        <div class="card-body">
          <h1 class="card-title">${record.title}</h1>
          <div class="meta-row">
            <span>${record.created_at ? new Date(record.created_at).toLocaleDateString() : ''}</span>
            ${record.public_name ? `<span>By ${record.public_name}</span>` : ''}
          </div>
          ${record.image_url ? `<img class="record-image" src="${record.image_url}" alt="${record.title}" />` : ''}
          ${record.description ? `<div class="card-subtitle">${record.description}</div>` : ''}
          <div class="card-text">${marked.parse(record.content || '')}</div>
        </div>
      </div>
    `;
    
    // Setup features after DOM update
    setTimeout(() => {
      this.setupDownloadFeature(record);
      this.setupAdminFeatures(record);
    }, 0);
  }

  setupAdminFeatures(record) {
    if (!this.isUserAdmin()) return;
    
    const editButton = document.getElementById('editRecordButton');
    if (editButton) {
      editButton.classList.remove('hidden');
      editButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `/record-editor?id=${record.id}`;
      });
    }
  }

  setupDownloadFeature(record) {
    if (!this.app.user.isAuthenticated) return;
    
    const downloadButton = document.getElementById('downloadRecordButton');
    if (downloadButton) {
      downloadButton.classList.remove('hidden');
      downloadButton.addEventListener('click', () => {
        DownloadUtils.downloadAsMarkdown(record.title, record.content);
      });
    }
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
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="alert ${alertClass}">
        <h4>${title}</h4>
        <p>${description}</p>
        <a href="/" class="btn">Go to Homepage</a>
      </div>
    `;
  }
}