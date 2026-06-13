"use client";

import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { eyebrow, sectionTitle, sectionSubtitle } from '../../components/PageStyles';

export default function RoadmapClient() {
  const { theme, launchApp } = useSaaS();
  const isLight = theme === 'light';

  const milestones = [
    {
      quarter: 'Q2 2026',
      hue: 265,
      items: [
        { title: 'Screenshot → Excel (OCR)', status: 'in-progress' },
        { title: 'PDF Bank Statement Parser', status: 'in-progress' },
        { title: 'Subtitle Re-syncer', status: 'planned' },
        { title: 'HEIC / WebP Batch Converter', status: 'planned' },
      ],
    },
    {
      quarter: 'Q3 2026',
      hue: 195,
      items: [
        { title: 'Auto-Redactor (PII Scrubber)', status: 'planned' },
        { title: 'Visual PDF Diff Checker', status: 'planned' },
        { title: 'QR Code Generator & Reader', status: 'planned' },
        { title: 'Team Workspaces & Sharing', status: 'planned' },
      ],
    },
    {
      quarter: 'Q4 2026',
      hue: 75,
      items: [
        { title: 'API Access & Webhooks', status: 'planned' },
        { title: 'Custom Branded Exports', status: 'planned' },
        { title: 'Batch Processing (500 files)', status: 'planned' },
        { title: 'SOC2 Compliance & SSO', status: 'planned' },
      ],
    },
  ];

  const statusColors: Record<string, { bg: string; fg: string; label: string }> = {
    'in-progress': {
      bg: isLight ? 'oklch(0.92 0.04 195)' : 'oklch(0.22 0.06 195 / 0.3)',
      fg: isLight ? 'oklch(0.48 0.12 195)' : 'oklch(0.78 0.14 195)',
      label: 'In Progress',
    },
    'planned': {
      bg: isLight ? 'oklch(0.94 0.03 265)' : 'oklch(0.22 0.04 265 / 0.2)',
      fg: isLight ? 'oklch(0.52 0.10 265)' : 'oklch(0.65 0.10 265)',
      label: 'Planned',
    },
  };

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

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Product Vision</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Roadmap</h1>
        <p style={sectionSubtitle}>What we're building next. Priorities shift based on user demand—tell us what matters most.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', zIndex: 1 }}>
        {milestones.map((ms) => (
          <div key={ms.quarter} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: `oklch(0.75 0.14 ${ms.hue})`,
                boxShadow: isLight ? 'none' : `0 0 10px oklch(0.75 0.14 ${ms.hue} / 0.8)`,
              }} />
              <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)' }} className="mono">{ms.quarter}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ms.items.map((item) => {
                const st = statusColors[item.status];
                return (
                  <div key={item.title} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--bg-elev-1)',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 14, color: 'var(--fg-muted)', fontWeight: 500 }}>{item.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 12,
                      background: st.bg, color: st.fg,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }} className="mono">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <button onClick={launchApp} className="reset" style={{
          padding: '11px 24px', borderRadius: 9,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
          color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
        >Return to App Console</button>
      </div>
    </div>
  );
}
