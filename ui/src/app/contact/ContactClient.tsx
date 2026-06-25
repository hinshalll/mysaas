"use client";

import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Icon } from '../../components/LucideIcons';
import { eyebrow, sectionTitle, sectionSubtitle } from '../../components/PageStyles';

export default function ContactClient() {
  const { theme } = useSaaS();
  const [sent, setSent] = useState(false);
  const isLight = theme === 'light';

  return (
    <div className="max-w-[720px] mx-auto mt-10 mb-[120px] px-8 box-border relative fade-in">
      {/* Subpage ambient top-center glow */}
      <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 bg-[radial-gradient(500px_200px_at_50%_0%,var(--accent)_0%,transparent_70%)] ${isLight ? 'opacity-[0.08]' : 'opacity-[0.15]'}`} />

      <div className="text-center mb-10 relative z-[1]">
        <span className={eyebrow}>Get In Touch</span>
        <h1 className={`${sectionTitle} mt-3 text-[var(--fg)]`}>Contact Us</h1>
        <p className={sectionSubtitle}>Have a question, feature request, or partnership opportunity? We'd love to hear from you.</p>
      </div>

      {!sent ? (
        <div className="glass-card relative z-[1] py-9 px-[clamp(20px,5vw,40px)]">
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-[12px] font-semibold text-[var(--fg-muted)] block mb-1.5 uppercase tracking-[0.06em]">Email</label>
              <input type="email" placeholder="you@example.com" className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)] text-[var(--fg)] text-[14px] outline-none box-border transition-colors duration-150 focus:border-[var(--accent)] focus:bg-[var(--bg-elev-2)]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[var(--fg-muted)] block mb-1.5 uppercase tracking-[0.06em]">Subject</label>
              <input type="text" placeholder="Feature request, bug report, partnership…" className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)] text-[var(--fg)] text-[14px] outline-none box-border transition-colors duration-150 focus:border-[var(--accent)] focus:bg-[var(--bg-elev-2)]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[var(--fg-muted)] block mb-1.5 uppercase tracking-[0.06em]">Message</label>
              <textarea rows={5} placeholder="Tell us what's on your mind…" className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)] text-[var(--fg)] text-[14px] outline-none resize-y font-[inherit] box-border transition-colors duration-150 focus:border-[var(--accent)] focus:bg-[var(--bg-elev-2)]" />
            </div>
            <button onClick={() => setSent(true)} className="w-full p-3 rounded-lg bg-gradient-to-b from-[oklch(0.72_0.18_265)] to-[oklch(0.62_0.20_265)] text-white font-semibold text-[14px] cursor-pointer shadow-[0_4px_14px_oklch(0.50_0.20_265/0.3)] border-none hover:brightness-110 transition-all">Send Message</button>
          </div>
        </div>
      ) : (
        <div className="glass-card text-center py-12 px-8 relative z-[1]">
          <div className={`w-14 h-14 rounded-full bg-[oklch(0.22_0.010_145/0.2)] border border-[oklch(0.75_0.14_145/0.4)] text-[oklch(0.78_0.16_145)] inline-flex items-center justify-center mb-5 ${isLight ? 'shadow-none' : 'shadow-[0_0_20px_oklch(0.78_0.16_145/0.25)]'}`}>
            <Icon.Check size={28} strokeWidth={2.5} />
          </div>
          <h2 className="text-[22px] font-semibold text-[var(--fg)] m-0 mb-2.5">Message Sent!</h2>
          <p className="text-[14px] text-[var(--fg-muted)] m-0 leading-relaxed">
            Thank you for reaching out. We'll get back to you within 24 hours.
          </p>
        </div>
      )}
    </div>
  );
}
