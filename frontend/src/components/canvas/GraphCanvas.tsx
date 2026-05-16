"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type OnNodesChange,
  type OnEdgesChange,
  type OnSelectionChangeFunc,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { toPng } from "@/lib/export-png";

import { useAppStore } from "@/store/app-store";
import { useGraph } from "@/hooks/useGraph";
import { useGraphHistory } from "@/hooks/useGraphHistory";
import { nodeTypes } from "./nodes";
import { CustomEdge } from "./edges/CustomEdge";
import { Toolbar } from "./Toolbar";
import { NodePropertyPanel } from "./NodePropertyPanel";
import type { GraphDiff } from "@/lib/types";
import { Loader2 } from "lucide-react";

const edgeTypes = { custom: CustomEdge };

const defaultEdgeOptions = {
  type: "custom",
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });
  nodes.forEach((node) => {
    const w = (node.data.width as number) || 180;
    const h = node.type === "detail" ? 40 : 70;
    g.setNode(node.id, { width: w, height: h });
  });
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  dagre.layout(g);
  return nodes.map((node) => {
    const pos = g.node(node.id);
    const w = (node.data.width as number) || 180;
    return { ...node, position: { x: pos.x - w / 2, y: pos.y - 35 } };
  });
}

function GraphCanvasInner() {
  const { selectedPaperId, selectedNodeIds, setSelectedNodes, editingNodeId, setEditingNode, papers } = useAppStore();
  const { nodes, edges, loading, setNodes, setEdges, loadGraph, saveGraph, applyDiff } =
    useGraph();
  const { pushSnapshot, undo, redo, canUndo, canRedo, clear } = useGraphHistory();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const needsAutoLayout = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graphRef = useRef<{ applyDiff: typeof applyDiff; nodes: typeof nodes; edges: typeof edges }>({
    applyDiff, nodes, edges,
  });
  graphRef.current = { applyDiff, nodes, edges };

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);
  const paperReady = selectedPaper?.status === "ready";

  useEffect(() => {
    if (selectedPaperId && paperReady) {
      clear();
      needsAutoLayout.current = true;
      loadGraph(selectedPaperId);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [selectedPaperId, paperReady, loadGraph, setNodes, setEdges, clear]);

  useEffect(() => {
    if (nodes.length > 0 && !loading && needsAutoLayout.current) {
      needsAutoLayout.current = false;
      const laid = applyDagreLayout(nodes, edges);
      setNodes(laid);
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [loading, nodes.length, edges, fitView, setNodes]);

  const debouncedSave = useCallback(
    (paperId: string, n: Node[], e: Edge[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveGraph(paperId, n, e);
      }, 300);
    },
    [saveGraph]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: sel }) => setSelectedNodes(sel.map((n) => n.id)),
    [setSelectedNodes]
  );

  const onNodeDragStop = useCallback(() => {
    if (selectedPaperId) {
      pushSnapshot(nodes, edges);
      saveGraph(selectedPaperId, nodes, edges);
    }
  }, [selectedPaperId, nodes, edges, pushSnapshot, saveGraph]);

  const handleAddNode = useCallback(() => {
    pushSnapshot(nodes, edges);
    setNodes((nds) => [
      ...nds,
      {
        id: `n_manual_${Date.now()}`,
        type: "knowledge",
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        data: { label: "新节点", description: "", nodeType: "module", color: "#06b6d4", page_ref: null },
      },
    ]);
  }, [nodes, edges, pushSnapshot, setNodes]);

  const handleDelete = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    pushSnapshot(nodes, edges);
    const ids = new Set(selectedNodeIds);
    setNodes((nds) => nds.filter((n) => !ids.has(n.id)));
    setEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)));
    setEditingNode(null);
  }, [selectedNodeIds, nodes, edges, pushSnapshot, setNodes, setEdges, setEditingNode]);

  const handleUndo = useCallback(() => {
    const s = undo(nodes, edges);
    if (s) { setNodes(s.nodes); setEdges(s.edges); }
  }, [nodes, edges, undo, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const s = redo(nodes, edges);
    if (s) { setNodes(s.nodes); setEdges(s.edges); }
  }, [nodes, edges, redo, setNodes, setEdges]);

  const handleAutoLayout = useCallback(() => {
    pushSnapshot(nodes, edges);
    const laid = applyDagreLayout(nodes, edges);
    setNodes(laid);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, pushSnapshot, setNodes, fitView]);

  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      pushSnapshot(nodes, edges);
      const updated = nodes.map((n) => {
        if (n.id !== nodeId) return n;
        return { ...n, data: { ...n.data, ...updates } };
      });
      setNodes(updated);
      if (selectedPaperId) {
        debouncedSave(selectedPaperId, updated, edges);
      }
    },
    [nodes, edges, pushSnapshot, setNodes, selectedPaperId, debouncedSave]
  );

  const handleUpdateEdgeLabel = useCallback(
    (edgeId: string, newLabel: string) => {
      pushSnapshot(nodes, edges);
      const updated = edges.map((e) =>
        e.id === edgeId ? { ...e, label: newLabel } : e
      );
      setEdges(updated);
      if (selectedPaperId) {
        debouncedSave(selectedPaperId, nodes, updated);
      }
    },
    [nodes, edges, pushSnapshot, setEdges, selectedPaperId, debouncedSave]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.source !== "pdf-bubble") return;

        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        pushSnapshot(nodes, edges);

        const newNode = {
          id: `n_drop_${Date.now()}`,
          type: "detail" as const,
          position,
          data: {
            label: data.title || "知识点",
            description: data.description || "",
            nodeType: "detail",
            color: "#94a3b8",
            page_ref: null,
          },
        };

        setNodes((nds) => [...nds, newNode]);
        if (selectedPaperId) {
          saveGraph(selectedPaperId, [...nodes, newNode], edges);
        }
      } catch {
        // ignore invalid drag data
      }
    },
    [screenToFlowPosition, pushSnapshot, nodes, edges, setNodes, selectedPaperId, saveGraph]
  );

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__graphApplyDiff = (diff: GraphDiff) => {
      const ref = graphRef.current;
      pushSnapshot(ref.nodes, ref.edges);
      const result = ref.applyDiff(diff);
      if (selectedPaperId) {
        saveGraph(selectedPaperId, result.newNodes, result.newEdges);
      }
    };
    return () => { delete (window as unknown as Record<string, unknown>).__graphApplyDiff; };
  }, [pushSnapshot, selectedPaperId, saveGraph]);

  const edgesWithCallbacks: Edge[] = edges.map((e) => ({
    ...e,
    ...defaultEdgeOptions,
    data: {
      ...e.data,
      onLabelChange: (newLabel: string) => handleUpdateEdgeLabel(e.id, newLabel),
    },
  }));

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        <p className="text-sm">正在生成知识图谱...</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    const isProcessing = selectedPaper && selectedPaper.status !== "ready" && selectedPaper.status !== "error";
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted)] gap-3">
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
            <p className="text-sm">论文处理中，请稍候...</p>
          </>
        ) : (
          <p className="text-sm">等待图谱数据...</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Toolbar
        onAddNode={handleAddNode}
        onDelete={handleDelete}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAutoLayout={handleAutoLayout}
        onExport={() => toPng()}
        onFitView={() => fitView({ padding: 0.2 })}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={selectedNodeIds.length > 0}
      />
      <div className="flex-1 min-h-0 relative">
        <ReactFlow
          nodes={nodes}
          edges={edgesWithCallbacks}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onNodeDragStop={onNodeDragStop}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          fitView
          className="!bg-[var(--background)]"
        >
          <Controls className="!shadow-md !rounded-xl !border-[var(--border)] !bg-white" />
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(0,0,0,0.07)" />
        </ReactFlow>
        {editingNodeId && (
          <NodePropertyPanel
            nodeId={editingNodeId}
            nodes={nodes}
            onUpdate={handleUpdateNode}
            onClose={() => setEditingNode(null)}
          />
        )}
      </div>
    </div>
  );
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  );
}
