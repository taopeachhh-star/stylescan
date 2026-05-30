"use client";
import type { SpacingSystem, SpacingToken, RadiusToken } from "@/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

// ─── Spacing ──────────────────────────────────────────────────────────────────
interface SpacingProps {
  spacing: SpacingSystem & { tokens: (SpacingToken & { edited?: boolean })[] };
  onChange: (updated: SpacingSystem & { tokens: (SpacingToken & { edited?: boolean })[] }) => void;
}

export function SpacingPanel({ spacing, onChange }: SpacingProps) {
  function updateToken(name: string, value: string) {
    const num = parseFloat(value);
    onChange({
      ...spacing,
      tokens: spacing.tokens.map(t =>
        t.name === name ? { ...t, value, numericValue: isNaN(num) ? t.numericValue : num, edited: true } : t
      ),
    });
  }

  const maxVal = Math.max(...spacing.tokens.map(t => t.numericValue), 1);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-mono-custom text-[11px] uppercase tracking-widest" style={{color:'var(--text-muted)'}}>Spacing</h2>
        <div className="flex-1 h-px" style={{background:'var(--glass-border)'}} />
        <span className="font-mono-custom text-[10px]" style={{color:'var(--text-muted)'}}>
          {spacing.baseUnit}px base · {spacing.gridType} grid
        </span>
      </div>

      {/* Grid confidence note */}
      <div className="rounded-xl px-4 py-2.5 flex items-center justify-between glass">
        <p className="font-body text-xs" style={{color:'var(--text-secondary)'}}>
          Base unit: <code className="font-mono-custom" style={{color:'var(--text-primary)'}}>{spacing.baseUnit}px</code>
          {' · '}
          <code className="font-mono-custom" style={{color:'var(--text-primary)'}}>{spacing.gridType}</code> grid system
        </p>
        <ConfidenceBadge confidence={spacing.confidence} showNote />
      </div>

      <div className="space-y-2">
        {spacing.tokens.map(token => (
          <div key={token.name} className="flex items-center gap-4 rounded-xl px-4 py-3 glass glass-hover">
            {/* Bar visualization */}
            <div className="w-24 h-2 rounded-full overflow-hidden shrink-0" style={{background:'rgba(255,255,255,0.05)'}}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(token.numericValue / maxVal) * 100}%`,
                  background: 'linear-gradient(90deg, var(--accent-1), var(--accent-2))'
                }} />
            </div>

            <div className="flex-1 min-w-0">
              <code className="font-mono-custom text-[11px] block" style={{color:'var(--text-primary)'}}>{token.name}</code>
              <p className="font-body text-[10px] truncate" style={{color:'var(--text-muted)'}}>{token.usage}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                className="w-16 rounded-lg px-2 py-1 font-mono-custom text-xs text-right focus:outline-none transition-all"
                style={{background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)', color:'var(--text-primary)'}}
                defaultValue={token.value}
                onFocus={e => e.target.style.borderColor = 'var(--accent-1)'}
                onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; updateToken(token.name, e.target.value); }}
              />
              {(token as SpacingToken & { edited?: boolean }).edited && <span className="font-mono-custom text-[9px]" style={{color:'var(--accent-1)'}}>edited</span>}
              <ConfidenceBadge confidence={token.confidence} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Radius ───────────────────────────────────────────────────────────────────
interface RadiusProps {
  radii: (RadiusToken & { edited?: boolean })[];
  onChange: (updated: (RadiusToken & { edited?: boolean })[]) => void;
}

export function RadiusPanel({ radii, onChange }: RadiusProps) {
  function update(name: string, value: string) {
    const num = parseFloat(value);
    onChange(radii.map(r =>
      r.name === name ? { ...r, value, numericValue: isNaN(num) ? r.numericValue : num, edited: true } : r
    ));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-mono-custom text-[11px] uppercase tracking-widest" style={{color:'var(--text-muted)'}}>Border Radius</h2>
        <div className="flex-1 h-px" style={{background:'var(--glass-border)'}} />
        <span className="font-mono-custom text-[10px]" style={{color:'var(--text-muted)'}}>{radii.length} tokens</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {radii.map(r => (
          <div key={r.name} className="rounded-2xl p-4 glass glass-hover space-y-3">
            {/* Preview shape */}
            <div className="flex justify-center">
              <div className="w-14 h-14 transition-all duration-300"
                style={{
                  borderRadius: Math.min(r.numericValue, 28),
                  background: 'linear-gradient(135deg, rgba(124,107,255,0.2), rgba(62,207,207,0.1))',
                  border: '1px solid rgba(124,107,255,0.25)'
                }} />
            </div>

            <div className="space-y-1">
              <code className="font-mono-custom text-[11px] block" style={{color:'var(--text-primary)'}}>{r.name}</code>
              <p className="font-body text-[10px]" style={{color:'var(--text-muted)'}}>{r.context}</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg px-2 py-1 font-mono-custom text-xs focus:outline-none transition-all"
                style={{background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)', color:'var(--text-primary)'}}
                defaultValue={r.value}
                onFocus={e => e.target.style.borderColor = 'var(--accent-1)'}
                onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; update(r.name, e.target.value); }}
              />
              {r.edited && <span className="font-mono-custom text-[9px]" style={{color:'var(--accent-1)'}}>edited</span>}
            </div>
            <ConfidenceBadge confidence={r.confidence} />
          </div>
        ))}
      </div>
    </section>
  );
}
