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
    <div className="max-w-[880px] mx-auto mt-10 mb-[120px] px-8 box-border relative fade-in">
      {/* Subpage ambient top-center glow */}
      <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 ${isLight ? 'opacity-[0.08]' : 'opacity-[0.15]'}`} style={{
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
      }}/>

      <div className="text-center mb-12 relative z-[1]">
        <span className={eyebrow}>Software Releases</span>
        <h1 className={`${sectionTitle} mt-3 text-[var(--fg)]`}>Changelog & Updates</h1>
        <p className={sectionSubtitle}>Follow our daily product iterations as we roll out premium utilities for your data and file workflows.</p>
      </div>

      <div className="flex flex-col gap-10 relative z-[1]">
        {/* Vertical Timeline bar */}
        <div className="absolute left-4 top-6 bottom-6 w-[1px] bg-[var(--border)]" />

        {releases.map((rel) => (
          <div key={rel.version} className="flex gap-6 relative">
            {/* Timeline Dot */}
            <div className="w-8 h-8 rounded-full bg-[var(--bg-elev-1)] border border-[var(--border)] flex items-center justify-center shrink-0 z-[2]">
              <span className={`w-2 h-2 rounded-full ${isLight ? 'shadow-none' : ''}`} style={{
                background: `oklch(0.75 0.14 ${rel.hue})`,
                boxShadow: isLight ? 'none' : `0 0 10px oklch(0.75 0.14 ${rel.hue} / 0.8)`,
              }} />
            </div>

            {/* Content card */}
            <div className="glass-card flex-1 py-6 px-7">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-[18px] font-semibold text-[var(--fg)] mono">{rel.version}</span>
                <span className="text-[13px] text-[var(--fg-subtle)]">({rel.date})</span>
                <span className="px-2 py-[3px] rounded-full text-[10.5px] font-semibold uppercase tracking-[0.04em] mono" style={{
                  background: tint(rel.hue, 0.18, 0.08, 0.15),
                  border: `1px solid ${tintBorder(rel.hue)}`,
                  color: tintFg(rel.hue),
                }}>{rel.badge}</span>
              </div>

              <h2 className="text-[16px] font-semibold text-[var(--fg)] m-0 mb-4">{rel.title}</h2>

              <ul className="m-0 pl-[18px] text-[var(--fg-muted)] text-[14px] flex flex-col gap-2.5 leading-[1.55] list-[square]">
                {rel.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-12 relative z-[1]">
        <button onClick={launchApp} className="px-6 py-3 rounded-[9px] bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--fg)] font-medium text-[14px] cursor-pointer shadow-[0_4px_12px_oklch(0_0_0/0.15)] transition-colors duration-150 hover:bg-[var(--bg-hover)]">Explore the Dashboard</button>
      </div>
    </div>
  );
}
