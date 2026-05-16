"use client";

import { useState } from "react";
import type { Paper } from "@/lib/types";
import { FileText, Loader2, AlertCircle, CheckCircle2, RotateCw, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app-store";

interface Props {
  paper: Paper;
  selected: boolean;
  onClick: () => void;
}

const statusConfig = {
  uploading: { icon: Loader2, color: "text-[var(--muted)]", spin: true },
  parsing: { icon: Loader2, color: "text-amber-500", spin: true },
  generating: { icon: Loader2, color: "text-[var(--accent)]", spin: true },
  ready: { icon: CheckCircle2, color: "text-emerald-500", spin: false },
  error: { icon: AlertCircle, color: "text-red-500", spin: false },
} as const;

export function PaperItem({ paper, selected, onClick }: Props) {
  const { updatePaperStatus, removePaper } = useAppStore();
  const [deleting, setDeleting] = useState(false);
  const status = statusConfig[paper.status];
  const StatusIcon = status.icon;
  const title = paper.short_title || paper.original_title;

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePaperStatus(paper.id, "parsing");
    await api.retryPaper(paper.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      await api.deletePaper(paper.id);
      removePaper(paper.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-150 group cursor-pointer ${
        selected
          ? "bg-[var(--accent)] text-white shadow-sm"
          : "hover:bg-black/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <FileText
          className={`w-4 h-4 shrink-0 ${
            selected ? "text-white/70" : "text-[var(--muted)]"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-medium truncate ${
            selected ? "text-white" : "text-[var(--foreground)]"
          }`}>
            {title}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {paper.status === "error" ? (
            <button
              onClick={handleRetry}
              title="重试"
              className={`p-0.5 rounded-md hover:bg-black/10 ${
                selected ? "text-white/70" : "text-red-500"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <StatusIcon
              className={`w-3.5 h-3.5 shrink-0 ${
                selected ? "text-white/70" : status.color
              } ${status.spin ? "animate-spin" : ""}`}
            />
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="删除"
            className={`p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
              selected
                ? "hover:bg-white/20 text-white/70"
                : "hover:bg-black/10 text-[var(--muted)] hover:text-red-500"
            } disabled:opacity-40`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
