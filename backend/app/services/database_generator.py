"""Database schema generation (Milestone 9).

Given the system prompt plus the already-generated requirements and
architecture, proposes a relational design: tables (with columns and indexes),
foreign-key relationships, and the full SQL DDL. Provider is forced into JSON
mode and validated against the :class:`DatabaseSchema` schema.
"""

import json
from typing import Any

from app.ai.base import LLMError, LLMProvider
from app.schemas.database import DatabaseSchema, Relationship, Table

_SYSTEM = (
    "You are a senior database architect. Given a system's requirements and "
    "component architecture, design a normalized relational schema. Produce "
    "concrete tables with columns (name, type, constraints), useful indexes, "
    "and the foreign-key relationships between tables. Also produce the full "
    "CREATE TABLE SQL DDL (PostgreSQL dialect). Output JSON only."
)

_SCHEMA_HINT = (
    '{"tables": [{"name": "string", "columns": [{"name": "string", '
    '"type": "string", "constraints": "string"}], "indexes": ["string"]}], '
    '"relationships": [{"from_table": "string", "from_column": "string", '
    '"to_table": "string", "to_column": "string", "kind": "one-to-many"}], '
    '"sql": "CREATE TABLE ..."}'
)


async def generate_database(
    provider: LLMProvider,
    prompt: str,
    requirements: dict[str, Any] | None,
    architecture: dict[str, Any] | None,
) -> DatabaseSchema:
    context_parts = [f"System to design:\n{prompt}"]
    if requirements:
        context_parts.append("Requirements:\n" + json.dumps(requirements, indent=2))
    if architecture:
        # The services and databases inform which tables are needed.
        summary = {
            k: architecture.get(k)
            for k in ("services", "databases")
            if k in architecture
        }
        context_parts.append("Architecture:\n" + json.dumps(summary, indent=2))

    user_prompt = (
        "\n\n".join(context_parts)
        + "\n\nDesign the relational schema: the tables (each with columns and "
        "indexes), the foreign-key relationships between them, and the full "
        "PostgreSQL CREATE TABLE statements in the `sql` field. Use concrete "
        "names (e.g. users, orders, payments, restaurants)."
    )

    data = await provider.generate_json(
        system=_SYSTEM, prompt=user_prompt, schema_hint=_SCHEMA_HINT
    )

    return _coerce_schema(data)


def _coerce_schema(data: dict[str, Any]) -> DatabaseSchema:
    """Build a DatabaseSchema, dropping malformed list items rather than failing.

    Local models occasionally emit a stray malformed table/relationship object;
    we keep the well-formed ones instead of rejecting the whole (otherwise good)
    response.
    """
    def _valid(model_cls: type, items: Any) -> list:
        out = []
        if isinstance(items, list):
            for item in items:
                try:
                    out.append(model_cls.model_validate(item))
                except ValueError:
                    continue  # skip the malformed entry
        return out

    if not isinstance(data, dict):
        raise LLMError("Generated database schema was not a JSON object.")

    tables = _valid(Table, data.get("tables"))
    relationships = _valid(Relationship, data.get("relationships"))
    sql = data.get("sql") if isinstance(data.get("sql"), str) else ""

    if not tables:
        raise LLMError("Generated database schema contained no usable tables.")

    return DatabaseSchema(tables=tables, relationships=relationships, sql=sql)
