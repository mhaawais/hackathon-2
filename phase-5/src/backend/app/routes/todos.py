import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from sqlmodel import Session

from app.auth.dependencies import get_current_user
from app.models.schemas import TodoCreate, TodoResponse, TodoUpdate
from app.services import todo_service
from app.db import get_session

router = APIRouter()


@router.post("/todos", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(
    data: TodoCreate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TodoResponse:
    todo = todo_service.create_todo(session, user_id, data)
    return TodoResponse.model_validate(todo)


@router.get("/todos", response_model=list[TodoResponse])
def list_todos(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    tag: Optional[str] = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc"),
    due_before: Optional[datetime] = Query(default=None),
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[TodoResponse]:
    todos = todo_service.list_todos(
        session,
        user_id,
        status_filter=status_filter,
        search=search,
        priority=priority,
        tag=tag,
        sort_by=sort_by,
        sort_dir=sort_dir,
        due_before=due_before,
    )
    return [TodoResponse.model_validate(t) for t in todos]


@router.get("/todos/{todo_id}", response_model=TodoResponse)
def get_todo_by_id(
    todo_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TodoResponse:
    todo = todo_service.get_todo(session, todo_id, user_id)
    return TodoResponse.model_validate(todo)


@router.patch("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: uuid.UUID,
    data: TodoUpdate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TodoResponse:
    todo = todo_service.update_todo(session, todo_id, user_id, data)
    return TodoResponse.model_validate(todo)


@router.patch("/todos/{todo_id}/complete", response_model=TodoResponse)
def complete_todo(
    todo_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TodoResponse:
    todo = todo_service.complete_todo(session, todo_id, user_id)
    return TodoResponse.model_validate(todo)


@router.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Response:
    todo_service.delete_todo(session, todo_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
