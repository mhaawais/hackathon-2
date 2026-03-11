import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.todo import Todo
from app.models.schemas import TodoCreate, TodoUpdate


def create_todo(session: Session, user_id: str, data: TodoCreate) -> Todo:
    todo = Todo(
        title=data.title,
        description=data.description,
        user_id=user_id,
    )
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


def list_todos(
    session: Session, user_id: str, status_filter: str | None = None
) -> list[Todo]:
    statement = select(Todo).where(Todo.user_id == user_id)
    if status_filter:
        statement = statement.where(Todo.status == status_filter)
    return list(session.exec(statement).all())


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
