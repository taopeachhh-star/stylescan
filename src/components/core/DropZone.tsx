"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      onFile(file);
    },
    [onFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <label
      className={`
        relative flex flex-col items-center justify-center gap-4
        w-full min-h-[240px] rounded-2xl border-2 border-dashed
        transition-all duration-200 cursor-pointer select-none
        ${dragging
          ? "border-zinc-400 bg-zinc-800/80 scale-[1.01]"
          : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-800/60"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={onInputChange}
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className={`
          p-4 rounded-2xl border transition-colors
          ${dragging ? "border-zinc-500 bg-zinc-700" : "border-zinc-700 bg-zinc-800"}
        `}>
          <Upload
            className={`w-6 h-6 transition-colors ${dragging ? "text-zinc-200" : "text-zinc-500"}`}
            strokeWidth={1.5}
          />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-zinc-300">
            Drop a UI screenshot here
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            PNG, JPG, WebP · any UI screenshot works
          </p>
        </div>
      </div>
    </label>
  );
}
