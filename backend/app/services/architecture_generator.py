"""Architecture generation (Milestone 7).

Given the system prompt plus the already-generated requirements and capacity
estimates, proposes the system components: services (with their dependencies),
databases, queues, and caches. Provider is forced into JSON mode and validated
against the :class:`Architecture` schema.
"""

import json
from typing import Any

from app.ai.base import LLMError, LLMProvider
from app.schemas.architecture import Architecture, Component, Service

_SYSTEM = (
    "You are a senior software architect. Given a system's requirements and "
    "capacity profile, propose a concrete component architecture: services, "
    "databases, queues, and caches. Prefer a small, sensible set of components "
    "for the described system; do not over-engineer. For each service list the "
    "other components it depends on (calls), so the relationships are explicit. "
    "Output JSON only."
)

_SCHEMA_HINT = (
    '{"services": [{"name": "string", "responsibility": "string", '
    '"depends_on": ["component name", ...]}], '
    '"databases": [{"name": "string", "purpose": "string"}], '
    '"queues": [{"name": "string", "purpose": "string"}], '
    '"caches": [{"name": "string", "purpose": "string"}]}'
)


async def generate_architecture(
    provider: LLMProvider,
    prompt: str,
    requirements: dict[str, Any] | None,
    capacity: dict[str, Any] | None,
) -> Architecture:
    context_parts = [f"System to design:\n{prompt}"]
    if requirements:
        context_parts.append("Requirements:\n" + json.dumps(requirements, indent=2))
    if capacity:
        # Only the headline numbers matter for component choices.
        summary = {
            k: capacity.get(k)
            for k in ("peak_rps", "average_rps", "database_size_human", "cache_recommendation")
            if k in capacity
        }
        context_parts.append("Capacity profile:\n" + json.dumps(summary, indent=2))

    user_prompt = (
        "\n\n".join(context_parts)
        + "\n\nPropose the services (each with a one-line responsibility and the "
        "components it depends on), plus the databases, queues, and caches the "
        "system needs. Use concrete names (e.g. API Gateway, Auth Service, "
        "PostgreSQL, Redis, Kafka)."
    )

    data = await provider.generate_json(
        system=_SYSTEM, prompt=user_prompt, schema_hint=_SCHEMA_HINT
    )

    return _coerce(data)


def _coerce(data: Any) -> Architecture:
    """Build an Architecture, dropping malformed items rather than failing.

    Local models occasionally emit a stray malformed entry (a bare string where
    an object is expected, or a component missing ``name``). We keep the
    well-formed ones instead of rejecting the whole (otherwise good) response.
    """
    if not isinstance(data, dict):
        raise LLMError("Generated architecture was not a JSON object.")

    def _valid(model_cls: type, items: Any) -> list:
        out = []
        if isinstance(items, list):
            for item in items:
                try:
                    out.append(model_cls.model_validate(item))
                except ValueError:
                    continue
        return out

    services = _valid(Service, data.get("services"))
    if not services:
        raise LLMError("Generated architecture contained no usable services.")

    return Architecture(
        services=services,
        databases=_valid(Component, data.get("databases")),
        queues=_valid(Component, data.get("queues")),
        caches=_valid(Component, data.get("caches")),
    )
