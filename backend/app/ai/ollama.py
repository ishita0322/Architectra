"""Ollama-backed LLM provider.

Talks to the Ollama REST API (``POST /api/generate``) with ``format: "json"``,
which constrains the model to emit a single valid JSON value. We still parse
defensively and raise :class:`LLMError` on anything unusable.
"""

import json
from typing import Any

import httpx

from app.ai.base import LLMError


class OllamaProvider:
    def __init__(self, base_url: str, model: str, timeout_seconds: float) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout_seconds

    async def generate_json(
        self, *, system: str, prompt: str, schema_hint: str | None = None
    ) -> dict[str, Any]:
        user_prompt = prompt
        if schema_hint:
            user_prompt = (
                f"{prompt}\n\n"
                f"Respond ONLY with a JSON object matching this shape:\n{schema_hint}"
            )

        payload = {
            "model": self._model,
            "system": system,
            "prompt": user_prompt,
            "stream": False,
            # Force the model to emit a single valid JSON value.
            "format": "json",
            # Disable reasoning-model "thinking" traces (qwen3 et al.): they add
            # large hidden token costs that roughly double latency and can blow
            # past the timeout for heavier prompts. We only want the JSON answer.
            "think": False,
            "options": {"temperature": 0.2},
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(
                    f"{self._base_url}/api/generate", json=payload
                )
                # Models that don't support "think" reject it with a 400;
                # retry once without it so the provider stays model-agnostic.
                if resp.status_code == 400 and "think" in payload:
                    payload.pop("think")
                    resp = await client.post(
                        f"{self._base_url}/api/generate", json=payload
                    )
                resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise LLMError(
                f"Ollama returned {exc.response.status_code}. Is the model "
                f"'{self._model}' pulled? (ollama pull {self._model})"
            ) from exc
        except httpx.TimeoutException as exc:
            raise LLMError(
                f"Ollama timed out after {self._timeout:.0f}s generating with "
                f"'{self._model}'. CPU inference can be slow for large prompts; "
                f"raise OLLAMA_TIMEOUT_SECONDS or use a smaller model. ({exc!r})"
            ) from exc
        except httpx.HTTPError as exc:
            raise LLMError(
                f"Could not reach Ollama at {self._base_url}. Is it running? "
                f"({exc!r})"
            ) from exc

        body = resp.json()
        # Ollama wraps the model's text in {"response": "...", ...}.
        raw = body.get("response", "")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise LLMError(
                f"Model did not return valid JSON: {raw[:200]!r}"
            ) from exc

        if not isinstance(parsed, dict):
            raise LLMError(
                f"Model returned JSON but not an object (got {type(parsed).__name__})."
            )
        return parsed
