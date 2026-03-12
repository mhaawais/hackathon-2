import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class Todo(SQLModel, table=True):
    __tablename__ = "todo"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(nullable=False, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    priority: str = Field(default="medium", nullable=False)
    tags: list = Field(default=[], sa_column=Column(JSON, nullable=False, server_default="[]"))
    due_date: Optional[datetime] = Field(default=None)
    status: str = Field(default="pending")
    # Recurring task fields (Spec-010)
    is_recurring: bool = Field(default=False, nullable=False)
    recurrence_frequency: Optional[str] = Field(default=None)  # daily/weekly/monthly
    reminder_sent: bool = Field(default=False, nullable=False)
    user_id: str = Field(nullable=False, index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
