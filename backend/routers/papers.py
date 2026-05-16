import json
import logging
import os
import shutil

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import async_session, get_db
from llm import get_provider
from llm.prompts import TITLE_SHORTENING_SYSTEM
from models import ChatMessage, Graph, Paper
from schemas import PaperResponse
from services.graph_service import generate_graph
from services.pdf_service import extract_pdf

router = APIRouter()
logger = logging.getLogger(__name__)


async def _process_paper(paper_id: str):
    """Background task: parse PDF, generate graph."""
    async with async_session() as db:
        paper = await db.get(Paper, paper_id)
        if not paper:
            return

        try:
            if not paper.extracted_text:
                paper.status = "parsing"
                await db.commit()

                text, title = await extract_pdf(paper.pdf_path)
                paper.extracted_text = text
                paper.original_title = title or paper.original_title
                await db.commit()
            else:
                text = paper.extracted_text

            paper.status = "generating"
            await db.commit()

            title_llm = get_provider(
                settings.llm_provider,
                settings.anthropic_api_key if settings.llm_provider == "claude" else settings.openai_api_key,
                settings.get_model("title"),
                base_url=settings.openai_base_url,
                thinking=settings.get_thinking("title"),
            )
            short = await title_llm.generate(TITLE_SHORTENING_SYSTEM, paper.original_title)
            paper.short_title = short.strip().strip('"')

            graph_llm = get_provider(
                settings.llm_provider,
                settings.anthropic_api_key if settings.llm_provider == "claude" else settings.openai_api_key,
                settings.get_model("graph"),
                base_url=settings.openai_base_url,
                thinking=settings.get_thinking("graph"),
            )
            graph_data = await generate_graph(text, graph_llm)

            graph = Graph(
                paper_id=paper_id,
                nodes=json.dumps(graph_data["nodes"], ensure_ascii=False),
                edges=json.dumps(graph_data["edges"], ensure_ascii=False),
            )
            db.add(graph)

            paper.status = "ready"
            await db.commit()

        except Exception as e:
            logger.exception(f"Error processing paper {paper_id}")
            paper.status = "error"
            paper.error_message = str(e)[:500]
            await db.commit()


@router.post("/papers", response_model=PaperResponse)
async def upload_paper(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    os.makedirs(settings.pdf_storage_path, exist_ok=True)

    paper = Paper(original_title=file.filename.rsplit(".", 1)[0])
    db.add(paper)
    await db.flush()

    pdf_path = os.path.join(settings.pdf_storage_path, f"{paper.id}.pdf")
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    paper.pdf_path = pdf_path
    await db.commit()

    background_tasks.add_task(_process_paper, paper.id)
    return paper


@router.get("/papers", response_model=list[PaperResponse])
async def list_papers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Paper).order_by(Paper.created_at.desc()))
    return result.scalars().all()


@router.get("/papers/{paper_id}", response_model=PaperResponse)
async def get_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    paper = await db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")
    return paper


@router.get("/papers/{paper_id}/pdf")
async def get_paper_pdf(paper_id: str, db: AsyncSession = Depends(get_db)):
    paper = await db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")
    if not os.path.exists(paper.pdf_path):
        raise HTTPException(404, "PDF file not found")
    return FileResponse(paper.pdf_path, media_type="application/pdf")


@router.post("/papers/{paper_id}/retry", response_model=PaperResponse)
async def retry_paper(
    paper_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    paper = await db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")
    result = await db.execute(select(Graph).where(Graph.paper_id == paper_id))
    for old_graph in result.scalars().all():
        await db.delete(old_graph)
    paper.status = "parsing"
    paper.error_message = None
    await db.commit()
    background_tasks.add_task(_process_paper, paper.id)
    return paper


@router.delete("/papers/{paper_id}")
async def delete_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    paper = await db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")
    for model in (Graph, ChatMessage):
        result = await db.execute(select(model).where(model.paper_id == paper_id))
        for row in result.scalars().all():
            await db.delete(row)
    if paper.pdf_path and os.path.exists(paper.pdf_path):
        os.remove(paper.pdf_path)
    await db.delete(paper)
    await db.commit()
    return {"ok": True}
