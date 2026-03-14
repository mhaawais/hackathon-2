"""Conversation service — DB persistence + Dapr state caching.

Primary store: Neon PostgreSQL (always authoritative).
Cache: Dapr state store (PostgreSQL-backed via `state.postgresql` component).
  - Cache key: `conv-{conversation_id}`
  - On save: write last MAX_CACHED_MESSAGES to Dapr state (best-effort)
  - On load: try Dapr cache first; fall back to DB on miss/error

Dapr state calls are best-effort — any exception is logged and ignored so that
the service continues working even when Dapr sidecar is not running.
"""

import json
import logging
import os
from datetime import datetime, timezone

import httpx
from sqlmodel import Session, select

from app.models.conversation import Conversation
from app.models.message import Message

logger = logging.getLogger(__name__)

DAPR_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))
STATE_STORE = "statestore"
MAX_CACHED_MESSAGES = 20  # last N messages kept in Dapr state


# ---------------------------------------------------------------------------
# Core DB operations (unchanged from Spec-4)
# ---------------------------------------------------------------------------


def create_conversation(session: Session, user_id: str) -> Conversation:
    conv = Conversation(user_id=user_id)
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv


def get_conversation(
    session: Session, conversation_id: int, user_id: str
) -> Conversation | None:
    conv = session.get(Conversation, conversation_id)
    if conv is None or conv.user_id != user_id:
        return None
    return conv


def list_conversations(session: Session, user_id: str) -> list[Conversation]:
    statement = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())  # type: ignore[attr-defined]
    )
    return list(session.exec(statement).all())


def add_message(
    session: Session,
    conversation_id: int,
    user_id: str,
    role: str,
    content: str,
) -> Message:
    if role not in ("user", "assistant"):
        raise ValueError("role must be 'user' or 'assistant'")
    if not content.strip():
        raise ValueError("content must not be empty")

    msg = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    session.add(msg)

    conv = session.get(Conversation, conversation_id)
    if conv is not None:
        conv.updated_at = datetime.now(timezone.utc)
        session.add(conv)

    session.commit()
    session.refresh(msg)
    return msg


def get_messages_for_conversation(
    session: Session, conversation_id: int, user_id: str
) -> list[Message]:
    conv = get_conversation(session, conversation_id, user_id)
    if conv is None:
        return []
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())  # type: ignore[attr-defined]
    )
    return list(session.exec(statement).all())


# ---------------------------------------------------------------------------
# Dapr state caching (Spec-011 — Building Block: State Management)
# ---------------------------------------------------------------------------


def _state_key(conversation_id: int) -> str:
    return f"conv-{conversation_id}"


async def cache_conversation(conversation_id: int, messages: list[dict]) -> None:
    """Write the last MAX_CACHED_MESSAGES to Dapr state store. Best-effort."""
    recent = messages[-MAX_CACHED_MESSAGES:]
    payload = [
        {
            "key": _state_key(conversation_id),
            "value": recent,
        }
    ]
    url = f"http://localhost:{DAPR_PORT}/v1.0/state/{STATE_STORE}"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                url,
                content=json.dumps(payload),
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code not in (200, 204):
                logger.warning(
                    "Dapr state save failed for conv-%d: %d %s",
                    conversation_id,
                    resp.status_code,
                    resp.text,
                )
    except Exception as exc:
        logger.debug("Dapr state save skipped (sidecar unavailable?): %s", exc)


async def get_cached_conversation(conversation_id: int) -> list[dict]:
    """Read message list from Dapr state store. Returns [] on miss or error."""
    url = f"http://localhost:{DAPR_PORT}/v1.0/state/{STATE_STORE}/{_state_key(conversation_id)}"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200 and resp.text:
                data = resp.json()
                if isinstance(data, list):
                    return data
    except Exception as exc:
        logger.debug("Dapr state read skipped (sidecar unavailable?): %s", exc)
    return []
