"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  onStop: () => void;
  sending: boolean;
  selectedCount: number;
  disabled: boolean;
  suggestions: string[];
}

export function ChatInput({ onSend, onStop, sending, selectedCount, disabled, suggestions }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    if (w.__chatInputSetText) return;
    w.__chatInputSetText = setText;
    return () => { delete w.__chatInputSetText; };
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = suggestions.length > 0 && !sending;

  return (
    <div className="border-t border-[var(--border)]">
      {showSuggestions && (
        <div className="px-3 pt-2.5 pb-1 space-y-1.5">
          {suggestions.slice(0, 3).map((q, i) => (
            <button
              key={i}
              onClick={() => setText(q)}
              disabled={disabled}
              className="block w-full text-left px-3 py-1.5 text-[12px] leading-snug rounded-2xl rounded-bl-md bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <div className="p-3">
        {selectedCount > 0 && (
          <div className="mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] font-medium">
              已选中 {selectedCount} 个节点
            </span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "请先选择一篇论文" : "问问论文内容，或编辑知识图谱..."}
            disabled={disabled}
            rows={2}
            className="flex-1 resize-none text-sm px-3 py-2 rounded-xl bg-[var(--background)] border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 disabled:opacity-40 placeholder:text-[var(--muted)]"
          />
          {sending ? (
            <button
              onClick={onStop}
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
              title="停止生成"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              className="p-2 rounded-full bg-[var(--accent)] text-white hover:bg-[#005bb5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
