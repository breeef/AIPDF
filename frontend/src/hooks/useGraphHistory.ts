"use client";

import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY = 50;

export function useGraphHistory() {
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
    undoStack.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(
    (
      currentNodes: Node[],
      currentEdges: Edge[]
    ): Snapshot | null => {
      const snapshot = undoStack.current.pop();
      if (!snapshot) return null;
      redoStack.current.push({
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
      });
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(true);
      return snapshot;
    },
    []
  );

  const redo = useCallback(
    (
      currentNodes: Node[],
      currentEdges: Edge[]
    ): Snapshot | null => {
      const snapshot = redoStack.current.pop();
      if (!snapshot) return null;
      undoStack.current.push({
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
      });
      setCanUndo(true);
      setCanRedo(redoStack.current.length > 0);
      return snapshot;
    },
    []
  );

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return { pushSnapshot, undo, redo, canUndo, canRedo, clear };
}
