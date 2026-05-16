"use client";

import {
  Plus,
  Trash2,
  Undo2,
  Redo2,
  LayoutGrid,
  Download,
  Maximize,
} from "lucide-react";

interface Props {
  onAddNode: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  onExport: () => void;
  onFitView: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

function Btn({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
    >
      <Icon className="w-[15px] h-[15px] text-[var(--foreground)]" />
    </button>
  );
}

export function Toolbar({
  onAddNode,
  onDelete,
  onUndo,
  onRedo,
  onAutoLayout,
  onExport,
  onFitView,
  canUndo,
  canRedo,
  hasSelection,
}: Props) {
  return (
    <div className="flex items-center gap-0.5 px-3 h-9 bg-white/80 backdrop-blur border-b border-[var(--border)] shrink-0">
      <Btn icon={Plus} label="Add Node" onClick={onAddNode} />
      <Btn icon={Trash2} label="Delete" onClick={onDelete} disabled={!hasSelection} />
      <Sep />
      <Btn icon={Undo2} label="Undo" onClick={onUndo} disabled={!canUndo} />
      <Btn icon={Redo2} label="Redo" onClick={onRedo} disabled={!canRedo} />
      <Sep />
      <Btn icon={LayoutGrid} label="Auto Layout" onClick={onAutoLayout} />
      <Btn icon={Maximize} label="Fit View" onClick={onFitView} />
      <Btn icon={Download} label="Export PNG" onClick={onExport} />
    </div>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-black/8 mx-0.5" />;
}
