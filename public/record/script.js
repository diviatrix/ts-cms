import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

document.addEventListener('DOMContentLoaded', async function() {
  const recordTitle = document.getElementById('recordTitle');
  const recordDescription = document.getElementById('recordDescription');
  const recordContent = document.getElementById('recordContent');
  const recordAuthor = document.getElementById('recordAuthor');
  const recordDate = document.getElementById('recordDate');

  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get('id');

  if (!recordId) {
    recordTitle.textContent = 'Record Not Found';
    recordDescription.textContent = 'No record ID provided.';
    return;
  }

  try {
    const response = await fetch(`/api/records/${recordId}`);
    if (!response.ok) {
      if (response.status === 404) {
        recordTitle.textContent = 'Record Not Found';
        recordDescription.textContent = 'The requested record does not exist.';
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return;
    }

    const record = await response.json();

    recordTitle.textContent = record.title;
    recordDescription.textContent = record.description;
    recordContent.innerHTML = marked.parse(record.content);
    recordAuthor.textContent = record.user_id; // Assuming user_id is enough for now, or fetch user details
    recordDate.textContent = new Date(record.created_at).toLocaleDateString();

  } catch (error) {
    console.error('Error fetching record:', error);
    recordTitle.textContent = 'Error Loading Record';
    recordDescription.textContent = 'An error occurred while loading the record.';
  }
});