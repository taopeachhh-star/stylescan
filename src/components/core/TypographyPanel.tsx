"use client";
import { useState } from "react";
import type { TypographyToken } from "@/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { ChevronDown } from "lucide-react";

interface Props {
  tokens: (TypographyToken & { edited?: boolean })[];
  onChange: (updated: (TypographyToken & { edited?: boolean })[]) => void;
}

const ORDER = ["h1","h2","h3","body","label","caption"];
const PREVIEW_TEXT: Record<string, string> = {
  h1: 'Display Heading', h2: 'Section Title', h3: 'Subsection',
  body: 'Body text flows here naturally', label: 'UI Label', caption: 'Caption text'
};

export function TypographyPanel({ tokens, onChange }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const sorted = [...tokens].sort((a,b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level));

  function update(idx: number, field: keyof TypographyToken, value: string) {
    const updated = tokens.map((t, i) => {
      if (i !== idx) return t;
      const patch: Partial<TypographyToken & {edited:boolean}> = { [field]: value, edited: true };
      if (field === 'size') { const n = parseFloat(value); if (!isNaN(n)) patch.sizeValue = n; }
      return { ...t, ...patch };
    });
    onChange(updated);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-mono-custom text-[11px] uppercase tracking-widest" style={{color:'var(--text-muted)'}}>Typography</h2>
        <div className="flex-1 h-px" style={{background:'var(--glass-border)'}} />
        <span className="font-mono-custom text-[10px]" style={{color:'var(--text-muted)'}}>{tokens.length} levels</span>
      </div>

      <div className="space-y-2">
        {sorted.map((token, idx) => (
          <div key={`${token.level}-${idx}`}
            className="rounded-2xl glass glass-hover overflow-hidden transition-all duration-200">

            {/* Header row */}
            <div className="flex items-center gap-4 px-4 py-3 cursor-pointer"
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>

              <span className="font-mono-custom text-[10px] uppercase w-12 shrink-0" style={{color:'var(--text-muted)'}}>{token.level}</span>

              {/* Preview */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <span className="font-body truncate block" style={{
                  fontSize: Math.min(token.sizeValue, 26),
                  fontWeight: token.weight,
                  lineHeight: token.lineHeight,
                  color: 'var(--text-primary)',
                }}>
                  {PREVIEW_TEXT[token.level] ?? token.label}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <code className="font-mono-custom text-[11px]" style={{color:'var(--text-secondary)'}}>{token.size}</code>
                <code className="font-mono-custom text-[11px]" style={{color:'var(--text-muted)'}}>/{token.weight}</code>
                {token.edited && <span className="font-mono-custom text-[9px]" style={{color:'var(--accent-1)'}}>edited</span>}
                <ConfidenceBadge confidence={token.confidence} />
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{color:'var(--text-muted)', transform: expandedIdx===idx ? 'rotate(180deg)' : ''}} />
              </div>
            </div>

            {/* Expanded editor */}
            {expandedIdx === idx && (
              <div className="px-4 pb-4 pt-1 grid grid-cols-3 gap-3 border-t" style={{borderColor:'var(--glass-border)'}}>
                {([
                  ['Size', 'size', token.size],
                  ['Weight', 'weight', token.weight],
                  ['Line height', 'lineHeight', token.lineHeight],
                ] as [string, keyof TypographyToken, string][]).map(([label, field, val]) => (
                  <label key={field} className="flex flex-col gap-1.5">
                    <span className="font-mono-custom text-[10px] uppercase" style={{color:'var(--text-muted)'}}>{label}</span>
                    <input
                      className="rounded-xl px-3 py-2 font-mono-custom text-xs focus:outline-none transition-all"
                      style={{
                        background:'rgba(255,255,255,0.04)',
                        border:'1px solid var(--glass-border)',
                        color:'var(--text-primary)',
                      }}
                      defaultValue={val}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-1)'}
                      onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; update(idx, field, e.target.value); }}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
