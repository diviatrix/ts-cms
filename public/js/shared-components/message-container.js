import { messageSystem } from '../utils/message-system.js';

export function initMessageContainer() {
    let container = document.getElementById('message-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'message-container';
        document.body.prepend(container);
    }
    function renderMessages(messages) {
        container.innerHTML = messages.map(msg => `
            <div class="alert alert-${msg.type} alert-dismissible fade show" role="alert">
                ${msg.title ? `<strong>${msg.title}</strong> ` : ''}${msg.text}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" onclick="this.parentElement.remove();"></button>
            </div>
        `).join('');
    }
    messageSystem.subscribe(renderMessages);
} 