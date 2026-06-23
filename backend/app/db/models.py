"""Central import point for all ORM models.

Importing this module registers every model on ``Base.metadata`` for Alembic
autogenerate. Add new models here as milestones introduce them.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    projects: Mapped[list["Project"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    owner: Mapped["User"] = relationship(back_populates="projects")
    design: Mapped["Design | None"] = relationship(
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )


class Design(Base):
    """Persisted generated output for a project.

    One design per project. The ``*_json`` columns hold the structured output
    produced in Milestones 5–10 (null until generated); ``diagram_text`` holds
    the Mermaid source (Milestone 8).
    """

    __tablename__ = "designs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    requirements_json: Mapped[Any | None] = mapped_column(JSON, nullable=True)
    capacity_json: Mapped[Any | None] = mapped_column(JSON, nullable=True)
    architecture_json: Mapped[Any | None] = mapped_column(JSON, nullable=True)
    database_json: Mapped[Any | None] = mapped_column(JSON, nullable=True)
    api_json: Mapped[Any | None] = mapped_column(JSON, nullable=True)
    diagram_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    project: Mapped["Project"] = relationship(back_populates="design")


__all__ = ["Base", "User", "Project", "Design"]
