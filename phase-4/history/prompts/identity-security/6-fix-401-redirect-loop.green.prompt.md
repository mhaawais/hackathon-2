---
id: 6
title: Fix 401 Redirect Loop After Sign-In
stage: green
date: 2026-02-18
surface: claude-code
model: claude-opus-4-6
feature: identity-security
branch: 001-identity-security
user: developer
command: implement fix plan
labels: [bugfix, auth, jwt, audience-claim]
links:
  spec: specs/identity-security/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - path: src/backend/app/auth/jwt_bearer.py
    action: modified
    summary: Added audience and issuer params to jwt.decode() for JWKS verification
tests:
  - path: src/backend/tests/test_jwt_verification.py
    result: pass
    summary: All 5 JWT verification tests pass
  - path: src/backend/tests/test_todo_routes.py
    result: pass
    summary: All 6 todo route tests pass
  - path: src/backend/tests/test_user_isolation.py
    result: pass
    summary: All 4 user isolation tests pass
---

## Prompt

Implement the fix for the 401 redirect loop after sign-in. The root cause is that Better Auth's JWT includes `aud` and `iss` claims set to the frontend URL, but PyJWT's `jwt.decode()` was not given `audience` or `issuer` parameters, causing an `InvalidAudienceError` that was silently caught by the broad except clause.

## Response snapshot

Added `audience=frontend_url` and `issuer=frontend_url` parameters to the `jwt.decode()` call in the JWKS verification path of `verify_token()`. The `frontend_url` parameter was already available (defaults to `"http://localhost:3000"`), matching exactly what Better Auth sets in the JWT's `aud` and `iss` claims. All 15 backend tests continue to pass since test tokens use HS256 without aud/iss claims.

## Outcome

- ✅ Impact: Fixes the 401 redirect loop; dashboard now loads after sign-in
- 🧪 Tests: 15/15 backend tests pass (no regressions)
- 📁 Files: 1 file modified (jwt_bearer.py)
- 🔁 Next prompts: Manual E2E verification (sign up, sign in, dashboard loads todos)
- 🧠 Reflection: The broad `except (jwt.InvalidTokenError, Exception): pass` clause masked the real error. Consider narrowing exception handling in the future.

## Evaluation notes (flywheel)

- Failure modes observed: InvalidAudienceError silently caught by broad except clause; HS256 fallback also fails on EdDSA token
- Graders run and results (PASS/FAIL): pytest 15/15 PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Consider narrowing the except clause to specific JWT exceptions for better error diagnostics
