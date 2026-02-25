# Research: Identity & Security Layer

**Branch**: `001-identity-security` | **Date**: 2026-02-17

## RD-1: Better Auth Token Strategy

**Decision**: Use Better Auth's cookie cache with `strategy: "jwt"`.

**Rationale**: This produces HS256-signed JWTs using `BETTER_AUTH_SECRET`, verifiable by PyJWT on the backend. Enables stateless backend verification (FR-010) without database lookup. Uses shared secret per FR-011.

**Alternatives considered**:
- Asymmetric JWT plugin (EdDSA/JWKS) — rejected: adds complexity (JWKS endpoint fetching, key rotation); spec explicitly calls for shared secret.
- Bearer plugin with opaque tokens — rejected: requires backend-to-frontend API call to validate, breaks stateless principle (Constitution VI).

## RD-2: Token Transport

**Decision**: Frontend extracts JWT from Better Auth session and sends as `Authorization: Bearer <token>` to FastAPI.

**Rationale**: Constitution Principle I requires Bearer header. Cross-origin cookies (port 3000 → 8000) are unreliable and require complex SameSite/CORS configuration.

**Alternatives considered**:
- Cookie-based transport — rejected: cross-origin cookies are fragile, especially in development.
- Proxy all backend calls through Next.js API routes — rejected: adds unnecessary latency and complexity.

## RD-3: JWT Verification Library

**Decision**: PyJWT 2.x for HS256 verification on FastAPI backend.

**Rationale**: Most widely used Python JWT library, lightweight, supports HS256 natively. Well-maintained with clear documentation.

**Alternatives considered**:
- python-jose — rejected: lower maintenance activity, heavier dependency chain.
- authlib — rejected: overkill for simple JWT verification.

## RD-4: Password Storage

**Decision**: Handled entirely by Better Auth (bcrypt internally). Backend never touches passwords.

**Rationale**: Satisfies FR-003 with zero custom code. Better Auth stores hashed passwords in the `account` table. Reduces security surface area.

**Alternatives considered**: None — the spec mandates Better Auth for authentication.

## RD-5: Database Sharing Strategy

**Decision**: Both Better Auth (via Node.js adapter) and FastAPI (via SQLModel) connect to the same Neon PostgreSQL database.

**Rationale**: Better Auth manages its own tables (`user`, `session`, `account`, `verification`). Backend manages only the `todo` table. Foreign key from `todo.user_id` to `user.id` ensures referential integrity.

**Risk mitigation**: Run Better Auth migrations first (creates its tables), then SQLModel `create_all()` (creates only `todo`). Never modify Better Auth tables from SQLModel.

**Alternatives considered**:
- Separate databases — rejected: breaks the foreign key relationship between todos and users; adds unnecessary complexity.

## RD-6: CORS Configuration

**Decision**: FastAPI CORS middleware allows origin `http://localhost:3000`, methods GET/POST/PUT/PATCH/DELETE/OPTIONS, headers Authorization + Content-Type, credentials enabled.

**Rationale**: Required for cross-origin frontend-to-backend communication during development. Production will use the same origin or a configured allowed origin.

**Alternatives considered**:
- Wildcard `["*"]` — rejected: security risk per auth-security agent guardrails.
