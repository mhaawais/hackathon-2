"""Tests for the Task model."""

from src.models import Task


def test_task_creation_with_defaults():
    task = Task(id=1, title="Test task")
    assert task.id == 1
    assert task.title == "Test task"
    assert task.description is None
    assert task.status == "pending"
    assert task.created_at is not None


def test_task_creation_with_description():
    task = Task(id=2, title="Test task", description="A description")
    assert task.description == "A description"


def test_task_str_without_description():
    task = Task(id=1, title="Buy groceries")
    result = str(task)
    assert "Buy groceries" in result
    assert "pending" in result


def test_task_str_with_description():
    task = Task(id=1, title="Read book", description="Chapter 5")
    result = str(task)
    assert "Read book" in result
    assert "Chapter 5" in result
