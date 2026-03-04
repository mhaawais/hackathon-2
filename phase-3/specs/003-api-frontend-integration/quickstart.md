# Quickstart: Running Phase-2 Locally

**Branch**: `003-api-frontend-integration` | **Date**: 2026-02-19

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Neon PostgreSQL database (free tier is sufficient)
- Git

---

## Step 1 — Clone and set up environment variables

```bash
git clone <repo-url>
cd hackathon-2/phase-2
cp .env.example .env
```

Edit `.env` and fill in all required values:

```env
# Neon PostgreSQL connection string
DATABASE_URL=postgresql+psycopg2://user:password@host/dbname?sslmode=require

# JWT shared secret — must be the same value used by Better Auth
JWT_SECRET=your-very-long-random-secret-at-least-32-chars

# Better Auth secret (can be the same as JWT_SECRET or different)
BETTER_AUTH_SECRET=your-better-auth-secret

# Backend base URL (used by the frontend server-side)
BACKEND_URL=http://localhost:8000

# Public API URL (used by the frontend client-side)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Where to get `DATABASE_URL`**: Create a free project at [neon.tech](https://neon.tech), then copy the connection string from the project dashboard.

---

## Step 2 — Start the backend

```bash
cd src/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend starts at `http://localhost:8000`.

Verify it's running:
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

Interactive API docs: `http://localhost:8000/docs`

**On first run**, Better Auth will create the `user` and `session` tables automatically. The `todo` table is created by SQLModel on startup.

---

## Step 3 — Start the frontend

In a separate terminal:

```bash
cd src/frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:3000`.

---

## Step 4 — Verify the full flow

1. **Open** `http://localhost:3000` in your browser.
2. **Sign up**: Click "Sign Up", enter email/password, submit.
3. **You're redirected** to the dashboard.
4. **Add a todo**: Enter a title in the input field, click "Add".
5. **List**: Your new todo appears in the list.
6. **Complete**: Click the checkbox/complete button — status changes to `completed`.
7. **Update**: Click edit, change the title or description, save.
8. **Delete**: Click the delete button — todo is removed.
9. **Sign out**: The session ends; revisiting `/dashboard` redirects to `/sign-in`.

---

## Running Tests

### Backend tests

```bash
cd src/backend
pytest tests/ -v
# Expected: 15+ tests passing
```

### With coverage

```bash
pytest tests/ -v --cov=app --cov-report=term-missing
```

---

## Environment Variable Reference

| Variable | Used by | Required |
|----------|---------|----------|
| `DATABASE_URL` | Backend, DB migrations | Yes |
| `JWT_SECRET` | Backend JWT verification | Yes |
| `BETTER_AUTH_SECRET` | Better Auth (frontend + backend) | Yes |
| `BACKEND_URL` | Frontend (server-side requests) | Yes |
| `NEXT_PUBLIC_API_URL` | Frontend (client-side requests) | Yes |

---

## Troubleshooting

**`401 Unauthorized` on all todo requests**
- Check that `JWT_SECRET` matches between backend `.env` and Better Auth config.
- Verify the session token is being sent in the `Authorization: Bearer` header.

**`Cannot connect to database`**
- Verify `DATABASE_URL` is correct and the Neon project is not suspended (free tier auto-suspends after inactivity).
- Add `?sslmode=require` to the connection string if missing.

**Dashboard redirects to `/sign-in` immediately**
- `middleware.ts` must exist at `src/frontend/src/middleware.ts`. If it's missing or named `proxy.ts`, the middleware is not active.

**`Module not found` errors on frontend start**
- Run `npm install` inside `src/frontend/` (not the repo root).

**Backend starts but `/docs` returns 404**
- Ensure you're running `uvicorn app.main:app` from within `src/backend/`, not from the repo root.
