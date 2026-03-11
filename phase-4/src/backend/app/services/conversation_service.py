from datetime import datetime, timezone

from sqlmodel import Session, select

from app.models.conversation import Conversation
from app.models.message import Message


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
