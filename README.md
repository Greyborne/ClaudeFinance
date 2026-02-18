# ClaudeFinance

Personal budget manager web app (replacing my Google Sheets tracker)

## Current status
- Backend: Flask + SQLAlchemy + PostgreSQL (or SQLite)
- Frontend: Vanilla JavaScript (ES modules) + Chart.js
- Containerized with Docker + docker-compose

## Directory structure (2025–2026 version)
├── app/
│   ├── init.py
│   ├── models.py
│   ├── routes.py               ← main API endpoints
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   │       ├── app.js          ← old monolithic version (being phased out)
│   │       └── src/            ← new modular structure
│   │           ├── app.js      ← new entry point (type="module")
│   │           ├── state.js
│   │           ├── api.js
│   │           ├── budgetTable.js
│   │           ├── settings.js
│   │           ├── transactions.js
│   │           ├── modals.js
│   │           └── (possibly dashboard.js, utils.js, ...)
│   └── templates/
│       └── index.html          ← main page with tabs
├── migrations/                 ← Alembic migration files
├── Dockerfile
├── docker-compose.yaml
├── requirements.txt
├── run.py                      ← development entrypoint (not used in prod)
└── README.md
