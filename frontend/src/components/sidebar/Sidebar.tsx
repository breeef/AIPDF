"use client";

import { useState } from "react";
import { usePapers } from "@/hooks/usePapers";
import { useAppStore } from "@/store/app-store";
import { UploadZone } from "./UploadZone";
import { SearchFilter } from "./SearchFilter";
import { PaperList } from "./PaperList";

interface Props {
  onSelectPaper?: () => void;
}

export function Sidebar({ onSelectPaper }: Props) {
  const { papers, upload } = usePapers();
  const { selectedPaperId, selectPaper } = useAppStore();
  const [filter, setFilter] = useState("");

  const handleUpload = async (file: File) => {
    const paper = await upload(file);
    selectPaper(paper.id);
  };

  const handleSelect = (id: string) => {
    selectPaper(id);
    onSelectPaper?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Library
        </p>
        <UploadZone onUpload={handleUpload} />
        <SearchFilter value={filter} onChange={setFilter} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <PaperList
          papers={papers}
          selectedId={selectedPaperId}
          onSelect={handleSelect}
          filter={filter}
        />
      </div>
    </div>
  );
}
