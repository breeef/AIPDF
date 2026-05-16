"use client";

import { useCallback, useState } from "react";
import * as api from "@/lib/api";
import type { ChatMessage, GraphDiff } from "@/lib/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const loadHistory = useCallback(async (paperId: string) => {
    try {
      const { messages: history } = await api.getChatHistory(paperId);
      setMessages(history);
    } catch {
      setMessages([]);
    }
  }, []);

  const loadSuggestions = useCallback(async (paperId: string) => {
    setSuggestionsLoading(true);
    try {
      const { questions } = await api.getSuggestions(paperId);
      setSuggestions(questions);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
  }, []);

  const sendMessage = useCallback(
    async (
      paperId: string,
      message: string,
      selectedNodeIds: string[]
    ): Promise<GraphDiff | null> => {
      setSending(true);
      setMessages((prev) => [...prev, { role: "user", content: message }]);

      try {
        const res = await api.sendChatMessage(paperId, message, selectedNodeIds);
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: res.content,
          diff: res.diff,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (res.suggestions && res.suggestions.length > 0) {
          setSuggestions(res.suggestions);
        }
        return res.diff;
      } catch (err) {
        const errorMsg: ChatMessage = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
        return null;
      } finally {
        setSending(false);
      }
    },
    []
  );

  return { messages, sending, sendMessage, loadHistory, clearMessages, suggestions, suggestionsLoading, loadSuggestions };
}
