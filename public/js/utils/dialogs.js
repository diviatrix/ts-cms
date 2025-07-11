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
        } = options;

        // Remove any existing dialog
        const existing = document.getElementById('confirmationDialogModal');
        if (existing) existing.remove();

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'confirmationDialogModal';
        modal.className = 'modal fade show';
        modal.tabIndex = -1;
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered" style="max-width:400px;">
                <div class="modal-content" style="background:#fff;color:#222;border:2px solid #00FF00;font-family:inherit;">
                    <div class="modal-header border-0">
                        <h5 class="modal-title">${title}</h5>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer border-0 d-flex justify-content-end">
                        <button type="button" class="btn btn-secondary me-2" data-action="cancel">${cancelText}</button>
                        <button type="button" class="btn btn-primary" style="background:#00FF00;border-color:#00FF00" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Focus confirm button
        setTimeout(() => {
            const confirmBtn = modal.querySelector('[data-action="confirm"]');
            if (confirmBtn) confirmBtn.focus();
        }, 10);

        // Promise for result
        return new Promise(resolve => {
            const handler = (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    resolve(true);
                    close();
                } else if (action === 'cancel') {
                    resolve(false);
                    close();
                }
            };
            function close() {
                modal.removeEventListener('click', handler);
                modal.remove();
                document.body.classList.remove('modal-open');
            }
            modal.addEventListener('click', handler);
            // Dismiss on backdrop click
            modal.addEventListener('mousedown', (e) => {
                if (e.target === modal) {
                    resolve(false);
                    close();
                }
            });
            document.body.classList.add('modal-open');
        });
    }
}

export { ConfirmationDialog };
