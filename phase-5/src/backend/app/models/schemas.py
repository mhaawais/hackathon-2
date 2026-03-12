import uuid
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class TodoCreate(BaseModel):
    title: str = Field(max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    priority: Literal["high", "medium", "low"] = "medium"
    tags: List[str] = []
    due_date: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title cannot be empty or contain only whitespace")
        return v


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    priority: Optional[Literal["high", "medium", "low"]] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None


class ToolCallRecord(BaseModel):
    tool_name: str
    arguments: dict
    result: dict


class ChatRequest(BaseModel):
    message: str
    conversation_id: int | None = None

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message cannot be empty")
        return v


class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: list[ToolCallRecord]


class TodoResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    priority: str
    tags: List[str]
    due_date: Optional[datetime]
    status: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
