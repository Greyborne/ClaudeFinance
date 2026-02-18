// src/transactions.js

import { state } from './state.js';
import { fetchData } from './api.js';

function renderTransactions() {
  // Your existing code...

  // Add from original: auto-categorize on load if needed
  state.transactions.forEach(t => {
    if (!t.category_id) autoCategorize(t);
  });
}

// NEW: From original
function categorizeTransaction(id, categoryId) {
  const transaction = state.transactions.find(t => t.id === id);
  if (!transaction) return;

  fetchData(`/transactions/${id}/categorize`, 'PUT', { category_id: categoryId })
    .then(() => {
      transaction.category_id = categoryId;
      transaction.is_categorized = true;
      renderTransactions();
    });
}

// NEW: Auto-categorize (stub — expand with rules)
function autoCategorize(transaction) {
  // Apply state.categoryRules...
  console.log(`Auto-categorizing transaction ${transaction.id}`);
}

export function initializeTransactions() {
  renderTransactions();
  setupTransactionEventListeners();
}

function setupTransactionEventListeners() {
  // Filters, imports, etc. from original
  document.getElementById('transactionFilter')?.addEventListener('change', renderTransactions);
}