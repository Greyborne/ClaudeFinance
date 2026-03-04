// src/state.js
import { loadAllData, fetchData } from './api.js';

/**
 * Global state object that holds all necessary data for the application.
 */
const state = {
  categories: [],
  transactions: [],
  payPeriods: [],
  categoryRules: [],
  recurringTemplates: [],
  plannedAmounts: [],     // Added here so budgetTable.js can access it
  categoryGroups: []     // Added here for group management
};

/**
 * Initializes the global state by loading all necessary data.
 */
export async function initializeState() {
  console.log('Starting state initialization...');
  const data = await loadAllData();
  console.log('loadAllData returned:', data);
  Object.assign(state, data);
  
  try {
    const groups = await fetchData('/category-groups');
    console.log('Fetched groups from API:', groups);
    state.categoriesGroups = groups || [];  // fallback to empty array if null/undefined
  } catch (err) {
    console.error('Failed to fetch category-groups:', err);
    state.categoriesGroups = [];
  }

  console.log('Final state after load:', {
    categories: state.categories,
    categoriesGroups: state.categoriesGroups
  });
  
  
  //const groups = await fetchData('/category-groups');  // NEW: Load category groups
  //state.categoryGroups = groups;
}
  
  //{
//      categories: data.categories ?? state.categories,
//      transactions: data.transactions ?? state.transactions,
//      payPeriods: data.payPeriods ?? state.payPeriods,
//      categoryRules: data.categoryRules ?? state.categoryRules,
//      recurringTemplates: data.recurringTemplates ?? state.recurringTemplates,
//      plannedAmounts: data.plannedAmounts ?? state.plannedAmounts,
//      categoryGroups: data.categoryGroups ?? state.categoryGroups
//  });
  /*await loadCategoriesAndGroups();*/
//}

/**
 * Named export of the state object so other modules can import it directly:
 *    import { state } from './state.js';
 */
export { state };