"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronDown, Type } from "lucide-react";
import type { Node } from "@xyflow/react";

const NODE_TYPES = [
  { value: "input", label: "输入", color: "#64748b" },
  { value: "module", label: "模块", color: "#06b6d4" },
  { value: "mechanism", label: "机制", color: "#8b5cf6" },
  { value: "output", label: "输出", color: "#10b981" },
  { value: "hyperparam", label: "超参数", color: "#f59e0b" },
  { value: "phase", label: "阶段", color: "#ef4444" },
  { value: "detail", label: "详解", color: "#94a3b8" },
] as const;

const PRESET_COLORS = [
  "#64748b", "#06b6d4", "#8b5cf6", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#6366f1",
  "#14b8a6", "#f97316",
];

const FONT_SIZE_RANGE = { min: 8, max: 28 };
const LETTER_SPACING_RANGE = { min: -1, max: 4, step: 0.1 };
const FONT_FAMILIES = [
  { value: "", label: "默认" },
  { value: "serif", label: "衬线" },
  { value: "monospace", label: "等宽" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier" },
];
const TEXT_COLORS = [
  "#1d1d1f", "#86868b", "#64748b", "#06b6d4", "#8b5cf6",
  "#10b981", "#ef4444", "#f59e0b", "#ec4899",
];

interface FontStyle {
  fontSize?: string;
  letterSpacing?: string;
  fontFamily?: string;
  color?: string;
}

interface Props {
  nodeId: string;
  nodes: Node[];
  onUpdate: (nodeId: string, updates: Record<string, unknown>) => void;
  onClose: () => void;
}

export function NodePropertyPanel({ nodeId, nodes, onUpdate, onClose }: Props) {
  const node = nodes.find((n) => n.id === nodeId);
  const panelRef = useRef<HTMLDivElement>(null);

  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [nodeType, setNodeType] = useState("module");
  const [color, setColor] = useState("#06b6d4");
  const [width, setWidth] = useState<number | null>(null);
  const [customColor, setCustomColor] = useState("");
  const [labelStyle, setLabelStyle] = useState<FontStyle>({});
  const [descStyle, setDescStyle] = useState<FontStyle>({});

  useEffect(() => {
    if (!node) return;
    setLabel(node.data.label as string || "");
    setDescription(node.data.description as string || "");
    setNodeType(node.data.nodeType as string || "module");
    setColor(node.data.color as string || "#06b6d4");
    setWidth((node.data.width as number) || null);
    setCustomColor("");
    setLabelStyle((node.data.labelStyle as FontStyle) || {});
    setDescStyle((node.data.descStyle as FontStyle) || {});
  }, [node, nodeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const commit = useCallback(
    (updates: Record<string, unknown>) => {
      onUpdate(nodeId, updates);
    },
    [nodeId, onUpdate]
  );

  if (!node) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-0 left-0 right-0 z-20 glass border-t border-[var(--border)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-2xl animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[12px] font-semibold text-[var(--foreground)]">
            节点属性
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-[var(--muted)]" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 grid grid-cols-[1fr_1fr] gap-x-4 gap-y-3 max-h-[320px] overflow-y-auto">
        {/* Label — full width */}
        <div className="col-span-2">
          <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
            标签
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => commit({ label })}
            onKeyDown={(e) => { if (e.key === "Enter") commit({ label }); }}
            className="mt-1 w-full px-2.5 py-1.5 text-[13px] rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
          />
        </div>

        {/* Description — full width */}
        <div className="col-span-2">
          <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => commit({ description })}
            rows={2}
            className="mt-1 w-full px-2.5 py-1.5 text-[12px] rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] resize-none"
          />
        </div>

        {/* Type dropdown */}
        <div>
          <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
            类型
          </label>
          <div className="relative mt-1">
            <select
              value={nodeType}
              onChange={(e) => {
                const newType = e.target.value;
                const typeInfo = NODE_TYPES.find((t) => t.value === newType);
                setNodeType(newType);
                if (typeInfo) {
                  setColor(typeInfo.color);
                  commit({ nodeType: newType, color: typeInfo.color });
                }
              }}
              className="w-full pl-2.5 pr-7 py-1.5 text-[12px] rounded-lg border border-[var(--border)] bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
            >
              {NODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--muted)] pointer-events-none" />
          </div>
        </div>

        {/* Width */}
        <div>
          <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
            宽度
          </label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="range"
              min={120}
              max={400}
              value={width || 180}
              onChange={(e) => {
                const v = Number(e.target.value);
                setWidth(v);
              }}
              onMouseUp={() => commit({ width: width || undefined })}
              className="flex-1 h-1.5 accent-[var(--accent)]"
            />
            <button
              onClick={() => {
                setWidth(null);
                commit({ width: undefined });
              }}
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                width === null
                  ? "bg-[var(--accent)] text-white"
                  : "bg-black/5 text-[var(--muted)] hover:bg-black/10"
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        {/* Color palette — full width */}
        <div className="col-span-2">
          <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
            颜色
          </label>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  commit({ color: c });
                }}
                className={`w-5 h-5 rounded-full transition-all ${
                  color === c ? "ring-2 ring-offset-1 ring-[var(--accent)] scale-110" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <div className="flex items-center gap-1 ml-1">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && /^#[0-9a-fA-F]{6}$/.test(customColor)) {
                    setColor(customColor);
                    commit({ color: customColor });
                  }
                }}
                placeholder="#hex"
                className="w-16 px-1.5 py-0.5 text-[11px] rounded-md border border-[var(--border)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
              />
            </div>
          </div>
        </div>

        {/* Label font style */}
        <div className="col-span-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Type className="w-3 h-3 text-[var(--accent)]" />
            <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
              标签样式
            </label>
          </div>
          <FontStyleRow
            style={labelStyle}
            defaultSize="13px"
            onChange={(s) => { setLabelStyle(s); commit({ labelStyle: s }); }}
          />
        </div>

        {/* Description font style */}
        <div className="col-span-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Type className="w-3 h-3 text-[var(--muted)]" />
            <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
              描述样式
            </label>
          </div>
          <FontStyleRow
            style={descStyle}
            defaultSize="11px"
            onChange={(s) => { setDescStyle(s); commit({ descStyle: s }); }}
          />
        </div>
      </div>
    </div>
  );
}

function parsePx(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function FontStyleRow({
  style,
  defaultSize,
  onChange,
}: {
  style: FontStyle;
  defaultSize: string;
  onChange: (s: FontStyle) => void;
}) {
  const update = (field: keyof FontStyle, value: string) => {
    onChange({ ...style, [field]: value || undefined });
  };

  const defaultPx = parsePx(defaultSize, 13);
  const currentSize = parsePx(style.fontSize, defaultPx);
  const currentSpacing = parsePx(style.letterSpacing, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--muted)] w-6 shrink-0">字号</span>
        <input
          type="range"
          min={FONT_SIZE_RANGE.min}
          max={FONT_SIZE_RANGE.max}
          step={1}
          value={currentSize}
          onChange={(e) => {
            const v = Number(e.target.value);
            update("fontSize", v === defaultPx ? "" : `${v}px`);
          }}
          className="flex-1 h-1.5 accent-[var(--accent)]"
        />
        <span className="text-[10px] text-[var(--muted)] w-5 text-right tabular-nums">{currentSize}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--muted)] w-6 shrink-0">间距</span>
        <input
          type="range"
          min={LETTER_SPACING_RANGE.min}
          max={LETTER_SPACING_RANGE.max}
          step={LETTER_SPACING_RANGE.step}
          value={currentSpacing}
          onChange={(e) => {
            const v = Number(e.target.value);
            update("letterSpacing", v === 0 ? "" : `${v}px`);
          }}
          className="flex-1 h-1.5 accent-[var(--accent)]"
        />
        <span className="text-[10px] text-[var(--muted)] w-5 text-right tabular-nums">{currentSpacing.toFixed(1)}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={style.fontFamily || ""}
          onChange={(e) => update("fontFamily", e.target.value)}
          className="w-[70px] px-1.5 py-1 text-[11px] rounded-md border border-[var(--border)] bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
          title="字体"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => update("color", style.color === c ? "" : c)}
              className={`w-4 h-4 rounded-full transition-all ${
                style.color === c ? "ring-2 ring-offset-1 ring-[var(--accent)] scale-110" : "hover:scale-110"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
