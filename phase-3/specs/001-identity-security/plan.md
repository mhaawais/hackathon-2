# Implementation Plan: Identity & Security Layer

**Branch**: `001-identity-security` | **Date**: 2026-02-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-identity-security/spec.md`

## Summary

Implement secure multi-user authentication and authorization. Better Auth handles all auth operations (signup, signin, JWT issuance) on the Next.js frontend. The FastAPI backend only verifies JWTs using a shared secret — it has no auth endpoints of its own. This cleanly separates concerns per Constitution Principle IV.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript (frontend)
**Primary Dependencies**: FastAPI, SQLModel, PyJWT, Better Auth, Next.js 16+
**Storage**: Neon Serverless PostgreSQL
**Testing**: pytest (backend), vitest (frontend)
**Target Platform**: Web application (Linux server / Vercel)
**Project Type**: Web (frontend + backend)
**Performance Goals**: Token verification < 100ms overhead per request
**Constraints**: Shared `BETTER_AUTH_SECRET`, stateless backend, zero-trust
**Scale/Scope**: Multi-user todo app, standard web traffic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Zero Trust Backend | PASS | user_id extracted only from verified JWT via `get_current_user()` |
| II | Strict User Isolation | PASS | All DB queries filter by user_id; ownership check returns 403 |
| III | Spec-Driven Development | PASS | Plan follows spec.md |
| IV | Separation of Concerns | PASS | Better Auth (frontend), FastAPI (backend), Neon (DB) |
| V | Deterministic API Contracts | PASS | All endpoints documented in contracts/ |
| VI | Stateless Backend | PASS | JWT-only verification; no session store |
| VII | Production-Ready | PASS | All secrets via env vars; .env.example committed |
| VIII | Security Standards | PASS | JWT verified every request; 401/403 proper; passwords hashed |
| IX | Database Standards | PASS | SQLModel; UUID PK; timestamps; user_id index; FK |
| X | Frontend Standards | PASS | App Router; Better Auth; Bearer header; Tailwind responsive |

## Project Structure

### Documentation (this feature)

```text
specs/001-identity-security/
├── spec.md              # Feature requirements
├── plan.md              # This file
├── research.md          # Phase 0 research decisions
├── data-model.md        # Entity definitions
├── quickstart.md        # Setup instructions
├── contracts/           # API endpoint contracts
│   ├── auth-endpoints.md
│   └── todo-endpoints.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /sp.tasks)
```

### Source Code (repository root)

```text
phase-2/
├── .env.example
├── src/
│   ├── frontend/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/page.tsx
│   │   │   │   └── sign-up/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── api/auth/[...all]/route.ts
│   │   ├── components/auth/
│   │   │   ├── sign-in-form.tsx
│   │   │   └── sign-up-form.tsx
│   │   └── lib/
│   │       ├── auth.ts
│   │       ├── auth-client.ts
│   │       └── api.ts
│   ├── backend/
│   │   ├── requirements.txt
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── auth/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── jwt_bearer.py
│   │   │   │   └── dependencies.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── todo.py
│   │   │   │   └── schemas.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── health.py
│   │   │   │   └── todos.py
│   │   │   └── services/
│   │   │       ├── __init__.py
│   │   │       └── todo_service.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── conftest.py
│   │       ├── test_jwt_verification.py
│   │       ├── test_todo_routes.py
│   │       └── test_user_isolation.py
│   └── db/
│       ├── connection.py
│       └── init_db.py
└── tests/
    ├── test_auth_flow.py
    └── test_cross_user_isolation.py
```

**Structure Decision**: Web application layout with `src/frontend/` and `src/backend/` separation, plus shared `src/db/` layer. Matches CLAUDE.md repository structure template.

## Complexity Tracking

No constitution violations detected. No justifications needed.

## Implementation Steps

### Step 1: Project Scaffolding & Environment
- Create `.env.example` with DATABASE_URL, BETTER_AUTH_SECRET, BACKEND_URL, NEXT_PUBLIC_API_URL
- Initialize Next.js in `src/frontend/`
- Create `requirements.txt` in `src/backend/` (fastapi, uvicorn, sqlmodel, pyjwt, psycopg2-binary, python-dotenv, httpx)

### Step 2: Auth Agent — Better Auth Configuration (Frontend)
- `lib/auth.ts`: Server config with emailAndPassword, cookie cache `strategy: "jwt"`
- `lib/auth-client.ts`: Client instance
- `app/api/auth/[...all]/route.ts`: Catch-all handler
- Run Better Auth migrations

### Step 3: Auth Agent — JWT Verification Middleware (Backend)
- `app/config.py`: Load env vars
- `app/auth/jwt_bearer.py`: PyJWT HS256 decode/verify
- `app/auth/dependencies.py`: `get_current_user()` FastAPI dependency

### Step 4: DB Agent — Database Layer
- `src/db/connection.py`: SQLModel engine + session
- `app/models/todo.py`: Todo model (UUID PK, timestamps, user_id FK)
- `src/db/init_db.py`: Create todo table

### Step 5: Backend Agent — API Routes
- `app/main.py`: FastAPI app, CORS, routers
- `app/models/schemas.py`: Pydantic schemas
- `app/routes/`: health.py, todos.py
- `app/services/todo_service.py`: Business logic with ownership enforcement

### Step 6: Frontend Agent — Auth UI & Integration
- Sign-up/sign-in pages
- `lib/api.ts`: Fetch wrapper with Bearer token
- Dashboard page
- 401 redirect, route protection middleware

## Risks

1. **Better Auth JWT payload structure**: Claims (`sub` vs `userId`) undocumented for cookie-cache JWT. Mitigate: decode test JWT in Step 2.
2. **Token extraction**: Better Auth uses cookies; extracting for Bearer header needs testing. Mitigate: test during Step 2.
3. **Schema ownership**: Better Auth and SQLModel share DB. Mitigate: Better Auth migrates first; SQLModel only creates `todo` table.
