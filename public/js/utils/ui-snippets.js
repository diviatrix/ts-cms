// todo, move to  frontpage-logic.js, maybe refactor to use a more generic card rendering function
export function renderFrontpageCard(record, isAdmin = false) {
  const truncatedContent = record.content.substring(0, 150);
  const formattedDate = new Date(record.created_at).toLocaleDateString();
  const editButtonClass = isAdmin ? '' : 'd-none';
  const hasImage = !!record.image_url;
  const imageHtml = hasImage ? `<div class="card-image-container"><img src="${escapeHtml(record.image_url)}" class="card-image" alt="${escapeHtml(record.title)}"></div>` : '';
  return `<div class="card-grid-item"><div class="card">${imageHtml}<div class="card-body">
    <h5 class="card-title">${escapeHtml(record.title)}</h5>
    <h6 class="card-subtitle">${escapeHtml(record.description)}</h6>
    <div class="card-text">${truncatedContent}...</div>
    <div class="meta-row">
      <small>${escapeHtml(record.public_name)} on ${formattedDate}</small>
      <div>
        <a href="/record/index.html?id=${record.id}" class="btn">Read</a>
        <a href="#" class="btn edit-record-btn ${editButtonClass}" data-record-id="${record.id}">Edit</a>
      </div>
    </div>
  </div></div></div>`;
}

export function renderCard({
  title = '',
  description = '',
  content = '',
  image_url = '',
  public_name = '',
  created_at = '',
  id = '',
  isAdmin = false,
  extraMeta = '',
  extraButtons = ''
} = {}) {
  const truncatedContent = content ? content.substring(0, 150) : '';
  const formattedDate = created_at ? new Date(created_at).toLocaleDateString() : '';
  const editButtonClass = isAdmin ? '' : 'd-none';
  const hasImage = !!image_url;
  const imageHtml = hasImage ? `<div class="card-image-container"><img src="${escapeHtml(image_url)}" class="card-image" alt="${escapeHtml(title)}"></div>` : '';
  return `<div class="card">${imageHtml}<div class="card-body">
    <h5 class="card-title">${escapeHtml(title)}</h5>
    <h6 class="card-subtitle">${escapeHtml(description)}</h6>
    <div class="card-text">${truncatedContent}${content.length > 150 ? '...' : ''}</div>
    <div class="meta-row">
      <small>${escapeHtml(public_name)}${formattedDate ? ' on ' + formattedDate : ''}${extraMeta}</small>
      <div>
        <a href="/record/index.html?id=${id}" class="btn">Read</a>
        <a href="#" class="btn edit-record-btn ${editButtonClass}" data-record-id="${id}">Edit</a>
        ${extraButtons}
      </div>
    </div>
  </div></div>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}