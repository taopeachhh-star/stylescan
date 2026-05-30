"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { ColorToken } from "@/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

function hexToHsl(hex: string): [number, number, number] {
  const sanitized = hex.replace('#', '').slice(0, 6);
  const r = parseInt(sanitized.slice(0, 2), 16) / 255;
  const g = parseInt(sanitized.slice(2, 4), 16) / 255;
  const b = parseInt(sanitized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function isDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

function ColorPickerCard({
  color,
  onConfirm,
  onClose,
}: {
  color: ColorToken & { edited?: boolean };
  onConfirm: (hex: string) => void;
  onClose: () => void;
}) {
  const originalHex = color.hex;
  // Fix 3: init HSL from actual color so black opens in correct region
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(originalHex));
  const [hoverHex, setHoverHex] = useState<string | null>(null);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const selectedHex = hslToHex(...hsl);
  const previewHex = hoverHex ?? selectedHex;
  const hueColor = hslToHex(hsl[0], 100, 50);

  // Fix 1: click outside closes only this picker
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handleOutside), 120);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleOutside); };
  }, [onClose]);

  const getSpectrumSL = useCallback((e: React.MouseEvent<HTMLDivElement>): [number, number] => {
    const rect = spectrumRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 50 + (1 - x) * y * 50);
    return [s, l];
  }, []);

  const handleSpectrumMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const [s, l] = getSpectrumSL(e);
    setHoverHex(hslToHex(hsl[0], s, l));
  }, [hsl, getSpectrumSL]);

  // Click = confirm immediately
  const handleSpectrumClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const [s, l] = getSpectrumSL(e);
    const hex = hslToHex(hsl[0], s, l);
    onConfirm(hex);
  }, [hsl, getSpectrumSL, onConfirm]);

  const handleHueInteract = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHsl([Math.round(x * 360), hsl[1], hsl[2]]);
    setHoverHex(null);
  }, [hsl]);

  return (
    <div ref={cardRef}
      className="absolute left-0 right-0 top-0 z-50 rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: '#111118',
        border: '1px solid rgba(124,107,255,0.45)',
        boxShadow: '0 16px 56px rgba(0,0,0,0.8)',
        height: 240,
      }}>

      {/* Spectrum */}
      <div
        ref={spectrumRef}
        className="flex-1 relative cursor-crosshair select-none"
        style={{
          background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueColor})`,
        }}
        onMouseMove={handleSpectrumMove}
        onMouseLeave={() => setHoverHex(null)}
        onClick={handleSpectrumClick}
      >
        {hoverHex && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-mono-custom font-medium pointer-events-none"
            style={{
              background: hoverHex,
              color: isDark(hoverHex) ? '#fff' : '#000',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
            {hoverHex.toUpperCase()}
          </div>
        )}
        {!hoverHex && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <span className="font-body text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.35)' }}>
              Slide to preview · Click to apply
            </span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{ background: selectedHex }} />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="mx-3 mt-2 rounded-full cursor-pointer relative select-none"
        style={{ height: 12, background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
        onMouseMove={e => e.buttons === 1 && handleHueInteract(e)}
        onClick={handleHueInteract}
      >
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${(hsl[0] / 360) * 100}% - 8px)`, background: hueColor }} />
      </div>

      {/* Before → After */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-7 h-7 rounded-lg border border-white/10" style={{ background: originalHex }} />
          <span className="font-mono-custom text-[9px]" style={{ color: 'var(--text-muted)' }}>Before</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-7 h-7 rounded-lg border border-white/10 transition-colors duration-75" style={{ background: previewHex }} />
          <span className="font-mono-custom text-[9px]" style={{ color: 'var(--text-muted)' }}>After</span>
        </div>
        <code className="flex-1 font-mono-custom text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>
          {previewHex.toUpperCase()}
        </code>
        <span className="font-body text-[10px]" style={{ color: 'var(--text-muted)' }}>Click outside to cancel</span>
      </div>
    </div>
  );
}

interface Props {
  colors: (ColorToken & { edited?: boolean })[];
  onChange: (updated: (ColorToken & { edited?: boolean })[]) => void;
}

export function ColorPanel({ colors, onChange }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Fix 2: deduplicate colors by hex before rendering
  const deduped = colors.filter((c, i, arr) =>
    arr.findIndex(x => x.hex.toLowerCase() === c.hex.toLowerCase()) === i
  );

  function confirmColor(idx: number, hex: string) {
    const updated = colors.map((c, i) => i === idx ? { ...c, hex, edited: true } : c);
    onChange(updated);
    setEditingIdx(null);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-mono-custom text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Colors</h2>
        <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
        <span className="font-mono-custom text-[10px]" style={{ color: 'var(--text-muted)' }}>{deduped.length} tokens</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {deduped.map((color, idx) => {
          const isEditing = editingIdx === idx;
          return (
            <div key={`${color.role}-${idx}`}
              className="group relative rounded-2xl overflow-visible glass glass-hover transition-all duration-200"
              style={{ zIndex: isEditing ? 40 : 1 }}>

              {/* Fix 1: only render picker for THIS card */}
              {isEditing && (
                <ColorPickerCard
                  color={color}
                  onConfirm={(hex) => confirmColor(idx, hex)}
                  onClose={() => setEditingIdx(null)}
                />
              )}

              {/* Swatch — clicking opens picker for only this one */}
              <div
                className="relative h-20 w-full rounded-t-2xl overflow-hidden cursor-pointer"
                style={{ background: color.hex }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingIdx(isEditing ? null : idx);
                }}
              >
                {!isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ background: 'rgba(0,0,0,0.25)' }}>
                    <span className="font-body text-xs font-medium text-white px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                      Edit color
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-body text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{color.label}</span>
                  {color.edited && <span className="font-mono-custom text-[9px]" style={{ color: 'var(--accent-1)' }}>edited</span>}
                </div>
                <code className="font-mono-custom text-[11px] block" style={{ color: 'var(--text-secondary)' }}>{color.hex}</code>
                <ConfidenceBadge confidence={color.confidence} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
