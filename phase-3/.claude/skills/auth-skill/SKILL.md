---
name: auth-skill
description: Implement secure authentication and authorization systems including sign up, sign in, password hashing, JWT tokens, and Better Auth integration. Use for backend and full-stack applications.
---

# Authentication & Authorization Skill

## Scope
This skill is responsible for designing, implementing, and validating secure authentication flows for modern applications.

It covers:
- User registration (sign up)
- User login (sign in)
- Password hashing and verification
- JWT-based authentication
- Better Auth integration
- Secure auth middleware and token validation

## Instructions

### 1. User Management
- Design a clear user data model (id, email/username, password_hash, timestamps).
- Ensure unique identifiers (email or username).
- Never store plain-text passwords.

### 2. Password Security
- Use strong hashing algorithms (bcrypt, argon2, or equivalent).
- Include salting by default.
- Implement secure password comparison.
- Enforce minimum password strength rules.

### 3. Sign Up Flow
- Validate inputs (email format, password length).
- Hash password before persistence.
- Prevent duplicate accounts.
- Return success response without exposing sensitive data.

### 4. Sign In Flow
- Verify user existence.
- Compare hashed passwords securely.
- Issue JWT on successful authentication.
- Return consistent error messages (avoid leaking auth details).

### 5. JWT Token Handling
- Use signed JWTs with a secret or keypair.
- Include minimal claims (user_id, issued_at, expiry).
- Set reasonable expiration times.
- Support token verification and decoding.
- Reject expired or tampered tokens.

### 6. Better Auth Integration
- Integrate Better Auth according to official patterns.
- Share JWT secret between backend services when required.
- Use Better Auth for:
  - Session handling
  - Token refresh (if applicable)
  - Secure cookie or header-based auth
- Ensure compatibility with frontend and API consumers.

### 7. Authorization & Middleware
- Implement auth middleware/guards.
- Protect private routes/endpoints.
- Attach authenticated user context to requests.
- Fail securely on unauthorized access.

## Best Practices
- Never log passwords or tokens.
- Use environment variables for secrets.
- Separate auth logic from business logic.
- Keep auth code modular and testable.
- Follow least-privilege principles.
- Prefer stateless authentication unless session state is required.

## Outputs
When this skill is used, it should produce:
- Auth-related specs (endpoints, payloads, token structure).
- Clean, modular auth code (controllers, services, middleware).
- Clear error handling and responses.
- Updated documentation (README or API docs).
- Example requests for sign up and sign in.

## Example API Structure
```http
POST /auth/signup
POST /auth/signin
GET  /auth/me        (protected)
