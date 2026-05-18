"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import type { GraphDiff } from "@/lib/types";
import { Sparkles, Trash2 } from "lucide-react";

export function ChatPanel() {
  const { selectedPaperId, selectedNodeIds } = useAppStore();
  const { messages, sending, sendMessage, stopSending, loadHistory, clearMessages, deleteHistory, deleteMessage, suggestions, loadSuggestions } = useChat();

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

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedPaperId) return;
    await deleteMessage(selectedPaperId, messageId);
  };

  const handleEditMessage = (content: string) => {
    return content;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-10 flex items-center gap-2 px-4 border-b border-[var(--border)] shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="text-[13px] font-semibold text-[var(--foreground)]">AI Assistant</span>
        <div className="flex-1" />
        {messages.length > 0 && (
          <button
            onClick={async () => {
              if (!selectedPaperId) return;
              await deleteHistory(selectedPaperId);
              loadSuggestions(selectedPaperId);
            }}
            className="p-1 rounded-md hover:bg-red-50 text-[var(--muted)] hover:text-red-500 transition-colors"
            title="清空对话历史"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <MessageList
        messages={messages}
        onApplyDiff={handleApplyDiff}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
      />
      <ChatInput
        onSend={handleSend}
        onStop={stopSending}
        sending={sending}
        selectedCount={selectedNodeIds.length}
        disabled={!selectedPaperId}
        suggestions={suggestions}
      />
    </div>
  );
}
