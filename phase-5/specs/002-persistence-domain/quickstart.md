# Quickstart: Persistence & Domain Layer

**Branch**: `002-persistence-domain` | **Date**: 2026-02-18

## Prerequisites

- Python 3.11+
- Neon Postgres database provisioned
- `.env` file with `DATABASE_URL` set

## Setup

1. Ensure `.env` contains:
   ```
   DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
   ```

2. Initialize the database schema:
   ```bash
   cd src/backend
   python -c "from app.db import engine; from sqlmodel import SQLModel; from app.models.todo import Todo; SQLModel.metadata.create_all(engine)"
   ```

3. Start the backend:
   ```bash
   cd src/backend
   uvicorn app.main:app --reload --port 8000
   ```

## Verify Persistence

1. Create a task via API (requires valid JWT):
   ```bash
   curl -X POST http://localhost:8000/api/todos \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test persistence"}'
   ```

2. Restart the backend server.

3. List tasks — the created task should still be there:
   ```bash
   curl http://localhost:8000/api/todos \
     -H "Authorization: Bearer <token>"
   ```

## Run Tests

```bash
cd src/backend
python -m pytest tests/ -v
```

## Key Files

| File | Purpose |
|------|---------|
| `src/backend/app/db.py` | Engine creation, session dependency |
| `src/backend/app/models/todo.py` | SQLModel table definition |
| `src/backend/app/services/todo_service.py` | Repository layer (all CRUD) |
| `src/backend/app/models/schemas.py` | Pydantic request/response models |
