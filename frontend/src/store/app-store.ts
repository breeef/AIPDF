import { create } from "zustand";
import type { Paper, PaperStatus } from "@/lib/types";

export interface PdfHighlight {
  id: string;
  text: string;
  pageNum: number;
  rects: { left: number; top: number; width: number; height: number }[];
  translation: string;
  explanation: { title: string; description: string };
}

interface AppState {
  selectedPaperId: string | null;
  selectedNodeIds: string[];
  editingNodeId: string | null;
  editingEdgeId: string | null;
  papers: Paper[];
  isPdfPreviewOpen: boolean;
  pdfHighlights: Record<string, PdfHighlight[]>;

  selectPaper: (id: string | null) => void;
  setSelectedNodes: (ids: string[]) => void;
  setEditingNode: (id: string | null) => void;
  setEditingEdge: (id: string | null) => void;
  setPapers: (papers: Paper[]) => void;
  addPaper: (paper: Paper) => void;
  updatePaperStatus: (id: string, status: PaperStatus, shortTitle?: string) => void;
  removePaper: (id: string) => void;
  togglePdfPreview: () => void;
  addHighlight: (paperId: string, hl: PdfHighlight) => void;
  updateHighlight: (paperId: string, hlId: string, updates: { explanation: { title: string; description: string } }) => void;
  removeHighlight: (paperId: string, hlId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedPaperId: null,
  selectedNodeIds: [],
  editingNodeId: null,
  editingEdgeId: null,
  papers: [],
  isPdfPreviewOpen: false,
  pdfHighlights: {},

  selectPaper: (id) => set({ selectedPaperId: id, selectedNodeIds: [], editingNodeId: null, editingEdgeId: null }),
  setSelectedNodes: (ids) => set({
    selectedNodeIds: ids,
    editingNodeId: ids.length === 1 ? ids[0] : null,
    editingEdgeId: null,
  }),
  setEditingNode: (id) => set({ editingNodeId: id, editingEdgeId: null }),
  setEditingEdge: (id) => set({ editingEdgeId: id, editingNodeId: null }),
  setPapers: (papers) => set({ papers }),
  addPaper: (paper) => set((s) => ({ papers: [paper, ...s.papers] })),
  updatePaperStatus: (id, status, shortTitle) =>
    set((s) => ({
      papers: s.papers.map((p) =>
        p.id === id
          ? { ...p, status, ...(shortTitle ? { short_title: shortTitle } : {}) }
          : p
      ),
    })),
  removePaper: (id) =>
    set((s) => ({
      papers: s.papers.filter((p) => p.id !== id),
      selectedPaperId: s.selectedPaperId === id ? null : s.selectedPaperId,
    })),
  togglePdfPreview: () => set((s) => ({ isPdfPreviewOpen: !s.isPdfPreviewOpen })),
  addHighlight: (paperId, hl) =>
    set((s) => ({
      pdfHighlights: {
        ...s.pdfHighlights,
        [paperId]: [...(s.pdfHighlights[paperId] || []), hl],
      },
    })),
  updateHighlight: (paperId, hlId, updates) =>
    set((s) => ({
      pdfHighlights: {
        ...s.pdfHighlights,
        [paperId]: (s.pdfHighlights[paperId] || []).map((h) =>
          h.id === hlId ? { ...h, ...updates } : h
        ),
      },
    })),
  removeHighlight: (paperId, hlId) =>
    set((s) => ({
      pdfHighlights: {
        ...s.pdfHighlights,
        [paperId]: (s.pdfHighlights[paperId] || []).filter((h) => h.id !== hlId),
      },
    })),
}));
