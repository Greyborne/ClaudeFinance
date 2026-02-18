// Global state
let state = {
    categories: [],
    payPeriods: [],
    plannedAmounts: [],
    transactions: [],
    categoryRules: [],
    recurringTemplates: []
};

let charts = {
    budgetVsActual: null,
    spendingTrend: null
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeModals();
    loadAllData();
    setupEventListeners();
});

// Tab switching
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
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Refresh data for specific tabs
    if (tabName === 'dashboard') {
        loadDashboard();
    } else if (tabName === 'budget') {
        renderBudgetTable();
    } else if (tabName === 'transactions') {
        renderTransactions();
    } else if (tabName === 'settings') {
        renderSettings();
    }
}

// Load all data from API
async function loadAllData() {
    try {
        console.log('Fetching categories...');
        const categories = await fetch('/api/categories').then(r => {
            console.log('Categories response status:', r.status);
            return r.json();
        });
        
        console.log('Fetching pay periods...');
        const payPeriods = await fetch('/api/pay-periods').then(r => {
            console.log('Pay periods response status:', r.status);
            return r.json();
        });
        
        console.log('Fetching planned amounts...');
        const plannedAmounts = await fetch('/api/planned-amounts').then(r => {
            console.log('Planned amounts response status:', r.status);
            return r.json();
        });
        
        console.log('Fetching transactions...');
        const transactions = await fetch('/api/transactions').then(r => {
            console.log('Transactions response status:', r.status);
            return r.json();
        });
        
        console.log('Fetching rules...');
        const rules = await fetch('/api/category-rules').then(r => {
            console.log('Rules response status:', r.status);
            return r.json();
        });
        
        console.log('Fetching templates...');
        const templates = await fetch('/api/recurring-templates').then(r => {
            console.log('Templates response status:', r.status);
            return r.json();
        });
        
        state.categories = categories;
        state.payPeriods = payPeriods;
        state.plannedAmounts = plannedAmounts;
        state.transactions = transactions;
        state.categoryRules = rules;
        state.recurringTemplates = templates;
        
        loadDashboard();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please refresh the page.Debug info in console.');
    }
}


// Dashboard
async function loadDashboard() {
    try {
        const [budgetVsActual, spendingTrend] = await Promise.all([
            fetch('/api/analytics/budget-vs-actual').then(r => r.json()),
            fetch('/api/analytics/spending-trend').then(r => r.json())
        ]);
        
        renderBudgetVsActualChart(budgetVsActual);
        renderSpendingTrendChart(spendingTrend);
        updateSummaryStats(budgetVsActual);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderBudgetVsActualChart(data) {
    const ctx = document.getElementById('budgetVsActualChart');
    
    if (charts.budgetVsActual) {
        charts.budgetVsActual.destroy();
    }
    
    const expenseData = data.filter(d => d.category_type === 'expense');
    
    charts.budgetVsActual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: expenseData.map(d => d.category_name),
            datasets: [
                {
                    label: 'Planned',
                    data: expenseData.map(d => d.planned),
                    backgroundColor: 'rgba(52, 152, 219, 0.7)'
                },
                {
                    label: 'Actual',
                    data: expenseData.map(d => d.actual),
                    backgroundColor: 'rgba(231, 76, 60, 0.7)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value.toFixed(2)
                    }
                }
            }
        }
    });
}

function renderSpendingTrendChart(data) {
    const ctx = document.getElementById('spendingTrendChart');
    
    if (charts.spendingTrend) {
        charts.spendingTrend.destroy();
    }
    
    charts.spendingTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.period),
            datasets: [{
                label: 'Total Spending',
                data: data.map(d => d.total),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value.toFixed(2)
                    }
                }
            }
        }
    });
}

function updateSummaryStats(budgetData) {
    const expenses = budgetData.filter(d => d.category_type === 'expense');
    const totalPlanned = expenses.reduce((sum, d) => sum + d.planned, 0);
    const totalActual = expenses.reduce((sum, d) => sum + d.actual, 0);
    const uncategorized = state.transactions.filter(t => !t.is_categorized).length;
    
    document.getElementById('totalPlanned').textContent = '$' + totalPlanned.toFixed(2);
    document.getElementById('totalActual').textContent = '$' + totalActual.toFixed(2);
    document.getElementById('totalDiff').textContent = '$' + (totalPlanned - totalActual).toFixed(2);
    document.getElementById('uncategorizedCount').textContent = uncategorized;
}

