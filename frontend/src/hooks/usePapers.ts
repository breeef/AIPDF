"use client";

import { useCallback, useEffect, useRef } from "react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app-store";

export function usePapers() {
  const { papers, setPapers, addPaper, updatePaperStatus } = useAppStore();
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const refresh = useCallback(async () => {
    const list = await api.listPapers();
    setPapers(list);
  }, [setPapers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pollPaper = useCallback(
    (paperId: string) => {
      if (pollingRef.current.has(paperId)) return;
      const interval = setInterval(async () => {
        try {
          const paper = await api.getPaper(paperId);
          updatePaperStatus(paperId, paper.status, paper.short_title ?? undefined);
          if (paper.status === "ready" || paper.status === "error") {
            clearInterval(interval);
            pollingRef.current.delete(paperId);
          }
        } catch {
          clearInterval(interval);
          pollingRef.current.delete(paperId);
        }
      }, 2000);
      pollingRef.current.set(paperId, interval);
    },
    [updatePaperStatus]
  );

  useEffect(() => {
    return () => {
      pollingRef.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  const upload = useCallback(
    async (file: File) => {
      const paper = await api.uploadPaper(file);
      addPaper(paper);
      pollPaper(paper.id);
      return paper;
    },
    [addPaper, pollPaper]
  );

  // Start polling for any paper that's still processing on mount
  useEffect(() => {
    for (const p of papers) {
      if (p.status !== "ready" && p.status !== "error") {
        pollPaper(p.id);
      }
    }
  }, [papers, pollPaper]);

  return { papers, refresh, upload, pollPaper };
}
