// app/sort.js

import { state } from './state.js';
import { fetchData } from './api.js';
import { renderCategories } from './categories.js';


export async function moveCategoryUp(categoryId) {
  await adjustSortOrder(categoryId, -1);
}

export async function moveCategoryDown(categoryId) {
  await adjustSortOrder(categoryId, +1);
}

async function adjustSortOrder(categoryId, direction) {
  console.log(`Adjusting sort for cat ${categoryId}, direction ${direction}`);

  const cat = state.categories.find(c => c.id === categoryId);
  if (!cat) {
    console.warn('Category not found');
    return;
  }

  // Get all siblings in same group, sorted by current sort_order
  let siblings = state.categories
    .filter(c => c.group_id === cat.group_id && c.category_type === cat.category_type)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const currentIndex = siblings.findIndex(c => c.id === categoryId);
  if (currentIndex === -1) return;

  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= siblings.length) {
    console.log('At boundary, no move');
    return;
  }

  // Remove the moved category from siblings
  const moved = siblings.splice(currentIndex, 1)[0];

  // Insert it at new position
  siblings.splice(newIndex, 0, moved);

  // Re-assign sequential sort_order (0, 1, 2, ...)
  siblings.forEach((sibling, idx) => {
    sibling.sort_order = idx;
  });

  console.log('New sibling orders:', siblings.map(s => `${s.id}: ${s.sort_order}`));

  // Re-render immediately (optimistic UI)
  renderCategories();

  // Save ALL affected categories to backend
  try {
    console.log('Saving sort orders to backend...');
    for (const sibling of siblings) {
      await fetchData(`/categories/${sibling.id}/sort`, 'PUT', { sort_order: sibling.sort_order });
    }
    console.log('All saves successful');
  } catch (err) {
    console.error('Sort save failed:', err);
    // Optional: revert state on error
  }
}