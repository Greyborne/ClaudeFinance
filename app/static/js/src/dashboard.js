// src/dashboard.js

import { state } from './state.js';
import { fetchData } from './api.js';

let charts = { budgetVsActual: null, spendingTrend: null };

async function loadDashboard() {
  const [budgetVsActualData, spendingTrendData] = await Promise.all([
    fetchData('/analytics/budget-vs-actual'),
    fetchData('/analytics/spending-trend')
  ]);

  // Update summaries (from original)
  document.getElementById('totalPlanned').textContent = `$${budgetVsActualData.planned_total.toFixed(2)}`;
  // ... other summaries

  // Render charts (using Chart.js from original)
  if (charts.budgetVsActual) charts.budgetVsActual.destroy();
  charts.budgetVsActual = new Chart(document.getElementById('budgetVsActualChart'), {
    type: 'bar',
    data: { /* from budgetVsActualData */ }
    // ... config from original
  });

  // Similar for spendingTrend
}

export function initializeDashboard() {
  loadDashboard();
}