"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import type { GraphDiff } from "@/lib/types";
import { Sparkles } from "lucide-react";

export function ChatPanel() {
  const { selectedPaperId, selectedNodeIds } = useAppStore();
  const { messages, sending, sendMessage, loadHistory, clearMessages, suggestions, loadSuggestions } = useChat();

  useEffect(() => {
    if (selectedPaperId) {
      loadHistory(selectedPaperId);
      loadSuggestions(selectedPaperId);
    } else {
      clearMessages();
    }
  }, [selectedPaperId, loadHistory, loadSuggestions, clearMessages]);

  const handleSend = async (message: string) => {
    if (!selectedPaperId) return;
    await sendMessage(selectedPaperId, message, selectedNodeIds);
  };

  const handleApplyDiff = (diff: GraphDiff) => {
    const fn = (window as unknown as Record<string, unknown>).__graphApplyDiff;
    if (typeof fn === "function") {
      (fn as (d: GraphDiff) => void)(diff);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-10 flex items-center gap-2 px-4 border-b border-[var(--border)] shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="text-[13px] font-semibold text-[var(--foreground)]">AI Assistant</span>
      </div>
      <MessageList
        messages={messages}
        onApplyDiff={handleApplyDiff}
      />
      <ChatInput
        onSend={handleSend}
        sending={sending}
        selectedCount={selectedNodeIds.length}
        disabled={!selectedPaperId}
        suggestions={suggestions}
      />
    </div>
  );
}
