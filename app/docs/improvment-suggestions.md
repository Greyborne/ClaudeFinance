# Improvement Suggestions – Personal Budget Manager

Tracking ideas, fixes, UX enhancements, performance, and architecture improvements as we build this app to replace your Google Sheets budget system.

Last updated: February 2025 (feel free to update date when we edit)

## 1. Core Functionality Gaps

- [ ] **Tab switching logic** is missing or incomplete  
  → Add click handlers to `.tab-btn` elements that toggle `.active` class on buttons and `.tab-content` divs

- [ ] **Dashboard charts are not populated**  
  → Implement data aggregation + Chart.js rendering for:
    - Budget vs Actual (bar chart per category or grouped)
    - Spending Trend (line chart over pay periods or months)

- [ ] **Saving planned amounts / due dates** is only partially wired  
  → POST/PUT to backend endpoint (e.g. `/planned-amounts`) when amount input changes or due day is selected

- [ ] **Clearing/resetting pay period status** UI missing  
  → Add checkbox or button per cell/period to mark as "cleared/paid" → updates backend `is_cleared`

- [ ] **Income tracking** is not yet surfaced in dashboard or budget table  
  → Add income rows or separate summary section

## 2. UX / Usability Enhancements

- [ ] **Currency input UX** – current $ on focus/blur is okay but fragile  
  → Consider using `<input type="number" step="0.01">` + prefix styling, or dedicated currency masked input library (e.g. cleave.js or simple custom formatter)

- [ ] **Add loading states / spinners**  
  → Show spinner when fetching initial data, uploading CSV, saving changes

- [ ] **Sortable categories** in Settings  
  → Drag-and-drop reordering of categories (updates `sort_order`)

- [ ] **Collapsible category groups** in budget table & settings  
  → If using parent categories, allow collapsing subcategories

- [ ] **Mobile/responsive layout**  
  → Current grid/table design likely breaks on small screens → add media queries, horizontal scroll on tables, stack cards on dashboard

- [ ] **Quick-add transaction from dashboard**  
  → Floating action button or shortcut to open manual transaction modal

## 3. Data & Backend Integration

- [ ] **Consistent ID types**  
  → Backend should always return numeric IDs (not strings). Frontend already uses `Number()` in places — centralize this coercion or fix at source.

- [ ] **Bulk actions on transactions**  
  → Select multiple → categorize / delete / export

- [ ] **Auto-categorization rules editor UI** incomplete  
  → Build form/modal to create rules (contains text, amount range, assign category, priority, etc.)

- [ ] **Recurring templates application logic** missing  
  → When clicking "Apply Templates", generate planned amounts or transactions for selected periods

- [ ] **CSV import mapping & preview step**  
  → After file upload, show preview table + column mapping UI before importing

## 4. Code Quality & Maintainability

- [ ] **Central event delegation** instead of many individual listeners  
  → Use event delegation on `#budgetTable`, `#transactionsTable`, etc.

- [ ] **Extract shared utilities**  
  → `formatCurrency()`, `parseCurrency()`, `showModal()`, `hideModal()`, `apiErrorHandler()`

- [ ] **Add basic TypeScript** (optional future step)  
  → Convert `.js` → `.ts`, define interfaces for state shape, API responses

- [ ] **Error boundaries / global error handler**  
  → Catch unhandled promise rejections and show user-friendly message

## 5. Nice-to-Have / Future Features

- [ ] Export budget & transactions (CSV, PDF)
- [ ] Monthly/annual rollover behavior options
- [ ] Visual progress bars per category (budget vs actual)
- [ ] Dark mode toggle
- [ ] Search/filter transactions by date range, amount, description
- [ ] Multi-currency support (probably far future)

## Prioritization Suggestion (as of now)

**Must-have before usable MVP:**
1. Tab switching
2. Save planned amounts & due dates
3. Populate dashboard summary numbers (even without charts)
4. Finish CSV import flow (at least basic parsing + save)

**High value / quick wins:**
- Better currency input handling
- Loading indicators
- Collapsible parent categories


* The new modular frontend is in $${\color{orange}\textsf{app/static/js/src/}}$$
* The entry point is $${\color{orange}\textsf{app/static/js/src/app.js}}$$ (loaded via <script type="module"> in index.html)
* The old single-file version remains in $${\color{orange}\textsf{app/static/js/app.js}}$$ (for reference / rollback)
* All API calls are prefixed with $${\color{orange}\textsf{/api}}$$ (handled in $${\color{orange}\textsf{routes.py}}$$)
* Database schema changes → make model changes → run flask db migrate → commit the new migration file

# Planned / in-progress features

* Finish modular JS migration (dashboard charts, utils)
* Recurring expense templates with auto-population across pay periods
* Budget rollover / carryover logic
* Mobile/responsive layout improvements
* CSV import preview + manual category mapping
* Export budget reports (CSV / PDF)
* Dark mode toggle