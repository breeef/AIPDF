"use client";

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { Loader2, BookOpen, GripVertical, Pencil, Check, RefreshCw, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app-store";

interface Props {
  text: string;
  position: { x: number; y: number };
  paperId: string;
  onClose: () => void;
  cached?: {
    translation: string;
    explanation: { title: string; description: string };
  };
  onExplainDone?: (data: {
    translation: string;
    explanation: { title: string; description: string };
  }) => void;
  highlightId?: string;
}

export function SelectionBubble({
  text,
  position,
  paperId,
  onClose,
  cached,
  onExplainDone,
  highlightId,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [translation, setTranslation] = useState<string | null>(
    cached?.translation ?? null
  );
  const [translating, setTranslating] = useState(!cached);
  const [explanation, setExplanation] = useState<{
    title: string;
    description: string;
  } | null>(cached?.explanation ?? null);
  const [explaining, setExplaining] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const updateHighlight = useAppStore((s) => s.updateHighlight);
  const removeHighlight = useAppStore((s) => s.removeHighlight);

  // Clamp bubble within viewport after every content/size change
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = position.x - rect.width / 2;
    let y = position.y;

    x = Math.max(pad, Math.min(x, vw - rect.width - pad));

    if (y + rect.height > vh - pad) {
      y = position.y - rect.height - 16;
    }
    y = Math.max(pad, Math.min(y, vh - rect.height - pad));

    setPos({ x, y });
  }, [position, translation, explanation, editing]);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    setTranslating(true);
    api
      .translateText(text)
      .then((r) => {
        if (!cancelled) setTranslation(r.translation);
      })
      .catch(() => {
        if (!cancelled) setTranslation("翻译失败");
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [text, cached]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) setEditing(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editing]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => window.addEventListener("mousedown", onClick), 10);
    return () => window.removeEventListener("mousedown", onClick);
  }, [onClose]);

  const handleExplain = useCallback(async () => {
    setExplaining(true);
    try {
      const r = await api.explainText(paperId, text);
      setExplanation(r);
      onExplainDone?.({ translation: translation || "", explanation: r });
    } catch {
      const fallback = { title: text.slice(0, 20), description: "解释失败" };
      setExplanation(fallback);
    } finally {
      setExplaining(false);
    }
  }, [paperId, text, translation, onExplainDone]);

  const handleRegenerate = useCallback(async () => {
    setExplaining(true);
    try {
      const r = await api.explainText(paperId, text);
      setExplanation(r);
      if (highlightId) {
        updateHighlight(paperId, highlightId, { explanation: r });
      }
    } catch {
      // keep existing explanation on failure
    } finally {
      setExplaining(false);
    }
  }, [paperId, text, highlightId, updateHighlight]);

  const startEdit = useCallback(() => {
    if (!explanation) return;
    setEditTitle(explanation.title);
    setEditDesc(explanation.description);
    setEditing(true);
  }, [explanation]);

  const saveEdit = useCallback(() => {
    const updated = { title: editTitle.trim(), description: editDesc.trim() };
    setExplanation(updated);
    setEditing(false);
    if (highlightId) {
      updateHighlight(paperId, highlightId, { explanation: updated });
    }
  }, [editTitle, editDesc, highlightId, paperId, updateHighlight]);

  const handleDelete = useCallback(() => {
    if (highlightId) {
      removeHighlight(paperId, highlightId);
      onClose();
    }
  }, [highlightId, paperId, removeHighlight, onClose]);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      const payload = {
        title: explanation?.title || translation || text.slice(0, 30),
        description:
          explanation?.description ||
          `${translation || ""}\n\n原文: ${text}`.trim(),
        source: "pdf-bubble",
      };
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "move";
    },
    [text, translation, explanation]
  );

  const displayText = text.length > 80 ? text.slice(0, 80) + "..." : text;

  return (
    <div
      ref={ref}
      draggable={!editing}
      onDragStart={handleDragStart}
      className="fixed z-50 w-[320px] max-h-[80vh] overflow-y-auto rounded-xl shadow-xl shadow-black/12 border border-[var(--border)] bg-white/95 backdrop-blur-xl animate-bubble-in cursor-grab active:cursor-grabbing"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="flex items-center justify-center py-1 border-b border-[var(--border)]/50">
        <GripVertical className="w-3.5 h-3.5 text-[var(--muted)]/40" />
      </div>

      <div className="p-3 space-y-2.5">
        <p className="text-[11px] text-[var(--muted)] leading-relaxed line-clamp-2">
          {displayText}
        </p>

        <div className="min-h-[20px]">
          {translating ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" />
              <span className="text-[11px] text-[var(--muted)]">翻译中...</span>
            </div>
          ) : (
            <p className="text-[13px] font-medium text-[var(--foreground)] leading-relaxed">
              {translation}
            </p>
          )}
        </div>

        {explanation ? (
          editing ? (
            <div className="rounded-lg bg-[var(--accent-light)] p-2.5 space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-[12px] font-semibold bg-white rounded-md px-2 py-1 border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full text-[11px] bg-white rounded-md px-2 py-1.5 border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none leading-relaxed"
              />
              <button
                onClick={saveEdit}
                className="flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:text-[#005bb5] transition-colors"
              >
                <Check className="w-3 h-3" />
                保存
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--accent-light)] p-2.5 space-y-1 group/expl relative">
              <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover/expl:opacity-100 transition-all">
                <button
                  onClick={handleRegenerate}
                  disabled={explaining}
                  className="p-1 rounded-md hover:bg-black/5 disabled:opacity-40"
                  title="重新生成"
                >
                  {explaining ? (
                    <Loader2 className="w-3 h-3 animate-spin text-[var(--muted)]" />
                  ) : (
                    <RefreshCw className="w-3 h-3 text-[var(--muted)]" />
                  )}
                </button>
                <button
                  onClick={startEdit}
                  className="p-1 rounded-md hover:bg-black/5"
                  title="编辑"
                >
                  <Pencil className="w-3 h-3 text-[var(--muted)]" />
                </button>
              </div>
              <p className="text-[12px] font-semibold text-[var(--foreground)] pr-12">
                {explanation.title}
              </p>
              <p className="text-[11px] text-[var(--foreground)]/80 leading-relaxed">
                {explanation.description}
              </p>
            </div>
          )
        ) : (
          <button
            onClick={handleExplain}
            disabled={explaining || translating}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)] hover:text-[#005bb5] transition-colors disabled:opacity-40"
          >
            {explaining ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <BookOpen className="w-3 h-3" />
            )}
            {explaining ? "解释中..." : "详细解释"}
          </button>
        )}

        <div className="flex items-center justify-center gap-3">
          <p className="text-[10px] text-[var(--muted)]/60">
            拖拽到知识图谱以创建节点
          </p>
          {highlightId && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-500 transition-colors shrink-0"
            >
              <Trash2 className="w-3 h-3" />
              删除标注
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
