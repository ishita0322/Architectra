from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Declarative base for all ORM models.

    Models are imported in ``app.db.models`` so Alembic autogenerate can
    discover them via this shared metadata.
    """
