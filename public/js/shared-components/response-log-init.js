// Shared Response Log Initializer
// Usage: Call initResponseLog() after confirming user is admin
import { ResponseLog } from '/admin/modules/response-log.js';

export function initResponseLog() {
  // Only inject if not already present
  if (!document.getElementById('responseLogWindow')) {
    const logHtml = `
      <div id="responseLogWindow" class="position-fixed" style="display: none; bottom: 0; left: 0; right: 0; height: 40%; z-index: 1050; background: rgba(0,0,0,0.9); backdrop-filter: blur(2px); transform: translateY(100%);">
        <div class="d-flex flex-column h-100">
          <div class="d-flex justify-content-between align-items-center p-2 border-bottom border-secondary" style="background: rgba(0,0,0,0.8);">
            <h6 class="mb-0 text-light">📟 Response Log Terminal</h6>
            <div class="btn-group btn-group-sm" role="group">
              <button id="clearLogButton" class="btn btn-outline-light btn-sm">Clear</button>
              <button id="exportLogButton" class="btn btn-outline-light btn-sm">Export</button>
              <button id="closeLogButton" class="btn btn-outline-danger btn-sm">×</button>
            </div>
          </div>
          <div id="responseLogContainer" class="flex-grow-1 bg-dark text-light p-3" style="overflow-y: auto; font-family: 'Courier New', monospace;">
            <div id="responseLogContent"></div>
          </div>
        </div>
      </div>
      <button id="responseLogButton"
        class="position-fixed d-flex align-items-center justify-content-center shadow-sm border border-2 rounded-circle"
        style="
          bottom: 20px; left: 20px; width: 56px; height: 56px; z-index: 1100;
          font-size: 2rem; border-color: var(--bs-border-color, #444); cursor: pointer;
          background: transparent;
        "
        title="View Response Log"
      >
        🖥️
      </button>
    `;
    document.body.insertAdjacentHTML('beforeend', logHtml);
  }
  // Initialize the log (safe to call multiple times)
  if (!window.__responseLogInstance) {
    window.__responseLogInstance = new ResponseLog();
  }
  return window.__responseLogInstance;
} 