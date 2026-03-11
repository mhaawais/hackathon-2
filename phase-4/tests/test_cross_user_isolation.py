"""Integration test for cross-user access prevention.

This test validates FR-009: Users cannot access, modify, or delete
other users' todos. Uses two separate JWT tokens to simulate
two different authenticated users.

Run from phase-2/src/backend/:
    pytest ../../tests/test_cross_user_isolation.py -v
"""

import os
import sys
import uuid

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "backend"))

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("BETTER_AUTH_SECRET", "test-secret-key-for-testing-minimum-32-chars")

import jwt as pyjwt
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.db import get_session
from app.main import app
from app.models.todo import Todo  # noqa: F401

SECRET = os.environ["BETTER_AUTH_SECRET"]


def _token(user_id: str) -> dict[str, str]:
    token = pyjwt.encode({"sub": user_id}, SECRET, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_cross_user_isolation_integration():
    """Full integration test: two users, complete isolation."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_session():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[get_session] = override_session
    client = TestClient(app)

    user_a = str(uuid.uuid4())
    user_b = str(uuid.uuid4())

    # User A creates 2 todos
    r1 = client.post("/api/todos", json={"title": "A-1"}, headers=_token(user_a))
    r2 = client.post("/api/todos", json={"title": "A-2"}, headers=_token(user_a))
    assert r1.status_code == 201
    assert r2.status_code == 201
    todo_a1 = r1.json()["id"]

    # User B creates 1 todo
    r3 = client.post("/api/todos", json={"title": "B-1"}, headers=_token(user_b))
    assert r3.status_code == 201

    # User B lists — should only see their own
    list_b = client.get("/api/todos", headers=_token(user_b))
    assert len(list_b.json()) == 1
    assert list_b.json()[0]["title"] == "B-1"

    # User A lists — should only see their own
    list_a = client.get("/api/todos", headers=_token(user_a))
    assert len(list_a.json()) == 2

    # Cross-user PATCH → 403
    r = client.patch(f"/api/todos/{todo_a1}", json={"title": "X"}, headers=_token(user_b))
    assert r.status_code == 403

    # Cross-user complete → 403
    r = client.patch(f"/api/todos/{todo_a1}/complete", headers=_token(user_b))
    assert r.status_code == 403

    # Cross-user DELETE → 403
    r = client.delete(f"/api/todos/{todo_a1}", headers=_token(user_b))
    assert r.status_code == 403

    # Cleanup
    app.dependency_overrides.clear()
