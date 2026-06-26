from pydantic import BaseModel, Field


class Service(BaseModel):
    """A service/component. ``depends_on`` names other components it calls,
    capturing the relationships needed for the diagram (Milestone 8)."""

    name: str
    responsibility: str = ""
    depends_on: list[str] = Field(default_factory=list)


class Component(BaseModel):
    """A backing component (database, queue, or cache)."""

    name: str
    purpose: str = ""


class Architecture(BaseModel):
    """System components — the shape stored in ``designs.architecture_json``."""

    services: list[Service] = Field(default_factory=list)
    databases: list[Component] = Field(default_factory=list)
    queues: list[Component] = Field(default_factory=list)
    caches: list[Component] = Field(default_factory=list)
