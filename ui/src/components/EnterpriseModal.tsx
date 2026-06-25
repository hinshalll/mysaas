"use client";

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';

interface EnterpriseModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EnterpriseModal({ open, onClose }: EnterpriseModalProps) {
  const [email, setEmail] = useState('');
  const [size, setSize] = useState('10-50');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 box-border fade-in">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-[oklch(0.08_0.005_250/0.75)] backdrop-blur-[16px]" />

      {/* Modal Card */}
      <div className="relative w-full max-w-[460px] bg-[oklch(0.16_0.006_250/0.85)] border border-[var(--border)] rounded-2xl px-8 py-9 shadow-[0_32px_64px_oklch(0_0_0/0.5),inset_0_1px_0_oklch(1_0_0/0.03)] box-border fade-in-up">
        {/* Close Button */}
        <button onClick={onClose} className="reset absolute top-5 right-5 w-8 h-8 rounded-lg border border-[var(--border)] bg-[oklch(0.20_0.008_250/0.5)] text-[var(--fg-muted)] flex items-center justify-center cursor-pointer hover:text-[var(--fg)] hover:bg-[oklch(0.25_0.01_250/0.8)] transition-all">
          <X size={15} />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[oklch(0.22_0.010_195/0.15)] border border-[oklch(0.75_0.14_195/0.2)] text-[11px] font-semibold text-[oklch(0.82_0.13_195)] uppercase tracking-[0.05em] mb-4 mono">
              Enterprise Solutions
            </div>
            
            <h2 className="text-[24px] font-semibold m-0 mb-2 text-white tracking-[-0.020em]">Request Credentials</h2>
            <p className="text-[13.5px] text-[var(--fg-muted)] m-0 mb-6 leading-relaxed">
              Talk to us about custom high-compute capacity, dedicated parser nodes, SOC2 compliance, and SAML/SSO.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11.5px] font-semibold text-[var(--fg-dim)] mb-1.5 uppercase tracking-[0.04em] mono">Work Email</label>
                <input required type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3.5 py-3 rounded-lg bg-[oklch(0.12_0.004_250)] border border-[var(--border)] text-white text-[14px] outline-none box-border focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[var(--fg-dim)] mb-1.5 uppercase tracking-[0.04em] mono">Company Size</label>
                <select value={size} onChange={e => setSize(e.target.value)} className="w-full px-3.5 py-3 rounded-lg bg-[oklch(0.12_0.004_250)] border border-[var(--border)] text-white text-[14px] outline-none box-border focus:border-[var(--accent)] transition-colors appearance-none">
                  <option value="10-50">10 to 50 employees</option>
                  <option value="50-200">50 to 200 employees</option>
                  <option value="200+">More than 200 employees</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-[var(--fg-dim)] mb-1.5 uppercase tracking-[0.04em] mono">Custom Requirements</label>
                <textarea rows={3} placeholder="Tell us about your estimated daily API volume or PII scrubber compliance needs..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3.5 py-3 rounded-lg bg-[oklch(0.12_0.004_250)] border border-[var(--border)] text-white text-[14px] outline-none resize-y box-border focus:border-[var(--accent)] transition-colors" />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="reset w-full mt-6 p-[14px] rounded-[9px] bg-gradient-to-b from-[oklch(0.96_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.16_0.008_250)] font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_oklch(0.82_0.13_250/0.15)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all border-none">
              {submitting ? 'Transmitting Request...' : 'Send Request'} <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </form>
        ) : (
          <div className="text-center py-5 fade-in">
            <div className="w-14 h-14 rounded-full bg-[oklch(0.22_0.010_145/0.2)] border border-[oklch(0.75_0.14_145/0.4)] text-[oklch(0.78_0.16_145)] inline-flex items-center justify-center mb-5 shadow-[0_0_20px_oklch(0.78_0.16_145/0.25)]">
              <Check size={28} strokeWidth={2.5} />
            </div>

            <h2 className="text-[22px] font-semibold text-white m-0 mb-2.5 tracking-[-0.020em]">Request Transmitted!</h2>
            <p className="text-[14px] text-[var(--fg-muted)] m-0 mb-6 leading-relaxed">
              Thank you! An Enterprise Solutions architect will reach out to you at <span className="mono text-white">{email}</span> within 2 business hours.
            </p>

            <button onClick={onClose} className="reset px-5 py-2.5 rounded-lg bg-[oklch(0.20_0.008_250)] border border-[var(--border)] text-white text-[13.5px] font-medium cursor-pointer hover:bg-[oklch(0.25_0.01_250)] transition-colors">Close Window</button>
          </div>
        )}
      </div>
    </div>
  );
}
