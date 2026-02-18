// src/app.js

import { state, initializeState } from './state.js';
import { renderSettings } from './settings.js';
import { initializeTransactions } from './transactions.js';
import { initializeBudgetTable } from './budgetTable.js';
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
    loadDashboard();  // From dashboard.js
  } else if (tabName === 'budget') {
    renderBudgetTable();  // From budgetTable.js
  } else if (tabName === 'transactions') {
    renderTransactions();  // From transactions.js
  } else if (tabName === 'settings') {
    renderSettings();  // From settings.js
  }
}

// Global event listeners (from original — expand as needed)
function setupEventListeners() {
  // Toolbar buttons, etc. — add specifics here or delegate to module inits
  document.getElementById('addCategoryBtn')?.addEventListener('click', addCategory);  // Example
  // ... add more from original
}