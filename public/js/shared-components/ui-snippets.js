// Minimal shared UI snippets for admin/user/record modules

export function renderCardTitle(title) {
  return `<div class="themed" style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em; cursor: pointer;">${title}</div>`;
}

export function renderMetaRow(metaHtml) {
  return `<div style="display: flex; align-items: center; gap: 1em;">${metaHtml}</div>`;
}

export function renderEditButton(attrs = '') {
  return `<button class="edit-user-btn icon-btn btn btn-sm btn-primary" ${attrs} title="Edit">✏️</button>`;
}

export function renderDeleteButton(attrs = '') {
  return `<button class="icon-btn btn btn-sm btn-secondary" ${attrs} title="Delete">🗑️</button>`;
}

export function renderActivateButton(attrs = '') {
  return `<button class="icon-btn btn btn-sm btn-success" ${attrs} title="Activate">✅</button>`;
}

export function renderDeactivateButton(attrs = '') {
  return `<button class="icon-btn btn btn-sm btn-warning" ${attrs} title="Deactivate">🚫</button>`;
}

export function renderEmptyState(message = 'No items found') {
  return `<div class="themed" style="padding:1em;">${message}</div>`;
}

export function renderErrorState(message = 'Failed to load data') {
  return `<div class="text-danger themed" style="padding:1em;">${message}</div>`;
} 