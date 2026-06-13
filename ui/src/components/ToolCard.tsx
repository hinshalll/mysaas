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
      className="reset"
      style={{
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', flexDirection: 'column', gap: large ? 16 : 12,
        padding: large ? '22px 22px 20px' : '16px 16px 14px',
        background: hover ? 'var(--bg-hover)' : 'var(--bg-elev-1)',
        border: '1px solid',
        borderColor: hover ? tintBorder(tool.hue) : 'var(--border)',
        borderRadius: 12,
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.18s, border-color 0.18s, transform 0.18s',
        transform: hover ? 'translateY(-1px)' : 'none',
        boxShadow: hover ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
      }}>
      {/* Soft category glow on hover */}
      <span style={{
        position: 'absolute', inset: -1, pointerEvents: 'none',
        background: hover
          ? `radial-gradient(280px 140px at 20% 0%, ${tint(tool.hue, 0.45, 0.10, 0.18)}, transparent 70%)`
          : 'none',
        transition: 'opacity 0.2s',
        opacity: hover ? 1 : 0,
        borderRadius: 12,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <div style={{
          width: large ? 40 : 34, height: large ? 40 : 34, borderRadius: 9,
          background: tint(tool.hue),
          border: `1px solid ${tintBorder(tool.hue)}`,
          color: tintFg(tool.hue),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Ico size={large ? 18 : 16} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              fontSize: large ? 16 : 14, fontWeight: 600, color: 'var(--fg)',
              letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{tool.name}</span>
            {tool.hot && <span className="hot-dot" />}
            {tool.pro && <span className="pro-badge">PRO</span>}
          </div>
          <div style={{
            fontSize: 12.5, color: 'var(--fg-subtle)',
            marginTop: 2, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{tool.tagline}</div>
        </div>
        <Icon.ArrowUpRight size={14} style={{
          color: hover ? tintFg(tool.hue) : 'var(--fg-dim)',
          transition: 'color 0.18s, transform 0.18s',
          transform: hover ? 'translate(2px, -2px)' : 'none',
          flexShrink: 0,
        }} />
      </div>
    </button>
  );
}
