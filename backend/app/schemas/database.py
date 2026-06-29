from pydantic import BaseModel, Field


class Column(BaseModel):
    name: str
    type: str = ""
    constraints: str = ""  # e.g. "PRIMARY KEY", "NOT NULL", "UNIQUE"


class Table(BaseModel):
    name: str
    columns: list[Column] = Field(default_factory=list)
    indexes: list[str] = Field(default_factory=list)


class Relationship(BaseModel):
    """A foreign-key relationship between two tables."""

    from_table: str
    from_column: str = ""
    to_table: str
    to_column: str = ""
    kind: str = ""  # e.g. "one-to-many", "many-to-many"


class DatabaseSchema(BaseModel):
    """Relational design — the shape stored in ``designs.database_json``."""

    tables: list[Table] = Field(default_factory=list)
    relationships: list[Relationship] = Field(default_factory=list)
    sql: str = ""
