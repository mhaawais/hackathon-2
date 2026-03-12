"""Tests for cross-user access prevention (US4, FR-009)."""

from tests.conftest import USER_A_ID, USER_B_ID, auth_header


def test_user_cannot_see_other_users_todos(client):
    """User B's GET /todos should not include User A's todos."""
    # User A creates a todo
    client.post(
        "/api/todos",
        json={"title": "User A's todo"},
        headers=auth_header(USER_A_ID),
    )

    # User B lists todos — should be empty
    res = client.get("/api/todos", headers=auth_header(USER_B_ID))
    assert res.status_code == 200
    assert res.json() == []


def test_user_cannot_update_other_users_todo(client):
    """User B should get 404 when trying to PATCH User A's todo."""
    # User A creates a todo
    create_res = client.post(
        "/api/todos",
        json={"title": "Private todo"},
        headers=auth_header(USER_A_ID),
    )
    todo_id = create_res.json()["id"]

    # User B tries to update it
    res = client.patch(
        f"/api/todos/{todo_id}",
        json={"title": "Hacked"},
        headers=auth_header(USER_B_ID),
    )
    assert res.status_code == 404
    assert res.json()["detail"] == "Todo not found"


def test_user_cannot_complete_other_users_todo(client):
    """User B should get 404 when trying to complete User A's todo."""
    create_res = client.post(
        "/api/todos",
        json={"title": "My task"},
        headers=auth_header(USER_A_ID),
    )
    todo_id = create_res.json()["id"]

    res = client.patch(
        f"/api/todos/{todo_id}/complete",
        headers=auth_header(USER_B_ID),
    )
    assert res.status_code == 404


def test_user_cannot_delete_other_users_todo(client):
    """User B should get 404 when trying to DELETE User A's todo."""
    create_res = client.post(
        "/api/todos",
        json={"title": "Keep this"},
        headers=auth_header(USER_A_ID),
    )
    todo_id = create_res.json()["id"]

    res = client.delete(
        f"/api/todos/{todo_id}",
        headers=auth_header(USER_B_ID),
    )
    assert res.status_code == 404
