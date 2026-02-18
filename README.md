# ClaudeFinance

Personal budget manager web app — replacing my Google Sheets tracker.

A self-hosted, single-page budgeting tool with categories, pay periods, planned vs actual tracking, bank CSV imports, auto-categorization rules, recurring templates, and visualizations.

## Current status (February 2026)

- **Backend**: Flask + SQLAlchemy + Alembic migrations  
  (PostgreSQL preferred, SQLite for quick local dev)
- **Frontend**: Vanilla JavaScript (ES modules — no bundler) + Chart.js
- **Containerized**: Docker + docker-compose

## Directory structure

```bash
├── app/
│   ├── init.py
│   ├── models.py                # DB models: BudgetCategory, PayPeriod, PlannedAmount, Transaction, etc.
│   ├── routes.py                # All API endpoints (/api/categories, /api/planned-amounts, analytics, etc.)
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── app.js           # OLD monolithic version (being phased out — kept for reference)
│   │       └── src/             # NEW modular JavaScript files
│   │           ├── app.js       # Main entry point (loaded with type="module")
│   │           ├── state.js
│   │           ├── api.js
│   │           ├── budgetTable.js
│   │           ├── settings.js
│   │           ├── transactions.js
│   │           ├── modals.js
│   │           ├── dashboard.js     # (in progress / planned)
│   │           └── utils.js         # (in progress / planned shared helpers)
│   └── templates/
│       └── index.html           # Single-page app with tabs, modals, charts
├── migrations/                  # Alembic migration scripts
├── Dockerfile
├── docker-compose.yaml
├── requirements.txt
├── run.py                       # Local development entrypoint (flask run)
└── README.md
```

## Docker Compose Commands

```bash
# Build and start (first time or after code changes)
docker compose up --build

# Or start in detached/background mode
docker compose up -d --build

# Open in browser
http://localhost:5000

# Stop when finished
docker compose down
```
### Non-Docker local development (optional)
```Bash
# Install dependencies
pip install -r requirements.txt

# Apply any pending migrations
flask db upgrade

# Run the app
flask run
# or
python run.py
```
## Useful development commands (inside Docker container or local env)
### Enter the running web container
```bash
docker compose exec web bash
```
### Inside container or local env:
```bash
flask db migrate          # Create new migration after model changes
flask db upgrade          # Apply migrations
flask db downgrade        # Roll back last migration (careful!)
```

# Development notes

The new modular frontend is in app/static/js/src/
The entry point is app/static/js/src/app.js (loaded via <script type="module"> in index.html)
The old single-file version remains in app/static/js/app.js (for reference / rollback)
All API calls are prefixed with /api (handled in routes.py)
Database schema changes → make model changes → run flask db migrate → commit the new migration file

# Planned / in-progress features

Finish modular JS migration (dashboard charts, utils)
Recurring expense templates with auto-population across pay periods
Budget rollover / carryover logic
Mobile/responsive layout improvements
CSV import preview + manual category mapping
Export budget reports (CSV / PDF)
Dark mode toggle

Feedback, suggestions, and pull requests are very welcome!
Charles — Topeka, KS
(February 2026)
