"use client";

import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { eyebrow, sectionTitle, sectionSubtitle } from '../../components/PageStyles';

export default function AboutClient() {
  const { brandName, launchApp } = useSaaS();
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
        <span style={eyebrow}>Monetization & Philosophy</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>The Global Utility SaaS</h1>
      </div>

      <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '40px clamp(24px, 5vw, 48px)' }}>
        <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--fg-muted)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 16 }}>
            Welcome to <strong style={{ color: 'var(--fg)' }} suppressHydrationWarning>{brandName}</strong>—a collection of lightweight, blazing-fast, serverless-grade utility tools built directly for developers, creators, and professionals.
          </p>
          
          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Our Mission: Extreme Speed, Total Privacy</h2>
          <p>
            Most modern websites have become bloated, filled with megabytes of tracking pixels, advertising banners, and slow server-side loops. We believe that simple, daily file operations—like scrubbing metadata, formatting JSON, synching subtitles, or converting HEIC images—should run in milliseconds right inside your browser without leaking any private details.
          </p>

          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Pricing Plans & Access Levels</h2>
          <p>
            Our billing is designed to be simple, predictable, and highly transparent:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Free Plan</strong>: Standard daily usage on all essential browser utility tools. 100% free, no credit card required. Includes 10 daily API key test runs.
            </li>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Pro Plan</strong>: Advanced rendering features, custom watermark removal, unlimited daily interactive browser execution, and 200 daily production API requests for $9/month.
            </li>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Developer Plan</strong>: Premium high-volume programmatic API access with dedicated console endpoints, custom webhooks, and 2,000 daily production key requests for $29/month.
            </li>
          </ul>

          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>High-Performance Serverless Architecture</h2>
          <p>
            Our backend services are built for secure, low-latency, and highly concurrent execution. We employ safe sandboxing, automated resource allocation, and advanced memory queues to ensure complex operations—such as multi-page PDF generation or large dataset parsing—are processed reliably with high uptime and optimal speed.
          </p>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <button onClick={launchApp} className="reset" style={{
              padding: '12px 28px',
              borderRadius: 9,
              background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
            }}>Launch Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}