function formatCurrency(event) {
    const input = event.target;
    const value = parseFloat(input.value.replace(/[^0-9.]/g, ''));  // Remove non-numeric
    
    if (value > 0) {
        input.value = '$' + value.toFixed(2);  // Add the $ here too
        input.classList.add('has-value');
    } else {
        input.value = '0';
        input.classList.remove('has-value');
    }
}

function removeCurrencyFormat(event) {
    const input = event.target;
    // Remove $ for editing
    if (input.value.startsWith('$')) {
        input.value = input.value.substring(1);
    }
    input.classList.remove('has-value');
}

// Budget Table
function renderBudgetTable() {
    const table = document.getElementById('budgetTable');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    
    // Clear existing content
    thead.innerHTML = '<th>Category</th><th>Due Day</th>';
    tbody.innerHTML = '';
    
    // Add pay period columns
    state.payPeriods.forEach(period => {
        const th = document.createElement('th');
        const dateStr = period.start_date || period.startdate;
        const date = new Date(dateStr);
        // Format as 2/19/26 (month/day/2-digit year)
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = String(date.getFullYear()).slice(-2); // Last 2 digits
        
        th.textContent = `${month}/${day}/${year}`;
        th.style.fontSize = '12px';
        thead.appendChild(th);
    });
    
    // Add expense categories
    const expenseCategories = state.categories.filter(c => c.category_type === 'expense' && !c.is_parent_only);

    expenseCategories.forEach(category => {
        const tr = document.createElement('tr');
        
        // Category name
        const tdName = document.createElement('td');
        tdName.textContent = category.name;
        tr.appendChild(tdName);
        
        // Due day dropdown
        const tdDueDay = document.createElement('td');
        const dueDaySelect = document.createElement('select');
        dueDaySelect.className = 'due-day-select';
        dueDaySelect.dataset.categoryId = category.id;
        
        // Find if this category already has a due day set
        const existingPlanned = state.plannedAmounts.find(p => 
            p.category_id === category.id && p.due_date
        );
        let selectedDay = null;
        if (existingPlanned && existingPlanned.due_date) {
            selectedDay = new Date(existingPlanned.due_date).getDate();
        }
        
        // Add default option (blank)
        dueDaySelect.innerHTML = '<option value=""></option>';
        
        // Add days 1-31
        for (let day = 1; day <= 31; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            if (day === selectedDay) {
                option.selected = true;
            }
            dueDaySelect.appendChild(option);
        }
        
        dueDaySelect.addEventListener('change', setRecurringDueDate);
        tdDueDay.appendChild(dueDaySelect);
        tr.appendChild(tdDueDay);
        
        // Amount inputs for each pay period
        state.payPeriods.forEach(period => {
            const td = document.createElement('td');

            // Use Number() to handle possible string IDs from JSON
            const planned = state.plannedAmounts.find(p =>
                Number(p.category_id) === Number(category.id) &&
                Number(p.pay_period_id) === Number(period.id)
            );

            console.log('Looking for:', {
                categoryId: category.id,
                periodId: period.id,
                found: !!planned,
                plannedData: planned ? { amount: planned.amount, cleared: planned.is_cleared || planned.iscleared } : null
            });

            const input = document.createElement('input');
            input.type = 'text';                    // was 'number'
            input.className = 'amount-input';
            input.dataset.categoryId = category.id;
            input.dataset.periodId = period.id;

            // Parse amount safely
            let amount = 0;
            if (planned && planned.amount != null) {
                amount = parseFloat(planned.amount);
                if (isNaN(amount)) amount = 0;
            }

            console.log('→ parsed amount:', amount, '(raw:', planned?.amount, ')');

            if (amount > 0) {
                // Option A: Include $ in value (simpler, reliable)
                input.value = '$' + amount.toFixed(2);
                input.classList.add('has-value');

                // Option B: If you prefer CSS-only $, use this instead:
                // input.value = amount.toFixed(2);
                // input.classList.add('has-value');

                console.log('→ set value to:', input.value);
            } else {
                input.value = '';
                console.log('→ left blank (amount <= 0)');
            }

            // Optional: better placeholder
            input.placeholder = '0.00';

            // Cleared styling
            if (planned && (planned.is_cleared || planned.iscleared)) {
                td.classList.add('cleared');
            }

            // Event listeners
            input.addEventListener('change', savePlannedAmount);
            input.addEventListener('blur', formatCurrency);
            input.addEventListener('focus', removeCurrencyFormat);

            td.appendChild(input);
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}
  
async function savePlannedAmount(event) {
    const input = event.target;
    const categoryId = parseInt(input.dataset.categoryId);
    const periodId = parseInt(input.dataset.periodId);
    
    // Remove $ and parse
    // const amount = parseFloat(input.value.replace(/[^0-9.]/g, '')) || 0;
    const value = parseFloat((input.value || '').replace(/[^0-9.]/g, '')) || 0;

    try {
        const response = await fetch('/api/planned-amounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category_id: categoryId,
                pay_period_id: periodId,
                // amount: amount
                amount: value
            })
        });
        
        if (response.ok) {
            const updated = await response.json();
            
            // Update state - FIX: Use category_id and pay_period_id
            // const index = state.plannedAmounts.findIndex(p => 
            //     p.category_id === categoryId && p.pay_period_id === periodId
            const index = state.plannedAmounts.findIndex(p =>
                Number(p.categoryid) === categoryId &&
                Number(p.payperiodid) === periodId
            );
            
            if (index >= 0) {
                state.plannedAmounts[index] = updated;
            } else {
                state.plannedAmounts.push(updated);
            }
            // Re‑format after save
            formatCurrency({ target: input });
        } else {
            alert('Error saving amount');
        }
    } catch (error) {
        console.error('Error saving planned amount:', error);
        alert('Error saving amount');
    }
}

async function createRecurringExpense(event) {
    const input = event.target;
    const categoryId = parseInt(input.dataset.categoryId);
    const dueDay = parseInt(input.value);
    
    if (!dueDay || dueDay < 1 || dueDay > 31) {
        alert('Please enter a valid day (1-31)');
        return;
    }
    
    const frequencySelect = input.parentElement.querySelector('.frequency-select');
    const frequency = frequencySelect.value;
    
    const amountStr = prompt('Enter the recurring amount for this expense:');
    const amount = parseFloat(amountStr);
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        const response = await fetch('/api/expenses/recurring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category_id: categoryId,
                amount: amount,
                due_day: dueDay,
                frequency: frequency
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            await loadAllData();
            renderBudgetTable();
        }
    } catch (error) {
        console.error('Error creating recurring expense:', error);
        alert('Error creating recurring expense');
    }
}

