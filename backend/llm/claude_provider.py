import anthropic

from .base import LLMError, LLMProvider


class ClaudeProvider(LLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=8192,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return response.content[0].text
        except anthropic.APIError as e:
            raise LLMError(f"Claude API error: {e}") from e
