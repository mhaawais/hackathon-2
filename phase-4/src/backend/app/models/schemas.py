import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class TodoCreate(BaseModel):
    title: str = Field(max_length=500)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title cannot be empty or contain only whitespace")
        return v


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=5000)


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
    description: str | None
    status: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
