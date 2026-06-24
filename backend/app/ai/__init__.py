"""AI provider layer.

A small provider abstraction so the LLM backend can be swapped (Ollama now,
OpenAI/Claude later — see steps.md "Future Enhancements") without the rest of
the app changing. Generators depend on the ``LLMProvider`` protocol, not on a
concrete client.
"""

from app.ai.base import LLMError, LLMProvider
from app.ai.provider import get_provider

__all__ = ["LLMProvider", "LLMError", "get_provider"]
