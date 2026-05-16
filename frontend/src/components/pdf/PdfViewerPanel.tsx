"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Minus } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { getPdfUrl } from "@/lib/api";
import { SelectionBubble } from "./SelectionBubble";
import { useAppStore, type PdfHighlight } from "@/store/app-store";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  paperId: string;
}

interface BubbleState {
  text: string;
  x: number;
  y: number;
  pageNum: number;
  rects: { left: number; top: number; width: number; height: number }[];
  highlightId?: string;
  cached?: {
    translation: string;
    explanation: { title: string; description: string };
  };
}

function captureRelativeRects(
  range: Range,
  pageEl: Element
): { left: number; top: number; width: number; height: number }[] {
  const pageRect = pageEl.getBoundingClientRect();
  if (pageRect.width === 0 || pageRect.height === 0) return [];
  return Array.from(range.getClientRects()).map((r) => ({
    left: (r.left - pageRect.left) / pageRect.width,
    top: (r.top - pageRect.top) / pageRect.height,
    width: r.width / pageRect.width,
    height: r.height / pageRect.height,
  }));
}

export function PdfViewerPanel({ paperId }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [renderScale, setRenderScale] = useState(1.2);
  const [bubble, setBubble] = useState<BubbleState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const scaleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = getPdfUrl(paperId);

  const allHighlights = useAppStore((s) => s.pdfHighlights);
  const addHighlight = useAppStore((s) => s.addHighlight);
  const highlights = allHighlights[paperId] ?? [];
  const pageHighlights = useMemo(
    () => highlights.filter((h) => h.pageNum === pageNum),
    [highlights, pageNum]
  );

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() || "";
      if (text.length < 2) return;

      const range = sel?.getRangeAt(0);
      if (!range) return;

      const wrapEl = pageWrapRef.current;
      const rects = wrapEl ? captureRelativeRects(range, wrapEl) : [];

      const rect = range.getBoundingClientRect();
      setBubble({
        text,
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
        pageNum,
        rects,
      });
    }, 10);
  }, [pageNum]);

  const handleHighlightClick = useCallback(
    (hl: PdfHighlight, e: React.MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setBubble({
        text: hl.text,
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
        pageNum: hl.pageNum,
        rects: hl.rects,
        highlightId: hl.id,
        cached: {
          translation: hl.translation,
          explanation: hl.explanation,
        },
      });
    },
    []
  );

  const handleExplainDone = useCallback(
    (data: {
      translation: string;
      explanation: { title: string; description: string };
    }) => {
      if (!bubble || bubble.highlightId) return;
      const hl: PdfHighlight = {
        id: `hl_${Date.now()}`,
        text: bubble.text,
        pageNum: bubble.pageNum,
        rects: bubble.rects,
        translation: data.translation,
        explanation: data.explanation,
      };
      addHighlight(paperId, hl);
      setBubble((prev) => (prev ? { ...prev, highlightId: hl.id } : prev));
    },
    [bubble, paperId, addHighlight]
  );

  const closeBubble = useCallback(() => setBubble(null), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let swipeAccum = 0;
    let swipeCooldown = false;
    const SWIPE_THRESHOLD = 120;
    const COOLDOWN_MS = 400;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.005;
        setScale((s) => {
          const next = Math.min(3, Math.max(0.5, s + delta));
          if (scaleTimerRef.current) clearTimeout(scaleTimerRef.current);
          scaleTimerRef.current = setTimeout(() => setRenderScale(next), 150);
          return next;
        });
        return;
      }

      if (swipeCooldown) return;

      if (
        Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 &&
        Math.abs(e.deltaX) > 4
      ) {
        swipeAccum += e.deltaX;
        if (swipeAccum > SWIPE_THRESHOLD) {
          swipeAccum = 0;
          swipeCooldown = true;
          setTimeout(() => { swipeCooldown = false; }, COOLDOWN_MS);
          setPageNum((p) => Math.min(numPages, p + 1));
        } else if (swipeAccum < -SWIPE_THRESHOLD) {
          swipeAccum = 0;
          swipeCooldown = true;
          setTimeout(() => { swipeCooldown = false; }, COOLDOWN_MS);
          setPageNum((p) => Math.max(1, p - 1));
        }
      } else {
        swipeAccum = 0;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [numPages]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(document.activeElement) && document.activeElement !== el)
        return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setPageNum((p) => Math.max(1, p - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setPageNum((p) => Math.min(numPages, p + 1));
          break;
        case "=":
        case "+":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setScale((s) => { const v = Math.min(3, s + 0.15); setRenderScale(v); return v; });
          }
          break;
        case "-":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setScale((s) => { const v = Math.max(0.5, s - 0.15); setRenderScale(v); return v; });
          }
          break;
        case "0":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setScale(1.2);
            setRenderScale(1.2);
          }
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [numPages]);

  return (
    <div className="h-full flex flex-col">
      <div className="h-10 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
        <span className="text-xs font-medium text-[var(--muted)]">
          {numPages > 0 ? `${pageNum} / ${numPages}` : "Loading..."}
        </span>
        <div className="flex items-center gap-0.5">
          <ToolBtn
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </ToolBtn>
          <div className="w-px h-4 bg-[var(--border)] mx-1" />
          <ToolBtn onClick={() => { const v = Math.max(0.5, scale - 0.15); setScale(v); setRenderScale(v); }}>
            <ZoomOut className="w-3.5 h-3.5" />
          </ToolBtn>
          <span className="text-[11px] text-[var(--muted)] min-w-[36px] text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <ToolBtn onClick={() => { const v = Math.min(3, scale + 0.15); setScale(v); setRenderScale(v); }}>
            <ZoomIn className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => { setScale(1.2); setRenderScale(1.2); }}>
            <Minus className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>
      </div>

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div
        ref={containerRef}
        tabIndex={0}
        className="flex-1 overflow-auto flex justify-center bg-[#e8e8ed] p-4 outline-none"
        onMouseUp={handleMouseUp}
      >
        <div
          ref={pageWrapRef}
          className="relative self-start origin-top-left"
          style={{
            transform: renderScale !== scale ? `scale(${scale / renderScale})` : undefined,
            transition: renderScale !== scale ? undefined : "transform 0.1s ease-out",
          }}
        >
          <Document
            file={url}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-[var(--muted)]">Loading PDF...</div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-red-500">Failed to load PDF</div>
              </div>
            }
          >
            <Page
              pageNumber={pageNum}
              scale={renderScale}
              className="shadow-lg rounded-sm"
            />
          </Document>

          {/* Highlight overlays */}
          {pageHighlights.map((hl) =>
            hl.rects.map((r, i) => (
              <div
                key={`${hl.id}-${i}`}
                className="pdf-highlight-overlay"
                style={{
                  position: "absolute",
                  left: `${r.left * 100}%`,
                  top: `${r.top * 100}%`,
                  width: `${r.width * 100}%`,
                  height: `${r.height * 100}%`,
                  zIndex: 5,
                  pointerEvents: "auto",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHighlightClick(hl, e);
                }}
              />
            ))
          )}
        </div>
      </div>

      {bubble && (
        <SelectionBubble
          text={bubble.text}
          position={{ x: bubble.x, y: bubble.y }}
          paperId={paperId}
          onClose={closeBubble}
          cached={bubble.cached}
          onExplainDone={handleExplainDone}
          highlightId={bubble.highlightId}
        />
      )}
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1 rounded-md hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[var(--foreground)]"
    >
      {children}
    </button>
  );
}