async function setRecurringDueDate(event) {
    const input = event.target;
    const categoryId = parseInt(input.dataset.categoryId);
    const dueDay = parseInt(input.value);
    
    if (!dueDay || dueDay < 1 || dueDay > 31) {
        alert('Please enter a valid day (1-31)');
        return;
    }
    
    const amountStr = prompt('Enter the amount for this recurring expense:');
    const amount = parseFloat(amountStr);
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        input.value = '';
        return;
    }
    
    try {
        let updatedCount = 0;
        
        // Loop through all pay periods and add the expense on the due date
        for (const period of state.payPeriods) {
            const startDate = new Date(period.startdate || period.start_date);
            const endDate = new Date(period.enddate || period.end_date);
            
            // Find if the due day falls within this period
            let dueDate = null;
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                if (currentDate.getDate() === dueDay) {
                    dueDate = currentDate.toISOString().split('T')[0];
                    break;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // If due date falls in this period, create/update planned amount
            if (dueDate) {
                const response = await fetch('/api/planned-amounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        category_id: categoryId,
                        pay_period_id: period.id,
                        amount: amount,
                        due_date: dueDate
                    })
                });
                
                if (response.ok) {
                    updatedCount++;
                }
            }
        }
        
        alert(`Set recurring expense for ${updatedCount} pay periods`);
        await loadAllData();
        renderBudgetTable();
        
    } catch (error) {
        console.error('Error setting recurring due date:', error);
        alert('Error setting recurring expense');
    }
}

// Transactions
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

// Settings
function renderSettings() {
    renderCategoryLists();
    renderCategoryRules();
    renderRecurringTemplates();
}

// Update the renderCategoryLists function
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

