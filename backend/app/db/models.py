"""Central import point for all ORM models.

Milestone 0 ships no domain tables yet — models land here starting with
Milestone 1 (users). Importing this module registers every model on
``Base.metadata`` for Alembic autogenerate.
"""

from app.db.base import Base  # noqa: F401

__all__ = ["Base"]
