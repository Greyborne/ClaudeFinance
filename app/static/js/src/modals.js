// src/modals.js

import { state, initializeState } from './state.js';
import { fetchData } from './api.js';
import { renderSettings } from './settings.js';  // To refresh after changes

function initializeModals() { 
  // Your existing close listeners...

  // NEW: Category form submit
  document.getElementById('categoryForm')?.addEventListener('submit', saveCategory);

  // NEW: File upload
  document.getElementById('uploadFileBtn')?.addEventListener('click', uploadFile);

  // Initialize group modal
  const groupModal = document.getElementById('addGroupModal');
  const groupCloseBtn = groupModal.querySelector('.close');

  groupCloseBtn.addEventListener('click', () => {
    groupModal.classList.remove('show');
  });

  window.addEventListener('click', (e) => {
    if (e.target === groupModal) {
      groupModal.classList.remove('show');
    }
  });

  // Cancel button
  document.getElementById('cancelGroupBtn').addEventListener('click', () => {
    groupModal.classList.remove('show');
  });

  // Form submit
  document.getElementById('groupForm').addEventListener('submit', saveGroup);
}

// New save function for groups
async function saveGroup(e) {
  e.preventDefault();
  const id = document.getElementById('groupId').value;
  const data = {
    name: document.getElementById('groupName').value.trim(),
    category_type: document.getElementById('groupType').value,
    parent_id: null,  // Groups are always top-level
    is_parent_only: true,  // Always true for groups
    sort_order: parseInt(document.getElementById('groupSortOrder').value) || 0
  };

  if (!data.name) {
    alert('Group name required');
    return;
  }

  const url = id ? `/api/categories/${id}` : '/api/categories';
  const method = id ? 'PUT' : 'POST';

  try {
    await fetchData(url, method, data);
    document.getElementById('addGroupModal').classList.remove('show');
    await initializeState();  // Reload data
    renderSettings();  // Refresh the list
  } catch (err) {
    console.error('Save group failed:', err);
    alert('Error saving group');
  }
}

// New addGroup function
export function addGroup(type) {
  const modalTitle = type === 'expense' ? 'Add Expense Group' : 'Add Income Group';
  document.getElementById('groupModalTitle').textContent = 'Add Group';
  document.getElementById('groupId').value = '';
  document.getElementById('groupName').value = '';
  document.getElementById('groupType').value = type;
  document.getElementById('groupSortOrder').value = '0';

  document.getElementById('addGroupModal').classList.add('show');
}

// New editGroup function (similar, but for existing)
export function editGroup(groupId) {
  const group = state.categories.find(c => c.id === groupId);
  if (!group) return;

  document.getElementById('groupModalTitle').textContent = 'Edit Group';
  document.getElementById('groupId').value = group.id;
  document.getElementById('groupName').value = group.name;
  document.getElementById('groupType').value = group.category_type;
  document.getElementById('groupSortOrder').value = group.sort_order || 0;

  document.getElementById('addGroupModal').classList.add('show');
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
    //is_parent_only: document.getElementById('categoryIsParentOnly').checked,
    sort_order: parseInt(document.getElementById('categorySortOrder').value)
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `/categories/${id}` : '/categories';

  await fetchData(url, method, data);
  document.getElementById('addCategoryModal').classList.remove('show');
  await initializeState();
  renderSettings();
}


export async function addCategoryType(type) {
    // Populate parent dropdown with same type categories
    const parentSelect = document.getElementById('categoryParent');
    parentSelect.innerHTML = '<option value="">-- Top Level Category --</option>';
    
    const sameTypeCategories = state.categories.filter(c => c.category_type === type);
    sameTypeCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.parent_id ? `  └─ ${cat.name}` : cat.name;
        parentSelect.appendChild(option);
    });
    
    // Set up modal
    document.getElementById('categoryModalTitle').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)} Category`;
    document.getElementById('categoryType').value = type;
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categorySortOrder').value = '0';
    document.getElementById('categoryParent').value = '';
    
    // Reset checkbox - with safety check
    const isParentOnlyCheckbox = document.getElementById('categoryIsParentOnly');
    if (isParentOnlyCheckbox) {
        isParentOnlyCheckbox.checked = false;
    }
    
    // Open modal (only once!)
    document.getElementById('addCategoryModal').classList.add('show');
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
    //document.getElementById('categoryIsParentOnly').checked = category.is_parent_only || false;  // NEW
    document.getElementById('addCategoryModal').classList.add('show');
}

async function addCategoryRule() {
    const pattern = prompt('Enter pattern to match (e.g., "walmart"):');
    if (!pattern) return;
    
    const categoryId = prompt('Enter category ID:');
    if (!categoryId) return;
    
    try {
        const response = await fetch('/api/category-rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pattern: pattern,
                category_id: parseInt(categoryId)
            })
        });
        
        if (response.ok) {
            const rule = await response.json();
            state.categoryRules.push(rule);
            renderCategoryRules();
        }
    } catch (error) {
        console.error('Error adding rule:', error);
    }
}

async function addRecurringTemplate() {
    const name = prompt('Template name:');
    if (!name) return;
    
    const categoryId = prompt('Category ID:');
    const amount = prompt('Amount:');
    const frequency = prompt('Frequency (every_period/monthly/bi_monthly):');
    
    if (!categoryId || !amount || !frequency) return;
    
    try {
        const response = await fetch('/api/recurring-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                category_id: parseInt(categoryId),
                amount: parseFloat(amount),
                frequency: frequency
            })
        });
        
        if (response.ok) {
            const template = await response.json();
            state.recurringTemplates.push(template);
            renderRecurringTemplates();
        }
    } catch (error) {
        console.error('Error adding template:', error);
    }
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

export function showUploadModal() {
    document.getElementById('uploadModal').classList.add('show');
}

export async function uploadTransactions() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/transactions/import', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            document.getElementById('uploadModal').classList.remove('show');
            await loadAllData();
            renderTransactions();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file');
    }
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
  //initializeModals();  // Removed by advise from Grok due to added code below.

  // Close with X button (works for ALL modals with .close)
  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeBtn.closest('.modal').classList.remove('show');
    });
  });

  // Cancel button in category modal (specific selector)
  const cancelBtn = document.querySelector('#cancelCategoryBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      document.getElementById('addCategoryModal').classList.remove('show');
    });
  }

  // Click outside (overlay) — works for all modals
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });

  // Esc key — closes any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        openModal.classList.remove('show');
      }
    }
  });
}
export { editCategory };  // Export editCategory for use in categories.js
export { addCategory };  // Export addCategory for use in app.js
export { saveCategory };  // Export saveCategory if needed elsewhere
export { addCategoryRule };  // Export addCategoryRule for use in app.js
export { addRecurringTemplate };  // Export addRecurringTemplate for use in app.js