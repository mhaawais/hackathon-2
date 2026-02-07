"""Tests for TaskStore — covers add, list, complete, update, delete operations."""

from src.store import TaskStore


# --- US1: Add ---

def test_add_task_returns_task_with_id_1():
    store = TaskStore()
    task = store.add("Buy groceries")
    assert task.id == 1
    assert task.title == "Buy groceries"
    assert task.status == "pending"


def test_add_task_auto_increments_id():
    store = TaskStore()
    t1 = store.add("Task 1")
    t2 = store.add("Task 2")
    t3 = store.add("Task 3")
    assert t1.id == 1
    assert t2.id == 2
    assert t3.id == 3


def test_add_task_with_description():
    store = TaskStore()
    task = store.add("Read book", description="Chapter 5")
    assert task.description == "Chapter 5"


def test_add_task_default_description_is_none():
    store = TaskStore()
    task = store.add("Buy groceries")
    assert task.description is None


# --- US2: List ---

def test_list_all_empty_store():
    store = TaskStore()
    assert store.list_all() == []


def test_list_all_with_tasks():
    store = TaskStore()
    store.add("Task 1")
    store.add("Task 2")
    store.add("Task 3")
    tasks = store.list_all()
    assert len(tasks) == 3


def test_list_by_status_pending():
    store = TaskStore()
    store.add("Task 1")
    store.add("Task 2")
    store.complete(1)
    pending = store.list_by_status("pending")
    assert len(pending) == 1
    assert pending[0].id == 2


def test_list_by_status_completed():
    store = TaskStore()
    store.add("Task 1")
    store.add("Task 2")
    store.complete(1)
    completed = store.list_by_status("completed")
    assert len(completed) == 1
    assert completed[0].id == 1


# --- US3: Complete ---

def test_complete_task_changes_status():
    store = TaskStore()
    store.add("Task 1")
    task = store.complete(1)
    assert task is not None
    assert task.status == "completed"


def test_complete_nonexistent_task_returns_none():
    store = TaskStore()
    result = store.complete(99)
    assert result is None


def test_complete_already_completed_task():
    store = TaskStore()
    store.add("Task 1")
    store.complete(1)
    task = store.complete(1)
    # store.complete doesn't check already-completed; that's the CLI layer's job
    assert task is not None
    assert task.status == "completed"


# --- US4: Update ---

def test_update_title_only():
    store = TaskStore()
    store.add("Old title")
    task = store.update(1, title="New title")
    assert task is not None
    assert task.title == "New title"


def test_update_description_only():
    store = TaskStore()
    store.add("Task 1")
    task = store.update(1, description="New description")
    assert task is not None
    assert task.description == "New description"


def test_update_both_title_and_description():
    store = TaskStore()
    store.add("Old title")
    task = store.update(1, title="New title", description="New desc")
    assert task is not None
    assert task.title == "New title"
    assert task.description == "New desc"


def test_update_nonexistent_task_returns_none():
    store = TaskStore()
    result = store.update(99, title="X")
    assert result is None


# --- US5: Delete ---

def test_delete_existing_task():
    store = TaskStore()
    store.add("Task 1")
    result = store.delete(1)
    assert result is True
    assert store.get(1) is None


def test_delete_nonexistent_task_returns_false():
    store = TaskStore()
    result = store.delete(99)
    assert result is False


def test_delete_does_not_reuse_ids():
    store = TaskStore()
    store.add("Task 1")
    store.delete(1)
    t2 = store.add("Task 2")
    assert t2.id == 2  # ID 1 is never reused
