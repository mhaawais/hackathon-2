---
title: TodoMate API
emoji: ✅
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
---

# TodoMate API

FastAPI backend for the TodoMate full-stack web application.

## Endpoints

- `GET /api/health` — Health check
- `POST /api/todos` — Create todo
- `GET /api/todos` — List todos
- `PUT /api/todos/{id}` — Update todo
- `DELETE /api/todos/{id}` — Delete todo
- `PATCH /api/todos/{id}/complete` — Toggle complete

## Environment Variables (set as Secrets in HF Space)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Shared JWT secret (must match frontend) |
| `FRONTEND_URL` | Your Vercel frontend URL (for CORS) |
