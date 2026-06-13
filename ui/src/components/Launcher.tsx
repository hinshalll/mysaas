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
      className="reset"
      style={{
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: large ? 16 : 12,
        padding: large ? '22px 22px 20px' : '16px 16px 14px',
        background: hover ? 'var(--bg-hover)' : 'var(--bg-elev-1)',
        border: '1px solid',
        borderColor: hover ? tintBorder(tool.hue) : 'var(--border)',
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.18s, border-color 0.18s, transform 0.18s',
        transform: hover ? 'translateY(-1px)' : 'none',
        boxShadow: hover ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
      }}>
      {/* Soft category glow on hover */}
      <span style={{
        position: 'absolute',
        inset: -1,
        pointerEvents: 'none',
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Ico size={large ? 18 : 16} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              fontSize: large ? 16 : 14,
              fontWeight: 600,
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{tool.name}</span>
            {tool.hot && <span className="hot-dot" />}
            {tool.pro && <span className="pro-badge">PRO</span>}
          </div>
          <div style={{
            fontSize: 12.5,
            color: 'var(--fg-subtle)',
            marginTop: 2,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>{tool.tagline}</div>
        </div>
        <ArrowUpRight size={14} style={{
          color: hover ? tintFg(tool.hue) : 'var(--fg-dim)',
          transition: 'color 0.18s, transform 0.18s',
          transform: hover ? 'translate(2px, -2px)' : 'none',
          flexShrink: 0,
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
    <div className="fade-in" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 90,
      background: 'var(--bg-overlay)',
      backdropFilter: 'blur(20px)',
      overflowY: 'auto',
    }}>
      {/* Top close bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        background: 'linear-gradient(180deg, var(--bg-overlay-sticky), transparent)',
      }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--fg-dim)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            Launcher
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em', marginTop: 2 }}>
            All tools
          </div>
        </div>
        <button onClick={onClose} className="reset" style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border)',
          color: 'var(--fg-muted)',
          cursor: 'pointer',
        }}>
          <X size={16} />
        </button>
      </div>

      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '8px 32px 80px',
      }}>
        {CATEGORIES.map(cat => (
          <section key={cat.id} className="fade-in-up" style={{ marginBottom: 56 }}>
            <header style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              marginBottom: 18,
              paddingBottom: 12,
              borderBottom: `1px solid ${cat.pro ? tintBorder(cat.hue) : 'var(--border)'}`,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: tintFg(cat.hue),
                boxShadow: `0 0 12px ${tintFg(cat.hue)}`,
              }} />
              <h2 style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 600,
                color: cat.pro ? tintFg(cat.hue) : 'var(--fg)',
                letterSpacing: '-0.01em',
              }}>{cat.label}</h2>
              <span style={{ fontSize: 12.5, color: 'var(--fg-subtle)', flex: 1 }}>
                {cat.tagline}
              </span>
            </header>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
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
