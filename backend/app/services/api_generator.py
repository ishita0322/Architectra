"""API contract generation (Milestone 10).

Given the system prompt plus the already-generated requirements, architecture,
and database schema, proposes the REST API: endpoints with request/response
models and error responses, plus a Swagger-ready OpenAPI 3 document. Provider
is forced into JSON mode; malformed endpoint entries are dropped rather than
failing the whole response.
"""

import json
from typing import Any

from app.ai.base import LLMError, LLMProvider
from app.schemas.api_contract import ApiContract, Endpoint

_SYSTEM = (
    "You are a senior API designer. Given a system's requirements, architecture "
    "and database schema, design its REST API. For each endpoint give the HTTP "
    "method, path, a short summary, a request model, a response model, and the "
    "error responses. Output JSON only."
)

# Only the endpoints are LLM-generated; the OpenAPI document is synthesized
# deterministically from them (asking the model to hand-emit a full nested
# OpenAPI doc roughly doubles latency and frequently times out on CPU).
_SCHEMA_HINT = (
    '{"endpoints": [{"method": "POST", "path": "/orders", "summary": "string", '
    '"request_model": {"field": "type"}, "response_model": {"field": "type"}, '
    '"error_responses": [{"status": 404, "description": "string"}]}]}'
)


async def generate_api_contract(
    provider: LLMProvider,
    prompt: str,
    requirements: dict[str, Any] | None,
    architecture: dict[str, Any] | None,
    database: dict[str, Any] | None,
) -> ApiContract:
    # Keep the input lean: large upstream context (full requirements + every
    # service's responsibilities/deps) bloats the prompt and times out on CPU.
    context_parts = [f"System to design:\n{prompt}"]
    if requirements and isinstance(requirements.get("functional"), list):
        context_parts.append(
            "Functional requirements:\n" + json.dumps(requirements["functional"])
        )
    if architecture and isinstance(architecture.get("services"), list):
        names = [s.get("name") for s in architecture["services"] if isinstance(s, dict)]
        context_parts.append("Services:\n" + json.dumps(names))
    if database and isinstance(database.get("tables"), list):
        tables = [t.get("name") for t in database["tables"] if isinstance(t, dict)]
        context_parts.append("Database tables:\n" + json.dumps(tables))

    user_prompt = (
        "\n\n".join(context_parts)
        + "\n\nDesign the REST API: the endpoints (method, path, summary, request "
        "model, response model, error responses). Use concrete resource paths "
        "(e.g. POST /orders, GET /orders/{id})."
    )

    data = await provider.generate_json(
        system=_SYSTEM, prompt=user_prompt, schema_hint=_SCHEMA_HINT
    )

    return _coerce(data, title=prompt[:60] or "Generated API")


def _coerce(data: Any, title: str) -> ApiContract:
    """Build an ApiContract, dropping malformed endpoints rather than failing.

    The OpenAPI document is synthesized from the validated endpoints (Swagger-
    ready, exportable) rather than asked of the model.
    """
    if not isinstance(data, dict):
        raise LLMError("Generated API contract was not a JSON object.")

    endpoints = []
    raw_endpoints = data.get("endpoints")
    if isinstance(raw_endpoints, list):
        for item in raw_endpoints:
            try:
                endpoints.append(Endpoint.model_validate(item))
            except ValueError:
                continue  # skip malformed entry

    if not endpoints:
        raise LLMError("Generated API contract contained no usable endpoints.")

    return ApiContract(endpoints=endpoints, openapi=_build_openapi(endpoints, title))


def _build_openapi(endpoints: list[Endpoint], title: str) -> dict[str, Any]:
    """Synthesize a minimal, valid OpenAPI 3.0 document from the endpoints."""
    paths: dict[str, Any] = {}
    for ep in endpoints:
        method = (ep.method or "get").lower()
        path = ep.path or "/"
        operation: dict[str, Any] = {"summary": ep.summary or ""}
        if ep.request_model:
            operation["requestBody"] = {
                "content": {
                    "application/json": {
                        "schema": {"type": "object", "example": ep.request_model}
                    }
                }
            }
        responses: dict[str, Any] = {
            "200": {
                "description": "Successful response",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "example": ep.response_model or {},
                        }
                    }
                },
            }
        }
        for err in ep.error_responses:
            if err.status:
                responses[str(err.status)] = {"description": err.description or ""}
        operation["responses"] = responses
        paths.setdefault(path, {})[method] = operation

    return {
        "openapi": "3.0.0",
        "info": {"title": title, "version": "1.0.0"},
        "paths": paths,
    }
