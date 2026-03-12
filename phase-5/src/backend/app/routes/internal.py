"""Internal service-to-service routes — bypasses JWT authentication.

These routes are called by other microservices (recurring_task_service) via
Dapr service invocation. Access is controlled by the X-Internal-Service header.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlmodel import Session

from app.db import get_session
from app.models.schemas import TodoCreate, TodoResponse
from app.services import todo_service

router = APIRouter()

_TRUSTED_SERVICES = {"recurring-task-service"}


def _verify_internal(x_internal_service: str = Header(default="")):
    if x_internal_service not in _TRUSTED_SERVICES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return x_internal_service


@router.post(
    "/internal/todos",
    response_model=TodoResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_todo_internal(
    data: TodoCreate,
    user_id: str = Header(alias="X-User-Id"),
    _service: str = Depends(_verify_internal),
    session: Session = Depends(get_session),
) -> TodoResponse:
    """Create a task on behalf of a user — called by recurring_task_service."""
    todo = todo_service.create_todo(session, user_id, data)
    return TodoResponse.model_validate(todo)
