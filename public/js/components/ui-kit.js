export class Button {
  static create(text, options = {}) {
    const button = document.createElement('button');
    button.className = options.className || 'btn';
    button.textContent = text;
    button.type = options.type || 'button';
        
    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }
        
    if (options.disabled) {
      button.disabled = true;
    }
        
    return button;
  }
}

export class Input {
  static create(options = {}) {
    const input = document.createElement('input');
    input.type = options.type || 'text';
    input.className = options.className || '';
        
    if (options.placeholder) input.placeholder = options.placeholder;
    if (options.value) input.value = options.value;
    if (options.id) input.id = options.id;
    if (options.name) input.name = options.name;
    if (options.required) input.required = true;
        
    return input;
  }

  static createWithLabel(labelText, inputOptions = {}) {
    const container = document.createElement('div');
    container.className = 'input-group';
        
    const label = document.createElement('label');
    label.textContent = labelText;
    if (inputOptions.id) label.htmlFor = inputOptions.id;
        
    const input = Input.create(inputOptions);
        
    container.appendChild(label);
    container.appendChild(input);
        
    return { container, input, label };
  }
}

export class Card {
  static create(title, content, options = {}) {
    const card = document.createElement('div');
    card.className = options.className || 'card';
        
    if (title) {
      const header = document.createElement('div');
      header.className = 'card-header';
      header.innerHTML = `<h3 class="card-title">${title}</h3>`;
      card.appendChild(header);
    }
        
    const body = document.createElement('div');
    body.className = 'card-body';
        
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }
        
    card.appendChild(body);
        
    return card;
  }
}

export class Modal {
  static create(title, content, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'none';
        
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
        
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
            <h2>${title}</h2>
            <span class="modal-close">&times;</span>
        `;
        
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
        
    if (typeof content === 'string') {
      modalBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      modalBody.appendChild(content);
    }
        
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
        
    if (options.footer) {
      const modalFooter = document.createElement('div');
      modalFooter.className = 'modal-footer';
      modalFooter.innerHTML = options.footer;
      modalContent.appendChild(modalFooter);
    }
        
    modal.appendChild(modalContent);
        
    // Add close functionality
    const closeButton = modalContent.querySelector('.modal-close');
    closeButton.addEventListener('click', () => Modal.close(modal));
        
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        Modal.close(modal);
      }
    });
        
    document.body.appendChild(modal);
    return modal;
  }
    
  static show(modal) {
    modal.style.display = 'flex';
  }
    
  static close(modal) {
    modal.style.display = 'none';
  }
    
  static destroy(modal) {
    modal.remove();
  }
}

export class Alert {
  static show(message, type = 'info', duration = 5000) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
        
    alert.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 9999;
            padding: 1rem;
            border-radius: var(--radius);
            background: var(--surface);
            border-left: 4px solid var(--primary);
            box-shadow: var(--shadow);
        `;
        
    document.body.appendChild(alert);
        
    setTimeout(() => {
      alert.remove();
    }, duration);
        
    return alert;
  }
    
  static success(message, duration) {
    return Alert.show(message, 'success', duration);
  }
    
  static error(message, duration) {
    return Alert.show(message, 'error', duration);
  }
    
  static warning(message, duration) {
    return Alert.show(message, 'warning', duration);
  }
}

export class Form {
  static create(fields, options = {}) {
    const form = document.createElement('form');
    form.className = options.className || '';
        
    fields.forEach(field => {
      let fieldElement;
            
      if (field.type === 'input') {
        const { container, input } = Input.createWithLabel(field.label, field);
        fieldElement = container;
      } else if (field.type === 'textarea') {
        const container = document.createElement('div');
        container.className = 'input-group';
                
        const label = document.createElement('label');
        label.textContent = field.label;
        if (field.id) label.htmlFor = field.id;
                
        const textarea = document.createElement('textarea');
        textarea.className = field.className || '';
        if (field.placeholder) textarea.placeholder = field.placeholder;
        if (field.value) textarea.value = field.value;
        if (field.id) textarea.id = field.id;
        if (field.name) textarea.name = field.name;
        if (field.required) textarea.required = true;
                
        container.appendChild(label);
        container.appendChild(textarea);
        fieldElement = container;
      }
            
      if (fieldElement) {
        form.appendChild(fieldElement);
      }
    });
        
    if (options.submitButton) {
      const submitBtn = Button.create(options.submitButton.text || 'Submit', {
        type: 'submit',
        className: options.submitButton.className || 'btn'
      });
      form.appendChild(submitBtn);
    }
        
    if (options.onSubmit) {
      form.addEventListener('submit', options.onSubmit);
    }
        
    return form;
  }
}