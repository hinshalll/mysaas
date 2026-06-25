"use client";

import React, { useState, useCallback } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { CATEGORIES } from '../app/config';
import { Icon, useKeydown, useBodyLock, tint, tintFg, tintBorder } from './LucideIcons';

interface LauncherProps {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}

interface ToolCardProps {
  tool: any;
  onClick: () => void;
  compact?: boolean;
  large?: boolean;
}

export function ToolCard({ tool, onClick, compact, large }: ToolCardProps) {
  const Ico = Icon[tool.icon] || ArrowUpRight;
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`reset relative overflow-hidden flex flex-col text-left cursor-pointer rounded-xl border border-solid transition-all duration-[180ms] ${large ? 'gap-4 pt-[22px] px-[22px] pb-[20px]' : 'gap-3 pt-4 px-4 pb-[14px]'} ${hover ? 'bg-[var(--bg-hover)] -translate-y-[1px] shadow-[var(--shadow-card-hover)]' : 'bg-[var(--bg-elev-1)] shadow-[var(--shadow-card)] translate-y-0'}`}
      style={{
        borderColor: hover ? tintBorder(tool.hue) : 'var(--border)',
      }}>
      {/* Soft category glow on hover */}
      <span className={`absolute inset-[-1px] pointer-events-none rounded-xl transition-opacity duration-200 ${hover ? 'opacity-100' : 'opacity-0'}`} style={{
        background: hover
          ? `radial-gradient(280px 140px at 20% 0%, ${tint(tool.hue, 0.45, 0.10, 0.18)}, transparent 70%)`
          : 'none',
      }} />

      <div className="flex items-center gap-3 relative">
        <div className={`flex items-center justify-center shrink-0 rounded-[9px] ${large ? 'w-10 h-10' : 'w-[34px] h-[34px]'}`} style={{
          background: tint(tool.hue),
          border: `1px solid ${tintBorder(tool.hue)}`,
          color: tintFg(tool.hue),
        }}>
          <Ico size={large ? 18 : 16} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[7px]">
            <span className={`font-semibold text-[var(--fg)] tracking-[-0.01em] overflow-hidden text-ellipsis whitespace-nowrap ${large ? 'text-[16px]' : 'text-[14px]'}`}>{tool.name}</span>
            {tool.hot && <span className="hot-dot" />}
            {tool.pro && <span className="pro-badge">PRO</span>}
          </div>
          <div className="text-[12.5px] text-[var(--fg-subtle)] mt-0.5 leading-[1.4] overflow-hidden text-ellipsis line-clamp-2">
            {tool.tagline}
          </div>
        </div>
        <ArrowUpRight size={14} className={`shrink-0 transition-all duration-[180ms] ${hover ? 'translate-x-[2px] -translate-y-[2px]' : 'translate-x-0 translate-y-0'}`} style={{
          color: hover ? tintFg(tool.hue) : 'var(--fg-dim)',
        }} />
      </div>
    </button>
  );
}

export default function Launcher({ open, onClose, onPick }: LauncherProps) {
  useBodyLock(open);
  useKeydown(useCallback((e: KeyboardEvent) => {
    if (open && e.key === 'Escape') onClose();
  }, [open, onClose]));

  if (!open) return null;

  return (
    <div className="fade-in fixed inset-0 z-[90] bg-[var(--bg-overlay)] backdrop-blur-[20px] overflow-y-auto">
      {/* Top close bar */}
      <div className="sticky top-0 z-[1] flex items-center justify-between px-8 py-5 bg-gradient-to-b from-[var(--bg-overlay-sticky)] to-transparent">
        <div>
          <div className="text-[11.5px] font-medium text-[var(--fg-dim)] tracking-[0.10em] uppercase">
            Launcher
          </div>
          <div className="text-[22px] font-semibold text-[var(--fg)] tracking-[-0.02em] mt-0.5">
            All tools
          </div>
        </div>
        <button onClick={onClose} className="reset w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--bg-elev-1)] border border-[var(--border)] text-[var(--fg-muted)] cursor-pointer hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="max-w-[1280px] mx-auto px-8 pt-2 pb-20">
        {CATEGORIES.map(cat => (
          <section key={cat.id} className="fade-in-up mb-14">
            <header className="flex items-baseline gap-3.5 mb-4.5 pb-3 border-b" style={{
              borderBottomColor: cat.pro ? tintBorder(cat.hue) : 'var(--border)',
            }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{
                background: tintFg(cat.hue),
                boxShadow: `0 0 12px ${tintFg(cat.hue)}`,
              }} />
              <h2 className="m-0 text-[17px] font-semibold tracking-[-0.01em]" style={{
                color: cat.pro ? tintFg(cat.hue) : 'var(--fg)',
              }}>{cat.label}</h2>
              <span className="text-[12.5px] text-[var(--fg-subtle)] flex-1">
                {cat.tagline}
              </span>
            </header>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              {cat.tools.map(t => (
                <ToolCard key={t.id} tool={{ ...t, hue: cat.hue }} onClick={() => onPick(t.id)} compact />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
