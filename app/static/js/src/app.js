// src/app.js

import { state, initializeState } from './state.js';
import { renderSettings } from './settings.js';
import { initializeTransactions } from './transactions.js';
import { initializeBudgetTable } from './budgetTable.js';
import { renderCategories } from './categories.js';  // adjust path if needed
import { setupModals } from './modals.js';
import { addCategory } from './modals.js';  // add this line near other imports
import { initializeDashboard } from './dashboard.js';  // NEW: Import from new file

async function initializeApp() {
  console.log('Initializing app...');
  
  await initializeState();
  console.log('State initialized');

  renderSettings();
  console.log('Settings rendered');

  initializeTransactions();
  console.log('Transactions initialized');

  initializeBudgetTable();
  console.log('Budget Table initialized');

  initializeDashboard();  // NEW: Init dashboard
  console.log('Dashboard initialized');

  setupModals();
  console.log('Modals set up');

  initializeTabs();  // From original — add tab switching
  setupEventListeners();  // From original — global listeners
}

document.addEventListener('DOMContentLoaded', () => {
  initializeApp().catch(error => {
    console.error('Error initializing app:', error);
  });
});

// Tab switching (from original)
function initializeTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
  
  // Refresh based on tab (use imported renders)
  if (tabName === 'dashboard') {
    initializeDashboard();  // From dashboard.js
  } else if (tabName === 'budget') {
    initializeBudgetTable();  // From budgetTable.js
  // In app.js - switchTab function
  } else if (tabName === 'categories') {
    renderCategories();  // From categories.js
  } else if (tabName === 'transactions') {
    initializeTransactions();  // From transactions.js
  } else if (tabName === 'settings') {
    renderSettings();  // From settings.js
  }
}

// Global event listeners (from original — expand as needed)
function setupEventListeners() {
  // Toolbar buttons, etc. — add specifics here or delegate to module inits
  document.getElementById('addCategoryBtn')?.addEventListener('click', addCategory);  // Example
  // ... add more from original
    // Add category buttons
  document.getElementById('addExpenseCategoryBtn').addEventListener('click', () => addCategory('expense'));
  document.getElementById('addIncomeCategoryBtn').addEventListener('click', () => addCategory('income'));
  
  // NEW: Category form submission
  document.getElementById('categoryForm').addEventListener('submit', saveCategory);
  document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
      document.getElementById('addCategoryModal').classList.remove('show');
  });

  // Import transactions
  document.getElementById('importTransactionsBtn').addEventListener('click', showUploadModal);
  document.getElementById('uploadFileBtn').addEventListener('click', uploadTransactions);
    
  // Generate pay periods
  document.getElementById('generatePeriodsBtn').addEventListener('click', generatePayPeriods);
    
  // Transaction filter
  document.getElementById('transactionFilter').addEventListener('change', renderTransactions);
    
  // Add rule button
  document.getElementById('addRuleBtn').addEventListener('click', addCategoryRule);
  
  // Add template button
  document.getElementById('addTemplateBtn').addEventListener('click', addRecurringTemplate);

  // Close modal when clicking X
  const closeButtons = document.querySelectorAll('.modal .close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.remove('show');
    });
  });

  // Close when clicking outside modal content (overlay)
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal') && e.target.classList.contains('show')) {
      e.target.classList.remove('show');
    }
  });

  // Cancel button (in your category modal)
  document.getElementById('cancelCategoryBtn')?.addEventListener('click', () => {
    document.getElementById('addCategoryModal').classList.remove('show');
  }); 
}