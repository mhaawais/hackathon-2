"""Tests for todo CRUD routes (US3, FR-006, FR-007, FR-012)."""

from tests.conftest import USER_A_ID, auth_header


def test_create_todo(client):
    """POST /api/todos should create and return a todo."""
    res = client.post(
        "/api/todos",
        json={"title": "Test todo", "description": "A test"},
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Test todo"
    assert data["description"] == "A test"
    assert data["status"] == "pending"
    assert data["user_id"] == USER_A_ID


def test_list_todos(client):
    """GET /api/todos should return user's todos."""
    client.post(
        "/api/todos",
        json={"title": "Item 1"},
        headers=auth_header(USER_A_ID),
    )
    client.post(
        "/api/todos",
        json={"title": "Item 2"},
        headers=auth_header(USER_A_ID),
    )

    res = client.get("/api/todos", headers=auth_header(USER_A_ID))
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_update_todo(client):
    """PATCH /api/todos/{id} should update title/description."""
    create_res = client.post(
        "/api/todos",
        json={"title": "Original"},
        headers=auth_header(USER_A_ID),
    )
    todo_id = create_res.json()["id"]

    res = client.patch(
        f"/api/todos/{todo_id}",
        json={"title": "Updated", "description": "New desc"},
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 200
    assert res.json()["title"] == "Updated"
    assert res.json()["description"] == "New desc"


def test_complete_todo(client):
    """PATCH /api/todos/{id}/complete should mark as completed."""
    create_res = client.post(
        "/api/todos",
        json={"title": "Finish this"},
        headers=auth_header(USER_A_ID),
    )
    todo_id = create_res.json()["id"]

    res = client.patch(
        f"/api/todos/{todo_id}/complete",
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 200
    assert res.json()["status"] == "completed"

    # Toggle back to pending
    res2 = client.patch(
        f"/api/todos/{todo_id}/complete",
        headers=auth_header(USER_A_ID),
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "pending"


def test_delete_todo(client):
    """DELETE /api/todos/{id} should return 204 and remove todo."""
    create_res = client.post(
        "/api/todos",
        json={"title": "Delete me"},
        headers=auth_header(USER_A_ID),
    )
    todo_id = create_res.json()["id"]

    res = client.delete(
        f"/api/todos/{todo_id}",
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 204

    # Verify it's gone
    list_res = client.get("/api/todos", headers=auth_header(USER_A_ID))
    assert len(list_res.json()) == 0


def test_create_todo_without_auth_returns_error(client):
    """POST /api/todos without auth should return 401 or 403."""
    res = client.post("/api/todos", json={"title": "No auth"})
    assert res.status_code in (401, 403)


def test_get_todo_by_id_success(client):
    """GET /api/todos/{id} should return the todo for the owner."""
    create_res = client.post(
        "/api/todos",
        json={"title": "Get me by ID"},
        headers=auth_header(USER_A_ID),
    )
    assert create_res.status_code == 201
    todo_id = create_res.json()["id"]

    res = client.get(f"/api/todos/{todo_id}", headers=auth_header(USER_A_ID))
    assert res.status_code == 200
    assert res.json()["id"] == todo_id
    assert res.json()["title"] == "Get me by ID"


def test_get_todo_by_id_not_found(client):
    """GET /api/todos/{id} with unknown UUID should return 404."""
    import uuid
    fake_id = str(uuid.uuid4())
    res = client.get(f"/api/todos/{fake_id}", headers=auth_header(USER_A_ID))
    assert res.status_code == 404


def test_create_todo_empty_title(client):
    """POST /api/todos with whitespace-only title should return 422."""
    res = client.post(
        "/api/todos",
        json={"title": "   "},
        headers=auth_header(USER_A_ID),
    )
    assert res.status_code == 422
