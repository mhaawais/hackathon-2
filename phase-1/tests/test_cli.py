"""CLI integration tests for all commands and the 90-second demo flow."""

from src.cli import (
    cmd_add,
    cmd_complete,
    cmd_delete,
    cmd_help,
    cmd_list,
    cmd_update,
    format_task_table,
    parse_id,
    parse_quoted_args,
)
from src.store import TaskStore

import pytest


# --- Parsing helpers ---

def test_parse_quoted_args_simple():
    assert parse_quoted_args('add "Buy groceries"') == ["add", "Buy groceries"]


def test_parse_quoted_args_with_description():
    result = parse_quoted_args('add "Buy groceries" "From the market"')
    assert result == ["add", "Buy groceries", "From the market"]


def test_parse_id_valid():
    assert parse_id("1") == 1
    assert parse_id("42") == 42


def test_parse_id_non_numeric():
    with pytest.raises(ValueError, match="positive integer"):
        parse_id("abc")


def test_parse_id_zero():
    with pytest.raises(ValueError, match="positive integer"):
        parse_id("0")


def test_parse_id_negative():
    with pytest.raises(ValueError, match="positive integer"):
        parse_id("-1")


# --- US1: Add command ---

def test_cmd_add_valid():
    store = TaskStore()
    result = cmd_add(["Buy groceries"], store)
    assert 'Task 1 added: "Buy groceries"' == result


def test_cmd_add_with_description():
    store = TaskStore()
    result = cmd_add(["Read book", "Chapter 5"], store)
    assert 'Task 1 added: "Read book"' == result
    task = store.get(1)
    assert task.description == "Chapter 5"


def test_cmd_add_empty_title():
    store = TaskStore()
    result = cmd_add([""], store)
    assert "Error: Title cannot be empty." == result


def test_cmd_add_whitespace_title():
    store = TaskStore()
    result = cmd_add(["   "], store)
    assert "Error: Title cannot be empty." == result


def test_cmd_add_no_args():
    store = TaskStore()
    result = cmd_add([], store)
    assert "Error: Title is required." in result


# --- US2: List command ---

def test_cmd_list_empty():
    store = TaskStore()
    result = cmd_list([], store)
    assert "No tasks found." == result


def test_cmd_list_with_tasks():
    store = TaskStore()
    store.add("Task 1")
    store.add("Task 2")
    result = cmd_list([], store)
    assert "Task 1" in result
    assert "Task 2" in result
    assert "ID" in result  # header present


def test_cmd_list_filter_pending():
    store = TaskStore()
    store.add("Task 1")
    store.add("Task 2")
    store.complete(1)
    result = cmd_list(["pending"], store)
    assert "Task 2" in result
    assert "Task 1" not in result


def test_cmd_list_filter_completed():
    store = TaskStore()
    store.add("Task 1")
    store.add("Task 2")
    store.complete(1)
    result = cmd_list(["completed"], store)
    assert "Task 1" in result
    assert "Task 2" not in result


def test_cmd_list_invalid_filter():
    store = TaskStore()
    result = cmd_list(["invalid"], store)
    assert "Error: Invalid status filter." in result


def test_format_task_table_output():
    store = TaskStore()
    store.add("Buy groceries")
    tasks = store.list_all()
    result = format_task_table(tasks)
    assert "ID" in result
    assert "Title" in result
    assert "Buy groceries" in result
    assert "pending" in result


# --- US3: Complete command ---

def test_cmd_complete_valid():
    store = TaskStore()
    store.add("Buy groceries")
    result = cmd_complete(["1"], store)
    assert 'Task 1 completed: "Buy groceries"' == result


def test_cmd_complete_not_found():
    store = TaskStore()
    result = cmd_complete(["99"], store)
    assert "Error: Task 99 not found." == result


def test_cmd_complete_already_completed():
    store = TaskStore()
    store.add("Task 1")
    store.complete(1)
    result = cmd_complete(["1"], store)
    assert "Error: Task 1 is already completed." == result


def test_cmd_complete_invalid_id():
    store = TaskStore()
    result = cmd_complete(["abc"], store)
    assert "Error: ID must be a positive integer." == result


def test_cmd_complete_no_args():
    store = TaskStore()
    result = cmd_complete([], store)
    assert "Error: ID is required." in result


# --- US4: Update command ---

def test_cmd_update_title_only():
    store = TaskStore()
    store.add("Old title")
    result = cmd_update(["1", "--title", "New title"], store)
    assert "Task 1 updated." == result
    assert store.get(1).title == "New title"


