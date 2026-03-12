"""Tests for conversation_service — Spec-4: Conversation & Message Persistence Domain."""
import time

import pytest
from sqlmodel import Session

# Import models so SQLModel.metadata registers tables before session_fixture create_all()
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.services.conversation_service import (
    add_message,
    create_conversation,
    get_conversation,
    get_messages_for_conversation,
    list_conversations,
)

USER_A = "user-a-spec4"
USER_B = "user-b-spec4"


# ---------------------------------------------------------------------------
# US1 — Start a New Chat Session
# ---------------------------------------------------------------------------


def test_create_conversation(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    assert conv.id is not None
    assert conv.user_id == USER_A
    assert conv.created_at is not None
    assert conv.updated_at is not None


def test_add_message_user_role(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    msg = add_message(session, conv.id, USER_A, "user", "Hello!")
    assert msg.id is not None
    assert msg.conversation_id == conv.id
    assert msg.user_id == USER_A
    assert msg.role == "user"
    assert msg.content == "Hello!"
    assert msg.created_at is not None


def test_add_message_invalid_role(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    with pytest.raises(ValueError, match="role must be"):
        add_message(session, conv.id, USER_A, "system", "ignored")


def test_add_message_empty_content(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    with pytest.raises(ValueError, match="content must not be empty"):
        add_message(session, conv.id, USER_A, "user", "   ")


# ---------------------------------------------------------------------------
# US2 — Resume a Previous Chat Session
# ---------------------------------------------------------------------------


def test_get_conversation_own(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    fetched = get_conversation(session, conv.id, USER_A)
    assert fetched is not None
    assert fetched.id == conv.id
    assert fetched.user_id == USER_A


def test_get_conversation_not_found(session: Session) -> None:
    result = get_conversation(session, 99999, USER_A)
    assert result is None


def test_get_conversation_wrong_user(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    result = get_conversation(session, conv.id, USER_B)
    assert result is None


def test_get_messages_ordering(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    add_message(session, conv.id, USER_A, "user", "First")
    add_message(session, conv.id, USER_A, "assistant", "Second")
    add_message(session, conv.id, USER_A, "user", "Third")
    messages = get_messages_for_conversation(session, conv.id, USER_A)
    assert len(messages) == 3
    assert messages[0].content == "First"
    assert messages[1].content == "Second"
    assert messages[2].content == "Third"


def test_get_messages_wrong_user(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    add_message(session, conv.id, USER_A, "user", "Secret")
    result = get_messages_for_conversation(session, conv.id, USER_B)
    assert result == []


# ---------------------------------------------------------------------------
# US3 — Store AI Responses
# ---------------------------------------------------------------------------


def test_add_message_assistant_role(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    msg = add_message(session, conv.id, USER_A, "assistant", "You have 3 tasks.")
    assert msg.role == "assistant"
    assert msg.content == "You have 3 tasks."


def test_add_message_updates_conversation_updated_at(session: Session) -> None:
    conv = create_conversation(session, USER_A)
    original_updated_at = conv.updated_at
    time.sleep(0.01)  # ensure timestamp difference is measurable
    add_message(session, conv.id, USER_A, "user", "Trigger update")
    session.refresh(conv)
    assert conv.updated_at > original_updated_at


# ---------------------------------------------------------------------------
# US4 — View All Conversations for a User
# ---------------------------------------------------------------------------


def test_list_conversations_empty(session: Session) -> None:
    result = list_conversations(session, "no-convs-user")
    assert result == []


def test_list_conversations_multiple(session: Session) -> None:
    conv1 = create_conversation(session, USER_A)
    conv2 = create_conversation(session, USER_A)
    conv3 = create_conversation(session, USER_A)
    # Add messages to update updated_at: conv3 first, then conv1
    time.sleep(0.01)
    add_message(session, conv3.id, USER_A, "user", "msg in conv3")
    time.sleep(0.01)
    add_message(session, conv1.id, USER_A, "user", "msg in conv1")
    result = list_conversations(session, USER_A)
    assert len(result) == 3
    # conv1 updated last → first; conv3 → second; conv2 untouched → last
    assert result[0].id == conv1.id
    assert result[1].id == conv3.id
    assert result[2].id == conv2.id


def test_list_conversations_isolation(session: Session) -> None:
    create_conversation(session, USER_A)
    create_conversation(session, USER_A)
    create_conversation(session, USER_B)
    create_conversation(session, USER_B)
    result_a = list_conversations(session, USER_A)
    result_b = list_conversations(session, USER_B)
    assert len(result_a) == 2
    assert len(result_b) == 2
    assert all(c.user_id == USER_A for c in result_a)
    assert all(c.user_id == USER_B for c in result_b)
