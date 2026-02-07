"""In-memory task store with auto-incrementing IDs."""

from src.models import Task


class TaskStore:
    """In-memory store wrapping a dict[int, Task] with auto-increment ID generation."""

    def __init__(self) -> None:
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1

    def add(self, title: str, description: str | None = None) -> Task:
        """Create a new task with the next available ID."""
        task = Task(id=self._next_id, title=title, description=description)
        self._tasks[self._next_id] = task
        self._next_id += 1
        return task

    def get(self, task_id: int) -> Task | None:
        """Retrieve a task by ID, or None if not found."""
        return self._tasks.get(task_id)

    def list_all(self) -> list[Task]:
        """Return all tasks ordered by ID."""
        return list(self._tasks.values())

    def list_by_status(self, status: str) -> list[Task]:
        """Return tasks matching the given status."""
        return [t for t in self._tasks.values() if t.status == status]

    def update(self, task_id: int, title: str | None = None, description: str | None = None) -> Task | None:
        """Update a task's title and/or description. Returns the task or None if not found."""
        task = self._tasks.get(task_id)
        if task is None:
            return None
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        return task

    def complete(self, task_id: int) -> Task | None:
        """Mark a task as completed. Returns the task or None if not found."""
        task = self._tasks.get(task_id)
        if task is None:
            return None
        task.status = "completed"
        return task

    def delete(self, task_id: int) -> bool:
        """Remove a task by ID. Returns True if deleted, False if not found."""
        if task_id in self._tasks:
            del self._tasks[task_id]
            return True
        return False
