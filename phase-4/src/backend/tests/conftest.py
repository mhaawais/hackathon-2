import os
import uuid

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Set env vars before importing app modules
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("BETTER_AUTH_SECRET", "test-secret-key-for-testing-minimum-32-chars")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-api-key-for-testing")

from app.db import get_session
from app.main import app
from app.models.todo import Todo  # noqa: F401


SECRET = os.environ["BETTER_AUTH_SECRET"]


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def make_token(user_id: str, secret: str = SECRET) -> str:
    """Create a valid JWT token for testing."""
    payload = {"sub": user_id}
    return jwt.encode(payload, secret, algorithm="HS256")


def auth_header(user_id: str) -> dict[str, str]:
    """Return Authorization header dict for a given user_id."""
    return {"Authorization": f"Bearer {make_token(user_id)}"}


USER_A_ID = str(uuid.uuid4())
USER_B_ID = str(uuid.uuid4())
