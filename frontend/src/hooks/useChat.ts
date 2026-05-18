"use client";

import { useCallback, useRef, useState } from "react";
import * as api from "@/lib/api";
import type { ChatMessage, GraphDiff } from "@/lib/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

  const deleteHistory = useCallback(async (paperId: string) => {
    await api.deleteChatHistory(paperId);
    setMessages([]);
    setSuggestions([]);
  }, []);

  const deleteMessage = useCallback(
    async (paperId: string, messageId: string) => {
      await api.deleteChatMessage(paperId, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    []
  );

  const stopSending = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const sendMessage = useCallback(
    async (
      paperId: string,
      message: string,
      selectedNodeIds: string[]
    ): Promise<GraphDiff | null> => {
      const ac = new AbortController();
      abortRef.current = ac;
      setSending(true);
      const tempUserId = `temp_${Date.now()}`;
      setMessages((prev) => [...prev, { id: tempUserId, role: "user", content: message }]);

      try {
        const res = await api.sendChatMessage(paperId, message, selectedNodeIds, ac.signal) as Record<string, unknown>;
        const userMsgId = (res.user_msg_id as string) || tempUserId;
        const assistantMsgId = res.assistant_msg_id as string | undefined;
        const diff = res.diff as GraphDiff | null;

        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserId ? { ...m, id: userMsgId } : m))
        );

        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: res.content as string,
          diff,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        const sug = res.suggestions as string[] | undefined;
        if (sug && sug.length > 0) {
          setSuggestions(sug);
        }
        return diff;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setMessages((prev) => prev.filter((m) => m.id !== tempUserId));
          return null;
        }
        const errorMsg: ChatMessage = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
        return null;
      } finally {
        abortRef.current = null;
        setSending(false);
      }
    },
    []
  );

  return { messages, sending, sendMessage, stopSending, loadHistory, clearMessages, deleteHistory, deleteMessage, suggestions, suggestionsLoading, loadSuggestions };
}
