"""Provider selection.

A single seam where the active LLM provider is chosen from config. Adding an
OpenAI/Claude provider later means adding a branch here — generators are
unaffected.
"""

from functools import lru_cache

from app.ai.base import LLMProvider
from app.ai.ollama import OllamaProvider
from app.core.config import settings


@lru_cache
def get_provider() -> LLMProvider:
    return OllamaProvider(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        timeout_seconds=settings.ollama_timeout_seconds,
    )
