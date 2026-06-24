"""Provider-agnostic LLM interface.

Generators (Milestones 5–10) call ``generate_json`` and depend only on this
protocol, so the concrete provider (Ollama, and later OpenAI/Claude) can be
swapped without touching generation logic.
"""

from typing import Any, Protocol, runtime_checkable


class LLMError(Exception):
    """Raised when the provider is unreachable or returns an unusable response.

    The API layer maps this to a 502/503 so callers get a clear signal that the
    failure is in the AI backend, not their request.
    """


@runtime_checkable
class LLMProvider(Protocol):
    async def generate_json(
        self, *, system: str, prompt: str, schema_hint: str | None = None
    ) -> dict[str, Any]:
        """Generate a response and return it parsed as a JSON object.

        Implementations must force the model into JSON mode and parse the
        result, raising :class:`LLMError` if the model is unreachable or the
        output is not valid JSON.
        """
        ...
