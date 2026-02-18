// src/dashboard.js

import { state } from './state.js';
import { fetchData } from './api.js';

let charts = {
  budgetVsActual: null,
  spendingTrend: null
};

export async function loadDashboard() {
  try {
    // Fetch real data (add this endpoint in routes.py if missing)
    const budgetData = await fetchData('/analytics/budget-vs-actual') || {};
    const trendData = await fetchData('/analytics/spending-trend') || {};

    console.log('Dashboard data loaded:', { budgetData, trendData }); // debug

    // Safe update summaries (use 0 if missing)
    const plannedTotal = Number(budgetData.planned_total ?? 0);
    document.getElementById('totalPlanned').textContent = `$${plannedTotal.toFixed(2)}`;

    const actualTotal = Number(budgetData.actual_total ?? 0);
    document.getElementById('totalActual').textContent = `$${actualTotal.toFixed(2)}`;

    const difference = plannedTotal - actualTotal;
    document.getElementById('totalDiff').textContent = `$${difference.toFixed(2)}`;
    // Add class for color: red if over, green if under
    document.getElementById('totalDiff').className = difference >= 0 ? 'text-success' : 'text-danger';

    // Uncategorized count
    const uncat = state.transactions.filter(t => !t.category_id).length;
    document.getElementById('uncategorizedCount').textContent = uncat;

    // Charts (only init if canvas exists and data present)
    const ctx1 = document.getElementById('budgetVsActualChart');
    if (ctx1 && budgetData.categories) {
      if (charts.budgetVsActual) charts.budgetVsActual.destroy();
      charts.budgetVsActual = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: budgetData.categories.map(c => c.name),
          datasets: [
            { label: 'Planned', data: budgetData.categories.map(c => c.planned), backgroundColor: '#36A2EB' },
            { label: 'Actual', data: budgetData.categories.map(c => c.actual), backgroundColor: '#FF6384' }
          ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    // Add similar for spendingTrendChart if you have data

  } catch (err) {
    console.error('Dashboard load failed:', err);
    // Show fallback message in UI
    document.getElementById('totalPlanned').textContent = '$0.00 (error loading)';
  }
}

export function initializeDashboard() {
  loadDashboard();
}