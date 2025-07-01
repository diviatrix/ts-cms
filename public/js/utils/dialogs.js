/**
 * Confirmation Dialog Utility
 * Provides modal confirmation dialogs
 */

/**
 * Confirmation Dialog Utility
 */
class ConfirmationDialog {
    static show(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'btn-primary',
            cancelClass = 'btn-secondary'
        } = options;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '9999';

            overlay.innerHTML = `
                <div class="bg-white p-4 rounded shadow-lg" style="max-width: 400px;">
                    <h5 class="mb-3">${title}</h5>
                    <p class="mb-4">${message}</p>
                    <div class="text-end">
                        <button class="btn ${cancelClass} me-2" data-action="cancel">${cancelText}</button>
                        <button class="btn ${confirmClass}" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    resolve(true);
                    overlay.remove();
                } else if (action === 'cancel' || e.target === overlay) {
                    resolve(false);
                    overlay.remove();
                }
            });

            // Focus confirm button
            overlay.querySelector('[data-action="confirm"]').focus();
        });
    }
}

export { ConfirmationDialog };
