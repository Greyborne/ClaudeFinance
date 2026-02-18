// src/utils.js

import { state } from './state.js';

export function isDescendantOf(category, ancestorId) {
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

export async function editCategory(id) {
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

// Add other utils like generatePeriods, applyTemplates, etc.
export async function generatePayPeriods() {
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
