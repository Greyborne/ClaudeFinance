// src/categories.js

import { state } from './state.js';
import { fetchData } from './api.js';
import { editCategory } from './modals.js';  // Import editCategory to reuse in event delegation
import { setupModals } from './modals.js';  // if needed for edit/add

export function renderCategories() {
  renderCategoryLists();  // Reuse or copy your existing function
  // Optional: add extra UI here (e.g. search bar, bulk actions)
}

// Reuse or adapt your renderCategoryLists() function
function renderCategoryLists() {
    const expensesList = document.getElementById('expenseCategoriesList');
    const incomesList = document.getElementById('incomeCategoriesList');
    
    expensesList.innerHTML = '';
    incomesList.innerHTML = '';
    
    // Get top-level categories (no parent)
    const topLevelExpenses = state.categories.filter(c => 
        c.category_type === 'expense' && !c.parent_id
    );
    const topLevelIncome = state.categories.filter(c => 
        c.category_type === 'income' && !c.parent_id
    );
    
    // Render expenses hierarchically
    topLevelExpenses.forEach(category => {
        renderCategoryWithChildren(category, expensesList, 'expense');
    });
    
    // Render income hierarchically
    topLevelIncome.forEach(category => {
        renderCategoryWithChildren(category, incomesList, 'income');
    });
}

// Keep your existing renderCategoryWithChildren, but add edit/delete handlers
function renderCategoryWithChildren(category, container, type, level = 0) {
  const div = document.createElement('div');
  div.className = 'category-item';
  div.style.marginLeft = `${level * 20}px`;
  div.innerHTML = `
    <span>${level > 0 ? '└─ ' : ''}${category.name}</span>
    <div class="category-actions">
      <button class="btn btn-sm btn-secondary edit-btn" data-id="${category.id}">Edit</button>
      <button class="btn btn-sm btn-danger delete-btn" data-id="${category.id}">Delete</button>
    </div>
  `;
  container.appendChild(div);

  // Children
  const children = state.categories.filter(c => c.parent_id === category.id);
  children.forEach(child => renderCategoryWithChildren(child, container, type, level + 1));
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


