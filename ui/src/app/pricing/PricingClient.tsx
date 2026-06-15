"use client";
import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Feature } from '../../components/PageStyles';

export default function PricingClient() {
  const { launchApp, setEnterpriseOpen } = useSaaS();
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <main className="max-w-[1200px] mx-auto mt-10 mb-[120px] px-8 relative fade-in">
      {/* Subpage ambient top-center glow */}
      <div 
        className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 transition-opacity duration-200"
        style={{
          background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
          opacity: isLight ? 0.08 : 0.15,
        }}
      />

      <header className="text-center mb-12 relative z-10">
        <span className="inline-block text-[11px] font-semibold text-[oklch(0.78_0.12_265)] tracking-[0.18em] uppercase mb-[18px]">Monetization & Plans</span>
        <h1 className="m-0 text-[clamp(34px,5vw,52px)] leading-[1.05] tracking-[-0.03em] font-semibold text-pretty mt-3 mb-0 text-fg">Simple, transparent pricing</h1>
        <p className="mt-5 mx-auto mb-0 max-w-[560px] text-base text-fg-muted leading-1.5 text-pretty">Choose the perfect tier for your workflow. Get high-fidelity documents and parsed datasets instantly.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-[1080px] mx-auto relative z-10" aria-label="Pricing Plans">
        {/* Free Plan */}
        <article className="glass-card flex flex-col h-full hover:scale-[1.01] transition-all duration-200">
          <div className="text-[13px] font-semibold text-fg-dim uppercase tracking-wider mono">Free</div>
          <h2 className="text-2xl font-semibold mt-2 mb-4 text-fg">Free Plan</h2>
          <div className="text-4xl font-bold mb-2 text-fg">$0 <span className="text-sm font-normal text-fg-dim">/ forever</span></div>
          <p className="text-[13.5px] text-fg-muted mb-6 min-h-10">Perfect for quick daily copy-pastes and standard interactive tools.</p>
          <ul className="list-none p-0 flex flex-col gap-1 flex-1 mb-8">
            <Feature on={true}>20 daily browser tool runs</Feature>
            <Feature on={true}>10 daily Sandbox API requests</Feature>
            <Feature on={true}>Standard document themes</Feature>
            <Feature on={true}>Mandatory brand watermarks</Feature>
            <Feature on={false}>Production API bearer keys</Feature>
          </ul>
          <button 
            onClick={launchApp} 
            className="reset w-full py-3 rounded-lg bg-bg-elev-2 border border-border text-fg font-medium text-[13.5px] cursor-pointer text-center mt-auto hover:bg-bg-hover active:scale-[0.98] transition-all duration-150"
          >
            Get Started Free
          </button>
        </article>

        {/* Pro Plan */}
        <article 
          className="glass-card flex flex-col h-full border-accent relative hover:scale-[1.01] hover:shadow-[0_24px_80px_rgba(108,68,265,0.15)] transition-all duration-200"
          style={{
            borderColor: 'var(--accent)',
            boxShadow: isLight 
              ? '0 24px 80px oklch(0.58 0.16 265 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.8)' 
              : '0 24px 80px oklch(0.50 0.20 265 / 0.18), inset 0 1px 0 oklch(1 0 0 / 0.05)',
          }}
        >
          <div className="absolute top-4 right-4 bg-accent text-white text-[10px] font-bold py-0.5 px-2 rounded-full uppercase tracking-wider mono">Popular</div>
          <div className="text-[13px] font-semibold text-accent uppercase tracking-wider mono">Pro</div>
          <h2 className="text-2xl font-semibold mt-2 mb-4 text-fg">Pro Plan</h2>
          <div className="text-4xl font-bold mb-2 text-fg">$9 <span className="text-sm font-normal text-fg-dim">/ month</span></div>
          <p className="text-[13.5px] text-fg-muted mb-6 min-h-10">Complete interactive browser-level cockpit for heavy document workflows.</p>
          <ul className="list-none p-0 flex flex-col gap-1 flex-1 mb-8">
            <Feature on={true} em={true}>Unlimited browser tool runs</Feature>
            <Feature on={true} em={true}>200 daily Production API requests</Feature>
            <Feature on={true} em={true}>Custom watermark removal</Feature>
            <Feature on={true} em={true}>Visual PDF Diff Checker</Feature>
            <Feature on={false}>Developer API Plan bounds</Feature>
          </ul>
          <button 
            onClick={launchApp} 
            className="reset w-full py-3 rounded-lg bg-gradient-to-b from-[oklch(0.72_0.18_265)] to-[oklch(0.62_0.20_265)] text-white font-medium text-[13.5px] cursor-pointer text-center mt-auto shadow-[0_4px_14px_rgba(108,68,265,0.3)] hover:brightness-110 active:scale-[0.98] transition-all duration-150"
          >
            Unlock Pro Vault
          </button>
        </article>

        {/* Developer Plan */}
        <article className="glass-card flex flex-col h-full hover:scale-[1.01] transition-all duration-200">
          <div className="text-[13px] font-semibold text-[oklch(0.78_0.16_145)] uppercase tracking-wider mono">Developer</div>
          <h2 className="text-2xl font-semibold mt-2 mb-4 text-fg">Developer Plan</h2>
          <div className="text-4xl font-bold mb-2 text-fg">$29 <span className="text-sm font-normal text-fg-dim">/ month</span></div>
          <p className="text-[13.5px] text-fg-muted mb-6 min-h-10">Direct programmatic integration, massive query capacity, and data webhooks.</p>
          <ul className="list-none p-0 flex flex-col gap-1 flex-1 mb-8">
            <Feature on={true} em={true}><strong>All Pro Plan features included</strong></Feature>
            <Feature on={true} em={true}><strong>2,000 daily Production API requests</strong></Feature>
            <Feature on={true} em={true}><strong>Direct API keys console</strong></Feature>
            <Feature on={true} em={true}>Custom webhooks and status callbacks</Feature>
            <Feature on={true} em={true}>Priority server computing resources</Feature>
          </ul>
          <button 
            onClick={launchApp} 
            className="reset w-full py-3 rounded-lg bg-bg-elev-2 border border-border text-fg font-medium text-[13.5px] cursor-pointer text-center mt-auto hover:bg-bg-hover active:scale-[0.98] transition-all duration-150"
          >
            Get API Vault Keys
          </button>
        </article>
      </div>

      <p className="text-center mt-9 text-[13px] text-fg-dim relative z-10">
        Need SOC2, SSO, or on-prem?{' '}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setEnterpriseOpen(true); }} 
          className="text-fg-muted underline decoration-border-strong hover:text-fg transition-colors duration-150"
        >
          Talk to us about Enterprise
        </a>.
      </p>
    </main>
  );
}
