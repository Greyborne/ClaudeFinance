// src/transactions.js

import { state } from './state.js';
import { fetchData } from './api.js';

function renderTransactions() {
  // Your existing code...

  function renderTransactions() {
    const tbody = document.querySelector('#transactionsTable tbody');
    tbody.innerHTML = '';
    
    const filter = document.getElementById('transactionFilter').value;
    let filteredTransactions = state.transactions;
    
    if (filter === 'uncategorized') {
        filteredTransactions = state.transactions.filter(t => !t.is_categorized);
    } else if (filter === 'categorized') {
        filteredTransactions = state.transactions.filter(t => t.is_categorized);
    }
    
    filteredTransactions.forEach(transaction => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.description}</td>
            <td>$${parseFloat(transaction.amount).toFixed(2)}</td>
            <td>
                <select class="category-select" data-transaction-id="${transaction.id}">
                    <option value="">Select category...</option>
                    ${state.categories.map(c => 
                        `<option value="${c.id}" ${c.id === transaction.category_id ? 'selected' : ''}>
                            ${c.name}
                        </option>`
                    ).join('')}
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="categorizeTransaction(${transaction.id})">
                    Categorize
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });

    // Filter out parent-only categories
    const assignableCategories = state.categories.filter(c => !c.is_parent_only);
    
    filteredTransactions.forEach(transaction => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.description}</td>
            <td>$${parseFloat(transaction.amount).toFixed(2)}</td>
            <td>
                <select class="category-select" data-transaction-id="${transaction.id}">
                    <option value="">Select category...</option>
                    ${assignableCategories.map(c => `
                        <option value="${c.id}" ${c.id === transaction.category_id ? 'selected' : ''}>
                            ${c.name}
                        </option>
                    `).join('')}
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="categorizeTransaction(${transaction.id})">Categorize</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add change listener to category selects
    document.querySelectorAll('.category-select').forEach(select => {
        select.addEventListener('change', function() {
            const transactionId = parseInt(this.dataset.transactionId);
            const categoryId = parseInt(this.value);
            if (categoryId) {
                categorizeTransaction(transactionId, categoryId);
            }
        });
    });
}

async function categorizeTransaction(transactionId, categoryId) {
    if (!categoryId) {
        const select = document.querySelector(`select[data-transaction-id="${transactionId}"]`);
        categoryId = parseInt(select.value);
    }
    
    if (!categoryId) {
        alert('Please select a category');
        return;
    }
    
    try {
        const response = await fetch(`/api/transactions/${transactionId}/categorize`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category_id: categoryId,
                auto_match: true
            })
        });
        
        if (response.ok) {
            const updated = await response.json();
            const index = state.transactions.findIndex(t => t.id === transactionId);
            if (index >= 0) {
                state.transactions[index] = updated;
            }
            renderTransactions();
            alert('Transaction categorized successfully!');
        }
    } catch (error) {
        console.error('Error categorizing transaction:', error);
        alert('Error categorizing transaction');
    }
}


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