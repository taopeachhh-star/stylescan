"use client";

import { useState, useCallback, useRef } from "react";
import { Download, RotateCcw, AlertCircle, Sparkles, ArrowRight, Eye, Zap, Shield } from "lucide-react";
import type { UploadState, StyleScanResult, EditableResult } from "@/types";
import { ColorPanel } from "@/components/core/ColorPanel";
import { TypographyPanel } from "@/components/core/TypographyPanel";
import { SpacingPanel, RadiusPanel } from "@/components/core/SpacingRadiusPanels";
import { downloadTokenJSON } from "@/lib/exporter";

function toEditable(result: StyleScanResult): EditableResult {
  return {
    colors: result.colors,
    typography: result.typography,
    spacing: result.spacing,
    radii: result.radii,
    styleKeywords: result.styleKeywords,
    analysisNotes: result.analysisNotes,
    overallConfidence: result.overallConfidence,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Animated Background ───────────────────────────────────────────────────────
function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{zIndex:0}}>
      {/* Top-left corner — purple */}
      <div className="orb-1" style={{
        width: 500, height: 500,
        top: '-180px', left: '-150px',
        background: 'radial-gradient(circle, rgba(124,107,255,0.22) 0%, transparent 70%)',
      }} />
      {/* Top-right corner — teal, starts far from center */}
      <div className="orb-2" style={{
        width: 440, height: 440,
        top: '-120px', right: '-160px',
        background: 'radial-gradient(circle, rgba(62,207,207,0.18) 0%, transparent 70%)',
        animationDelay: '-8s',
      }} />
      {/* Bottom-left — pink accent */}
      <div className="orb-3" style={{
        width: 360, height: 360,
        bottom: '-100px', left: '5%',
        background: 'radial-gradient(circle, rgba(255,107,157,0.12) 0%, transparent 70%)',
        animationDelay: '-4s',
      }} />
      {/* Bottom-right — purple soft */}
      <div className="orb-1" style={{
        width: 320, height: 320,
        bottom: '-80px', right: '8%',
        background: 'radial-gradient(circle, rgba(124,107,255,0.10) 0%, transparent 70%)',
        animationDelay: '-12s',
      }} />
    </div>
  );
}

