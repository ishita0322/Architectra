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
    "and the foreign-key relationships between tables. Output JSON only."
)

# Only the structured tables/relationships are LLM-generated; the CREATE TABLE
# DDL is synthesized deterministically from them (asking the model to also emit
# the full SQL doubles the output and frequently times out on CPU).
_SCHEMA_HINT = (
    '{"tables": [{"name": "string", "columns": [{"name": "string", '
    '"type": "string", "constraints": "string"}], "indexes": ["string"]}], '
    '"relationships": [{"from_table": "string", "from_column": "string", '
    '"to_table": "string", "to_column": "string", "kind": "one-to-many"}]}'
)


async def generate_database(
    provider: LLMProvider,
    prompt: str,
    requirements: dict[str, Any] | None,
    architecture: dict[str, Any] | None,
) -> DatabaseSchema:
    context_parts = [f"System to design:\n{prompt}"]
    if requirements:
        # Functional requirements drive the tables; keep the input lean.
        funcs = requirements.get("functional") if isinstance(requirements, dict) else None
        if funcs:
            context_parts.append("Functional requirements:\n" + json.dumps(funcs))
    if architecture and isinstance(architecture.get("services"), list):
        # Only service names are needed to infer the entities; full
        # responsibilities/dependencies would bloat the prompt and slow things.
        names = [s.get("name") for s in architecture["services"] if isinstance(s, dict)]
        context_parts.append("Services:\n" + json.dumps(names))

    user_prompt = (
        "\n\n".join(context_parts)
        + "\n\nDesign the relational schema: the tables (each with columns and "
        "indexes) and the foreign-key relationships between them. Use concrete "
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

    if not tables:
        raise LLMError("Generated database schema contained no usable tables.")

    # Synthesize the CREATE TABLE DDL from the structured tables (Swagger-style:
    # let the model do semantics, generate the verbose SQL deterministically).
    sql = _build_sql(tables, relationships)

    return DatabaseSchema(tables=tables, relationships=relationships, sql=sql)


def _build_sql(tables: list[Table], relationships: list[Relationship]) -> str:
    """Produce PostgreSQL CREATE TABLE DDL from the structured tables."""
    blocks: list[str] = []
    fks_by_table: dict[str, list[Relationship]] = {}
    for r in relationships:
        if r.from_table and r.to_table:
            fks_by_table.setdefault(r.from_table, []).append(r)

    for t in tables:
        lines = [f"CREATE TABLE {t.name} ("]
        col_defs = []
        for c in t.columns:
            parts = [c.name, c.type or "TEXT"]
            if c.constraints:
                parts.append(c.constraints)
            col_defs.append("    " + " ".join(p for p in parts if p).strip())
        for fk in fks_by_table.get(t.name, []):
            if fk.from_column and fk.to_column:
                col_defs.append(
                    f"    FOREIGN KEY ({fk.from_column}) "
                    f"REFERENCES {fk.to_table}({fk.to_column})"
                )
        lines.append(",\n".join(col_defs))
        lines.append(");")
        block = "\n".join(lines)
        for idx in t.indexes:
            # Accept either a bare column name or a full CREATE INDEX statement.
            if idx.strip().upper().startswith("CREATE"):
                block += "\n" + idx.rstrip(";") + ";"
            else:
                safe = idx.replace(" ", "_")
                block += f"\nCREATE INDEX idx_{t.name}_{safe} ON {t.name} ({idx});"
        blocks.append(block)

    return "\n\n".join(blocks)
