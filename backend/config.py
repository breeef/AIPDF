from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./storage/aipdf.db"
    pdf_storage_path: str = "./storage/pdfs"
    llm_provider: str = "openai"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    openai_base_url: str = ""
    llm_model: str = ""

    graph_model: str = ""
    graph_thinking: bool = True
    chat_model: str = ""
    chat_thinking: bool = False
    title_model: str = ""
    title_thinking: bool = False
    translate_model: str = ""
    translate_thinking: bool = False
    explain_model: str = ""
    explain_thinking: bool = False

    def get_model(self, task: str) -> str:
        m = getattr(self, f"{task}_model", "") or self.llm_model
        if m:
            return m
        if self.llm_provider == "claude":
            return "claude-sonnet-4-20250514"
        return "gpt-4o"

    def get_thinking(self, task: str) -> bool:
        return getattr(self, f"{task}_thinking", False)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
