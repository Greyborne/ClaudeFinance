// src/state.js
import { loadAllData } from './api.js';

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
};

/**
 * Initializes the global state by loading all necessary data.
 */
export async function initializeState() {
  const data = await loadAllData();
  // Merge safely – only overwrite keys that exist, preserve defaults otherwise
Object.assign(state, {
    categories: data.categories ?? state.categories,
    transactions: data.transactions ?? state.transactions,
    payPeriods: data.payPeriods ?? state.payPeriods,
    categoryRules: data.categoryRules ?? state.categoryRules,
    recurringTemplates: data.recurringTemplates ?? state.recurringTemplates,
    plannedAmounts: data.plannedAmounts ?? state.plannedAmounts,
  });
}

/**
 * Named export of the state object so other modules can import it directly:
 *    import { state } from './state.js';
 */
export { state };