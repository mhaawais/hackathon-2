"""MCP task tool handlers — Spec-5 + Spec-010.

Each do_*() function is a pure synchronous function that accepts a Session and returns a dict.
These are the testable units: tests call them directly without starting the MCP server subprocess.

Each handle_*() async function is the MCP-layer wrapper: creates its own session, calls
do_*() via asyncio.to_thread() to avoid blocking, then best-effort publishes Kafka events.
"""

import asyncio
import json
import logging
import os
import sys
import uuid
from typing import Optional

from sqlmodel import Session, create_engine

# Add src/backend to sys.path so backend modules are importable.
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import HTTPException  # noqa: E402
from app.services import todo_service  # noqa: E402
from app.models.schemas import TodoCreate, TodoUpdate  # noqa: E402

try:
    from mcp.types import TextContent  # noqa: E402
except ImportError:
    TextContent = None  # type: ignore[assignment,misc]

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Production database engine (lazy-initialized from DATABASE_URL)
# ---------------------------------------------------------------------------

_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        url = os.environ.get("DATABASE_URL", "")
        if not url:
            raise RuntimeError("DATABASE_URL environment variable is required")
        _engine = create_engine(url, pool_pre_ping=True, pool_recycle=300)
    return _engine


def get_db_session() -> Session:
    return Session(_get_engine())


# ---------------------------------------------------------------------------
# Pure sync handler functions (testable — accept session: Session)
# ---------------------------------------------------------------------------


def _task_dict(todo) -> dict:
    """Convert a Todo ORM object to the canonical task dict returned by all tools."""
    return {
        "task_id": str(todo.id),
        "title": todo.title,
        "status": todo.status,
        "description": todo.description,
        "priority": todo.priority,
        "tags": todo.tags,
        "due_date": todo.due_date.isoformat() if todo.due_date else None,
        "is_recurring": todo.is_recurring,
        "recurrence_frequency": todo.recurrence_frequency,
    }


def do_add_task(
    session: Session,
    user_id: str,
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
    tags: Optional[list] = None,
    due_date: Optional[str] = None,
    is_recurring: bool = False,
    recurrence_frequency: Optional[str] = None,
) -> dict:
    """Create a new task. Returns task dict or error dict."""
    try:
        from datetime import datetime
        parsed_due_date = None
        if due_date:
            try:
                parsed_due_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
            except ValueError:
                return {"error": f"Invalid due_date format: {due_date}", "code": "VALIDATION_ERROR"}

        todo = todo_service.create_todo(
            session,
            user_id,
            TodoCreate(
                title=title,
                description=description,
                priority=priority,
                tags=tags or [],
                due_date=parsed_due_date,
                is_recurring=is_recurring,
                recurrence_frequency=recurrence_frequency,
            ),
        )
        return _task_dict(todo)
    except HTTPException as exc:
        code = "NOT_FOUND" if exc.status_code == 404 else "INTERNAL_ERROR"
        return {"error": exc.detail, "code": code}
    except ValueError as exc:
        return {"error": str(exc), "code": "VALIDATION_ERROR"}
    except Exception as exc:
        return {"error": str(exc), "code": "INTERNAL_ERROR"}


