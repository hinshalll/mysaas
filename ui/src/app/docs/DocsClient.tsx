"use client";

import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { eyebrow, sectionTitle } from '../../components/PageStyles';

export default function DocsClient() {
  const { launchApp } = useSaaS();
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <div className="max-w-[880px] mx-auto mt-10 mb-[120px] px-8 box-border relative fade-in">
      {/* Subpage ambient top-center glow */}
      <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 ${isLight ? 'opacity-[0.08]' : 'opacity-[0.15]'}`} style={{
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
      }}/>

      <div className="text-center mb-10 relative z-[1]">
        <span className={eyebrow}>Technical Docs</span>
        <h1 className={`${sectionTitle} mt-3 mb-0 text-[var(--fg)]`}>Developer Documentation</h1>
      </div>

      <div className="glass-card relative z-[1] py-10 px-[clamp(24px,5vw,48px)]">
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-[18px] text-[var(--fg)] font-semibold mb-2">1. Single-Message AI Formatter API</h2>
            <p className="text-[14.5px] text-[var(--fg-muted)] leading-[1.6] mb-3">
              You can programmatically format raw AI text by posting to the unified Python/FastAPI endpoint:
            </p>
            <pre className={`bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-lg py-3.5 px-4.5 overflow-x-auto text-[12.5px] leading-relaxed mono ${isLight ? 'text-[oklch(0.55_0.15_265)]' : 'text-[oklch(0.80_0.10_195)]'}`}>
  {`POST /api/format
Headers: { "Content-Type": "application/json" }
Body:
{
  "content": "raw_markdown_text",
  "is_html": true,
  "theme": "modern",       // 'modern' | 'academic' | 'minimalist'
  "export_format": "pdf"  // 'pdf' | 'docx' | 'html' | 'txt' | 'md'
}`}
            </pre>
          </div>

          <div>
            <h2 className="text-[18px] text-[var(--fg)] font-semibold mb-2">2. Rate Limits & Fair-Use</h2>
            <p className="text-[14.5px] text-[var(--fg-muted)] leading-[1.6]">
              Our Free Tier operates on on-device scripts running locally in the browser, meaning zero rate limits. Server-side API formatting endpoints operate a Fair-Use protector to ensure service availability for all users.
            </p>
          </div>

          <div>
            <h2 className="text-[18px] text-[var(--fg)] font-semibold mb-2">3. Security & Compliance</h2>
            <p className="text-[14.5px] text-[var(--fg-muted)] leading-[1.6]">
              Any files uploaded or text processed through the tools catalog is analyzed and streamed directly. We do not store, scan, or log document contents inside database instances, protecting data integrity.
            </p>
          </div>

          <div className="mt-3 flex justify-center">
            <button onClick={launchApp} className="px-6 py-3 rounded-[9px] bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--fg)] font-medium text-[13.5px] cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-hover)]">Go to App</button>
          </div>
        </div>
      </div>
    </div>
  );
}
