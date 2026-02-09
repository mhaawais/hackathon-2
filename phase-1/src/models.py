"""Task model for the in-memory Todo CLI application."""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Task:
    """Represents a single todo item.

    Attributes:
        id: Unique auto-incremented integer identifier.
        title: Non-empty task title.
        description: Optional task description.
        status: Either 'pending' or 'completed'.
        created_at: Timestamp when the task was created.
    """

    id: int
    title: str
    description: str | None = None
    status: str = "pending"
    created_at: datetime = field(default_factory=datetime.now)

    def __str__(self) -> str:
        desc = self.description if self.description else "\u2014"
        return f"[{self.id}] {self.title} ({self.status}) - {desc}"