// ─── Analyzing Screen ──────────────────────────────────────────────────────────
function AnalyzingScreen({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'var(--bg-primary)'}}>
      <AmbientBackground />
      <div className="relative z-10 flex flex-col items-center gap-10 px-8">
        {/* Screenshot with scan */}
        <div className="relative rounded-2xl overflow-hidden" style={{
          border:'1px solid var(--glass-border)',
          width: 300, maxHeight: 200,
          boxShadow: '0 0 60px rgba(124,107,255,0.15)',
        }}>
          <img src={imageUrl} alt="Analyzing" className="w-full object-cover object-top" style={{maxHeight:200}} />
          <div className="absolute inset-x-0 h-[2px] animate-scan" style={{
            background:'linear-gradient(90deg, transparent 0%, var(--accent-2) 30%, var(--accent-1) 70%, transparent 100%)',
            boxShadow:'0 0 16px var(--accent-1)',
            zIndex:10,
          }} />
          <div className="absolute inset-0" style={{background:'rgba(6,6,8,0.25)'}} />
        </div>

        {/* Spinner + label */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 opacity-15" style={{borderColor:'var(--accent-1)'}} />
            <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
              style={{borderTopColor:'var(--accent-1)', borderRightColor:'var(--accent-2)'}} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4" style={{color:'var(--accent-1)'}} />
            </div>
          </div>
          <div className="text-center">
            <p className="font-body font-semibold text-lg" style={{color:'var(--text-primary)'}}>Extracting design tokens…</p>
            <p className="font-body text-sm mt-1" style={{color:'var(--text-secondary)'}}>Colors · Typography · Spacing · Radius</p>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                background:'var(--accent-1)',
                animation: `pulse-dot 1.2s ${i*0.18}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Drop Zone ─────────────────────────────────────────────────────────────────
function DropZone({ onFile, disabled }: { onFile: (f: File) => void; disabled?: boolean }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback((file: File) => {
    if (file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 rounded-2xl ${dragging ? 'scale-[1.01]' : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault(); setDragging(false);
        if (!disabled) { const f = e.dataTransfer.files[0]; if (f) handle(f); }
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value=''; }} />

      {/* Gradient border on hover/drag */}
      <div className={`absolute -inset-[1px] rounded-2xl transition-opacity duration-300 ${dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
        style={{background:'linear-gradient(135deg, var(--accent-1), var(--accent-2), var(--accent-3))'}}>
      </div>

      {/* Inner card — solid dark bg so orbs don't bleed through */}
      <div className="relative rounded-2xl px-12 py-14 flex flex-col items-center gap-5 transition-all duration-300"
        style={{
          background: dragging ? 'rgba(124,107,255,0.06)' : 'rgba(10,10,18,0.92)',
          border: dragging ? '1px solid transparent' : '1px solid var(--glass-border)',
          backdropFilter: 'blur(12px)',
        }}>

        {/* Icon */}
        <div className="w-18 h-18 rounded-2xl p-4 flex items-center justify-center animate-float"
          style={{
            background:'linear-gradient(135deg, rgba(124,107,255,0.18), rgba(62,207,207,0.08))',
            border:'1px solid rgba(124,107,255,0.28)',
          }}>
          <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
            <path d="M20 8v20M12 20l8 8 8-8" stroke="url(#ug)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 32h24" stroke="url(#ug2)" strokeWidth="2.2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="ug" x1="12" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c6bff"/><stop offset="1" stopColor="#3ecfcf"/>
              </linearGradient>
              <linearGradient id="ug2" x1="8" y1="32" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c6bff"/><stop offset="1" stopColor="#3ecfcf"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="text-center space-y-1.5">
          <p className="font-body font-semibold text-xl" style={{color:'var(--text-primary)'}}>
            {dragging ? 'Release to analyze' : 'Drop your UI screenshot'}
          </p>
          <p className="font-body text-sm" style={{color:'var(--text-secondary)'}}>
            PNG · JPG · WebP — any UI screenshot works
          </p>
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium"
          style={{
            background:'linear-gradient(135deg, rgba(124,107,255,0.18), rgba(62,207,207,0.10))',
            border:'1px solid rgba(124,107,255,0.32)',
            color:'var(--accent-1)',
          }}>
          <span>Browse files</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection({ onFile }: { onFile: (f: File) => void }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <AmbientBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{background:'linear-gradient(135deg, var(--accent-1), var(--accent-2))'}}>
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-body font-semibold tracking-tight" style={{color:'var(--text-primary)'}}>StyleScan</span>
          <span className="font-mono-custom text-[10px] px-2 py-0.5 rounded-full"
            style={{background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', color:'var(--text-muted)'}}>v0.1</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="https://github.com/taopeachhh-star/stylescan"
            className="font-body text-sm transition-colors hover:opacity-80" style={{color:'var(--text-secondary)'}}>
            GitHub
          </a>
          <a href="#upload" className="font-body text-sm font-medium px-4 py-2 rounded-full"
            style={{background:'linear-gradient(135deg, var(--accent-1), var(--accent-2))', color:'white'}}>
            Try it free
          </a>
        </nav>
      </header>

      {/* Hero content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8 pt-4 text-center">
        {/* Badge */}
        <div className="animate-fade-up-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 font-body text-sm"
          style={{background:'rgba(124,107,255,0.1)', border:'1px solid rgba(124,107,255,0.22)', color:'var(--accent-1)'}}>
          <Zap className="w-3.5 h-3.5" />
          <span>AI-powered design token extraction</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-2 font-display text-6xl md:text-7xl lg:text-8xl leading-[1.05] mb-6 max-w-4xl">
          <span style={{color:'var(--text-primary)'}}>Screenshot</span>
          <br />
          <span className="gradient-text italic">to Figma Tokens</span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-up-3 font-body text-lg max-w-xl mb-12 leading-relaxed" style={{color:'var(--text-secondary)'}}>
          Upload any UI screenshot. Get colors, typography, spacing and radius tokens —
          with AI confidence ratings — ready to import into Figma in seconds.
        </p>

        {/* Drop zone — contained with solid background */}
        <div id="upload" className="animate-fade-up-4 w-full max-w-lg">
          <DropZone onFile={onFile} />
        </div>

        {/* Feature chips */}
        <div className="animate-fade-up-4 flex flex-wrap justify-center gap-2 mt-8">
          {[
            { icon: Eye,     label: 'Color extraction' },
            { icon: Zap,     label: 'Typography analysis' },
            { icon: Shield,  label: 'Confidence ratings' },
            { icon: Download,label: 'Figma-ready export' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs"
              style={{background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)', color:'var(--text-secondary)'}}>
              <Icon className="w-3 h-3" style={{color:'var(--accent-2)'}} />
              {label}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Results ───────────────────────────────────────────────────────────────────
function ResultsHeader({ imageUrl, editable, onReset, onExport }: {
  imageUrl: string; editable: EditableResult; onReset: () => void; onExport: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
      style={{background:'rgba(6,6,8,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--glass-border)'}}>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{background:'linear-gradient(135deg, var(--accent-1), var(--accent-2))'}}>
          <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} />
        </div>
        <span className="font-body font-semibold" style={{color:'var(--text-primary)'}}>StyleScan</span>
        <div className="hidden md:flex gap-1.5 ml-3">
          {editable.styleKeywords.slice(0,3).map(kw => (
            <span key={kw} className="font-body text-[11px] px-2 py-0.5 rounded-full"
              style={{background:'var(--glass-bg)', border:'1px solid var(--glass-border)', color:'var(--text-secondary)'}}>
              {kw}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs transition-all glass glass-hover"
          style={{color:'var(--text-secondary)'}}>
          <RotateCcw className="w-3.5 h-3.5" /> New scan
        </button>
        <button onClick={onExport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-xs font-semibold"
          style={{background:'linear-gradient(135deg, var(--accent-1), var(--accent-2))', color:'white'}}>
          <Download className="w-3.5 h-3.5" /> Export tokens.json
        </button>
      </div>
    </header>
  );
}

function ResultsSidebar({ imageUrl, editable }: { imageUrl: string; editable: EditableResult }) {
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--glass-border)'}}>
        <img src={imageUrl} alt="Analyzed" className="w-full object-cover object-top" style={{maxHeight:240}} />
      </div>

      <div className="rounded-2xl p-4 glass space-y-3">
        <p className="font-mono-custom text-[10px] uppercase tracking-widest" style={{color:'var(--text-muted)'}}>Confidence</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
            <div className="h-full rounded-full" style={{
              width: editable.overallConfidence==='high'?'85%':editable.overallConfidence==='medium'?'58%':'32%',
              background:'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
            }} />
          </div>
          <span className="font-mono-custom text-xs capitalize" style={{color:'var(--accent-2)'}}>{editable.overallConfidence}</span>
        </div>
        {editable.analysisNotes && (
          <p className="font-body text-xs leading-relaxed" style={{color:'var(--text-secondary)'}}>{editable.analysisNotes}</p>
        )}
      </div>

      {editable.styleKeywords.length > 0 && (
        <div className="rounded-2xl p-4 glass space-y-3">
          <p className="font-mono-custom text-[10px] uppercase tracking-widest" style={{color:'var(--text-muted)'}}>Visual style</p>
          <div className="flex flex-wrap gap-2">
            {editable.styleKeywords.map((kw, i) => (
              <span key={kw} className="font-body text-xs px-3 py-1 rounded-full"
                style={{
                  background:`rgba(${['124,107,255','62,207,207','255,107,157'][i%3]},0.12)`,
                  border:`1px solid rgba(${['124,107,255','62,207,207','255,107,157'][i%3]},0.25)`,
                  color:['var(--accent-1)','var(--accent-2)','var(--accent-3)'][i%3],
                }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4 glass space-y-3">
        <p className="font-mono-custom text-[10px] uppercase tracking-widest" style={{color:'var(--text-muted)'}}>Import to Figma</p>
        <ol className="space-y-2">
          {['Export tokens as .json','Figma → Plugins → Tokens Studio','File Storage → Load from file','Apply to your design system'].map((s,i)=>(
            <li key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5"
                style={{background:'rgba(124,107,255,0.2)', color:'var(--accent-1)'}}>{i+1}</span>
              <span className="font-body text-xs leading-relaxed" style={{color:'var(--text-secondary)'}}>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [editable, setEditable] = useState<EditableResult | null>(null);
  const analyzingImageUrl = useRef<string>('');

  const handleFile = useCallback(async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    analyzingImageUrl.current = imageUrl;
    setUploadState({ status: 'analyzing' });
    setEditable(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Analysis failed');
      const result: StyleScanResult = data.result;
      setEditable(toEditable(result));
      setUploadState({ status: 'done', result, imageUrl });
    } catch (err) {
      URL.revokeObjectURL(imageUrl);
      setUploadState({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong' });
    }
  }, []);

  function handleReset() {
    if (uploadState.status === 'done') URL.revokeObjectURL(uploadState.imageUrl);
    setUploadState({ status: 'idle' });
    setEditable(null);
  }

  return (
    <div style={{background:'var(--bg-primary)', minHeight:'100vh'}}>
      {uploadState.status === 'analyzing' && <AnalyzingScreen imageUrl={analyzingImageUrl.current} />}

      {(uploadState.status === 'idle' || uploadState.status === 'error') && (
        <>
          <HeroSection onFile={handleFile} />
          {uploadState.status === 'error' && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
              <div className="rounded-2xl p-4 flex items-start gap-3"
                style={{background:'rgba(255,60,60,0.1)', border:'1px solid rgba(255,60,60,0.25)', backdropFilter:'blur(20px)'}}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{color:'#ff6b6b'}} />
                <div className="flex-1">
                  <p className="font-body text-sm font-medium" style={{color:'#ff6b6b'}}>Analysis failed</p>
                  <p className="font-body text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>{uploadState.message}</p>
                </div>
                <button onClick={() => setUploadState({status:'idle'})} className="font-mono-custom text-xs" style={{color:'var(--text-muted)'}}>✕</button>
              </div>
            </div>
          )}
        </>
      )}

      {uploadState.status === 'done' && editable && (
        <div className="min-h-screen">
          <ResultsHeader
            imageUrl={uploadState.imageUrl}
            editable={editable}
            onReset={handleReset}
            onExport={() => downloadTokenJSON(editable)}
          />
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
              <ResultsSidebar imageUrl={uploadState.imageUrl} editable={editable} />
              <div className="space-y-8 animate-fade-up">
                <ColorPanel colors={editable.colors} onChange={c => setEditable(p => p ? {...p,colors:c} : p)} />
                <TypographyPanel tokens={editable.typography} onChange={t => setEditable(p => p ? {...p,typography:t} : p)} />
                <SpacingPanel spacing={editable.spacing} onChange={s => setEditable(p => p ? {...p,spacing:s} : p)} />
                <RadiusPanel radii={editable.radii} onChange={r => setEditable(p => p ? {...p,radii:r} : p)} />
              </div>
            </div>
          </div>
          <footer className="border-t px-8 py-5 mt-16 flex items-center justify-between"
            style={{borderColor:'var(--glass-border)'}}>
            <p className="font-mono-custom text-[11px]" style={{color:'var(--text-muted)'}}>StyleScan · MIT License</p>
            <p className="font-mono-custom text-[11px]" style={{color:'var(--text-muted)'}}>Powered by Gemini Vision</p>
          </footer>
        </div>
      )}
    </div>
  );
}
