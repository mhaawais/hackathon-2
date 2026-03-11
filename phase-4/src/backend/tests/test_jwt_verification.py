"""Tests for JWT verification (US5, FR-008)."""

import time

import jwt as pyjwt

from tests.conftest import SECRET, auth_header, make_token


def test_valid_token_returns_user_id(client):
    """Valid JWT should allow access and return data."""
    user_id = "test-user-123"
    res = client.get("/api/todos", headers=auth_header(user_id))
    assert res.status_code == 200


def test_expired_token_returns_401(client):
    """Expired JWT should return 401."""
    payload = {"sub": "test-user", "exp": int(time.time()) - 100}
    token = pyjwt.encode(payload, SECRET, algorithm="HS256")
    res = client.get("/api/todos", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_malformed_token_returns_401(client):
    """Malformed JWT should return 401."""
    res = client.get(
        "/api/todos",
        headers={"Authorization": "Bearer not.a.valid.jwt"},
    )
    assert res.status_code == 401


def test_missing_auth_header_returns_401(client):
    """Request without Authorization header should return 401/403."""
    res = client.get("/api/todos")
    assert res.status_code in (401, 403)


def test_wrong_secret_returns_401(client):
    """JWT signed with wrong secret should return 401."""
    token = pyjwt.encode({"sub": "user"}, "wrong-secret-key", algorithm="HS256")
    res = client.get("/api/todos", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
