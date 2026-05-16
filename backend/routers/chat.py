from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from llm import get_provider
from llm.base import LLMError
from llm.prompts import CHAT_SUGGESTIONS_SYSTEM
from models import ChatMessage, Paper
from schemas import ChatHistoryResponse, ChatMessageRequest, ChatMessageResponse
from services.chat_service import process_chat

router = APIRouter()


@router.post("/papers/{paper_id}/chat", response_model=ChatMessageResponse)
async def chat(
    paper_id: str,
    req: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    llm = get_provider(
        settings.llm_provider,
        settings.anthropic_api_key if settings.llm_provider == "claude" else settings.openai_api_key,
        settings.get_model("chat"),
        base_url=settings.openai_base_url,
        thinking=settings.get_thinking("chat"),
    )
    try:
        return await process_chat(paper_id, req.message, req.selected_node_ids, db, llm)
    except ValueError as e:
        raise HTTPException(404, str(e)) from e
    except LLMError as e:
        raise HTTPException(502, f"LLM error: {e}") from e


@router.get("/papers/{paper_id}/chat/suggestions")
async def get_suggestions(paper_id: str, db: AsyncSession = Depends(get_db)):
    paper = await db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")
    excerpt = (paper.extracted_text or "")[:3000]
    if not excerpt.strip():
        return {"questions": []}
    llm = get_provider(
        settings.llm_provider,
        settings.anthropic_api_key if settings.llm_provider == "claude" else settings.openai_api_key,
        settings.get_model("chat"),
        base_url=settings.openai_base_url,
        thinking=settings.get_thinking("chat"),
    )
    try:
        data = await llm.generate_json(CHAT_SUGGESTIONS_SYSTEM, excerpt)
        return {"questions": data.get("questions", [])}
    except Exception:
        return {"questions": []}


@router.get("/papers/{paper_id}/chat", response_model=ChatHistoryResponse)
async def get_chat_history(paper_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.paper_id == paper_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    return ChatHistoryResponse(
        messages=[
            ChatMessageResponse(role=m.role, content=m.content)
            for m in messages
        ]
    )
