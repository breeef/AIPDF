import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from config import settings
from database import get_db, init_db
from llm import get_provider
from llm.prompts import TRANSLATE_SYSTEM, EXPLAIN_SYSTEM, EXPLAIN_USER_TEMPLATE
from models import Paper
from routers import chat, graphs, papers


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="AI Paper Reader", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(papers.router, prefix="/api")
app.include_router(graphs.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


class SettingsResponse(BaseModel):
    llm_provider: str
    openai_base_url: str
    openai_api_key: str
    llm_model: str
    graph_model: str
    graph_thinking: bool
    chat_model: str
    chat_thinking: bool
    title_model: str
    title_thinking: bool
    translate_model: str
    translate_thinking: bool
    explain_model: str
    explain_thinking: bool


class SettingsUpdate(BaseModel):
    llm_model: str | None = None
    graph_model: str | None = None
    graph_thinking: bool | None = None
    chat_model: str | None = None
    chat_thinking: bool | None = None
    title_model: str | None = None
    title_thinking: bool | None = None
    translate_model: str | None = None
    translate_thinking: bool | None = None
    explain_model: str | None = None
    explain_thinking: bool | None = None
    openai_api_key: str | None = None
    openai_base_url: str | None = None


@app.get("/api/settings", response_model=SettingsResponse)
async def get_settings():
    key = settings.openai_api_key
    masked_key = (key[:3] + "***" + key[-4:]) if len(key) > 8 else ("*" * len(key))
    return SettingsResponse(
        llm_provider=settings.llm_provider,
        openai_base_url=settings.openai_base_url,
        openai_api_key=masked_key,
        llm_model=settings.llm_model,
        graph_model=settings.graph_model,
        graph_thinking=settings.graph_thinking,
        chat_model=settings.chat_model,
        chat_thinking=settings.chat_thinking,
        title_model=settings.title_model,
        title_thinking=settings.title_thinking,
        translate_model=settings.translate_model,
        translate_thinking=settings.translate_thinking,
        explain_model=settings.explain_model,
        explain_thinking=settings.explain_thinking,
    )


@app.put("/api/settings", response_model=SettingsResponse)
async def update_settings(req: SettingsUpdate):
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    updates: dict[str, str] = {}
    for field in req.model_fields_set:
        val = getattr(req, field)
        attr = field.upper()
        if isinstance(val, bool):
            setattr(settings, field, val)
            updates[attr] = "true" if val else "false"
        elif val is not None:
            setattr(settings, field, val)
            updates[attr] = val

    if updates and os.path.exists(env_path):
        lines = []
        with open(env_path, "r") as f:
            lines = f.readlines()
        existing_keys = set()
        new_lines = []
        for line in lines:
            key = line.split("=", 1)[0].strip() if "=" in line else ""
            if key in updates:
                new_lines.append(f"{key}={updates[key]}\n")
                existing_keys.add(key)
            else:
                new_lines.append(line)
        for key, val in updates.items():
            if key not in existing_keys:
                new_lines.append(f"{key}={val}\n")
        with open(env_path, "w") as f:
            f.writelines(new_lines)

    return await get_settings()


class TranslateRequest(BaseModel):
    text: str


class TranslateResponse(BaseModel):
    translation: str


class ExplainRequest(BaseModel):
    text: str
    paper_id: str


class ExplainResponse(BaseModel):
    title: str
    description: str


@app.post("/api/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest):
    llm = get_provider(
        settings.llm_provider,
        settings.openai_api_key,
        settings.get_model("translate"),
        base_url=settings.openai_base_url,
        thinking=settings.get_thinking("translate"),
    )
    result = await llm.generate(TRANSLATE_SYSTEM, req.text)
    return TranslateResponse(translation=result.strip())


@app.post("/api/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest, db: AsyncSession = Depends(get_db)):
    paper = await db.get(Paper, req.paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")

    paper_excerpt = (paper.extracted_text or "")[:3000]
    user_prompt = EXPLAIN_USER_TEMPLATE.format(
        paper_excerpt=paper_excerpt,
        selected_text=req.text,
    )

    llm = get_provider(
        settings.llm_provider,
        settings.openai_api_key,
        settings.get_model("explain"),
        base_url=settings.openai_base_url,
        thinking=settings.get_thinking("explain"),
    )
    data = await llm.generate_json(EXPLAIN_SYSTEM, user_prompt)
    return ExplainResponse(
        title=data.get("title", req.text[:20]),
        description=data.get("description", ""),
    )
