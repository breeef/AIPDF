"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useAppStore } from "@/store/app-store";
import { NODE_TYPE_LABELS, type NodeType } from "@/lib/types";

interface ImportanceStyle {
  labelSize: string;
  labelWeight: string;
  descSize: string;
  borderWidth: string;
  labelColor: string;
}

const IMPORTANCE_STYLES: Record<number, ImportanceStyle> = {
  5: { labelSize: "15px", labelWeight: "800", descSize: "11px", borderWidth: "4px", labelColor: "var(--foreground)" },
  4: { labelSize: "14px", labelWeight: "700", descSize: "11px", borderWidth: "3px", labelColor: "var(--foreground)" },
  3: { labelSize: "13px", labelWeight: "600", descSize: "11px", borderWidth: "3px", labelColor: "var(--foreground)" },
  2: { labelSize: "12px", labelWeight: "500", descSize: "10px", borderWidth: "2px", labelColor: "#4b5563" },
  1: { labelSize: "11px", labelWeight: "500", descSize: "10px", borderWidth: "2px", labelColor: "#6b7280" },
};

function KnowledgeNodeInner({ id, data, selected }: NodeProps) {
  const [hover, setHover] = useState(false);
  const editingNodeId = useAppStore((s) => s.editingNodeId);
  const isEditing = editingNodeId === id;

  const color = (data.color as string) || "#6366f1";
  const label = data.label as string;
  const description = data.description as string;
  const nodeType = data.nodeType as string;
  const nodeWidth = data.width as number | undefined;
  const importance = (data.importance as number) || 3;
  const labelStyle = (data.labelStyle as Record<string, string | undefined>) || {};
  const descStyle = (data.descStyle as Record<string, string | undefined>) || {};
  const impStyle = IMPORTANCE_STYLES[Math.min(5, Math.max(1, importance))] || IMPORTANCE_STYLES[3];

  return (
    <div
      className={`rounded-xl transition-all duration-200 ${
        nodeWidth ? "" : "min-w-[150px] max-w-[220px]"
      } ${
        selected
          ? "shadow-lg shadow-black/10 scale-[1.02]"
          : hover
            ? "shadow-md shadow-black/8"
            : "shadow-sm shadow-black/5"
      } ${isEditing ? "ring-2 ring-[var(--accent)]" : selected ? "ring-2 ring-[var(--accent)]/50" : ""}`}
      style={{
        background: "white",
        borderLeft: `${impStyle.borderWidth} solid ${color}`,
        ...(nodeWidth ? { width: `${nodeWidth}px`, minWidth: "unset", maxWidth: "unset" } : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[var(--muted)] !border-white !border-2" />
      <div className="px-3 py-2">
        <span
          className="inline-block text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded-md mb-1.5"
          style={{ color, background: `${color}15` }}
        >
          {NODE_TYPE_LABELS[nodeType as NodeType] || nodeType}
        </span>
        <p
          className="leading-tight"
          style={{
            fontSize: labelStyle.fontSize || impStyle.labelSize,
            fontWeight: impStyle.labelWeight,
            letterSpacing: labelStyle.letterSpacing || undefined,
            fontFamily: labelStyle.fontFamily || undefined,
            color: labelStyle.color || impStyle.labelColor,
          }}
        >
          {label}
        </p>
        {description && (
          <p
            className="mt-1 leading-snug"
            style={{
              fontSize: descStyle.fontSize || impStyle.descSize,
              letterSpacing: descStyle.letterSpacing || undefined,
              fontFamily: descStyle.fontFamily || undefined,
              color: descStyle.color || "var(--muted)",
            }}
          >
            {description}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[var(--muted)] !border-white !border-2" />
    </div>
  );
}

export const KnowledgeNode = memo(KnowledgeNodeInner);
