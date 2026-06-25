"use client";

import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { ALL_TOOLS, CATEGORIES } from '../config';
import { Search, ArrowRight, Star } from 'lucide-react';
import { Icon, tint, tintFg, tintBorder } from '../../components/LucideIcons';
import ToolCard from '../../components/ToolCard';

interface WelcomeStripProps {
  onOpenLauncher: () => void;
  onOpenPalette: () => void;
}

function WelcomeStrip({ onOpenLauncher, onOpenPalette }: WelcomeStripProps) {
  const [now] = useState(() => new Date());
  const hour = now.getHours();
  const greeting = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <section className="px-8 pt-10 pb-7 max-w-[1280px] mx-auto w-full box-border">
      <div className="flex items-end gap-6 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <div className="text-[11.5px] font-semibold text-[var(--fg-dim)] tracking-[0.10em] uppercase mb-2.5">
            {greeting}, Riley
          </div>
          <h1 className="m-0 text-[clamp(28px,4vw,40px)] leading-[1.05] tracking-[-0.025em] font-semibold text-[var(--fg)]">
            What needs <span className="font-serif italic font-normal bg-gradient-to-br from-[oklch(0.92_0.04_265)] to-[oklch(0.78_0.16_285)] text-transparent bg-clip-text">cleaning up</span> today?
          </h1>
          <p className="mt-2.5 mb-0 text-[14px] text-[var(--fg-muted)] max-w-[540px]">
            Every utility is loaded and ready. Hit <kbd className="kbd-inline">⌘K</kbd> to jump to any of them, or pick one from the shelves below.
          </p>
        </div>

        {/* Inline quick actions */}
        <div className="flex gap-2.5 flex-wrap">
          <button onClick={onOpenPalette} className="reset inline-flex items-center gap-2 px-3 py-2 bg-[oklch(0.20_0.008_250/0.6)] border border-[var(--border)] text-[var(--fg)] text-[13px] font-medium rounded-lg cursor-pointer transition-colors hover:bg-[var(--bg-hover)]">
            <Search size={13} />
            <span>Quick find</span>
            <kbd className="kbd ml-1">⌘K</kbd>
          </button>
        </div>
      </div>

      {/* Mini stats row */}
      <div className="flex gap-0 mt-7 py-3.5 border-t border-[var(--border)] flex-wrap dash-stats">
        {[
          { kpi: '14', label: 'days left in trial', tint: 75 },
          { kpi: '128', label: 'runs this month', tint: 265 },
          { kpi: '47ms', label: 'median launch', tint: 145, mono: true },
          { kpi: '0 B', label: 'data uploaded', tint: 195, mono: true },
        ].map((s, i) => (
          <div key={i} className={`py-1 px-6 flex-[1_1_140px] ${i === 0 ? 'border-none' : 'border-l border-[var(--border)]'}`}>
            <div className={`text-[20px] font-semibold tracking-[-0.02em] text-[var(--fg)] ${s.mono ? 'font-mono' : 'font-inherit'}`}>
              {s.kpi}
            </div>
            <div className="text-[11.5px] text-[var(--fg-muted)] mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface FeaturedToolProps {
  onPick: (id: string) => void;
}

function FeaturedTool({ onPick }: FeaturedToolProps) {
  const featured = ALL_TOOLS.find(t => t.id === 'universal-ai-formatter');
  if (!featured) return null;
  const Ico = Icon[featured.icon] || Search;

  return (
    <section className="max-w-[1280px] mx-auto px-8 pt-3 pb-8">
      <button onClick={() => onPick(featured.id)} className="reset w-full block text-left p-[clamp(24px,3vw,36px)] bg-gradient-to-br from-[oklch(0.22_0.05_265/0.55)] to-[oklch(0.18_0.03_290/0.40)] border border-[oklch(0.40_0.08_265/0.45)] rounded-2xl relative overflow-hidden transition-all duration-200 shadow-[0_16px_48px_oklch(0.25_0.15_265/0.18),inset_0_1px_0_oklch(1_0_0/0.04)] cursor-pointer hover:-translate-y-[2px]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(450px_220px_at_90%_50%,oklch(0.60_0.18_285/0.20),transparent_70%)]" />
        <div className="relative grid grid-cols-[1fr_auto] gap-6 items-center featured-grid">
          <div>
            <div className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[oklch(0.30_0.08_265/0.4)] border border-[oklch(0.45_0.10_265/0.4)] text-[11px] font-medium text-[oklch(0.88_0.10_265)] mb-3.5">
              <span className="hot-dot" />
              <span>Featured tool · most opened this week</span>
            </div>
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-[42px] h-[42px] rounded-lg flex items-center justify-center shrink-0" style={{
                background: tint(featured.hue, 0.35, 0.08, 0.45),
                border: `1px solid ${tintBorder(featured.hue)}`,
                color: tintFg(featured.hue),
              }}>
                <Ico size={19} strokeWidth={1.8} />
              </div>
              <h2 className="m-0 text-[clamp(20px,2.4vw,28px)] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                {featured.name}
              </h2>
            </div>
            <p className="m-0 text-[15px] text-[var(--fg-muted)] leading-relaxed max-w-[560px]">
              Paste raw output from ChatGPT, Claude, or Gemini and get a beautifully themed PDF, Word doc, or HTML — runs entirely on-device.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-[18px] py-3 bg-gradient-to-b from-[oklch(0.97_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.14_0.008_250)] font-medium text-[14px] rounded-lg shadow-[inset_0_1px_0_oklch(1_0_0/0.5),0_1px_3px_oklch(0_0_0/0.5)]">
            Open <ArrowRight size={14} strokeWidth={2.2} />
          </div>
        </div>
      </button>
    </section>
  );
}

interface ShelfProps {
  category: any;
  onPick: (id: string) => void;
}

function Shelf({ category, onPick }: ShelfProps) {
  const isPro = category.pro;
  return (
    <section className="mb-12">
      <header className="flex items-baseline gap-3.5 mb-[18px] shelf-header">
        <span className="w-1.5 h-1.5 rounded-full -mr-1 shrink-0" style={{
          background: tintFg(category.hue),
          boxShadow: `0 0 10px ${tintFg(category.hue)}`,
        }} />
        <span className="text-[11px] font-semibold tracking-[0.10em] uppercase shrink-0" style={{
          color: isPro ? tintFg(category.hue) : 'var(--fg-dim)',
        }}>
          {isPro && <Star size={10} strokeWidth={2} className="mr-1 inline align-[-1px]" />}
          {category.label}
        </span>
        <h2 className="m-0 text-[clamp(16px,2vw,20px)] font-semibold tracking-[-0.015em] text-[var(--fg)] [text-wrap:balance]">
          {category.tagline}
        </h2>
        <div className="flex-1" />
      </header>

      <div className={`grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[14px] ${isPro ? 'p-[18px] rounded-[14px]' : ''}`} style={isPro ? {
        background: `linear-gradient(180deg, ${tint(category.hue, 0.30, 0.06, 0.10)}, ${tint(category.hue, 0.22, 0.04, 0.04)})`,
        border: `1px solid ${tintBorder(category.hue)}`,
      } : {}}>
        {category.tools.map((t: any) => (
          <ToolCard key={t.id} tool={{ ...t, hue: category.hue }} onClick={() => onPick(t.id)} />
        ))}
      </div>
    </section>
  );
}

export default function DashboardClient() {
  const { openTool, setLauncher, setPalette } = useSaaS();

  return (
    <div className="fade-in">
      <WelcomeStrip onOpenLauncher={() => setLauncher(true)} onOpenPalette={() => setPalette(true)} />
      <FeaturedTool onPick={openTool} />

      <section className="max-w-[1280px] mx-auto px-8 pb-20 box-border">
        {CATEGORIES.map(cat => (
          <Shelf key={cat.id} category={cat} onPick={openTool} />
        ))}
      </section>
    </div>
  );
}
