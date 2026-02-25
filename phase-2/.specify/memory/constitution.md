<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0
- Added principles:
  1. Zero Trust Backend (new)
  2. Strict User Isolation (new)
  3. Spec-Driven Development (new)
  4. Separation of Concerns (new)
  5. Deterministic API Contracts (new)
  6. Stateless Backend (new)
  7. Production-Ready Standards (new)
  8. Security Standards (new)
  9. Database Standards (new)
  10. Frontend Standards (new)
- Added sections: Technology Constraints, Success Criteria, Governance
- Removed sections: none (initial constitution)
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no conflicts
  - .specify/templates/spec-template.md ✅ no conflicts
  - .specify/templates/tasks-template.md ✅ no conflicts
- Follow-up TODOs: none
-->

# Hackathon II — Phase 2 Full-Stack Multi-User Todo System Constitution

## Core Principles

### I. Zero Trust Backend

Backend MUST never trust frontend-provided `user_id`. All user identity MUST be derived exclusively from a verified JWT. Every protected endpoint MUST require a valid JWT in the `Authorization: Bearer <token>` header.

### II. Strict User Isolation

Every task MUST belong to exactly one user. No user may access, modify, or delete another user's tasks. Ownership MUST be enforced at the database query level — never in application-layer post-filtering alone.

### III. Spec-Driven Development

No manual coding outside approved specifications. All features MUST be defined in Markdown specs before implementation. Each spec MUST include: Purpose, Constraints, Expected behavior, Error cases, and Acceptance criteria. The workflow is: Spec → Plan → Tasks → Implement → Verify.

### IV. Separation of Concerns

Frontend handles UI and authentication session management. Backend handles data persistence and authorization enforcement. Database handles integrity and constraints. No business logic leakage across layers. No direct DB access from frontend.

### V. Deterministic API Contracts

All endpoints MUST have defined request/response schemas. All error responses MUST be explicit and documented. Status codes MUST follow REST standards. API contracts MUST be finalized before frontend integration begins.

### VI. Stateless Backend

Backend MUST NOT rely on in-memory session state. All authentication MUST be JWT-based. All state MUST persist in the database. The server must be horizontally scalable with no shared memory.

### VII. Production-Ready Standards

Environment variables MUST be used for all secrets. `BETTER_AUTH_SECRET` MUST be shared between frontend and backend. Neon Postgres connection MUST be environment-driven via `DATABASE_URL`. All code MUST be modular and scalable. `.env.example` committed; `.env` gitignored.

### VIII. Security Standards

JWT signature MUST be verified on every protected request. Expired tokens MUST be rejected with 401. Missing `Authorization` header MUST return 401. Malformed tokens MUST return 401. Unauthorized resource access (wrong user) MUST return 403. Passwords MUST be stored hashed (bcrypt/argon2); never plaintext.

### IX. Database Standards

Use SQLModel ORM for all database operations. Use UUID primary keys on all tables. Include `created_at` and `updated_at` timestamps on all records. Enforce NOT NULL constraints where appropriate. Add index on `user_id` for task queries. Foreign key constraints MUST link todos to users.

### X. Frontend Standards

MUST use Next.js App Router. MUST use Better Auth for signup and login flows. MUST send `Authorization: Bearer <token>` header for all protected API calls. UI MUST be responsive (mobile < 640px, tablet 640–1024px, desktop > 1024px). No direct DB access from frontend.

## Technology Constraints

| Component    | Technology                  | Required |
| ------------ | --------------------------- | -------- |
| Frontend     | Next.js 16+ (App Router)   | Yes      |
| Backend      | FastAPI (Python 3.11+)      | Yes      |
| ORM          | SQLModel                    | Yes      |
| Database     | Neon Serverless PostgreSQL  | Yes      |
| Auth         | Better Auth + JWT           | Yes      |
| CSS          | Tailwind CSS (preferred)    | No       |

Additional constraints:
- MUST follow hackathon spec exactly.
- MUST maintain monorepo structure (`phase-2/` root).
- MUST maintain CLAUDE.md layering.
- No skipping authentication enforcement.
- No storing tasks in memory.
- No bypassing JWT verification.

## Success Criteria

1. Multi-user system works correctly — users register, login, and manage their own tasks.
2. JWT verification enforced on all protected endpoints.
3. Complete user isolation — no cross-user data access.
4. All 5 core todo operations functional: Add, List, Update, Delete, Complete.
5. Data persists in Neon PostgreSQL across server restarts.
6. Frontend is responsive across mobile, tablet, and desktop breakpoints.
7. All acceptance criteria from specs pass verification.

## Governance

- This constitution supersedes all other development practices for Phase 2.
- Amendments require documentation, version bump, and propagation to dependent templates.
- All PRs and reviews MUST verify compliance with these principles.
- Complexity MUST be justified; default to the smallest viable diff.
- See `CLAUDE.md` for runtime development guidance and agent coordination rules.

**Version**: 1.0.0 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-02-17
