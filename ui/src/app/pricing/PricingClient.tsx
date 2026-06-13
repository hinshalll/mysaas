"use client";

import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { eyebrow, sectionTitle, sectionSubtitle, listStyle, Feature } from '../../components/PageStyles';

export default function PricingClient() {
  const { launchApp, setEnterpriseOpen } = useSaaS();
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <div style={{
      maxWidth: 1200,
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

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Monetization & Plans</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Simple, transparent pricing</h1>
        <p style={sectionSubtitle}>Choose the perfect tier for your workflow. Get high-fidelity documents and parsed datasets instantly.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        alignItems: 'stretch',
        maxWidth: 1080,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Free Plan */}
        <div className="glass-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Free</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Free Plan</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>$0 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>/ forever</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>Perfect for quick daily copy-pastes and standard interactive tools.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true}>20 daily browser tool runs</Feature>
            <Feature on={true}>10 daily Sandbox API requests</Feature>
            <Feature on={true}>Standard document themes</Feature>
            <Feature on={true}>Mandatory brand watermarks</Feature>
            <Feature on={false}>Production API bearer keys</Feature>
          </ul>
          <button onClick={launchApp} className="reset" style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
            color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
            textAlign: 'center', marginTop: 'auto',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
          >Get Started Free</button>
        </div>

        {/* Pro Plan */}
        <div className="glass-card" style={{
          borderColor: 'var(--accent)',
          boxShadow: isLight 
            ? '0 24px 80px oklch(0.58 0.16 265 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.8)' 
            : '0 24px 80px oklch(0.50 0.20 265 / 0.18), inset 0 1px 0 oklch(1 0 0 / 0.05)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'var(--accent)',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }} className="mono">Popular</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Pro</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Pro Plan</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>$9 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>/ month</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>Complete interactive browser-level cockpit for heavy document workflows.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true} em={true}>Unlimited browser tool runs</Feature>
            <Feature on={true} em={true}>200 daily Production API requests</Feature>
            <Feature on={true} em={true}>Custom watermark removal</Feature>
            <Feature on={true} em={true}>Visual PDF Diff Checker</Feature>
            <Feature on={false}>Developer API Plan bounds</Feature>
          </ul>
          <button onClick={launchApp} className="reset" style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
            color: 'white', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
            textAlign: 'center', marginTop: 'auto',
            boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
          }}>Unlock Pro Vault</button>
        </div>

        {/* Developer Plan */}
        <div className="glass-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.78 0.16 145)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Developer</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Developer Plan</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>$29 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>/ month</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>Direct programmatic integration, massive query capacity, and data webhooks.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true} em={true}><strong>All Pro Plan features included</strong></Feature>
            <Feature on={true} em={true}><strong>2,000 daily Production API requests</strong></Feature>
            <Feature on={true} em={true}><strong>Direct API keys console</strong></Feature>
            <Feature on={true} em={true}>Custom webhooks and status callbacks</Feature>
            <Feature on={true} em={true}>Priority server computing resources</Feature>
          </ul>
          <button onClick={launchApp} className="reset" style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
            color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
            textAlign: 'center', marginTop: 'auto',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
          >Get API Vault Keys</button>
        </div>
      </div>

      <p style={{
        textAlign: 'center',
        marginTop: 36,
        fontSize: 13,
        color: 'var(--fg-dim)',
        position: 'relative',
        zIndex: 1,
      }}>
        Need SOC2, SSO, or on-prem? <a href="#" onClick={(e) => { e.preventDefault(); setEnterpriseOpen(true); }} style={{ color: 'var(--fg-muted)', textDecoration: 'underline', textDecorationColor: 'var(--border-strong)' }}>Talk to us about Enterprise</a>.
      </p>
    </div>
  );
}