// NEW: Render category with its subcategories
function renderCategoryWithChildren(category, container, type, level = 0) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.style.marginLeft = `${level * 20}px`; // Indent subcategories
    
    div.innerHTML = `
        <span>${level > 0 ? '└─ ' : ''}${category.name}</span>
        <div class="category-actions">
            <button class="btn btn-sm btn-secondary" onclick="editCategory(${category.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">Delete</button>
        </div>
    `;
    
    container.appendChild(div);
    
    // Find and render children
    const children = state.categories.filter(c => c.parent_id === category.id);
    children.forEach(child => {
        renderCategoryWithChildren(child, container, type, level + 1);
    });
}

function renderCategoryRules() {
    const list = document.getElementById('categoryRulesList');
    list.innerHTML = '';
    
    state.categoryRules.forEach(rule => {
        const div = document.createElement('div');
        div.className = 'rule-item';
        div.innerHTML = `
            <span><strong>${rule.pattern}</strong> → ${rule.category_name}</span>
            <button class="btn btn-sm btn-danger" onclick="deleteRule(${rule.id})">Delete</button>
        `;
        list.appendChild(div);
    });
}

function renderRecurringTemplates() {
    const list = document.getElementById('recurringTemplatesList');
    list.innerHTML = '';
    
    state.recurringTemplates.forEach(template => {
        const div = document.createElement('div');
        div.className = 'template-item';
        div.innerHTML = `
            <span><strong>${template.name}</strong>: ${template.category_name} - $${template.amount} (${template.frequency})</span>
            <button class="btn btn-sm btn-success" onclick="applyTemplate(${template.id})">Apply</button>
        `;
        list.appendChild(div);
    });
}

// Event Listeners
function setupEventListeners() {
    // Add category buttons
    document.getElementById('addExpenseCategoryBtn').addEventListener('click', () => addCategory('expense'));
    document.getElementById('addIncomeCategoryBtn').addEventListener('click', () => addCategory('income'));
    
     // NEW: Category form submission
    document.getElementById('categoryForm').addEventListener('submit', saveCategoryForm);
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
}

// Modals
function initializeModals() {
    const modal = document.getElementById('uploadModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    const uploadModal = document.getElementById('uploadModal');
    const uploadCloseBtn = uploadModal.querySelector('.close');
    uploadCloseBtn.addEventListener('click', () => {
        uploadModal.classList.remove('show');
    });
        // NEW: Category modal
    const categoryModal = document.getElementById('addCategoryModal');
    const categoryCloseBtn = categoryModal.querySelector('.close');
    categoryCloseBtn.addEventListener('click', () => {
        categoryModal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.remove('show');
        }
        if (e.target === categoryModal) {
            categoryModal.classList.remove('show');
        }
    });
}

function showUploadModal() {
    document.getElementById('uploadModal').classList.add('show');
}

async function uploadTransactions() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/transactions/import', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            document.getElementById('uploadModal').classList.remove('show');
            await loadAllData();
            renderTransactions();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file');
    }
}

