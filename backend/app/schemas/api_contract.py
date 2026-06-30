from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    status: int = 0
    description: str = ""


class Endpoint(BaseModel):
    """A single REST endpoint definition."""

    method: str
    path: str
    summary: str = ""
    request_model: dict[str, Any] | None = None
    response_model: dict[str, Any] | None = None
    error_responses: list[ErrorResponse] = Field(default_factory=list)


class ApiContract(BaseModel):
    """REST API definitions — the shape stored in ``designs.api_json``.

    ``openapi`` holds the OpenAPI 3 document so the output is Swagger-ready and
    exportable directly.
    """

    endpoints: list[Endpoint] = Field(default_factory=list)
    openapi: dict[str, Any] | None = None
