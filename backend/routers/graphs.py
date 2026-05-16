import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Graph
from schemas import GraphEdge, GraphNode, GraphResponse, GraphUpdateRequest

router = APIRouter()


@router.get("/papers/{paper_id}/graph", response_model=GraphResponse)
async def get_graph(paper_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Graph).where(Graph.paper_id == paper_id).order_by(Graph.version.desc(), Graph.created_at.desc())
    )
    graph = result.scalars().first()
    if not graph:
        raise HTTPException(404, "Graph not found")

    nodes = [GraphNode(**n) for n in json.loads(graph.nodes)]
    edges = [GraphEdge(**e) for e in json.loads(graph.edges)]

    return GraphResponse(
        id=graph.id,
        paper_id=graph.paper_id,
        nodes=nodes,
        edges=edges,
        version=graph.version,
    )


@router.put("/papers/{paper_id}/graph", response_model=GraphResponse)
async def update_graph(
    paper_id: str,
    req: GraphUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Graph).where(Graph.paper_id == paper_id).order_by(Graph.version.desc())
    )
    graph = result.scalars().first()
    if not graph:
        graph = Graph(paper_id=paper_id)
        db.add(graph)

    graph.nodes = json.dumps([n.model_dump() for n in req.nodes], ensure_ascii=False)
    graph.edges = json.dumps([e.model_dump() for e in req.edges], ensure_ascii=False)
    graph.version += 1
    await db.commit()

    return GraphResponse(
        id=graph.id,
        paper_id=graph.paper_id,
        nodes=req.nodes,
        edges=req.edges,
        version=graph.version,
    )
