export function renderFrontpageCard(record, isAdmin = false) {
  const temp = document.createElement('div');
  temp.innerHTML = `<div class="card-grid-item"><div class="card">
    <div class="card-image-container" data-card-image></div>
    <div class="card-body">
      <h5 class="card-title" data-card-title></h5>
      <h6 class="card-subtitle" data-card-subtitle></h6>
      <div class="card-text" data-card-text></div>
      <div class="meta-row">
        <small data-card-meta></small>
        <div data-card-actions></div>
      </div>
    </div>
  </div></div>`;
  return renderCard(record, temp.innerHTML, { isAdmin, showEdit: isAdmin, showRead: true });
}

export function renderCard(record, template, options = {}) {
  const { isAdmin = false, showEdit = true, showRead = true } = options;
  // Truncate content based on whether image exists
  const maxLength = record.image_url ? 500 : 1500;
  const truncatedContent = record.content ? record.content.substring(0, maxLength) : '';
  const formattedDate = record.created_at ? new Date(record.created_at).toLocaleDateString() : '';
  
  if (template) {
    const temp = document.createElement('div');
    temp.innerHTML = template.trim();
    const card = temp.firstElementChild;
    
    const imgContainer = card.querySelector('[data-card-image]');
    if (imgContainer) {
      if (record.image_url) {
        imgContainer.innerHTML = `<img src="${escapeHtml(record.image_url)}" class="card-image" alt="${escapeHtml(record.title)}" onerror="this.src='/img/placeholder-square.png'">`;
      } else {
        // Remove image container if no image
        imgContainer.remove();
      }
    }
    
    const title = card.querySelector('[data-card-title]');
    if (title) title.textContent = record.title || '';
    
    const subtitle = card.querySelector('[data-card-subtitle]');
    if (subtitle) subtitle.textContent = record.description || '';
    
    const text = card.querySelector('[data-card-text]');
    if (text) {
      if (window.marked) {
        text.innerHTML = marked.parse(truncatedContent) + (record.content?.length > maxLength ? '...' : '');
      } else {
        text.textContent = truncatedContent + (record.content?.length > maxLength ? '...' : '');
      }
    }
    
    const meta = card.querySelector('[data-card-meta]');
    if (meta) meta.textContent = `${record.public_name || ''} on ${formattedDate}`;
    
    const actions = card.querySelector('[data-card-actions]');
    if (actions) {
      actions.innerHTML = `
        ${showRead ? `<a href="/pages/record-page.html?id=${record.id}" class="btn">Read</a>` : ''}
        ${showEdit && isAdmin ? `<a href="/pages/records-manage-page.html?edit=${record.id}" class="btn">Edit</a>` : ''}
      `;
    }
    return card;
  }
  
  return renderFrontpageCard(record, isAdmin);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}