"use client";

import { Plus, Minus, Pencil, Check, X } from "lucide-react";
import type { GraphDiff } from "@/lib/types";

interface Props {
  diff: GraphDiff;
  onApply: () => void;
  onDismiss: () => void;
}

export function DiffPreview({ diff, onApply, onDismiss }: Props) {
  const addCount = diff.add_nodes.length + diff.add_edges.length;
  const removeCount = diff.remove_nodes.length + diff.remove_edges.length;
  const updateCount = diff.update_nodes.length + diff.update_edges.length;
  const hasChanges = addCount + removeCount + updateCount > 0;

  if (!hasChanges) return null;

  return (
    <div className="mt-2 rounded-xl bg-white border border-[var(--border)] p-3 shadow-sm">
      <div className="flex flex-wrap gap-3 text-[11px] font-medium mb-2.5">
        {addCount > 0 && (
          <span className="flex items-center gap-1 text-emerald-600">
            <Plus className="w-3 h-3" /> {addCount} added
          </span>
        )}
        {removeCount > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <Minus className="w-3 h-3" /> {removeCount} removed
          </span>
        )}
        {updateCount > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <Pencil className="w-3 h-3" /> {updateCount} updated
          </span>
        )}
      </div>
      {diff.add_nodes.length > 0 && (
        <div className="mb-2.5 space-y-1">
          {diff.add_nodes.map((n) => (
            <div
              key={n.id}
              className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
              {n.label}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent)] hover:bg-[#005bb5] rounded-lg transition-colors"
        >
          <Check className="w-3 h-3" /> Apply Changes
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
