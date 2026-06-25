"use client";

import React, { useState } from 'react';
import { Icon, tint, tintBorder, tintFg } from './LucideIcons';

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    tagline: string;
    icon: string;
    hue: number;
    hot?: boolean;
    pro?: boolean;
  };
  onClick: () => void;
  compact?: boolean;
  large?: boolean;
}

export default function ToolCard({ tool, onClick, compact, large }: ToolCardProps) {
  const Ico = Icon[tool.icon] || Icon.Wand;
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
        <Icon.ArrowUpRight size={14} className={`shrink-0 transition-all duration-[180ms] ${hover ? 'translate-x-[2px] -translate-y-[2px]' : 'translate-x-0 translate-y-0'}`} style={{
          color: hover ? tintFg(tool.hue) : 'var(--fg-dim)',
        }} />
      </div>
    </button>
  );
}
