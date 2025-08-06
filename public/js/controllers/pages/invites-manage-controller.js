import { AdminAPI } from '../../core/api-client.js';
import { notifications } from '../../modules/notifications.js';
import { BasePageController } from './base-page-controller.js';
import { cacheManager } from '../../utils/cache-manager.js';

export default class InvitesManageController extends BasePageController {
    constructor(app) {
        super();
        this.app = app;
        this.container = document.getElementById('invites-manage-container');
        this.cacheKey = 'invites-manage-data';
        this.init();
    }

    async init() {
        if (!this.app.user.roles.includes('admin')) {
            window.location.href = '/';
            return;
        }
        
        this.render();
        await this.loadInvites();
    }

    render() {
        this.container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">Manage Invites</h2>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="window.invitesManager.createInvite()">
                        Create New Invite
                    </button>
                </div>
            </div>
            
            <div class="card-full-height">
                <div class="card-body">
                    <div id="invites-content">Loading...</div>
                </div>
            </div>
        `;
        
        // Make controller globally available
        window.invitesManager = this;
    }

    async loadInvites() {
        const contentElement = document.getElementById('invites-content');
        
        // Try to load from cache first
        const cachedData = cacheManager.get(this.cacheKey);
        if (cachedData) {
            this.renderInvites(cachedData);
            return;
        }

        await this.setMultipleLoading([contentElement], true, 'Loading invites...', 'skeleton');

        try {
            const response = await AdminAPI.getInvites();
            
            if (response.success) {
                const invites = Array.isArray(response.data) ? response.data : [];
                
                // Cache the data for 2 minutes
                cacheManager.set(this.cacheKey, invites, 120000);
                
                this.renderInvites(invites);
            } else {
                contentElement.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load invites: ${response.message}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading invites:', error);
            this.handleNetworkErrorMessage(error);
            contentElement.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load invites. Please try again.
                </div>
            `;
        } finally {
            await this.setMultipleLoading([contentElement], false);
        }
    }

    renderInvites(invites) {
        const contentElement = document.getElementById('invites-content');
        
        if (!invites || invites.length === 0) {
            contentElement.innerHTML = `
                <div class="empty-state">
                    <h3>No Invites Found</h3>
                    <p>You haven't created any invite codes yet.</p>
                    <button class="btn btn-primary" onclick="window.invitesManager.createInvite()">
                        Create Your First Invite
                    </button>
                </div>
            `;
            return;
        }

        const unusedInvites = invites.filter(invite => !invite.used_by);
        const usedInvites = invites.filter(invite => invite.used_by);

        contentElement.innerHTML = `
            <div class="invite-summary" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing); margin-bottom: calc(var(--spacing) * 2);">
                <div class="stat-box">
                    <div class="stat-number">${invites.length}</div>
                    <div class="stat-label">Total Invites</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number text-success">${unusedInvites.length}</div>
                    <div class="stat-label">Unused</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number text-muted">${usedInvites.length}</div>
                    <div class="stat-label">Used</div>
                </div>
            </div>

            <div class="invites-section">
                <h3>Unused Invites</h3>
                ${unusedInvites.length > 0 ? `
                    <div class="invites-list">
                        ${unusedInvites.map(invite => this.renderInviteItem(invite, false)).join('')}
                    </div>
                ` : `
                    <p class="text-muted">No unused invites.</p>
                `}
            </div>

            ${usedInvites.length > 0 ? `
                <div class="invites-section">
                    <h3>Used Invites</h3>
                    <div class="invites-list">
                        ${usedInvites.map(invite => this.renderInviteItem(invite, true)).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    renderInviteItem(invite, isUsed) {
        const createdDate = new Date(invite.created_at).toLocaleDateString();
        const createdTime = new Date(invite.created_at).toLocaleTimeString();
        
        return `
            <div class="invite-item ${isUsed ? 'invite-used' : 'invite-unused'}">
                <div class="invite-header">
                    <div class="invite-code">
                        <strong>${invite.code}</strong>
                        ${!isUsed ? `<button class="btn-copy-small" onclick="window.invitesManager.copyInviteCode('${invite.code}')" title="Copy code">📋</button>` : ''}
                    </div>
                    <div class="invite-status">
                        <span class="badge ${isUsed ? 'badge-secondary' : 'badge-success'}">
                            ${isUsed ? 'Used' : 'Unused'}
                        </span>
                    </div>
                </div>
                <div class="invite-details">
                    <div class="invite-meta">
                        <span class="text-muted">Created by: ${invite.creator_login || 'Unknown'}</span>
                        <span class="text-muted">on ${createdDate} at ${createdTime}</span>
                    </div>
                    ${isUsed ? `
                        <div class="invite-usage">
                            <span class="text-muted">Used by: ${invite.user_login || 'Unknown'}</span>
                            ${invite.used_at ? `<span class="text-muted">on ${new Date(invite.used_at).toLocaleDateString()}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="invite-actions">
                    ${!isUsed ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="window.invitesManager.deleteInvite('${invite.id}', '${invite.code}')">
                            Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async createInvite() {
        try {
            const result = await AdminAPI.createInvite();
            
            if (result.success) {
                notifications.success(`Invite created: ${result.data.code}`);
                cacheManager.clear(this.cacheKey);
                await this.loadInvites(); // Refresh the list
            } else {
                notifications.error(result.message || 'Failed to create invite');
            }
        } catch (error) {
            console.error('Error creating invite:', error);
            notifications.error('Failed to create invite');
        }
    }

    async deleteInvite(inviteId, inviteCode) {
        if (!confirm(`Are you sure you want to delete invite "${inviteCode}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const result = await AdminAPI.deleteInvite(inviteId);
            
            if (result.success) {
                notifications.success(`Invite "${inviteCode}" deleted successfully`);
                cacheManager.clear(this.cacheKey);
                await this.loadInvites(); // Refresh the list
            } else {
                notifications.error(result.message || 'Failed to delete invite');
            }
        } catch (error) {
            console.error('Error deleting invite:', error);
            notifications.error('Failed to delete invite');
        }
    }

    copyInviteCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            notifications.success(`Invite code "${code}" copied to clipboard`);
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            notifications.success(`Invite code "${code}" copied to clipboard`);
        });
    }

    destroy() {
        if (window.invitesManager === this) {
            window.invitesManager = null;
        }
    }
}