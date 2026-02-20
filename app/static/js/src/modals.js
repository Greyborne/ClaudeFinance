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

// Show add category modal (clear form for new entry)
function addCategory() {
  // Reset form for new category
  document.getElementById('categoryModalTitle').textContent = 'Add Category';
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryName').value = '';
  document.getElementById('categoryType').value = 'expense'; // or default
  document.getElementById('categoryParent').value = '';
  document.getElementById('categorySortOrder').value = '0';
  document.getElementById('categoryIsParentOnly').checked = false;

  // Populate parent dropdown (all possible parents of same type)
  const parentSelect = document.getElementById('categoryParent');
  parentSelect.innerHTML = '<option value="">-- Top Level --</option>';
  
  state.categories
    .filter(c => c.category_type === 'expense') // or dynamic based on type
    .forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      parentSelect.appendChild(opt);
    });

  document.getElementById('addCategoryModal').classList.add('show');
}

// NEW: Edit category function
async function editCategory(id) {
    const category = state.categories.find(c => c.id === id);
    if (!category) return;
    
    // Populate parent dropdown (excluding self and descendants)
    const parentSelect = document.getElementById('categoryParent');
    parentSelect.innerHTML = '<option value="">-- Top Level Category --</option>';
    
    const validParents = state.categories.filter(c => 
        c.category_type === category.category_type && 
        c.id !== id && 
        !isDescendantOf(c, id) // Prevent circular references
    );
    
    validParents.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.parent_id ? `  └─ ${cat.name}` : cat.name;
        if (cat.id === category.parent_id) {
            option.selected = true;
        }
        parentSelect.appendChild(option);
    });
    
    // Set up modal with existing values
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryType').value = category.category_type;
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categorySortOrder').value = category.sort_order || 0;
    document.getElementById('categoryIsParentOnly').checked = category.is_parent_only || false;  // NEW
    document.getElementById('addCategoryModal').classList.add('show');
}

// NEW: Check if a category is a descendant of another
function isDescendantOf(category, ancestorId) {
    let current = category;
    while (current.parent_id) {
        if (current.parent_id === ancestorId) {
            return true;
        }
        current = state.categories.find(c => c.id === current.parent_id);
        if (!current) break;
    }
    return false;
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
export { editCategory };  // Export editCategory for use in categories.js
export { addCategory };  // Export addCategory for use in app.js
// export { saveCategory };  // Export saveCategory if needed elsewhere