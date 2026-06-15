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
    <div style={{
      maxWidth: 720, margin: '40px auto 120px',
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

      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Get In Touch</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Contact Us</h1>
        <p style={sectionSubtitle}>Have a question, feature request, or partnership opportunity? We'd love to hear from you.</p>
      </div>

      {!sent ? (
        <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '36px clamp(20px, 5vw, 40px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
              <input type="email" placeholder="you@example.com" style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                color: 'var(--fg)', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elev-1)'; }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</label>
              <input type="text" placeholder="Feature request, bug report, partnership…" style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                color: 'var(--fg)', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elev-1)'; }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</label>
              <textarea rows={5} placeholder="Tell us what's on your mind…" style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                color: 'var(--fg)', fontSize: 14, outline: 'none',
                resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elev-1)'; }}
              />
            </div>
            <button onClick={() => setSent(true)} className="" style={{
              width: '100%', padding: '12px', borderRadius: 8,
              background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
              color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
            }}>Send Message</button>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'oklch(0.22 0.010 145 / 0.2)',
            border: '1px solid oklch(0.75 0.14 145 / 0.4)',
            color: 'oklch(0.78 0.16 145)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
            boxShadow: isLight ? 'none' : '0 0 20px oklch(0.78 0.16 145 / 0.25)',
          }}>
            <Icon.Check size={28} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)', margin: '0 0 10px' }}>Message Sent!</h2>
          <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
            Thank you for reaching out. We'll get back to you within 24 hours.
          </p>
        </div>
      )}
    </div>
  );
}
