from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    prompt: str = Field(default="", max_length=10_000)


class ProjectUpdate(BaseModel):
    """Partial update — only provided fields are written."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    prompt: str | None = Field(default=None, max_length=10_000)


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    prompt: str
    created_at: datetime
    updated_at: datetime
