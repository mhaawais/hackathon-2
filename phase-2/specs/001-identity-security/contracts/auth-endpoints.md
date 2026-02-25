# API Contract: Authentication Endpoints

**Branch**: `001-identity-security` | **Date**: 2026-02-17
**Owner**: Better Auth (frontend Next.js server)

These endpoints are handled by Better Auth on the Next.js server at `/api/auth/*`.
They are NOT implemented in FastAPI.

---

## POST /api/auth/sign-up/email

**Purpose**: Register a new user (FR-001, FR-002, FR-003)

**Request**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response 200** (success):
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "emailVerified": false,
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  },
  "session": {
    "id": "string",
    "token": "string",
    "expiresAt": "ISO-8601"
  }
}
```

**Response 422** (duplicate email):
```json
{
  "message": "User already exists"
}
```

**Response 400** (validation error):
```json
{
  "message": "Invalid email or password"
}
```

---

## POST /api/auth/sign-in/email

**Purpose**: Authenticate user and issue token (FR-004, FR-005)

**Request**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200** (success):
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "session": {
    "id": "string",
    "token": "string",
    "expiresAt": "ISO-8601"
  }
}
```

**Response 401** (invalid credentials — generic message per FR-005):
```json
{
  "message": "Invalid credentials"
}
```

---

## GET /api/auth/get-session

**Purpose**: Get current session data (including JWT from cookie cache)

**Headers**: Cookie with Better Auth session

**Response 200** (authenticated):
```json
{
  "session": {
    "id": "string",
    "token": "string",
    "expiresAt": "ISO-8601",
    "userId": "string"
  },
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  }
}
```

**Response 401** (no session):
```json
{
  "session": null,
  "user": null
}
```

---

## Cookie Cache JWT Structure

When `cookieCache.strategy` is set to `"jwt"`, Better Auth stores a JWT in the `better-auth.session_data` cookie. The JWT payload contains:

```json
{
  "sub": "user-id-string",
  "iat": 1234567890,
  "exp": 1234567890,
  "session": {
    "id": "session-id",
    "userId": "user-id-string",
    "expiresAt": "ISO-8601"
  }
}
```

**Note**: The exact payload structure should be validated during implementation (Risk #1 in plan.md). The `sub` or `session.userId` field provides the user identifier for the backend.