def test_cmd_update_description_only():
    store = TaskStore()
    store.add("Task 1")
    result = cmd_update(["1", "--description", "New desc"], store)
    assert "Task 1 updated." == result
    assert store.get(1).description == "New desc"


def test_cmd_update_both():
    store = TaskStore()
    store.add("Old title")
    result = cmd_update(["1", "--title", "New", "--description", "Desc"], store)
    assert "Task 1 updated." == result
    assert store.get(1).title == "New"
    assert store.get(1).description == "Desc"


def test_cmd_update_not_found():
    store = TaskStore()
    result = cmd_update(["99", "--title", "X"], store)
    assert "Error: Task 99 not found." == result


def test_cmd_update_no_flags():
    store = TaskStore()
    store.add("Task 1")
    result = cmd_update(["1"], store)
    assert "Error: Provide at least a title or description to update." == result


def test_cmd_update_empty_title():
    store = TaskStore()
    store.add("Task 1")
    result = cmd_update(["1", "--title", ""], store)
    assert "Error: Title cannot be empty." == result


def test_cmd_update_no_args():
    store = TaskStore()
    result = cmd_update([], store)
    assert "Error: ID is required." in result


def test_cmd_update_invalid_id():
    store = TaskStore()
    result = cmd_update(["abc", "--title", "X"], store)
    assert "Error: ID must be a positive integer." == result


# --- US5: Delete command ---

def test_cmd_delete_valid():
    store = TaskStore()
    store.add("Task 1")
    result = cmd_delete(["1"], store)
    assert "Task 1 deleted." == result
    assert store.get(1) is None


def test_cmd_delete_not_found():
    store = TaskStore()
    result = cmd_delete(["99"], store)
    assert "Error: Task 99 not found." == result


def test_cmd_delete_invalid_id():
    store = TaskStore()
    result = cmd_delete(["abc"], store)
    assert "Error: ID must be a positive integer." == result


def test_cmd_delete_no_args():
    store = TaskStore()
    result = cmd_delete([], store)
    assert "Error: ID is required." in result


def test_cmd_delete_id_not_reused():
    store = TaskStore()
    store.add("Task 1")
    store.delete(1)
    t2 = store.add("Task 2")
    assert t2.id == 2


# --- Help command ---

def test_cmd_help():
    result = cmd_help()
    assert "add" in result
    assert "list" in result
    assert "update" in result
    assert "complete" in result
    assert "delete" in result
    assert "help" in result
    assert "exit" in result


# --- T031: Integration smoke test (90-second demo flow) ---

def test_full_demo_flow():
    """Full 90-second demo flow per quickstart.md:
    add 3 → list → complete 1 → list pending → list completed → update 1 → delete 1 → list
    """
    store = TaskStore()

    # Add 3 tasks
    r1 = cmd_add(["Buy groceries"], store)
    assert 'Task 1 added' in r1

    r2 = cmd_add(["Read book", "Chapter 5 of Clean Code"], store)
    assert 'Task 2 added' in r2

    r3 = cmd_add(["Write tests"], store)
    assert 'Task 3 added' in r3

    # List all — should show 3 tasks
    r4 = cmd_list([], store)
    assert "Buy groceries" in r4
    assert "Read book" in r4
    assert "Write tests" in r4

    # Complete task 1
    r5 = cmd_complete(["1"], store)
    assert 'Task 1 completed' in r5

    # List pending — should show tasks 2 and 3
    r6 = cmd_list(["pending"], store)
    assert "Read book" in r6
    assert "Write tests" in r6
    assert "Buy groceries" not in r6

    # List completed — should show task 1
    r7 = cmd_list(["completed"], store)
    assert "Buy groceries" in r7
    assert "Read book" not in r7

    # Update task 2
    r8 = cmd_update(["2", "--title", "Read Clean Code", "--description", "Chapters 5-7"], store)
    assert "Task 2 updated." == r8
    assert store.get(2).title == "Read Clean Code"
    assert store.get(2).description == "Chapters 5-7"

    # Delete task 3
    r9 = cmd_delete(["3"], store)
    assert "Task 3 deleted." == r9

    # Final list — should show tasks 1 (completed) and 2 (pending)
    r10 = cmd_list([], store)
    assert "Buy groceries" in r10
    assert "Read Clean Code" in r10
    assert "Write tests" not in r10
