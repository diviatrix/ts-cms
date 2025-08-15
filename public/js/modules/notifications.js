/**
 * Notifications module for displaying user feedback
 * Replaces browser alert() and confirm() with styled notifications
 */

class NotificationManager {
  constructor() {
    this.container = null;
    this.ensureContainer();
  }

  ensureContainer() {
    // Check if notifications container exists
    this.container = document.getElementById('notifications-container');
    if (!this.container) {
      // Create container if it doesn't exist
      this.container = document.createElement('div');
      this.container.id = 'notifications-container';
      this.container.className = 'notifications-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 5000) {
    this.ensureContainer();
        
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
        
    // Add to container
    this.container.appendChild(notification);
        
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        notification.remove();
      }, duration);
    }
        
    return notification;
  }

  success(message, duration = 5000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 5000) {
    return this.show(message, 'danger', duration);
  }

  warning(message, duration = 5000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }

  async confirm(message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      this.ensureContainer();
            
      const notification = document.createElement('div');
      notification.className = 'alert alert-warning notification-confirm';
            
      notification.innerHTML = `
                <div class="notification-message">${message}</div>
                <div class="notification-actions">
                    <button class="btn btn-sm" data-action="confirm">${confirmText}</button>
                    <button class="btn btn-sm btn-secondary" data-action="cancel">${cancelText}</button>
                </div>
            `;
            
      // Add to container
      this.container.appendChild(notification);
            
      // Handle button clicks
      const handleAction = (e) => {
        if (e.target.dataset.action === 'confirm') {
          notification.remove();
          resolve(true);
        } else if (e.target.dataset.action === 'cancel') {
          notification.remove();
          resolve(false);
        }
      };
            
      notification.addEventListener('click', handleAction);
    });
  }

  clear() {
    this.ensureContainer();
    this.container.innerHTML = '';
  }
}

// Create singleton instance
const notifications = new NotificationManager();

// Export for use in other modules
export { notifications };

// Also attach to window for legacy code compatibility
window.notifications = notifications;