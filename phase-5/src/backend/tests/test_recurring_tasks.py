"""Tests for Spec-010: Recurring tasks + advanced fields."""

from tests.conftest import USER_A_ID, auth_header


def test_create_recurring_task(client):
    """POST /api/todos with is_recurring=True and recurrence_frequency."""
    res = client.post(
        "/api/todos",
        json={
            "title": "Weekly standup",
            "is_recurring": True,
            "recurrence_frequency": "weekly",
            "priority": "high",
        },
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 201
    data = res.json()
    assert data["is_recurring"] is True
    assert data["recurrence_frequency"] == "weekly"
    assert data["reminder_sent"] is False


def test_create_non_recurring_defaults(client):
    """Tasks default to non-recurring."""
    res = client.post(
        "/api/todos",
        json={"title": "One-off task"},
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 201
    data = res.json()
    assert data["is_recurring"] is False
    assert data["recurrence_frequency"] is None
    assert data["reminder_sent"] is False


def test_update_task_to_recurring(client):
    """PATCH /api/todos/{id} can enable recurring on an existing task."""
    create_res = client.post(
        "/api/todos",
        json={"title": "Daily journal"},
        headers=auth_header(USER_A_ID),
    )
    todo_id = create_res.json()["id"]

    res = client.patch(
        f"/api/todos/{todo_id}",
        json={"is_recurring": True, "recurrence_frequency": "daily"},
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 200
    assert res.json()["is_recurring"] is True
    assert res.json()["recurrence_frequency"] == "daily"


def test_create_task_with_due_date(client):
    """POST /api/todos with due_date returns task with due_date set."""
    res = client.post(
        "/api/todos",
        json={
            "title": "Submit report",
            "due_date": "2026-04-01T09:00:00Z",
            "priority": "high",
        },
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 201
    data = res.json()
    assert data["due_date"] is not None
    assert "2026-04-01" in data["due_date"]


def test_internal_route_forbidden_without_header(client):
    """POST /api/internal/todos without X-Internal-Service header → 403."""
    res = client.post(
        "/api/internal/todos",
        json={"title": "Sneaky task"},
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 403


def test_internal_route_forbidden_wrong_service(client):
    """POST /api/internal/todos with unknown service name → 403."""
    res = client.post(
        "/api/internal/todos",
        json={"title": "Sneaky task"},
        headers={**auth_header(USER_A_ID), "X-Internal-Service": "evil-service"},
    )
    assert res.status_code == 403


def test_internal_route_creates_task(client):
    """POST /api/internal/todos with trusted service + user header → 201."""
    res = client.post(
        "/api/internal/todos",
        json={"title": "Next occurrence of weekly standup"},
        headers={
            "X-Internal-Service": "recurring-task-service",
            "X-User-Id": USER_A_ID,
        },
    )
    assert res.status_code == 201
    assert res.json()["title"] == "Next occurrence of weekly standup"
