"use client";

import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { ALL_TOOLS, CATEGORIES } from '../config';
import { Search, ArrowRight, Star } from 'lucide-react';
import { Icon, tint, tintFg, tintBorder } from '../../components/LucideIcons';
import ToolCard from '../../components/ToolCard';

const quickBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: 'oklch(0.20 0.008 250 / 0.6)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 8,
  cursor: 'pointer',
};

interface WelcomeStripProps {
  onOpenLauncher: () => void;
  onOpenPalette: () => void;
}

function WelcomeStrip({ onOpenLauncher, onOpenPalette }: WelcomeStripProps) {
  const [now] = useState(() => new Date());
  const hour = now.getHours();
  const greeting = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <section style={{
      padding: '40px 32px 28px',
      maxWidth: 1280,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--fg-dim)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>{greeting}, Riley</div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(28px, 4vw, 40px)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            fontWeight: 600,
            color: 'var(--fg)',
          }}>
            What needs <span style={{
              fontFamily: '"Source Serif Pro", Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 400,
              background: 'linear-gradient(110deg, oklch(0.92 0.04 265), oklch(0.78 0.16 285))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>cleaning up</span> today?
          </h1>
          <p style={{
            margin: '10px 0 0',
            fontSize: 14,
            color: 'var(--fg-muted)',
            maxWidth: 540,
          }}>
            Every utility is loaded and ready. Hit <kbd className="kbd-inline">⌘K</kbd> to jump to any of them, or pick one from the shelves below.
          </p>
        </div>

        {/* Inline quick actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onOpenPalette} className="reset" style={quickBtn as React.CSSProperties}>
            <Search size={13} />
            <span>Quick find</span>
            <kbd className="kbd" style={{ marginLeft: 4 }}>⌘K</kbd>
          </button>
        </div>
      </div>

      {/* Mini stats row */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginTop: 28,
        padding: '14px 0',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
      }} className="dash-stats">
        {[
          { kpi: '14', label: 'days left in trial', tint: 75 },
          { kpi: '128', label: 'runs this month', tint: 265 },
          { kpi: '47ms', label: 'median launch', tint: 145, mono: true },
          { kpi: '0 B', label: 'data uploaded', tint: 195, mono: true },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '4px 24px',
            borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
            flex: '1 1 140px',
          }}>
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--fg)',
              fontFamily: s.mono ? '"JetBrains Mono", monospace' : 'inherit',
            }}>{s.kpi}</div>
            <div style={{
              fontSize: 11.5,
              color: 'var(--fg-muted)',
              marginTop: 2,
            }}>{s.label}</div>
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
    <section style={{
      maxWidth: 1280,
      margin: '0 auto',
      padding: '12px 32px 32px',
    }}>
      <button onClick={() => onPick(featured.id)} className="reset" style={{
        cursor: 'pointer',
        width: '100%',
        display: 'block',
        textAlign: 'left',
        padding: 'clamp(24px, 3vw, 36px)',
        background: 'linear-gradient(120deg, oklch(0.22 0.05 265 / 0.55) 0%, oklch(0.18 0.03 290 / 0.40) 100%)',
        border: '1px solid oklch(0.40 0.08 265 / 0.45)',
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, border-color 0.2s',
        boxShadow: '0 16px 48px oklch(0.25 0.15 265 / 0.18), inset 0 1px 0 oklch(1 0 0 / 0.04)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(450px 220px at 90% 50%, oklch(0.60 0.18 285 / 0.20), transparent 70%)',
        }}/>
        <div style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 24,
          alignItems: 'center',
        }} className="featured-grid">
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px 4px 6px',
              borderRadius: 999,
              background: 'oklch(0.30 0.08 265 / 0.4)',
              border: '1px solid oklch(0.45 0.10 265 / 0.4)',
              fontSize: 11,
              fontWeight: 500,
              color: 'oklch(0.88 0.10 265)',
              marginBottom: 14,
            }}>
              <span className="hot-dot"/>
              <span>Featured tool · most opened this week</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 10,
            }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: tint(featured.hue, 0.35, 0.08, 0.45),
                border: `1px solid ${tintBorder(featured.hue)}`,
                color: tintFg(featured.hue),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ico size={19} strokeWidth={1.8}/>
              </div>
              <h2 style={{
                margin: 0,
                fontSize: 'clamp(20px, 2.4vw, 28px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--fg)',
              }}>{featured.name}</h2>
            </div>
            <p style={{
              margin: 0,
              fontSize: 15,
              color: 'var(--fg-muted)',
              lineHeight: 1.5,
              maxWidth: 560,
            }}>
              Paste raw output from ChatGPT, Claude, or Gemini and get a beautifully themed PDF, Word doc, or HTML — runs entirely on-device.
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            background: 'linear-gradient(180deg, oklch(0.97 0.005 250), oklch(0.86 0.005 250))',
            color: 'oklch(0.14 0.008 250)',
            fontWeight: 500,
            fontSize: 14,
            borderRadius: 10,
            boxShadow: '0 1px 0 oklch(1 0 0 / 0.5) inset, 0 1px 3px oklch(0 0 0 / 0.5)',
          }}>
            Open <ArrowRight size={14} strokeWidth={2.2}/>
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
    <section style={{ marginBottom: 48 }}>
      <header style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        marginBottom: 18,
      }} className="shelf-header">
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: tintFg(category.hue),
          boxShadow: `0 0 10px ${tintFg(category.hue)}`,
          marginRight: -4,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: isPro ? tintFg(category.hue) : 'var(--fg-dim)',
          flexShrink: 0,
        }}>
          {isPro && <Star size={10} strokeWidth={2} style={{ marginRight: 4, display: 'inline', verticalAlign: '-1px' }} />}
          {category.label}
        </span>
        <h2 style={{
          margin: 0,
          fontSize: 'clamp(16px, 2vw, 20px)',
          fontWeight: 600,
          letterSpacing: '-0.015em',
          color: 'var(--fg)',
          textWrap: 'balance',
        }}>{category.tagline}</h2>
        <div style={{ flex: 1 }} />
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 14,
        ...(isPro ? {
          padding: 18,
          background: `linear-gradient(180deg, ${tint(category.hue, 0.30, 0.06, 0.10)}, ${tint(category.hue, 0.22, 0.04, 0.04)})`,
          border: `1px solid ${tintBorder(category.hue)}`,
          borderRadius: 14,
        } : {}),
      }}>
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

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 80px', boxSizing: 'border-box' }}>
        {CATEGORIES.map(cat => (
          <Shelf key={cat.id} category={cat} onPick={openTool} />
        ))}
      </section>
    </div>
  );
}
