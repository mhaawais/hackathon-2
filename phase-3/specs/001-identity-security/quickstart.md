# Quickstart: Identity & Security Layer

**Branch**: `001-identity-security` | **Date**: 2026-02-17

## Prerequisites

- Node.js 20+
- Python 3.11+
- Neon PostgreSQL database (get connection string from [Neon console](https://console.neon.tech))

## Environment Setup

1. Copy the environment template:
   ```bash
   cp phase-2/.env.example phase-2/.env
   ```

2. Fill in your `.env` values:
   ```
   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
   BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
   BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

## Backend Setup

```bash
cd phase-2/src/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Initialize database (creates todo table)
python -m app.db.init_db

# Start the server
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup

```bash
cd phase-2/src/frontend

# Install dependencies
npm install

# Copy env for Next.js
cp ../../.env .env.local

# Run Better Auth migrations (creates user, session, account tables)
npx @better-auth/cli migrate

# Start the dev server
npm run dev
```

## Verification

1. Open http://localhost:3000 — should see the landing page
2. Navigate to sign-up, create an account
3. Sign in with the same credentials
4. Access the dashboard — should see empty todo list
5. Open http://localhost:8000/api/health — should return `{"status": "ok"}`

## Running Tests

```bash
# Backend tests
cd phase-2/src/backend
pytest tests/ -v

# All tests should pass:
# - test_jwt_verification.py (token validation)
# - test_todo_routes.py (CRUD endpoints)
# - test_user_isolation.py (cross-user prevention)
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | Shared JWT signing secret | `my-super-secret-key-at-least-32-chars` |
| `BACKEND_URL` | FastAPI base URL | `http://localhost:8000` |
| `NEXT_PUBLIC_API_URL` | Public API URL for browser | `http://localhost:8000/api` |
