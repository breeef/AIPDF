"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage, GraphDiff } from "@/lib/types";
import { DiffPreview } from "./DiffPreview";
import { Sparkles, GraduationCap, Copy, Trash2, Check, Pencil } from "lucide-react";

interface Props {
  messages: ChatMessage[];
  onApplyDiff: (diff: GraphDiff) => void;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (content: string) => string;
}

function ActionBtn({ icon: Icon, label, onClick, variant = "default" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-colors ${
        variant === "danger"
          ? "text-[var(--muted)] hover:text-red-500 hover:bg-red-50"
          : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/5"
      }`}
      title={label}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return copied ? (
    <span className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-emerald-600">
      <Check className="w-3 h-3" />
      <span>已复制</span>
    </span>
  ) : (
    <ActionBtn icon={Copy} label="复制" onClick={handleCopy} />
  );
}

export function MessageList({ messages, onApplyDiff, onDeleteMessage, onEditMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEdit = (content: string) => {
    const setText = (window as unknown as Record<string, unknown>).__chatInputSetText as ((v: string) => void) | undefined;
    if (setText) setText(content);
    onEditMessage(content);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">关于这篇论文，你可以问我...</p>
          <p className="text-[11px] text-[var(--muted)] mt-1 max-w-[220px]">
            论文解读 · 概念解释 · 图谱编辑
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg, i) => (
        <div key={msg.id || i} className="group">
          {msg.role === "user" ? (
            <div>
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[var(--accent)] text-white text-sm rounded-2xl rounded-br-md px-3.5 py-2">
                  {msg.content}
                </div>
              </div>
              <div className="flex justify-end gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionBtn icon={Pencil} label="编辑" onClick={() => handleEdit(msg.content)} />
                {msg.id && (
                  <ActionBtn icon={Trash2} label="删除" onClick={() => onDeleteMessage(msg.id!)} variant="danger" />
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                </div>
                <div className="max-w-[85%]">
                  <div className="bg-[var(--background)] text-sm rounded-2xl rounded-bl-md px-3.5 py-2 text-[var(--foreground)] prose prose-sm prose-neutral max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:text-[var(--accent)] prose-code:bg-[var(--accent-light)] prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.diff && (
                    <DiffPreview
                      diff={msg.diff}
                      onApply={() => onApplyDiff(msg.diff!)}
                      onDismiss={() => {}}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-0.5 ml-8 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyBtn text={msg.content} />
                {msg.id && (
                  <ActionBtn icon={Trash2} label="删除" onClick={() => onDeleteMessage(msg.id!)} variant="danger" />
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