def do_list_tasks(
    session: Session,
    user_id: str,
    status: Optional[str] = None,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    tag: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> dict:
    """List user's tasks with optional filters. Returns {tasks, count} or error dict."""
    try:
        status_filter = None if status in (None, "all") else status
        todos = todo_service.list_todos(
            session,
            user_id,
            status_filter=status_filter,
            search=search,
            priority=priority,
            tag=tag,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        tasks = [_task_dict(t) for t in todos]
        return {"tasks": tasks, "count": len(tasks)}
    except Exception as exc:
        return {"error": str(exc), "code": "INTERNAL_ERROR"}


def do_complete_task(
    session: Session,
    user_id: str,
    task_id: str,
) -> dict:
    """Toggle task completion status. Returns task dict or error dict."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        return {"error": "Invalid task_id format: expected UUID", "code": "VALIDATION_ERROR"}
    try:
        todo = todo_service.complete_todo(session, task_uuid, user_id)
        result = _task_dict(todo)
        result["toggled"] = True
        return result
    except HTTPException as exc:
        code = "NOT_FOUND" if exc.status_code == 404 else "INTERNAL_ERROR"
        return {"error": exc.detail, "code": code}
    except Exception as exc:
        return {"error": str(exc), "code": "INTERNAL_ERROR"}


def do_delete_task(
    session: Session,
    user_id: str,
    task_id: str,
) -> dict:
    """Delete a task. Returns {task_id, deleted: True} or error dict."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        return {"error": "Invalid task_id format: expected UUID", "code": "VALIDATION_ERROR"}
    try:
        todo_service.delete_todo(session, task_uuid, user_id)
        return {"task_id": task_id, "deleted": True}
    except HTTPException as exc:
        code = "NOT_FOUND" if exc.status_code == 404 else "INTERNAL_ERROR"
        return {"error": exc.detail, "code": code}
    except Exception as exc:
        return {"error": str(exc), "code": "INTERNAL_ERROR"}


def do_update_task(
    session: Session,
    user_id: str,
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[list] = None,
    due_date: Optional[str] = None,
    completed: Optional[bool] = None,
    is_recurring: Optional[bool] = None,
    recurrence_frequency: Optional[str] = None,
) -> dict:
    """Update task fields. Returns task dict or error dict."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        return {"error": "Invalid task_id format: expected UUID", "code": "VALIDATION_ERROR"}
    try:
        from datetime import datetime
        parsed_due_date = None
        if due_date:
            try:
                parsed_due_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
            except ValueError:
                return {"error": f"Invalid due_date format: {due_date}", "code": "VALIDATION_ERROR"}

        todo = todo_service.update_todo(
            session,
            task_uuid,
            user_id,
            TodoUpdate(
                title=title,
                description=description,
                priority=priority,
                tags=tags,
                due_date=parsed_due_date,
                completed=completed,
                is_recurring=is_recurring,
                recurrence_frequency=recurrence_frequency,
            ),
        )
        return _task_dict(todo)
    except HTTPException as exc:
        code = "NOT_FOUND" if exc.status_code == 404 else "INTERNAL_ERROR"
        return {"error": exc.detail, "code": code}
    except Exception as exc:
        return {"error": str(exc), "code": "INTERNAL_ERROR"}


# ---------------------------------------------------------------------------
# Kafka publishing (best-effort, imported lazily to avoid import errors in tests)
# ---------------------------------------------------------------------------

async def _publish_task_event(event_type: str, result: dict, user_id: str) -> None:
    """Best-effort Kafka publish. Never raises."""
    try:
        from app.services.kafka_service import publish_task_event, publish_reminder
        from datetime import datetime
        task_id = result.get("task_id", "")
        await publish_task_event(event_type, task_id, result, user_id)
        # Also publish reminder if task has a due date
        if result.get("due_date") and event_type in ("created", "updated"):
            due_dt = datetime.fromisoformat(result["due_date"].replace("Z", "+00:00"))
            await publish_reminder(task_id, result.get("title", ""), due_dt, user_id)
    except Exception as exc:
        logger.debug("Kafka publish skipped (Dapr not available): %s", exc)


# ---------------------------------------------------------------------------
# MCP async handler wrappers (used by server.py)
# ---------------------------------------------------------------------------


async def handle_add_task(args: dict) -> list:
    user_id = args["user_id"]

    def sync():
        with get_db_session() as session:
            return do_add_task(
                session,
                user_id=user_id,
                title=args["title"],
                description=args.get("description"),
                priority=args.get("priority", "medium"),
                tags=args.get("tags"),
                due_date=args.get("due_date"),
                is_recurring=args.get("is_recurring", False),
                recurrence_frequency=args.get("recurrence_frequency"),
            )

    result = await asyncio.to_thread(sync)
    if "task_id" in result:
        await _publish_task_event("created", result, user_id)
    if TextContent is not None:
        return [TextContent(type="text", text=json.dumps(result))]
    return [{"type": "text", "text": json.dumps(result)}]


async def handle_list_tasks(args: dict) -> list:
    def sync():
        with get_db_session() as session:
            return do_list_tasks(
                session,
                user_id=args["user_id"],
                status=args.get("status"),
                search=args.get("search"),
                priority=args.get("priority"),
                tag=args.get("tag"),
                sort_by=args.get("sort_by", "created_at"),
                sort_dir=args.get("sort_dir", "desc"),
            )

    result = await asyncio.to_thread(sync)
    if TextContent is not None:
        return [TextContent(type="text", text=json.dumps(result))]
    return [{"type": "text", "text": json.dumps(result)}]


async def handle_complete_task(args: dict) -> list:
    user_id = args["user_id"]

    def sync():
        with get_db_session() as session:
            return do_complete_task(session, user_id=user_id, task_id=args["task_id"])

    result = await asyncio.to_thread(sync)
    if "task_id" in result:
        await _publish_task_event("completed", result, user_id)
    if TextContent is not None:
        return [TextContent(type="text", text=json.dumps(result))]
    return [{"type": "text", "text": json.dumps(result)}]


async def handle_delete_task(args: dict) -> list:
    user_id = args["user_id"]

    def sync():
        with get_db_session() as session:
            return do_delete_task(session, user_id=user_id, task_id=args["task_id"])

    result = await asyncio.to_thread(sync)
    if "task_id" in result:
        await _publish_task_event("deleted", result, user_id)
    if TextContent is not None:
        return [TextContent(type="text", text=json.dumps(result))]
    return [{"type": "text", "text": json.dumps(result)}]


async def handle_update_task(args: dict) -> list:
    user_id = args["user_id"]

    def sync():
        with get_db_session() as session:
            return do_update_task(
                session,
                user_id=user_id,
                task_id=args["task_id"],
                title=args.get("title"),
                description=args.get("description"),
                priority=args.get("priority"),
                tags=args.get("tags"),
                due_date=args.get("due_date"),
                completed=args.get("completed"),
                is_recurring=args.get("is_recurring"),
                recurrence_frequency=args.get("recurrence_frequency"),
            )

    result = await asyncio.to_thread(sync)
    if "task_id" in result:
        await _publish_task_event("updated", result, user_id)
    if TextContent is not None:
        return [TextContent(type="text", text=json.dumps(result))]
    return [{"type": "text", "text": json.dumps(result)}]
