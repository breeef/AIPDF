"use client";

import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchFilter({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-black/[0.04] border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 placeholder:text-[var(--muted)]"
      />
    </div>
  );
}