// NEW: Save category form
async function saveCategoryForm(event) {
    event.preventDefault();
    
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value;
    const type = document.getElementById('categoryType').value;
    const parentId = document.getElementById('categoryParent').value || null;
    const isParentOnlyCheckbox = document.getElementById('categoryIsParentOnly');
    const isParentOnly = isParentOnlyCheckbox ? isParentOnlyCheckbox.checked : false;
    const sortOrder = parseInt(document.getElementById('categorySortOrder').value) || 0;
    
    const data = {
        name: name,
        category_type: type,
        parent_id: parentId,
        is_parent_only: isParentOnly,  // NEW
        sort_order: sortOrder
    };
    
    try {
        let response;
        if (id) {
            // Update existing
            response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Create new
            response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            await loadAllData();
            renderSettings();
            document.getElementById('addCategoryModal').classList.remove('show');
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Error saving category');
    }
}


// Helper Functions
// Update addCategory function
async function addCategory(type) {
    // Populate parent dropdown with same type categories
    const parentSelect = document.getElementById('categoryParent');
    parentSelect.innerHTML = '<option value="">-- Top Level Category --</option>';
    
    const sameTypeCategories = state.categories.filter(c => c.category_type === type);
    sameTypeCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.parent_id ? `  └─ ${cat.name}` : cat.name;
        parentSelect.appendChild(option);
    });
    
    // Set up modal
    document.getElementById('categoryModalTitle').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)} Category`;
    document.getElementById('categoryType').value = type;
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categorySortOrder').value = '0';
    document.getElementById('categoryParent').value = '';
    
    // Reset checkbox - with safety check
    const isParentOnlyCheckbox = document.getElementById('categoryIsParentOnly');
    if (isParentOnlyCheckbox) {
        isParentOnlyCheckbox.checked = false;
    }
    
    // Open modal (only once!)
    document.getElementById('addCategoryModal').classList.add('show');
}


async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            state.categories = state.categories.filter(c => c.id !== id);
            renderSettings();
        }
    } catch (error) {
        console.error('Error deleting category:', error);
    }
}

async function generatePayPeriods() {
    const startDate = prompt('Enter start date (YYYY-MM-DD):');
    const count = prompt('How many pay periods to generate?', '26');
    
    if (!startDate || !count) return;
    
    try {
        const response = await fetch('/api/pay-periods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start_date: startDate,
                generate_count: parseInt(count),
                interval_days: 14
            })
        });
        
        if (response.ok) {
            await loadAllData();
            alert('Pay periods generated successfully!');
            renderBudgetTable();
        }
    } catch (error) {
        console.error('Error generating pay periods:', error);
    }
}

async function addCategoryRule() {
    const pattern = prompt('Enter pattern to match (e.g., "walmart"):');
    if (!pattern) return;
    
    const categoryId = prompt('Enter category ID:');
    if (!categoryId) return;
    
    try {
        const response = await fetch('/api/category-rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pattern: pattern,
                category_id: parseInt(categoryId)
            })
        });
        
        if (response.ok) {
            const rule = await response.json();
            state.categoryRules.push(rule);
            renderCategoryRules();
        }
    } catch (error) {
        console.error('Error adding rule:', error);
    }
}

async function deleteRule(id) {
    try {
        const response = await fetch(`/api/category-rules/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            state.categoryRules = state.categoryRules.filter(r => r.id !== id);
            renderCategoryRules();
        }
    } catch (error) {
        console.error('Error deleting rule:', error);
    }
}

async function addRecurringTemplate() {
    const name = prompt('Template name:');
    if (!name) return;
    
    const categoryId = prompt('Category ID:');
    const amount = prompt('Amount:');
    const frequency = prompt('Frequency (every_period/monthly/bi_monthly):');
    
    if (!categoryId || !amount || !frequency) return;
    
    try {
        const response = await fetch('/api/recurring-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                category_id: parseInt(categoryId),
                amount: parseFloat(amount),
                frequency: frequency
            })
        });
        
        if (response.ok) {
            const template = await response.json();
            state.recurringTemplates.push(template);
            renderRecurringTemplates();
        }
    } catch (error) {
        console.error('Error adding template:', error);
    }
}

async function applyTemplate(templateId) {
    const periodIds = state.payPeriods.map(p => p.id);
    
    try {
        const response = await fetch(`/api/recurring-templates/${templateId}/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pay_period_ids: periodIds
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(`Applied to ${result.applied_count} pay periods`);
            await loadAllData();
        }
    } catch (error) {
        console.error('Error applying template:', error);
    }
}

// NEW: Edit category function
async function editCategory(id) {
    const category = state.categories.find(c => c.id === id);
    if (!category) return;
    
    // Populate parent dropdown (excluding self and descendants)
    const parentSelect = document.getElementById('categoryParent');
    parentSelect.innerHTML = '<option value="">-- Top Level Category --</option>';
    
    const validParents = state.categories.filter(c => 
        c.category_type === category.category_type && 
        c.id !== id && 
        !isDescendantOf(c, id) // Prevent circular references
    );
    
    validParents.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.parent_id ? `  └─ ${cat.name}` : cat.name;
        if (cat.id === category.parent_id) {
            option.selected = true;
        }
        parentSelect.appendChild(option);
    });
    
    // Set up modal with existing values
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryType').value = category.category_type;
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categorySortOrder').value = category.sort_order || 0;
    document.getElementById('categoryIsParentOnly').checked = category.is_parent_only || false;  // NEW
    document.getElementById('addCategoryModal').classList.add('show');
}

// NEW: Check if a category is a descendant of another
function isDescendantOf(category, ancestorId) {
    let current = category;
    while (current.parent_id) {
        if (current.parent_id === ancestorId) {
            return true;
        }
        current = state.categories.find(c => c.id === current.parent_id);
        if (!current) break;
    }
    return false;
}
