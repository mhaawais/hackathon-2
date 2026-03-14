import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import cast, String, or_
from sqlmodel import Session, select, col

from app.models.todo import Todo
from app.models.schemas import TodoCreate, TodoUpdate

_PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def create_todo(session: Session, user_id: str, data: TodoCreate) -> Todo:
    todo = Todo(
        title=data.title,
        description=data.description,
        priority=data.priority,
        tags=data.tags if data.tags is not None else [],
        due_date=data.due_date,
        is_recurring=data.is_recurring,
        recurrence_frequency=data.recurrence_frequency,
        user_id=user_id,
    )
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


def list_todos(
    session: Session,
    user_id: str,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    tag: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    due_before: Optional[datetime] = None,
) -> list[Todo]:
    statement = select(Todo).where(Todo.user_id == user_id)

    # Status filter — accept "open" as alias for "pending"
    if status_filter and status_filter != "all":
        if status_filter == "open":
            statement = statement.where(Todo.status == "pending")
        else:
            statement = statement.where(Todo.status == status_filter)

    # Priority filter
    if priority:
        statement = statement.where(Todo.priority == priority)

    # Full-text search on title, description, and tags
    if search:
        pattern = f"%{search}%"
        statement = statement.where(
            or_(
                col(Todo.title).ilike(pattern),
                col(Todo.description).isnot(None) & col(Todo.description).ilike(pattern),
                cast(Todo.tags, String).ilike(pattern),
            )
        )

    # Tag filter — exact tag match inside JSON array text
    if tag:
        statement = statement.where(
            cast(Todo.tags, String).contains(f'"{tag}"')
        )

    # Due date filter
    if due_before:
        statement = statement.where(
            (Todo.due_date != None) & (Todo.due_date <= due_before)  # noqa: E711
        )

    todos = list(session.exec(statement).all())

    # Sort in Python (avoids complex SQLAlchemy CASE for priority)
    reverse = sort_dir.lower() == "desc"

    if sort_by == "priority":
        todos.sort(key=lambda t: _PRIORITY_ORDER.get(t.priority, 99), reverse=reverse)
    elif sort_by == "due_date":
        todos.sort(
            key=lambda t: (t.due_date is None, t.due_date or datetime.min),
            reverse=reverse,
        )
    elif sort_by == "title":
        todos.sort(key=lambda t: t.title.lower(), reverse=reverse)
    else:
        # default: created_at
        todos.sort(key=lambda t: t.created_at, reverse=reverse)

    return todos


def get_todo(session: Session, todo_id: uuid.UUID, user_id: str) -> Todo:
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    if todo.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return todo


def update_todo(
    session: Session, todo_id: uuid.UUID, user_id: str, data: TodoUpdate
) -> Todo:
    todo = get_todo(session, todo_id, user_id)

    if data.title is not None:
        todo.title = data.title
    if data.description is not None:
        todo.description = data.description
    if data.priority is not None:
        todo.priority = data.priority
    if data.tags is not None:
        todo.tags = data.tags
    if data.due_date is not None:
        todo.due_date = data.due_date
    if data.completed is not None:
        todo.status = "completed" if data.completed else "pending"
    if data.is_recurring is not None:
        todo.is_recurring = data.is_recurring
    if data.recurrence_frequency is not None:
        todo.recurrence_frequency = data.recurrence_frequency

    todo.updated_at = datetime.now(timezone.utc)

    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


def complete_todo(session: Session, todo_id: uuid.UUID, user_id: str) -> Todo:
    todo = get_todo(session, todo_id, user_id)
    todo.status = "pending" if todo.status == "completed" else "completed"
    todo.updated_at = datetime.now(timezone.utc)

    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


def delete_todo(session: Session, todo_id: uuid.UUID, user_id: str) -> None:
    todo = get_todo(session, todo_id, user_id)
    session.delete(todo)
    session.commit()
