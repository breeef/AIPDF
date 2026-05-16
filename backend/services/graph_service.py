from collections import defaultdict, deque

from llm.base import LLMProvider
from llm.prompts import GRAPH_GENERATION_SYSTEM

VALID_TYPES = {
    "input": "#64748b",
    "module": "#06b6d4",
    "mechanism": "#8b5cf6",
    "output": "#10b981",
    "hyperparam": "#f59e0b",
    "phase": "#ef4444",
    "detail": "#94a3b8",
}

TYPE_REMAP = {
    "concept": "module",
    "method": "module",
    "finding": "output",
    "entity": "input",
    "metric": "output",
    "dataset": "input",
    "loss": "mechanism",
    "training": "phase",
}

INITIAL_REMAP = {
    "hyperparam": "mechanism",
    "phase": "module",
}


async def generate_graph(paper_text: str, llm: LLMProvider) -> dict:
    truncated = paper_text[:20000]
    data = await llm.generate_json(GRAPH_GENERATION_SYSTEM, truncated)

    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    _normalize_node_types(nodes, initial=True)
    _validate_edges(nodes, edges)
    _assign_pipeline_positions(nodes, edges)

    return {"nodes": nodes, "edges": edges}


def _normalize_node_types(nodes: list[dict], initial: bool = False):
    for node in nodes:
        t = node.get("type", "").lower()
        if t not in VALID_TYPES:
            t = TYPE_REMAP.get(t, "module")
        if initial and t in INITIAL_REMAP:
            t = INITIAL_REMAP[t]
        node["type"] = t
        node["color"] = VALID_TYPES[t]


def _assign_pipeline_positions(nodes: list[dict], edges: list[dict]):
    if not nodes:
        return

    node_ids = {n["id"] for n in nodes}
    adj: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {n["id"]: 0 for n in nodes}

    for e in edges:
        s, t = e.get("source"), e.get("target")
        if s in node_ids and t in node_ids:
            adj[s].append(t)
            in_degree[t] = in_degree.get(t, 0) + 1

    # topological sort to assign rows
    queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
    depth: dict[str, int] = {}
    while queue:
        nid = queue.popleft()
        if nid not in depth:
            depth[nid] = 0
        for child in adj[nid]:
            depth[child] = max(depth.get(child, 0), depth[nid] + 1)
            in_degree[child] -= 1
            if in_degree[child] == 0:
                queue.append(child)

    for n in nodes:
        if n["id"] not in depth:
            depth[n["id"]] = 0

    rows: dict[int, list[str]] = defaultdict(list)
    for nid, d in depth.items():
        rows[d].append(nid)

    node_map = {n["id"]: n for n in nodes}
    y_gap, x_gap = 120, 220
    for row_idx in sorted(rows.keys()):
        ids = rows[row_idx]
        total_width = (len(ids) - 1) * x_gap
        start_x = 400 - total_width // 2
        for col, nid in enumerate(ids):
            node_map[nid]["position_x"] = start_x + col * x_gap
            node_map[nid]["position_y"] = 80 + row_idx * y_gap


def _validate_edges(nodes: list[dict], edges: list[dict]):
    node_ids = {n["id"] for n in nodes}
    to_remove = []
    for i, edge in enumerate(edges):
        if edge.get("source") not in node_ids or edge.get("target") not in node_ids:
            to_remove.append(i)
    for i in reversed(to_remove):
        edges.pop(i)
