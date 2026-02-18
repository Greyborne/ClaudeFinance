// src/budgetTable.js

import { state } from './state.js';
import { fetchData } from './api.js';  // For saving

async function renderBudgetTable() {
  const table = document.getElementById('budgetTable');
  const thead = table.querySelector('thead tr');
  const tbody = table.querySelector('tbody');

  thead.innerHTML = '<th>Category</th><th>Due Day</th>';
  tbody.innerHTML = '';

  state.payPeriods.forEach(period => {
    const th = document.createElement('th');
    const date = new Date(period.start_date || period.startdate);
    th.textContent = `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
    thead.appendChild(th);
  });

  const expenseCategories = state.categories.filter(c => c.category_type === 'expense' && !c.is_parent_only);

  expenseCategories.forEach(category => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = category.name;
    tr.appendChild(tdName);

    const tdDueDay = document.createElement('td');
    const dueDaySelect = document.createElement('select');
    dueDaySelect.className = 'due-day-select';
    dueDaySelect.dataset.categoryId = category.id;

    const existingPlanned = state.plannedAmounts.find(p => p.category_id === category.id && p.due_date);
    let selectedDay = existingPlanned ? new Date(existingPlanned.due_date).getDate() : null;

    dueDaySelect.innerHTML = '<option value=""></option>';
    for (let day = 1; day <= 31; day++) {
      const option = document.createElement('option');
      option.value = day;
      option.textContent = day;
      if (day === selectedDay) option.selected = true;
      dueDaySelect.appendChild(option);
    }

    dueDaySelect.addEventListener('change', setRecurringDueDate);
    tdDueDay.appendChild(dueDaySelect);
    tr.appendChild(tdDueDay);

    state.payPeriods.forEach(period => {
      const td = document.createElement('td');
      const planned = state.plannedAmounts.find(p => Number(p.category_id) === Number(category.id) && Number(p.pay_period_id) === Number(period.id));
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.01';
      input.className = 'amount-input';
      input.dataset.categoryId = category.id;
      input.dataset.periodId = period.id;
      input.value = planned ? parseFloat(planned.amount).toFixed(2) : '';
      if (planned && (planned.is_cleared || planned.iscleared)) td.classList.add('cleared');

      input.addEventListener('change', savePlannedAmount);
      input.addEventListener('blur', formatCurrency);
      input.addEventListener('focus', removeCurrencyFormat);

      td.appendChild(input);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

// NEW: Missing handlers from original
async function setRecurringDueDate(event) {
  const select = event.target;
  const categoryId = parseInt(select.dataset.categoryId);
  const day = parseInt(select.value);
  if (!day) return;

  // Save to backend (from original logic)
  await fetchData(`/planned-amounts/due-date`, 'PUT', { category_id: categoryId, due_day: day });
  console.log(`Due day set to ${day} for category ${categoryId}`);
}

async function savePlannedAmount(event) {
  const input = event.target;
  const categoryId = parseInt(input.dataset.categoryId);
  const periodId = parseInt(input.dataset.periodId);
  let amount = parseFloat(input.value.replace('$', '')) || 0;

  await fetchData('/planned-amounts', 'POST', { category_id: categoryId, pay_period_id: periodId, amount });
  console.log(`Saved amount $${amount} for category ${categoryId}, period ${periodId}`);
}

function formatCurrency(event) {
  const input = event.target;
  let value = parseFloat(input.value.replace('$', '')) || 0;
  input.value = `$${value.toFixed(2)}`;
}

function removeCurrencyFormat(event) {
  const input = event.target;
  input.value = input.value.replace('$', '');
}

export async function initializeBudgetTable() {
  await renderBudgetTable();
}