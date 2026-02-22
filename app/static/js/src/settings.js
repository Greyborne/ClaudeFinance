// src/settings.js

import { state } from './state.js';
import { fetchData } from './api.js';  // For delete/edit



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

function renderCategoryWithChildren(category, container, type, level = 0) {
  const div = document.createElement('div');
  div.className = 'category-item';
  div.style.marginLeft = `${level * 20}px`;
  div.innerHTML = `
    <div class="sort-controls">
      <button class="btn btn-sm btn-outline-secondary move-up" data-id="${category.id}">↑</button>
      <button class="btn btn-sm btn-outline-secondary move-down" data-id="${category.id}">↓</button>
    </div>
    <span>${level > 0 ? '└─ ' : ''}${category.name}</span>
    <span class="sort-order">(${category.sort_order || 0})</span>
    <div class="category-actions">
      <button class="btn btn-sm btn-secondary edit-btn" data-id="${category.id}">Edit</button>
      <button class="btn btn-sm btn-danger delete-btn" data-id="${category.id}">Delete</button>
    </div>
  `;
  container.appendChild(div);

  // Children...
  const children = state.categories.filter(c => c.parent_id === category.id);
  children.forEach(child => renderCategoryWithChildren(child, container, type, level + 1));
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
  renderCategoryLists(); //- moved to categories.js
  renderCategoryRules();
  renderRecurringTemplates();
}