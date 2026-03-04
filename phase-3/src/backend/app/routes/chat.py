"""Chat endpoint — Spec-6: AI Agent & Chat Endpoint.

POST /api/chat: Accepts a user message and optional conversation_id.
Requires a valid JWT (Authorization: Bearer <token>).
Returns the AI agent's response with tool call details.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.auth.dependencies import get_current_user
from app.db import get_session
from app.models.schemas import ChatRequest, ChatResponse
from app.services import agent_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ChatResponse:
    """Run one turn of the AI chat agent.

    - Creates a new conversation if conversation_id is not provided or not found.
    - Loads full conversation history for context if conversation_id is provided.
    - Stores user message and assistant response to the database.
    - Returns conversation_id (new or existing), response text, and tool_calls made.
    """
    try:
        return agent_service.run_chat(
            session,
            user_id,
            request.message,
            request.conversation_id,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
