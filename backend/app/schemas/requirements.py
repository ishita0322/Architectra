from pydantic import BaseModel, Field


class RequirementsGenerateRequest(BaseModel):
    """Request body for requirements generation.

    ``prompt`` is optional: if omitted, the project's stored prompt is used.
    Sending one here also updates the project's prompt so re-generation and the
    workspace editor stay in sync.
    """

    prompt: str | None = Field(default=None, max_length=10_000)


class Requirements(BaseModel):
    """Structured requirements — the shape stored in ``designs.requirements_json``."""

    functional: list[str] = Field(default_factory=list)
    non_functional: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
