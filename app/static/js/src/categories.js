// src/categories.js

import { state } from './state.js';
import { fetchData } from './api.js';
import { editCategory } from './modals.js';  // Import editCategory to reuse in event delegation
import { moveCategoryUp, moveCategoryDown } from './sort.js';  // Import sorting functions

export function renderCategories() {
  renderCategoryLists();  // Reuse or copy your existing function
  // Optional: add extra UI here (e.g. search bar, bulk actions)
}

// src/settings.js

function renderCategoryLists() {
  const expensesList = document.getElementById('expenseCategoriesList');
  const incomesList = document.getElementById('incomeCategoriesList');

 if (!expensesList || !incomesList) return;  // safety

  expensesList.innerHTML = '';
  incomesList.innerHTML = '';

  // Guard: if groups or categories not loaded yet, show loading or empty
  if (!state.categoriesGroups || state.categoriesGroups.length === 0) {
    expensesList.innerHTML = '<p class="text-muted">Loading groups...</p>';
    incomesList.innerHTML = '<p class="text-muted">Loading groups...</p>';
    return;
  }

  if (!state.categories || state.categories.length === 0) {
    expensesList.innerHTML = '<p class="text-muted">No categories yet.</p>';
    incomesList.innerHTML = '<p class="text-muted">No categories yet.</p>';
    return;
  }
  // Expense groups
  const expenseGroups = state.categoriesGroups
    .filter(g => g.category_type === 'expense')
    .sort((a, b) => a.sort_order - b.sort_order);

  if (expenseGroups.length === 0) {
    expensesList.innerHTML = '<p class="text-muted">No expense groups yet. Add one!</p>';
  }

  expenseGroups.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-section mb-3';
    groupDiv.innerHTML = `
      <div class="group-header">
        <h5 class="mb-0">${group.name}</h5>
        <div>
          <button class="btn btn-sm btn-secondary me-2" onclick="editGroup(${group.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGroup(${group.id})">Delete</button>
        </div>
      </div>
      <div class="category-list ms-3" id="group-${group.id}-list"></div>
    `;
    expensesList.appendChild(groupDiv);

    const list = groupDiv.querySelector('.category-list');

    // Categories in this group
    const cats = state.categories
      .filter(c => c.group_id === group.id && c.category_type === 'expense')
      .sort((a, b) => a.sort_order - b.sort_order);

    if (cats.length === 0) {
      list.innerHTML = '<p class="text-muted small">No categories in this group yet.</p>';
    }

    cats.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'category-item d-flex justify-content-between align-items-center p-2 bg-secondary rounded mb-1';
      // Get siblings again (same filter & sort as in adjustSortOrder)
      const siblings = state.categories
        .filter(c => c.group_id === cat.group_id && c.category_type === cat.category_type)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      const currentIndex = siblings.findIndex(c => c.id === cat.id);

      // Create Dynamic HTML with sort buttons, disable if at boundaries
      item.innerHTML = `
        <div class="catrow">
          <div class="sort-arrows me-3">
            <button class="btn btn-arrow btn-outline-light sort-up" ${currentIndex === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-arrow btn-outline-light sort-down" ${currentIndex === siblings.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
          <span class="name">${cat.name}</span>
        </div>
        <div>
          <span class="count badge bg-info me-2">(${cat.transactionCount || 0})</span>
          <button class="btn btn-sm btn-secondary me-1" onclick="editCategory(${cat.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">Delete</button>
        </div>
      `;
      // Attach listeners (only if not disabled, but we can attach anyway — disabled prevents click)
      const upBtn = item.querySelector('.sort-up');
      const downBtn = item.querySelector('.sort-down');

      if (upBtn) {
        upBtn.addEventListener('click', () => moveCategoryUp(cat.id));
      }
      if (downBtn) {
        downBtn.addEventListener('click', () => moveCategoryDown(cat.id));
      }

      list.appendChild(item);
    });
  });

  // Income groups
  const incomeGroups = state.categoriesGroups
    .filter(g => g.category_type === 'income')
    .sort((a, b) => a.sort_order - b.sort_order);

  if (incomeGroups.length === 0) {
    incomesList.innerHTML = '<p class="text-muted">No income groups yet. Add one!</p>';
  }

  incomeGroups.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-section mb-3';
    groupDiv.innerHTML = `
      <div class="group-header">
        <h5 class="mb-0">${group.name}</h5>
        <div>
          <button class="btn btn-sm btn-secondary me-1" onclick="editGroup(${group.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGroup(${group.id})">Delete</button>
        </div>
      </div>
      <div class="category-list ms-3" id="group-${group.id}-list"></div>
    `;
    incomesList.appendChild(groupDiv);

    const list = groupDiv.querySelector('.category-list');

    // Categories in this group
    const cats = state.categories
      .filter(c => c.group_id === group.id && c.category_type === 'income')
      .sort((a, b) => a.sort_order - b.sort_order);

    if (cats.length === 0) {
      list.innerHTML = '<p class="text-muted small">No categories in this group yet.</p>';
    }

    cats.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'category-item d-flex justify-content-between align-items-center p-2 bg-secondary rounded mb-1';
      // Get siblings again (same filter & sort as in adjustSortOrder)
      const siblings = state.categories
        .filter(c => c.group_id === cat.group_id && c.category_type === cat.category_type)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      const currentIndex = siblings.findIndex(c => c.id === cat.id);

      // Create Dynamic HTML with sort buttons, disable if at boundaries
      item.innerHTML = `
        <div class="catrow">
          <div class="sort-arrows me-3">
            <button class="btn btn-arrow btn-outline-light sort-up" ${currentIndex === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-arrow btn-outline-light sort-down" ${currentIndex === siblings.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
          <span class="name">${cat.name}</span>
        </div>
        <div>
          <span class="count badge bg-info me-2">(${cat.transactionCount || 0})</span>
          <button class="btn btn-sm btn-secondary me-1" onclick="editCategory(${cat.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">Delete</button>
        </div>
      `;
      // Attach listeners (only if not disabled, but we can attach anyway — disabled prevents click)
      const upBtn = item.querySelector('.sort-up');
      const downBtn = item.querySelector('.sort-down');

      if (upBtn) {
        upBtn.addEventListener('click', () => moveCategoryUp(cat.id));
      }
      if (downBtn) {
        downBtn.addEventListener('click', () => moveCategoryDown(cat.id));
      }

      list.appendChild(item);
    });
  });

}

