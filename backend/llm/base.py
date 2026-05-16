import json
from abc import ABC, abstractmethod


class LLMError(Exception):
    pass


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> str: ...

    async def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        raw = await self.generate(
            system_prompt + "\n\nRespond ONLY with valid JSON. No markdown fences, no extra text.",
            user_prompt,
        )
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise LLMError(f"Failed to parse LLM JSON response: {e}\nRaw: {raw[:500]}") from e


def get_provider(provider_name: str, api_key: str, model: str, base_url: str = "", thinking: bool = False) -> LLMProvider:
    if provider_name == "claude":
        from .claude_provider import ClaudeProvider
        return ClaudeProvider(api_key=api_key, model=model)
    elif provider_name == "openai":
        from .openai_provider import OpenAIProvider
        return OpenAIProvider(api_key=api_key, model=model, base_url=base_url, thinking=thinking)
    raise ValueError(f"Unknown LLM provider: {provider_name}")
