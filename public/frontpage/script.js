document.addEventListener('DOMContentLoaded', function() {
  const postsGrid = document.getElementById('postsGrid');

  async function fetchAndRenderRecords() {
    try {
      const response = await fetch('/api/records');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const records = await response.json();
      renderRecords(records);
    } catch (error) {
      console.error('Error fetching records:', error);
      postsGrid.innerHTML = '<p class="text-danger">Failed to load posts. Please try again later.</p>';
    }
  }

  function renderRecords(records) {
    postsGrid.innerHTML = ''; // Clear existing posts
    if (records.length === 0) {
      postsGrid.innerHTML = '<p>No posts available yet.</p>';
      return;
    }

    // Adjust postsGrid class based on number of records
    if (records.length < 6) {
      postsGrid.className = 'row g-4 mt-4 justify-content-center'; // Center the single column
    } else {
      postsGrid.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mt-4'; // Default grid
    }

    const colClass = records.length < 6 ? 'col-12 col-md-8 col-lg-6' : 'col'; // Use 'col' for multi-column to let row-cols handle it

    records.forEach(record => {
      const postCard = `
        <div class="${colClass} mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${record.title}</h5>
              <h6 class="card-subtitle mb-2 text-muted">${record.description}</h6>
              <p class="card-text">${record.content.substring(0, 150)}...</p>
            </div>
            <div class="card-footer d-flex justify-content-between align-items-center">
              <small class="neon-green-text">By ${record.public_name} on ${new Date(record.created_at).toLocaleDateString()}</small>
              <a href="/record/index.html?id=${record.id}" class="btn btn-primary btn-sm">Read</a>
            </div>
          </div>
        </div>
      `;
      postsGrid.innerHTML += postCard;
    });
  }

  fetchAndRenderRecords();
});