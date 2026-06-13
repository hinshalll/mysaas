"use client";

import React, { useState } from 'react';
import { Icon } from './LucideIcons';

interface ComingSoonStubProps {
  tool: {
    id: string;
    name: string;
    tagline: string;
    hue?: number;
  };
}

export default function ComingSoonStub({ tool }: ComingSoonStubProps) {
  const activeHue = tool.hue ?? 265;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  }

  return (
    <div style={{
      maxWidth: 680, margin: '60px auto 120px',
      textAlign: 'center',
    }} className="glass-card fade-in-up">
      <div style={{
        width: 64, height: 64, borderRadius: 14,
        background: `oklch(0.22 0.010 ${activeHue} / 0.8)`,
        border: `1px solid oklch(0.45 0.10 ${activeHue} / 0.4)`,
        color: `oklch(0.82 0.13 ${activeHue})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: `0 0 32px oklch(0.78 0.16 ${activeHue} / 0.2)`,
      }}>
        <Icon.Sparkles size={28} strokeWidth={2} />
      </div>

      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 20,
          background: 'oklch(0.20 0.010 75 / 0.15)',
          border: '1px solid oklch(0.75 0.14 75 / 0.2)',
          fontSize: 11, fontWeight: 600, color: 'oklch(0.78 0.16 75)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          marginBottom: 16,
        }} className="mono">
          Active Development
        </div>
      </div>

      <h1 style={{
        margin: 0, fontSize: 32, fontWeight: 600,
        letterSpacing: '-0.02em', lineHeight: 1.1,
        color: 'var(--fg)',
      }}>{tool.name}</h1>
      
      <p style={{
        margin: '12px auto 0', fontSize: 15,
        color: 'var(--fg-muted)', maxWidth: 480, lineHeight: 1.5,
      }}>
        {tool.tagline}. We are currently building the high-compute backend parser engine for this tool.
      </p>

      <div style={{
        margin: '36px auto', maxWidth: 400,
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: '16px 20px',
        textAlign: 'left',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">
          Development Stage
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)' }}>
            <span style={{ color: 'oklch(0.78 0.16 145)' }}>✓</span>
            <span>Frontend Component Structure</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)' }}>
            <span style={{ color: 'oklch(0.78 0.16 145)' }}>✓</span>
            <span>Dynamic URL pSEO Indexing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg)' }}>
            <span style={{ color: `oklch(0.78 0.16 ${activeHue})` }}>⚡</span>
            <span style={{ fontWeight: 500 }}>Backend Parser Logic & Sandbox</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-dim)' }}>
            <span>○</span>
            <span>API Deployment & High-Compute Hook</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        {subscribed ? (
          <div style={{
            background: 'oklch(0.18 0.010 145 / 0.1)',
            border: '1px solid oklch(0.78 0.16 145 / 0.3)',
            borderRadius: 8, padding: '12px 18px',
            color: 'oklch(0.82 0.13 145)', fontSize: 13.5, fontWeight: 500,
          }} className="fade-in">
            🎉 You have successfully joined the beta waiting list!
          </div>
        ) : (
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email for beta access"
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--bg-elev-1)',
                border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--fg)', fontSize: 13,
                outline: 'none',
              }}
            />
            <button type="submit" className="reset" style={{
              padding: '10px 16px',
              background: `linear-gradient(180deg, oklch(0.72 0.18 ${activeHue}), oklch(0.62 0.20 ${activeHue}))`,
              color: 'white', fontWeight: 500, fontSize: 13,
              borderRadius: 8, cursor: 'pointer',
              boxShadow: `0 1px 0 oklch(1 0 0 / 0.25) inset, 0 4px 12px oklch(0.50 0.20 ${activeHue} / 0.25)`,
            }}>
              Join Waitlist
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
