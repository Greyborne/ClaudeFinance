// src/modals.js

import { state } from './state.js';
import { fetchData } from './api.js';
import { renderSettings } from './settings.js';  // To refresh after changes

function initializeModals() {
  // Your existing close listeners...

  // NEW: Category form submit
  document.getElementById('categoryForm')?.addEventListener('submit', saveCategory);

  // NEW: File upload
  document.getElementById('uploadFileBtn')?.addEventListener('click', uploadFile);
}

// NEW: From original
async function saveCategory(event) {
  event.preventDefault();
  const form = event.target;
  const id = document.getElementById('categoryId').value;
  const data = {
    name: document.getElementById('categoryName').value,
    category_type: document.getElementById('categoryType').value,
    parent_id: document.getElementById('categoryParent').value || null,
    is_parent_only: document.getElementById('categoryIsParentOnly').checked,
    sort_order: parseInt(document.getElementById('categorySortOrder').value)
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `/categories/${id}` : '/categories';

  await fetchData(url, method, data);
  document.getElementById('addCategoryModal').classList.remove('show');
  await initializeState();
  renderSettings();
}

// NEW: From original
async function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/transactions/import', { method: 'POST', body: formData });
  document.getElementById('uploadModal').classList.remove('show');
  await initializeState();
}

export function setupModals() {
  initializeModals();
}