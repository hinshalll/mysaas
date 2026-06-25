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
    <div className="max-w-[880px] mx-auto mt-10 mb-[120px] px-8 box-border relative fade-in">
      {/* Subpage ambient top-center glow */}
      <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 ${isLight ? 'opacity-[0.08]' : 'opacity-[0.15]'}`} style={{
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
      }}/>

      <div className="text-center mb-12 relative z-[1]">
        <span className={eyebrow}>Product Vision</span>
        <h1 className={`${sectionTitle} mt-3 mb-0 text-[var(--fg)]`}>Roadmap</h1>
        <p className={sectionSubtitle}>What we're building next. Priorities shift based on user demand—tell us what matters most.</p>
      </div>

      <div className="flex flex-col gap-8 relative z-[1]">
        {milestones.map((ms) => (
          <div key={ms.quarter} className="glass-card">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-2.5 h-2.5 rounded-full" style={{
                background: `oklch(0.75 0.14 ${ms.hue})`,
                boxShadow: isLight ? 'none' : `0 0 10px oklch(0.75 0.14 ${ms.hue} / 0.8)`,
              }} />
              <span className="text-[18px] font-semibold text-[var(--fg)] mono">{ms.quarter}</span>
            </div>
            <div className="flex flex-col gap-3">
              {ms.items.map((item) => {
                const st = statusColors[item.status];
                return (
                  <div key={item.title} className="flex items-center justify-between py-2.5 px-3.5 rounded-[10px] bg-[var(--bg-elev-1)] border border-[var(--border)]">
                    <span className="text-[14px] text-[var(--fg-muted)] font-medium">{item.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-[3px] rounded-xl uppercase tracking-[0.04em] mono" style={{
                      background: st.bg, color: st.fg,
                    }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <button onClick={launchApp} className="px-6 py-3 rounded-[9px] bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--fg)] font-medium text-[13.5px] cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-hover)]">Return to App Console</button>
      </div>
    </div>
  );
}
