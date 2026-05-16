"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage, GraphDiff } from "@/lib/types";
import { DiffPreview } from "./DiffPreview";
import { Sparkles, GraduationCap } from "lucide-react";

interface Props {
  messages: ChatMessage[];
  onApplyDiff: (diff: GraphDiff) => void;
}

export function MessageList({ messages, onApplyDiff }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        <div key={i}>
          {msg.role === "user" ? (
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-[var(--accent)] text-white text-sm rounded-2xl rounded-br-md px-3.5 py-2">
                {msg.content}
              </div>
            </div>
          ) : (
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
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
