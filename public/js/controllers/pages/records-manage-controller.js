import { RecordsAPI } from '../../core/api-client.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';

export default class RecordsManageController extends BasePageController {
    constructor(app) {
        super();
        this.app = app;
        this.container = document.getElementById('records-manage-container');
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        this.render();
        await this.loadRecords();
    }

    render() {
        this.container.innerHTML = `
            <h2 class="page-title">Manage Records</h2>
            
            <div class="form-actions mb-2">
                <button class="btn" onclick="window.recordsManager.createNewRecord()">Create New Record</button>
                <a href="/admin" class="btn btn-secondary">Back to Admin</a>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <h3 class="card-title">Records List</h3>
                    <div id="recordsList">Loading...</div>
                </div>
            </div>
        `;
        
        window.recordsManager = this;
    }

    async loadRecords() {
        await this.safeApiCall(
            () => RecordsAPI.getAll(),
            {
                successCallback: (data) => this.renderRecordsList(data),
                errorCallback: () => {
                    document.getElementById('recordsList').innerHTML = '<p class="alert alert-danger">Failed to load records</p>';
                }
            }
        );
    }

    renderRecordsList(records) {
        const container = document.getElementById('recordsList');
        if (!records.length) {
            container.innerHTML = '<p>No records found</p>';
            return;
        }
        
        container.innerHTML = records.map(record => `
            <div class="box">
                <div class="meta-row">
                    <span><strong>${record.title}</strong></span>
                    <span>${record.is_published ? 'Published' : 'Draft'}</span>
                </div>
                <div class="meta-row">
                    <a href="/record-editor?id=${record.id}" class="btn">Edit</a>
                    <button class="btn btn-danger" onclick="window.recordsManager.deleteRecord('${record.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    createNewRecord() {
        window.location.href = '/record-editor';
    }

    async deleteRecord(id) {
        const confirmed = await notifications.confirm('Are you sure you want to delete this record?');
        if (!confirmed) return;
        
        await this.safeApiCall(
            () => RecordsAPI.delete(id),
            {
                successCallback: async () => {
                    notifications.success('Record deleted successfully');
                    await this.loadRecords();
                },
                errorCallback: () => {
                    notifications.error('Failed to delete record');
                }
            }
        );
    }
}