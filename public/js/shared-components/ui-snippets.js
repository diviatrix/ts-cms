// Minimal shared UI snippets for admin/user/record modules

export function renderCardTitle(title) {
  return `<div class="card-title">${title}</div>`;
}

export function renderMetaRow(metaHtml) {
  return `<div class="meta-row">${metaHtml}</div>`;
}

export function renderEditButton(attrs = '') {
  return `<a class="btn btn-target" data-action="edit-user" ${attrs} href="#" title="Edit">✏️</a>`;
}

export function renderDeleteButton(attrs = '') {
  return `<a class="btn btn-target" data-action="delete-user" ${attrs} href="#" title="Delete">🗑️</a>`;
}

export function renderActivateButton(attrs = '') {
  return `<a class="btn btn-target" data-action="activate-user" ${attrs} href="#" title="Activate">✅</a>`;
}

export function renderDeactivateButton(attrs = '') {
  return `<a class="btn btn-target" data-action="deactivate-user" ${attrs} href="#" title="Deactivate">🚫</a>`;
}

export function renderEmptyState(message = 'No items found') {
  return `<div class="empty-state">${message}</div>`;
}

export function renderErrorState(message = 'Failed to load data') {
  return `<div class="error-state">${message}</div>`;
}

export function renderFrontpageCard(record, isAdmin) {
  const truncatedContent = record.content.substring(0, 150);
  const formattedDate = new Date(record.created_at).toLocaleDateString();
  const editButtonClass = isAdmin ? '' : 'd-none';
  const hasImage = !!record.image_url;
  const imageHtml = hasImage ? `<div class="card-image-container"><img src="${escapeHtml(record.image_url)}" class="card-image" alt="${escapeHtml(record.title)}"></div>` : '';
  return `<div class="card-grid-item"><div class="card">${imageHtml}<div class="card-body">
    <h5 class="card-title">${escapeHtml(record.title)}</h5>
    <h6 class="card-subtitle">${escapeHtml(record.description)}</h6>
    <div class="card-text">${truncatedContent}...</div>
    <div class="card-footer">
      <small>${escapeHtml(record.public_name)} on ${formattedDate}</small>
      <div>
        <a href="/record/index.html?id=${record.id}" class="btn">Read</a>
        <a href="#" class="btn edit-record-btn ${editButtonClass}" data-record-id="${record.id}">Edit</a>
      </div>
    </div>
  </div></div></div>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
} 