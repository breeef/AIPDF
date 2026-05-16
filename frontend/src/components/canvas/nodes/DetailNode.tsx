"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useAppStore } from "@/store/app-store";
import { Info } from "lucide-react";

function DetailNodeInner({ id, data, selected }: NodeProps) {
  const [hover, setHover] = useState(false);
  const editingNodeId = useAppStore((s) => s.editingNodeId);
  const isEditing = editingNodeId === id;

  const color = (data.color as string) || "#94a3b8";
  const label = data.label as string;
  const description = data.description as string;
  const nodeWidth = data.width as number | undefined;
  const labelStyle = (data.labelStyle as Record<string, string | undefined>) || {};
  const descStyle = (data.descStyle as Record<string, string | undefined>) || {};

  return (
    <div
      className={`rounded-lg transition-all duration-300 ease-in-out ${
        nodeWidth ? "" : "min-w-[130px] max-w-[240px]"
      } ${
        selected
          ? "shadow-md shadow-black/8"
          : hover
            ? "shadow-md shadow-black/6"
            : "shadow-sm shadow-black/3"
      } ${isEditing ? "ring-2 ring-[var(--accent)]" : selected ? "ring-2 ring-[var(--accent)]/50" : ""}`}
      style={{
        background: hover ? "white" : "#fafafa",
        borderLeft: `2px dashed ${color}`,
        ...(nodeWidth ? { width: `${nodeWidth}px`, minWidth: "unset", maxWidth: "unset" } : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-[var(--muted)] !border-white !border-2" />
      <div className="px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Info className="w-3 h-3 shrink-0" style={{ color }} />
          <span
            className="font-medium leading-tight truncate"
            style={{
              fontSize: labelStyle.fontSize || "11px",
              letterSpacing: labelStyle.letterSpacing || undefined,
              fontFamily: labelStyle.fontFamily || undefined,
              color: labelStyle.color || "rgba(var(--foreground), 0.8)",
            }}
          >
            {label}
          </span>
        </div>
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: hover || selected ? "200px" : "0px",
            opacity: hover || selected ? 1 : 0,
          }}
        >
          {description && (
            <p
              className="leading-snug pt-1 border-t border-dashed border-black/6"
              style={{
                fontSize: descStyle.fontSize || "10px",
                letterSpacing: descStyle.letterSpacing || undefined,
                fontFamily: descStyle.fontFamily || undefined,
                color: descStyle.color || "var(--muted)",
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-[var(--muted)] !border-white !border-2" />
    </div>
  );
}

export const DetailNode = memo(DetailNodeInner);