function renderGroupWithCategories(group, container, type) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'group-item';
  groupDiv.innerHTML = `
    <div class="group-header">
      <h5>${group.name}</h5>
      <div class="group-actions">
        <button class="btn btn-sm btn-outline-primary" onclick="addCategoryToGroup(${group.id})">Add Category</button>
        <button class="btn btn-sm btn-secondary" onclick="editGroup(${group.id})">Edit Group</button>
        <button class="btn btn-sm btn-danger" onclick="deleteGroup(${group.id})">Delete Group</button>
      </div>
    </div>
    <div class="category-list" id="group-${group.id}-list"></div>
  `;
  container.appendChild(groupDiv);

  const list = groupDiv.querySelector('.category-list');

  // Get categories in this group
  const categoriesInGroup = state.categories.filter(c => 
    c.group_id === group.id && c.category_type === type
  );

  // Sort by sort_order
  categoriesInGroup.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  categoriesInGroup.forEach(category => {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.innerHTML = `
      <div class="sort-arrows">
        <button class="btn btn-sm sort-up">↑</button>
        <button class="btn btn-sm sort-down">↓</button>
      </div>
      <span class="name">${category.name}</span>
      <span class="count">(${category.transactionCount || 0})</span>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editCategory(${category.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

// NEW: Load groups from API (add this to initializeState or a new function)
export async function loadCategoriesAndGroups() {
  const [categories, groups] = await Promise.all([
    fetchData('/categories'),
    fetchData('/category-groups')   // NEW endpoint you need to add in backend
  ]);
  state.categories = categories;
  state.categoriesGroups = groups;
}

// Add event delegation for edit/delete
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.edit-btn, .delete-btn');
  if (!btn) return;
  
  const id = parseInt(btn.dataset.id);
  if (btn.classList.contains('edit-btn')) {
    const category = state.categories.find(c => c.id === id);
    if (category.is_parent_only) {
      editGroup(id);  // Use group modal for parents
    } else {
      editCategory(id);  // Use regular modal for children
    }
  } else if (btn.classList.contains('delete-btn')) {
    if (confirm('Delete this category and all sub-categories?')) {
      deleteCategory(id);
    }
  }
});

// Optional: Refresh after changes
async function deleteCategory(id) {
if (!confirm('Are you sure you want to delete this category?')) return;
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE'
        });
            
        if (response.ok) {
            state.categories = state.categories.filter(c => c.id !== id);
            await initializeState();  // reload data
            renderCategories();
        }
    } catch (error) {
            console.error('Error deleting category:', error);
        }
}


