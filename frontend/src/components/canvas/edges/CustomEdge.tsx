"use client";

import { useState, useRef, useEffect } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(label || ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(String(label || ""));
  }, [label]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = () => {
    setEditing(false);
    const onLabelChange = data?.onLabelChange as ((label: string) => void) | undefined;
    if (onLabelChange && text !== String(label || "")) {
      onLabelChange(text);
    }
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ ...style, stroke: "#c7c7cc", strokeWidth: 1.5 }}
        markerEnd={markerEnd}
      />
      {(label || editing) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {editing ? (
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") { setText(String(label || "")); setEditing(false); }
                }}
                className="px-1.5 py-0.5 text-[10px] rounded-md border border-[var(--accent)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 min-w-[60px]"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] text-[var(--muted)] shadow-sm border border-[var(--border)] cursor-text hover:border-[var(--accent)]/30 transition-colors">
                {label}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
