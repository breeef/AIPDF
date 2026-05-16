"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { GraphCanvas } from "@/components/canvas/GraphCanvas";
import { ChatPanel } from "@/components/chat/ChatPanel";
import dynamic from "next/dynamic";

const PdfViewerPanel = dynamic(
  () => import("@/components/pdf/PdfViewerPanel").then((m) => ({ default: m.PdfViewerPanel })),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-sm">Loading viewer...</div> }
);
import { useAppStore } from "@/store/app-store";
import { PanelLeft, MessageCircle, Settings } from "lucide-react";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  const { selectedPaperId } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [splitRatio, setSplitRatio] = useState(0.45);
  const [chatWidth, setChatWidth] = useState(380);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"split" | "chat" | false>(false);

  const onMouseDown = useCallback(() => {
    dragging.current = "split";
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onChatResizeDown = useCallback(() => {
    dragging.current = "chat";
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      if (dragging.current === "split" && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        setSplitRatio(Math.min(0.7, Math.max(0.2, ratio)));
      } else if (dragging.current === "chat") {
        const newWidth = window.innerWidth - e.clientX;
        setChatWidth(Math.min(700, Math.max(300, newWidth)));
      }
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Top bar */}
      <header className="h-12 flex items-center px-4 gap-3 glass border-b border-[var(--border)] z-30 shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-[18px] h-[18px] text-[var(--muted)]" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            AI Paper Reader
          </span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          title="设置"
        >
          <Settings className="w-[18px] h-[18px] text-[var(--muted)]" />
        </button>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`p-1.5 rounded-lg transition-colors ${
            chatOpen ? "bg-[var(--accent)] text-white" : "hover:bg-black/5 text-[var(--muted)]"
          }`}
          title="Toggle chat"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
        </button>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* Floating sidebar */}
        <div
          className={`absolute top-0 left-0 h-full z-20 transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full w-[272px] glass border-r border-[var(--border)] shadow-lg shadow-black/5">
            <Sidebar onSelectPaper={() => {}} />
          </div>
        </div>

        {/* Click-away overlay when sidebar open on small screens */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content area */}
        <div
          ref={containerRef}
          className={`flex-1 flex min-w-0 transition-[margin] duration-300 ${
            sidebarOpen ? "lg:ml-[272px]" : "ml-0"
          }`}
        >
          {selectedPaperId ? (
            <>
              {/* PDF panel (left) */}
              <div
                className="h-full overflow-hidden bg-white rounded-tl-xl"
                style={{ width: `${splitRatio * 100}%` }}
              >
                <PdfViewerPanel paperId={selectedPaperId} />
              </div>

              {/* Resizer */}
              <div className="resizer" onMouseDown={onMouseDown} />

              {/* Graph panel (right) */}
              <div
                className="h-full flex flex-col min-w-0 bg-[var(--background)]"
                style={{ width: `${(1 - splitRatio) * 100}%` }}
              >
                <GraphCanvas />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center">
                  <PanelLeft className="w-8 h-8 text-[var(--accent)]" />
                </div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  Upload a paper to get started
                </p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Open the sidebar and drag a PDF to begin
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat panel (right side) */}
        <div
          className={`shrink-0 bg-white flex transition-all duration-300 ease-out overflow-hidden ${
            chatOpen ? "border-l border-[var(--border)]" : "w-0"
          }`}
          style={{ width: chatOpen ? `${chatWidth}px` : 0 }}
        >
          {chatOpen && (
            <div
              className="resizer"
              onMouseDown={onChatResizeDown}
            />
          )}
          <div className="flex-1 min-w-0 h-full">
            <ChatPanel />
          </div>
        </div>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
