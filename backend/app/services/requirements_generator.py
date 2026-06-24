"""Requirements generation (Milestone 5).

Turns a natural-language system-design prompt into structured functional /
non-functional requirements and assumptions. The provider is forced into JSON
mode and the result is validated against the :class:`Requirements` schema, so
callers always get a well-formed object (or an :class:`LLMError`).
"""

from app.ai.base import LLMError, LLMProvider
from app.schemas.requirements import Requirements

_SYSTEM = (
    "You are a senior software architect. Given a system to design, produce "
    "concise, concrete requirements. Be specific to the system described; do "
    "not invent unrelated features. Output JSON only."
)

_SCHEMA_HINT = (
    '{"functional": ["string", ...], '
    '"non_functional": ["string", ...], '
    '"assumptions": ["string", ...]}'
)


async def generate_requirements(provider: LLMProvider, prompt: str) -> Requirements:
    user_prompt = (
        f"System to design:\n{prompt}\n\n"
        "List the functional requirements (what the system does), the "
        "non-functional requirements (scalability, availability, latency, "
        "security, etc.), and the assumptions you are making. Each item should "
        "be a short, single-sentence string."
    )

    data = await provider.generate_json(
        system=_SYSTEM, prompt=user_prompt, schema_hint=_SCHEMA_HINT
    )

    try:
        # Ignore any extra keys the model adds; coerce to our schema.
        return Requirements.model_validate(data)
    except ValueError as exc:
        raise LLMError(f"Generated requirements did not match schema: {exc}") from exc
