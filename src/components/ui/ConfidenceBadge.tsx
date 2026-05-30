"use client";
import type { ConfidenceAnnotation } from "@/types";

interface Props { confidence: ConfidenceAnnotation; showNote?: boolean; }

const CFG = {
  high:   { label: 'Verified',  dot: '#3ecfcf', bg: 'rgba(62,207,207,0.1)',   border: 'rgba(62,207,207,0.25)',   text: '#3ecfcf' },
  medium: { label: 'Inferred',  dot: '#f5a623', bg: 'rgba(245,166,35,0.1)',   border: 'rgba(245,166,35,0.25)',   text: '#f5a623' },
  low:    { label: 'Verify →',  dot: '#ff6b9d', bg: 'rgba(255,107,157,0.1)',  border: 'rgba(255,107,157,0.25)',  text: '#ff6b9d' },
} as const;

export function ConfidenceBadge({ confidence, showNote = false }: Props) {
  const c = CFG[confidence.level];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono-custom text-[10px] font-medium shrink-0"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {showNote && confidence.note ? confidence.note : c.label}
    </span>
  );
}
