// src/settings.js

import { state } from './state.js';
import { fetchData } from './api.js';  // For delete/edit
import { renderCategories } from './categories.js';



// NEW: Added from original
function renderCategoryRules() {
  const rulesList = document.getElementById('categoryRulesList');
  rulesList.innerHTML = '';

  state.categoryRules.forEach(rule => {
    const div = document.createElement('div');
    div.className = 'rule-item';
    div.innerHTML = `
      <span>${rule.description}</span>
      <div class="actions">
        <button data-action="edit" data-id="${rule.id}">Edit</button>
        <button data-action="delete" data-id="${rule.id}">Delete</button>
      </div>
    `;
    rulesList.appendChild(div);
  });

  rulesList.addEventListener('click', handleRuleAction);
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

function handleRuleAction(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = parseInt(btn.dataset.id);
  if (action === 'edit') editRule(id);
  if (action === 'delete') deleteRule(id);
}

// Stub for edit/delete — expand with modals
async function editRule(id) {
  console.log(`Edit rule ${id}`);
  // Open modal, etc.
}

async function deleteRule(id) {
  await fetchData(`/category-rules/${id}`, 'DELETE');
  state.categoryRules = state.categoryRules.filter(r => r.id !== id);
  renderCategoryRules();
}

// NEW: Added from original
function renderRecurringTemplates() {
  const templatesList = document.getElementById('recurringTemplatesList');
  templatesList.innerHTML = '';

  state.recurringTemplates.forEach(template => {
    const div = document.createElement('div');
    div.className = 'template-item';
    div.innerHTML = `
      <span>${template.name}</span>
      <div class="actions">
        <button data-action="edit" data-id="${template.id}">Edit</button>
        <button data-action="delete" data-id="${template.id}">Delete</button>
        <button data-action="apply" data-id="${template.id}">Apply</button>
      </div>
    `;
    templatesList.appendChild(div);
  });

  templatesList.addEventListener('click', handleTemplateAction);
}

function handleTemplateAction(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = parseInt(btn.dataset.id);
  if (action === 'edit') editTemplate(id);
  if (action === 'delete') deleteTemplate(id);
  if (action === 'apply') applyTemplate(id);
}

// Stubs — expand
async function editTemplate(id) {
  console.log(`Edit template ${id}`);
}

async function deleteTemplate(id) {
  await fetchData(`/recurring-templates/${id}`, 'DELETE');
  state.recurringTemplates = state.recurringTemplates.filter(t => t.id !== id);
  renderRecurringTemplates();
}

async function applyTemplate(id) {
  // From original — call backend
  const periodIds = state.payPeriods.map(p => p.id);
  await fetchData(`/recurring-templates/${id}/apply`, 'POST', { pay_period_ids: periodIds });
  await initializeState();  // Refresh data
}

export function renderSettings() {
  renderCategories(); //- moved to categories.js
  renderCategoryRules();
  renderRecurringTemplates();
}