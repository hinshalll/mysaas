"use client";

import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { eyebrow, sectionTitle, sectionSubtitle } from '../../components/PageStyles';
import { tint, tintBorder, tintFg } from '../../components/LucideIcons';

export default function ChangelogClient() {
  const { theme, launchApp } = useSaaS();
  const isLight = theme === 'light';

  const releases = [
    {
      version: 'v1.1.0',
      date: 'May 27, 2026',
      badge: 'Major Release',
      hue: 195, /* Cyan */
      title: 'JSON Formatter, Validator & Global Navigation Upgrades',
      items: [
        'Tool 2 Integration: Full end-to-end launch of the JSON Formatter, Validator, and Auto-Repair tool featuring split-pane comparison view, drag-and-drop file uploads, real-time KB/line metrics, and automatic repair routines.',
        'Global Navigation Polish: Upgraded all header, footer, and catalog links to true, crawlable relative root paths (/pricing, /docs, /changelog, /dashboard) to enable high-speed client-side soft routing and search engine indexing.',
        'Dashboard Workspace Refactoring: Renamed the internal workspace paths from /home to /dashboard, providing a premium SaaS application atmosphere.',
        'Enterprise Intake Flow: Integrated a gorgeous, custom glassmorphic request overlay modal for large teams asking about SSO/SAML, custom compute pipelines, or SOC2.',
      ],
    },
    {
      version: 'v1.0.0',
      date: 'May 26, 2026',
      badge: 'Launch',
      hue: 265, /* Purple */
      title: 'Universal AI-to-Doc Formatter Launch',
      items: [
        'Universal AI Formatter: Polish raw transcripts and AI-generated outputs instantly into 3 beautiful styles (Modern, Academic, Minimalist) across 5 high-fidelity formats (PDF, DOCX, HTML, TXT, MD).',
        'Digital Bouncer Architecture: Fully sandboxed thread-level locking mechanisms in the FastAPI backend protect system memory from heavy multi-user PDF compile crashes.',
        'Visual Style Tokens: Integrated standard oklch color palettes, sleek dark themes, and high-performance interactive controls.'
      ],
    },
  ];

  return (
    <div style={{
      maxWidth: 880, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ marginBottom: 48, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Software Releases</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Changelog & Updates</h1>
        <p style={sectionSubtitle}>Follow our daily product iterations as we roll out premium utilities for your data and file workflows.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, position: 'relative', zIndex: 1 }}>
        {/* Vertical Timeline bar */}
        <div style={{
          position: 'absolute', left: 16, top: 24, bottom: 24, width: 1,
          background: 'var(--border)',
        }} />

        {releases.map((rel) => (
          <div key={rel.version} style={{ display: 'flex', gap: 24, position: 'relative' }}>
            {/* Timeline Dot */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-elev-1)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, zIndex: 2,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: `oklch(0.75 0.14 ${rel.hue})`,
                boxShadow: isLight ? 'none' : `0 0 10px oklch(0.75 0.14 ${rel.hue} / 0.8)`,
              }} />
            </div>

            {/* Content card */}
            <div className="glass-card" style={{
              flex: 1, padding: '24px 28px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)' }} className="mono">{rel.version}</span>
                <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>({rel.date})</span>
                <span style={{
                  padding: '3px 8px', borderRadius: 20,
                  fontSize: 10.5, fontWeight: 600,
                  background: tint(rel.hue, 0.18, 0.08, 0.15),
                  border: `1px solid ${tintBorder(rel.hue)}`,
                  color: tintFg(rel.hue),
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }} className="mono">{rel.badge}</span>
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', margin: '0 0 16px' }}>{rel.title}</h2>

              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--fg-muted)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.55 }}>
                {rel.items.map((item, idx) => (
                  <li key={idx} style={{ listStyleType: 'square' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48, position: 'relative', zIndex: 1 }}>
        <button onClick={launchApp} className="reset" style={{
          padding: '12px 24px', borderRadius: 9,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
          color: 'var(--fg)', fontWeight: 500, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 12px oklch(0 0 0 / 0.15)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
        >Explore the Dashboard</button>
      </div>
    </div>
  );
}
