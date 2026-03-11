"""Tests for MCP task tool handlers — Spec-5: MCP Task Server.

Tests call the pure sync do_*() functions directly using the existing session fixture.
No MCP subprocess or server.py required — the sync layer is the unit under test.
"""

import os
import sys
import uuid

import pytest
from sqlmodel import Session

# Add src/mcp/ to sys.path so we can import tools.task_tools without shadowing
# the installed PyPI 'mcp' package (which is at src/mcp/ — different from the package).
_mcp_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "mcp")
)
if _mcp_dir not in sys.path:
    sys.path.insert(0, _mcp_dir)

# Import Todo model so SQLModel.metadata registers the table before session fixture runs.
from app.models.todo import Todo  # noqa: F401, E402

from tools.task_tools import (  # noqa: E402
    do_add_task,
    do_complete_task,
    do_delete_task,
    do_list_tasks,
    do_update_task,
)

USER_A = "mcp-user-a-spec5"
USER_B = "mcp-user-b-spec5"


# ---------------------------------------------------------------------------
# US1 — add_task
# ---------------------------------------------------------------------------


def test_add_task_success(session: Session) -> None:
    result = do_add_task(session, USER_A, "Buy milk")
    assert "error" not in result
    assert result["task_id"] is not None
    assert result["title"] == "Buy milk"
    assert result["status"] == "pending"


def test_add_task_with_description(session: Session) -> None:
    result = do_add_task(session, USER_A, "Buy milk", description="Whole milk, 2 litres")
    assert "error" not in result
    assert result["description"] == "Whole milk, 2 litres"


def test_add_task_empty_title(session: Session) -> None:
    result = do_add_task(session, USER_A, "   ")
    assert result.get("code") == "VALIDATION_ERROR"
    assert "error" in result


# ---------------------------------------------------------------------------
# US2 — list_tasks
# ---------------------------------------------------------------------------


def test_list_tasks_all(session: Session) -> None:
    do_add_task(session, USER_A, "Task 1")
    do_add_task(session, USER_A, "Task 2")
    result = do_list_tasks(session, USER_A)
    assert "error" not in result
    assert result["count"] == 2
    assert len(result["tasks"]) == 2


def test_list_tasks_status_filter(session: Session) -> None:
    r1 = do_add_task(session, USER_A, "Pending task")
    task_id = r1["task_id"]
    do_add_task(session, USER_A, "Another pending task")
    # Complete one task
    do_complete_task(session, USER_A, task_id)
    # Filter by pending
    result = do_list_tasks(session, USER_A, status="pending")
    assert result["count"] == 1
    assert result["tasks"][0]["status"] == "pending"
    # Filter by completed
    result_completed = do_list_tasks(session, USER_A, status="completed")
    assert result_completed["count"] == 1
    assert result_completed["tasks"][0]["status"] == "completed"


def test_list_tasks_empty(session: Session) -> None:
    result = do_list_tasks(session, "no-tasks-user-spec5")
    assert "error" not in result
    assert result["count"] == 0
    assert result["tasks"] == []


def test_list_tasks_user_isolation(session: Session) -> None:
    do_add_task(session, USER_A, "User A task 1")
    do_add_task(session, USER_A, "User A task 2")
    do_add_task(session, USER_B, "User B task")
    result_a = do_list_tasks(session, USER_A)
    result_b = do_list_tasks(session, USER_B)
    assert result_a["count"] == 2
    assert result_b["count"] == 1
    assert all(t["title"].startswith("User A") for t in result_a["tasks"])
    assert result_b["tasks"][0]["title"] == "User B task"


# ---------------------------------------------------------------------------
# US3 — complete_task / delete_task / update_task
# ---------------------------------------------------------------------------


def test_complete_task_success(session: Session) -> None:
    r = do_add_task(session, USER_A, "Task to complete")
    task_id = r["task_id"]
    result = do_complete_task(session, USER_A, task_id)
    assert "error" not in result
    assert result["status"] == "completed"
    assert result["toggled"] is True
    assert result["task_id"] == task_id


def test_complete_task_not_found(session: Session) -> None:
    result = do_complete_task(session, USER_A, str(uuid.uuid4()))
    assert result.get("code") == "NOT_FOUND"
    assert "error" in result


def test_delete_task_success(session: Session) -> None:
    r = do_add_task(session, USER_A, "Task to delete")
    task_id = r["task_id"]
    result = do_delete_task(session, USER_A, task_id)
    assert "error" not in result
    assert result["deleted"] is True
    # Verify gone from list
    list_result = do_list_tasks(session, USER_A)
    ids = [t["task_id"] for t in list_result["tasks"]]
    assert task_id not in ids


def test_delete_task_not_found(session: Session) -> None:
    result = do_delete_task(session, USER_A, str(uuid.uuid4()))
    assert result.get("code") == "NOT_FOUND"
    assert "error" in result


def test_update_task_success(session: Session) -> None:
    r = do_add_task(session, USER_A, "Original title")
    task_id = r["task_id"]
    result = do_update_task(session, USER_A, task_id, title="Updated title")
    assert "error" not in result
    assert result["title"] == "Updated title"
    assert result["task_id"] == task_id


def test_update_task_not_found(session: Session) -> None:
    result = do_update_task(session, USER_A, str(uuid.uuid4()), title="x")
    assert result.get("code") == "NOT_FOUND"
    assert "error" in result


def test_invalid_task_id_format(session: Session) -> None:
    result = do_complete_task(session, USER_A, "not-a-valid-uuid")
    assert result.get("code") == "VALIDATION_ERROR"
    assert "error" in result
