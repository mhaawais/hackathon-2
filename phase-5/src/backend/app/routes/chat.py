"""Chat endpoint — Spec-6 + Spec-011 (Dapr Jobs callback).

POST /api/chat         → AI agent chat turn
POST /api/jobs/trigger → Dapr Jobs API callback (fires when reminder is due)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlmodel import Session

from app.auth.dependencies import get_current_user
from app.db import get_session
from app.models.schemas import ChatRequest, ChatResponse
from app.services import agent_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ChatResponse:
    """Run one turn of the AI chat agent."""
    try:
        return agent_service.run_chat(
            session,
            user_id,
            request.message,
            request.conversation_id,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.post("/jobs/trigger", include_in_schema=False)
async def jobs_trigger(request: Request) -> Response:
    """Dapr Jobs API callback — fires when a scheduled reminder is due.

    Dapr POST this endpoint at the time specified in the job's dueTime.
    No auth required — Dapr calls this internally within the cluster.
    """
    try:
        body = await request.json()
        data = body.get("data", body)
        task_id = data.get("task_id", "unknown")
        user_id = data.get("user_id", "unknown")
        logger.info(
            "[JOBS TRIGGER] Reminder fired: task_id=%s user_id=%s",
            task_id,
            user_id,
        )
        # Extension point: push WebSocket notification, send email, etc.
        # For hackathon scope: log only — notification_service handles Kafka reminders
    except Exception as exc:
        logger.error("Jobs trigger error: %s", exc)
    return Response(status_code=200)
