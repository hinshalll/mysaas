"use client";

import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { eyebrow, sectionTitle, sectionSubtitle } from '../../components/PageStyles';

export default function DocsClient() {
  const { launchApp } = useSaaS();
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <div style={{
      maxWidth: 880,
      margin: '40px auto 120px',
      padding: '0 32px',
      boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute',
        top: -100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 800,
        height: 300,
        pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Technical Docs</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Developer Documentation</h1>
      </div>

      <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '40px clamp(24px, 5vw, 48px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <h2 style={{ fontSize: 18, color: 'var(--fg)', fontWeight: 600, marginBottom: 8 }}>1. Single-Message AI Formatter API</h2>
            <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              You can programmatically format raw AI text by posting to the unified Python/FastAPI endpoint:
            </p>
            <pre style={{
              background: 'var(--bg-elev-1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '14px 18px',
              overflowX: 'auto',
              fontSize: 12.5,
              color: isLight ? 'oklch(0.55 0.15 265)' : 'oklch(0.80 0.10 195)',
              lineHeight: 1.5,
            }} className="mono">
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
            <h2 style={{ fontSize: 18, color: 'var(--fg)', fontWeight: 600, marginBottom: 8 }}>2. Rate Limits & Fair-Use</h2>
            <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Our Free Tier operates on on-device scripts running locally in the browser, meaning zero rate limits. Server-side API formatting endpoints operate a Fair-Use protector to ensure service availability for all users.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 18, color: 'var(--fg)', fontWeight: 600, marginBottom: 8 }}>3. Security & Compliance</h2>
            <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Any files uploaded or text processed through the tools catalog is analyzed and streamed directly. We do not store, scan, or log document contents inside database instances, protecting data integrity.
            </p>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <button onClick={launchApp} className="reset" style={{
              padding: '12px 24px',
              borderRadius: 9,
              background: 'var(--bg-elev-2)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              fontWeight: 500,
              fontSize: 13.5,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            >Go to App</button>
          </div>
        </div>
      </div>
    </div>
  );
}
