"""Requirements generation (Milestone 5).

Turns a natural-language system-design prompt into structured functional /
non-functional requirements and assumptions. The provider is forced into JSON
mode and the result is validated against the :class:`Requirements` schema, so
callers always get a well-formed object (or an :class:`LLMError`).
"""

from typing import Any

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

    if not isinstance(data, dict):
        raise LLMError("Generated requirements was not a JSON object.")

    # Coerce each section to a list of strings, ignoring malformed items, so a
    # stray non-string entry doesn't reject the whole response.
    def _strs(items: Any) -> list[str]:
        if not isinstance(items, list):
            return []
        return [str(x) for x in items if isinstance(x, (str, int, float))]

    req = Requirements(
        functional=_strs(data.get("functional")),
        non_functional=_strs(data.get("non_functional")),
        assumptions=_strs(data.get("assumptions")),
    )
    if not (req.functional or req.non_functional or req.assumptions):
        raise LLMError("Generated requirements were empty.")
    return req
