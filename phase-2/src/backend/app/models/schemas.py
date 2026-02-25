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


class TodoResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
