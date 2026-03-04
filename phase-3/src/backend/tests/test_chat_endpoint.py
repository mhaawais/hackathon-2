"""Tests for POST /api/chat endpoint — Spec-6: AI Agent & Chat Endpoint.

Tests use a mocked agent_service.run_chat to avoid real Gemini API calls.
The client fixture (from conftest.py) handles auth and session setup.
"""

from unittest.mock import patch

import pytest
from sqlmodel import Session

# Import models so SQLModel.metadata registers tables before session fixture runs.
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.schemas import ChatResponse, ToolCallRecord

# Use helpers from conftest.py
from tests.conftest import USER_A_ID, auth_header  # noqa: E402


# ---------------------------------------------------------------------------
# US4 — Auth protection
# ---------------------------------------------------------------------------


def test_chat_requires_auth(client) -> None:
    """POST /api/chat without JWT returns 401."""
    response = client.post("/api/chat", json={"message": "hello"})
    assert response.status_code == 401


def test_chat_empty_message_returns_422(client) -> None:
    """Blank message is rejected by Pydantic validator with 422."""
    response = client.post(
        "/api/chat",
        json={"message": "   "},
        headers=auth_header(USER_A_ID),
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# US1 — New conversation
# ---------------------------------------------------------------------------


def test_chat_creates_new_conversation(client) -> None:
    """Chat with no conversation_id creates a new conversation and returns 200."""
    mock_response = ChatResponse(
        conversation_id=1,
        response="Task added!",
        tool_calls=[],
    )
    with patch("app.routes.chat.agent_service.run_chat", return_value=mock_response):
        response = client.post(
            "/api/chat",
            json={"message": "Add a task to buy milk"},
            headers=auth_header(USER_A_ID),
        )
    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == 1
    assert data["response"] == "Task added!"
    assert data["tool_calls"] == []


# ---------------------------------------------------------------------------
# US2 — Resume conversation
# ---------------------------------------------------------------------------


def test_chat_resumes_existing_conversation(client) -> None:
    """Chat with conversation_id passes it to run_chat."""
    mock_response = ChatResponse(
        conversation_id=42,
        response="Here are your tasks.",
        tool_calls=[],
    )
    with patch("app.routes.chat.agent_service.run_chat", return_value=mock_response) as mock_fn:
        response = client.post(
            "/api/chat",
            json={"message": "list my tasks", "conversation_id": 42},
            headers=auth_header(USER_A_ID),
        )
    assert response.status_code == 200
    # Verify run_chat was called with conversation_id=42
    call_kwargs = mock_fn.call_args
    # run_chat(session, user_id, message, conversation_id)
    positional = call_kwargs.args
    assert positional[3] == 42  # conversation_id is the 4th arg (0-indexed)


# ---------------------------------------------------------------------------
# US3 — Response structure + tool_calls
# ---------------------------------------------------------------------------


def test_chat_response_has_required_fields(client) -> None:
    """Response includes conversation_id, response, and tool_calls with correct shape."""
    tc = ToolCallRecord(
        tool_name="add_task",
        arguments={"user_id": USER_A_ID, "title": "Buy milk"},
        result={"task_id": "abc-123", "title": "Buy milk", "status": "pending", "description": None},
    )
    mock_response = ChatResponse(
        conversation_id=7,
        response="Done! I added 'Buy milk' to your task list.",
        tool_calls=[tc],
    )
    with patch("app.routes.chat.agent_service.run_chat", return_value=mock_response):
        response = client.post(
            "/api/chat",
            json={"message": "add buy milk"},
            headers=auth_header(USER_A_ID),
        )
    assert response.status_code == 200
    data = response.json()
    assert "conversation_id" in data
    assert "response" in data
    assert "tool_calls" in data
    assert len(data["tool_calls"]) == 1
    assert data["tool_calls"][0]["tool_name"] == "add_task"
    assert data["tool_calls"][0]["result"]["status"] == "pending"
