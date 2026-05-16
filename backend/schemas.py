from datetime import datetime

from pydantic import BaseModel


class PaperResponse(BaseModel):
    id: str
    original_title: str
    short_title: str | None
    status: str
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class GraphNode(BaseModel):
    id: str
    type: str
    label: str
    description: str = ""
    color: str = "#6366f1"
    position_x: float = 0
    position_y: float = 0
    page_ref: str | None = None
    width: float | None = None
    importance: int = 3
    label_style: dict[str, str] | None = None
    desc_style: dict[str, str] | None = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = ""


class GraphResponse(BaseModel):
    id: str
    paper_id: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    version: int


class GraphUpdateRequest(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class GraphDiff(BaseModel):
    add_nodes: list[GraphNode] = []
    remove_nodes: list[str] = []
    update_nodes: list[dict] = []
    add_edges: list[GraphEdge] = []
    remove_edges: list[str] = []
    update_edges: list[dict] = []
    explanation: str = ""


class ChatMessageRequest(BaseModel):
    message: str
    selected_node_ids: list[str] = []


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    diff: GraphDiff | None = None
    suggestions: list[str] = []


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
