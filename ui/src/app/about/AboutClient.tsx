"use client";
import React from 'react';
import { useSaaS } from '../../context/SaaSContext';

export default function AboutClient() {
  const { brandName, launchApp } = useSaaS();
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <main className="max-w-[880px] mx-auto mt-10 mb-[120px] px-8 relative fade-in">
      {/* Subpage ambient top-center glow */}
      <div 
        className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 transition-opacity duration-200"
        style={{
          background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
          opacity: isLight ? 0.08 : 0.15,
        }}
      />

      <header className="text-center mb-10 relative z-10">
        <span className="inline-block text-[11px] font-semibold text-[oklch(0.78_0.12_265)] tracking-[0.18em] uppercase mb-[18px]">Monetization & Philosophy</span>
        <h1 className="m-0 text-[clamp(34px,5vw,52px)] leading-[1.05] tracking-[-0.03em] font-semibold text-pretty mt-3 mb-0 text-fg">The Global Utility SaaS</h1>
      </header>

      <section className="glass-card relative z-10 py-10 px-[clamp(24px,5vw,48px)]">
        <div className="text-[15px] leading-[1.75] text-fg-muted flex flex-col gap-5">
          <p className="text-base">
            Welcome to <strong className="text-fg" suppressHydrationWarning>{brandName}</strong>—a collection of lightweight, blazing-fast, serverless-grade utility tools built directly for developers, creators, and professionals.
          </p>
          
          <h2 className="text-xl text-fg font-semibold mt-6 mb-2 border-b border-border pb-2">Our Mission: Extreme Speed, Total Privacy</h2>
          <p>
            Most modern websites have become bloated, filled with megabytes of tracking pixels, advertising banners, and slow server-side loops. We believe that simple, daily file operations—like scrubbing metadata, formatting JSON, synching subtitles, or converting HEIC images—should run in milliseconds right inside your browser without leaking any private details.
          </p>

          <h2 className="text-xl text-fg font-semibold mt-6 mb-2 border-b border-border pb-2">Pricing Plans & Access Levels</h2>
          <p>
            Our billing is designed to be simple, predictable, and highly transparent:
          </p>
          <ul className="list-none p-0 flex flex-col gap-3">
            <li className="pl-4 border-l-3 border-accent">
              <strong className="text-fg">Free Plan</strong>: Standard daily usage on all essential browser utility tools. 100% free, no credit card required. Includes 10 daily API key test runs.
            </li>
            <li className="pl-4 border-l-3 border-accent">
              <strong className="text-fg">Pro Plan</strong>: Advanced rendering features, custom watermark removal, unlimited daily interactive browser execution, and 200 daily production API requests for $9/month.
            </li>
            <li className="pl-4 border-l-3 border-accent">
              <strong className="text-fg">Developer Plan</strong>: Premium high-volume programmatic API access with dedicated console endpoints, custom webhooks, and 2,000 daily production key requests for $29/month.
            </li>
          </ul>

          <h2 className="text-xl text-fg font-semibold mt-6 mb-2 border-b border-border pb-2">High-Performance Serverless Architecture</h2>
          <p>
            Our backend services are built for secure, low-latency, and highly concurrent execution. We employ safe sandboxing, automated resource allocation, and advanced memory queues to ensure complex operations—such as multi-page PDF generation or large dataset parsing—are processed reliably with high uptime and optimal speed.
          </p>
          
          <div className="mt-6 flex justify-center">
            <button 
              onClick={launchApp} 
              className="py-3 px-7 rounded-[9px] bg-gradient-to-b from-[oklch(0.72_0.18_265)] to-[oklch(0.62_0.20_265)] text-white font-semibold text-sm cursor-pointer shadow-[0_4px_14px_rgba(108,68,265,0.3)] transition-transform active:scale-95"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
