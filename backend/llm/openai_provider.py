import json
import logging

import openai

from .base import LLMError, LLMProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str, base_url: str = "", thinking: bool = False):
        kwargs: dict = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = openai.AsyncOpenAI(**kwargs)
        self.model = model
        self.thinking = thinking

    def _build_kwargs(self, system_prompt: str, user_prompt: str, **extra) -> dict:
        kwargs: dict = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        if self.thinking:
            kwargs["extra_body"] = {"thinking": {"type": "enabled"}}
            kwargs["max_tokens"] = 65536
        else:
            kwargs["max_tokens"] = 16384
        kwargs.update(extra)
        return kwargs

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                **self._build_kwargs(system_prompt, user_prompt)
            )
            return response.choices[0].message.content or ""
        except openai.APIError as e:
            raise LLMError(f"OpenAI API error: {e}") from e

    async def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        try:
            extra: dict = {}
            if not self.thinking:
                extra["response_format"] = {"type": "json_object"}
            response = await self.client.chat.completions.create(
                **self._build_kwargs(system_prompt, user_prompt, **extra)
            )
            content = response.choices[0].message.content or "{}"
            cleaned = content.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
            return json.loads(cleaned)
        except openai.BadRequestError:
            logger.info("response_format not supported, falling back to prompt-based JSON")
            return await super().generate_json(system_prompt, user_prompt)
        except openai.APIError as e:
            raise LLMError(f"OpenAI API error: {e}") from e
        except json.JSONDecodeError as e:
            raise LLMError(f"Failed to parse JSON: {e}") from e
