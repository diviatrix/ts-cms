/**
 * Auto-logout Manager
 * Manages automatic user logout due to inactivity
 */

/**
 * Auto-logout Manager
 */
class AutoLogoutManager {
    constructor(timeoutMinutes = 30) {
        this.timeoutMinutes = timeoutMinutes;
        this.timeoutId = null;
        this.warningId = null;
        this.setupActivityListeners();
        this.resetTimer();
    }

    setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => this.resetTimer(), true);
        });
    }

    resetTimer() {
        // Clear existing timers
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.warningId) clearTimeout(this.warningId);

        // Show warning 5 minutes before logout
        this.warningId = setTimeout(() => {
            this.showLogoutWarning();
        }, (this.timeoutMinutes - 5) * 60 * 1000);

        // Auto logout
        this.timeoutId = setTimeout(() => {
            this.performLogout();
        }, this.timeoutMinutes * 60 * 1000);
    }

    showLogoutWarning() {
        if (document.getElementById('logoutWarning')) return;

        const warning = document.createElement('div');
        warning.id = 'logoutWarning';
        warning.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
        warning.style.backgroundColor = 'rgba(0,0,0,0.8)';
        warning.style.zIndex = '9999';

        warning.innerHTML = `
            <div class="bg-warning text-dark p-4 rounded shadow-lg text-center">
                <h5><i class="fas fa-exclamation-triangle"></i> Session Expiring</h5>
                <p>Your session will expire in 5 minutes due to inactivity.</p>
                <button class="btn btn-primary me-2" onclick="this.parentElement.parentElement.remove()">
                    Stay Logged In
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='/login'">
                    Logout Now
                </button>
            </div>
        `;

        document.body.appendChild(warning);

        // Auto-remove warning after 30 seconds if no action
        setTimeout(() => {
            if (document.getElementById('logoutWarning')) {
                warning.remove();
            }
        }, 30000);
    }

    performLogout() {
        // Clear token and redirect
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login?reason=timeout';
    }
}

// Create global instance
const autoLogoutManager = new AutoLogoutManager();

export { AutoLogoutManager, autoLogoutManager };
