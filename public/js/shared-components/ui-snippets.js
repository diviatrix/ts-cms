// Minimal shared UI snippets for admin/user/record modules

export function renderCardTitle(title) {
  return `<div class="themed card-title">${title}</div>`;
}

export function renderMetaRow(metaHtml) {
  return `<div class="meta-row">${metaHtml}</div>`;
}

export function renderEditButton(attrs = '') {
  return `<button class="edit-user-btn btn" ${attrs} title="Edit">✏️</button>`;
}

export function renderDeleteButton(attrs = '') {
  return `<button class="btn" ${attrs} title="Delete">🗑️</button>`;
}

export function renderActivateButton(attrs = '') {
  return `<button class="btn" ${attrs} title="Activate">✅</button>`;
}

export function renderDeactivateButton(attrs = '') {
  return `<button class="btn" ${attrs} title="Deactivate">🚫</button>`;
}

export function renderEmptyState(message = 'No items found') {
  return `<div class="themed empty-state">${message}</div>`;
}

export function renderErrorState(message = 'Failed to load data') {
  return `<div class="themed error-state">${message}</div>`;
}

export function renderFrontpageCard(record, isAdmin) {
  const truncatedContent = record.content.substring(0, 150);
  const formattedDate = new Date(record.created_at).toLocaleDateString();
  const editButtonClass = isAdmin ? '' : 'd-none';
  const hasImage = !!record.image_url;
  const imageHtml = hasImage ? `<div class="card-image-container"><img src="${escapeHtml(record.image_url)}" class="card-image" alt="${escapeHtml(record.title)}"></div>` : '';
  return `<div class="card-grid-item"><div class="card themed">${imageHtml}<div class="card-body">
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