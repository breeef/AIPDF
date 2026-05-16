import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from llm.base import LLMProvider
from llm.prompts import CHAT_SYSTEM, CHAT_EDIT_USER_TEMPLATE
from models import ChatMessage, Graph, Paper
from schemas import ChatMessageResponse, GraphDiff


async def process_chat(
    paper_id: str,
    message: str,
    selected_node_ids: list[str],
    db: AsyncSession,
    llm: LLMProvider,
) -> ChatMessageResponse:
    paper = await db.get(Paper, paper_id)
    if not paper:
        raise ValueError("Paper not found")

    result = await db.execute(
        select(Graph).where(Graph.paper_id == paper_id).order_by(Graph.version.desc())
    )
    graph = result.scalars().first()

    nodes = json.loads(graph.nodes) if graph else []
    edges = json.loads(graph.edges) if graph else []

    selected_nodes = [n for n in nodes if n["id"] in selected_node_ids] if selected_node_ids else []

    paper_excerpt = (paper.extracted_text or "")[:3000]

    graph_json = json.dumps({"nodes": nodes, "edges": edges}, ensure_ascii=False, indent=2)

    user_prompt = CHAT_EDIT_USER_TEMPLATE.format(
        graph_json=graph_json,
        selected_nodes=json.dumps(selected_nodes, ensure_ascii=False) if selected_nodes else "None",
        paper_excerpt=paper_excerpt,
        user_message=message,
    )

    history = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.paper_id == paper_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    past_messages = list(reversed(history.scalars().all()))

    context = ""
    if past_messages:
        context = "\n\n## Recent Chat History\n"
        for msg in past_messages[-6:]:
            context += f"\n{msg.role}: {msg.content[:200]}"
        user_prompt = context + "\n\n" + user_prompt

    response_data = await llm.generate_json(CHAT_SYSTEM, user_prompt)

    mode = response_data.get("mode", "answer")

    if mode == "edit":
        diff_data = response_data.get("diff", {})
        diff = GraphDiff(
            add_nodes=diff_data.get("add_nodes", []),
            remove_nodes=diff_data.get("remove_nodes", []),
            update_nodes=diff_data.get("update_nodes", []),
            add_edges=diff_data.get("add_edges", []),
            remove_edges=diff_data.get("remove_edges", []),
            update_edges=diff_data.get("update_edges", []),
            explanation=response_data.get("explanation", ""),
        )
        content = diff.explanation
    else:
        diff = None
        content = response_data.get("content", "")

    user_msg = ChatMessage(paper_id=paper_id, role="user", content=message)
    assistant_msg = ChatMessage(
        paper_id=paper_id,
        role="assistant",
        content=content,
        graph_snapshot=json.dumps({"nodes": nodes, "edges": edges}, ensure_ascii=False),
    )
    db.add(user_msg)
    db.add(assistant_msg)
    await db.commit()

    follow_ups = response_data.get("follow_ups", [])

    return ChatMessageResponse(role="assistant", content=content, diff=diff, suggestions=follow_ups)
