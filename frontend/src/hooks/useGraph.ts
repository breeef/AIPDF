"use client";

import { useCallback, useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import * as api from "@/lib/api";
import type { GraphNode, GraphEdge, GraphDiff } from "@/lib/types";

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  version: number;
  loading: boolean;
}

function toFlowNode(n: GraphNode): Node {
  return {
    id: n.id,
    type: n.type === "detail" ? "detail" : "knowledge",
    position: { x: n.position_x, y: n.position_y },
    data: {
      label: n.label,
      description: n.description,
      nodeType: n.type,
      color: n.color,
      page_ref: n.page_ref,
      importance: n.importance ?? 3,
      ...(n.width ? { width: n.width } : {}),
      ...(n.label_style ? { labelStyle: n.label_style } : {}),
      ...(n.desc_style ? { descStyle: n.desc_style } : {}),
    },
  };
}

function toFlowEdge(e: GraphEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: "custom",
  };
}

function toApiNode(n: Node): GraphNode {
  return {
    id: n.id,
    type: n.data.nodeType as GraphNode["type"],
    label: n.data.label as string,
    description: (n.data.description as string) || "",
    color: (n.data.color as string) || "#6366f1",
    position_x: n.position.x,
    position_y: n.position.y,
    page_ref: n.data.page_ref as string | null,
    width: (n.data.width as number) || undefined,
    importance: (n.data.importance as number) || 3,
    label_style: (n.data.labelStyle as Record<string, string>) || undefined,
    desc_style: (n.data.descStyle as Record<string, string>) || undefined,
  };
}

function toApiEdge(e: Edge): GraphEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: (e.label as string) || "",
  };
}

export function useGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadGraph = useCallback(async (paperId: string) => {
    setLoading(true);
    try {
      const data = await api.getGraph(paperId);
      setNodes(data.nodes.map(toFlowNode));
      setEdges(data.edges.map(toFlowEdge));
      setVersion(data.version);
    } catch {
      setNodes([]);
      setEdges([]);
      setVersion(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGraph = useCallback(
    async (paperId: string, currentNodes: Node[], currentEdges: Edge[]) => {
      try {
        await api.saveGraph(
          paperId,
          currentNodes.map(toApiNode),
          currentEdges.map(toApiEdge)
        );
      } catch {
        // ignore save errors during processing/retry
      }
    },
    []
  );

  const applyDiff = useCallback(
    (diff: GraphDiff): { newNodes: Node[]; newEdges: Edge[] } => {
      let updatedNodes = [...nodes];
      let updatedEdges = [...edges];

      updatedNodes = updatedNodes.filter(
        (n) => !diff.remove_nodes.includes(n.id)
      );
      updatedEdges = updatedEdges.filter(
        (e) => !diff.remove_edges.includes(e.id)
      );

      for (const update of diff.update_nodes) {
        const id = update.id as string;
        updatedNodes = updatedNodes.map((n) => {
          if (n.id !== id) return n;
          const newData = { ...n.data };
          if (update.label !== undefined) newData.label = update.label;
          if (update.description !== undefined)
            newData.description = update.description;
          if (update.type !== undefined) newData.nodeType = update.type;
          if (update.color !== undefined) newData.color = update.color;
          if (update.width !== undefined) newData.width = update.width;
          return { ...n, data: newData };
        });
      }

      for (const update of diff.update_edges) {
        const id = update.id as string;
        updatedEdges = updatedEdges.map((e) => {
          if (e.id !== id) return e;
          return {
            ...e,
            ...(update.label !== undefined ? { label: update.label as string } : {}),
            ...(update.source !== undefined ? { source: update.source as string } : {}),
            ...(update.target !== undefined ? { target: update.target as string } : {}),
          };
        });
      }

      const newFlowNodes = diff.add_nodes.map(toFlowNode);
      const newFlowEdges = diff.add_edges.map(toFlowEdge);

      updatedNodes = [...updatedNodes, ...newFlowNodes];
      updatedEdges = [...updatedEdges, ...newFlowEdges];

      setNodes(updatedNodes);
      setEdges(updatedEdges);

      return { newNodes: updatedNodes, newEdges: updatedEdges };
    },
    [nodes, edges]
  );

  return {
    nodes,
    edges,
    version,
    loading,
    setNodes,
    setEdges,
    loadGraph,
    saveGraph,
    applyDiff,
  };
}
