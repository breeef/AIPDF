"use client";

import type { Paper } from "@/lib/types";
import { PaperItem } from "./PaperItem";

interface Props {
  papers: Paper[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: string;
}

export function PaperList({ papers, selectedId, onSelect, filter }: Props) {
  const filtered = papers.filter((p) => {
    const title = (p.short_title || p.original_title).toLowerCase();
    return title.includes(filter.toLowerCase());
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center text-sm text-gray-400 py-8">
        {papers.length === 0 ? "Upload a PDF to get started" : "No papers match your search"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {filtered.map((paper) => (
        <PaperItem
          key={paper.id}
          paper={paper}
          selected={paper.id === selectedId}
          onClick={() => onSelect(paper.id)}
        />
      ))}
    </div>
  );
}
