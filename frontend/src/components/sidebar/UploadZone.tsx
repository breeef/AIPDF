"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Plus } from "lucide-react";

interface Props {
  onUpload: (file: File) => Promise<void>;
}

export function UploadZone({ onUpload }: Props) {
  const onDrop = useCallback(
    (files: File[]) => {
      if (files[0]) onUpload(files[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? "border-[var(--accent)] bg-[var(--accent-light)] scale-[1.02]"
          : "border-black/10 hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-center gap-2">
        <Plus className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--accent)]">
          {isDragActive ? "Drop here" : "Add Paper"}
        </span>
      </div>
    </div>
  );
}
